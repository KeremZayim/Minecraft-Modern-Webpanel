/*
// ============================================================================
// 1-) DEĞİŞKENLER VE ELEMENT SEÇİMLERİ
//      - Global değişkenler ve DOM elementleri.
//
// 2-) MENÜ YÖNETİMİ
//      2.1-) loadMenu: Menü butonlarını yükler.
//
// 3-) SAYFA YÖNLENDİRME
//      3.1-) loadPage: Sayfalar arası geçişi yönetir.
//
// 4-) DASHBOARD (ÖZET) SAYFASI
//      4.1-) initDashboardPage: Dashboard verilerini ister.
//      4.2-) updateDashboardStats: Dashboard grafiklerini günceller.
//
// 5-) KONSOL SAYFASI
//      5.1-) initConsolePage: Konsol ekranını başlatır.
//      5.2-) appendLogToUI: Logları ekrana basar.
//
// 6-) DOSYA YÖNETİCİSİ
//      6.1-) initFilesPage: Dosya listeleme ve yükleme butonları.
//      6.2-) loadFileList: Dosyaları çeker ve listeler.
//      6.3-) openEditor / createItem / deleteItem...
//
// 7-) YEDEKLEME SİSTEMİ
//      7.1-) initBackupsPage: Yedekleme sayfasını başlatır.
//      7.2-) loadBackupList: Yedekleri listeler.
//
// 8-) ZAMANLAYICI
//      8.1-) initSchedulesPage: Zamanlanmış görevleri yönetir.
//      8.2-) updateScheduleList: Görev listesini günceller.
//
// 9-) EKLENTİ YÖNETİMİ
//      9.1-) initPluginsPage: Plugin yükleme işlemleri.
//      9.2-) updatePluginList: Pluginleri listeler.
//
// 10-) YASAKLILAR
//      10.1-) initBannedPage / updateBannedList
//
// 11-) DENETİM KAYITLARI
//      11.1-) initAuditPage: Audit sayfasını başlatır.
//      11.2-) renderAuditLogs: Logları listeler.
//
// 12-) DISCORD ENTEGRASYONU
//      12.1-) initDiscordPage
//
// 13-) DÜNYA YÖNETİCİSİ
//      13.1-) initWorldsPage / updateWorldsList
//
// 14-) AYARLAR VE YÖNETİCİLER
//      14.1-) initSettingsPage / initOpsPage
//      14.2-) updateOpsList
//      14.3-) updatePlayerList
//
// 15-) ARAYÜZ GÜNCELLEME
//      15.1-) updateDashboardUI: Online/Offline durumunu yansıtır.
//
// 16-) SOCKET.IO DİNLEYİCİLERİ
//      - Sunucudan gelen verileri işler.
// ============================================================================
*/

// 1-) DEĞİŞKENLER VE ELEMENT SEÇİMLERİ
const socket = io();
const contentDiv = document.getElementById('main-content');
const menuContainer = document.getElementById('sidebar-menu');

const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');

let storedLogs = []; 
let currentStatus = 'offline'; 
let currentPage = 'dashboard'; 
let schedules = [];
let currentPath = '';
let allAuditLogs = [];
let auditPageIndex = 1;
let auditPageSize = 50;

// 2-) MENÜ YÖNETİMİ
// 2.1-) loadMenu
async function loadMenu() 
{
    try 
    {
        const res = await fetch('/api/menu');
        const items = await res.json();
        menuContainer.innerHTML = '';

        // Manuel Dashboard Butonu
        const dashBtn = document.createElement('button');
        dashBtn.className = 'w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide';
        dashBtn.textContent = 'Ana Sayfa';
        dashBtn.onclick = () => loadPage('dashboard', dashBtn);
        menuContainer.appendChild(dashBtn);

        items.forEach(item => 
        {
            if(item.id === 'dashboard') return; // Çift olmasın

            const btn = document.createElement('button');
            btn.className = 'w-full text-left px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm font-medium uppercase tracking-wide';
            btn.textContent = item.name;
            btn.onclick = () => loadPage(item.id, btn);
            menuContainer.appendChild(btn);
        });
        
        // İlk açılışta Dashboard'u yükle
        loadPage('dashboard', dashBtn);
    } 
    catch (err) {}
}

// 3-) SAYFA YÖNLENDİRME SİSTEMİ
// 3.1-) loadPage
async function loadPage(pageId, activeBtn) 
{
    currentPage = pageId; 
    
    document.querySelectorAll('#sidebar-menu button').forEach(b => b.classList.remove('bg-blue-600', 'text-white', 'hover:bg-blue-700'));
    
    if(activeBtn) 
    {
        activeBtn.classList.remove('text-gray-400', 'hover:bg-gray-800');
        activeBtn.classList.add('bg-blue-600', 'text-white', 'hover:bg-blue-700');
    }

    if(pageId === 'dashboard') 
    {
        const res = await fetch(`/pages/dashboard.html`);
        contentDiv.innerHTML = await res.text();
        initDashboardPage();
    } 
    else 
    {
        const res = await fetch(`/pages/${pageId}.html`);
        contentDiv.innerHTML = await res.text();

        if (pageId === 'console') initConsolePage();
        if (pageId === 'ops') initOpsPage();
        if (pageId === 'settings') initSettingsPage();
        if (pageId === 'files') initFilesPage();
        if (pageId === 'backups') initBackupsPage();
        if (pageId === 'schedules') initSchedulesPage();
        if (pageId === 'plugins') initPluginsPage();
        if (pageId === 'banned') initBannedPage();
        if (pageId === 'audit') initAuditPage();
        if (pageId === 'discord') initDiscordPage();
        if (pageId === 'worlds') initWorldsPage();
    }
}

// 4-) DASHBOARD (ÖZET) MANTIĞI
// 4.1-) initDashboardPage
function initDashboardPage() 
{
    socket.emit('get-settings'); 
    updateDashboardUI(currentStatus);

    const dBtnStart = document.getElementById('dash-btn-start');
    const dBtnStop = document.getElementById('dash-btn-stop');

    if (dBtnStart) 
    {
        dBtnStart.onclick = () => 
        {
            socket.emit('start-server');
            updateDashboardUI('starting');
        };
    }

    if (dBtnStop) 
    {
        dBtnStop.onclick = () => 
        {
            if(confirm('Sunucuyu durdurmak istiyor musunuz?')) 
            {
                socket.emit('stop-server');
            }
        };
    }
}

// 4.2-) updateDashboardStats
function updateDashboardStats(data) 
{
    const ramBar = document.getElementById('dash-ram-bar');
    const ramText = document.getElementById('dash-ram-text');
    const ramPercent = document.getElementById('dash-ram-percent');
    
    if(ramBar && ramText) 
    {
        const currentRam = parseInt(data.ram);
        const maxRam = 12288; 
        const percent = Math.min((currentRam / maxRam) * 100, 100).toFixed(1);
        
        ramText.textContent = `${data.ram} MB`;
        ramBar.style.width = `${percent}%`;
        if(ramPercent) ramPercent.textContent = `${percent}%`;
    }

    const cpuBar = document.getElementById('dash-cpu-bar');
    const cpuText = document.getElementById('dash-cpu-text');
    if(cpuBar && cpuText) 
    {
        cpuText.textContent = `${data.cpu}%`;
        cpuBar.style.width = `${Math.min(data.cpu, 100)}%`;
    }

    const playerText = document.getElementById('dash-player-text');
    const headContainer = document.getElementById('dash-player-heads');
    if(playerText) 
    {
        const count = Array.isArray(data.players) ? data.players.length : 0;
        playerText.textContent = `${count} / 20`;
        
        if(headContainer) 
        {
            if(count === 0) headContainer.innerHTML = '<span class="text-xs text-gray-600 italic">Kimse yok...</span>';
            else 
            {
                headContainer.innerHTML = '';
                data.players.forEach(p => 
                {
                    const img = document.createElement('img');
                    img.src = `https://mc-heads.net/avatar/${p}/24`;
                    img.className = "w-8 h-8 rounded-full border-2 border-gray-800 inline-block -ml-2 first:ml-0";
                    headContainer.appendChild(img);
                });
            }
        }
    }
}

// 5-) KONSOL SAYFASI MANTIĞI
// 5.1-) initConsolePage
function initConsolePage() 
{
    const consoleWindow = document.getElementById('console-window');
    const commandForm = document.getElementById('command-form');
    const commandInput = document.getElementById('command-input');

    if(consoleWindow) 
    {
        consoleWindow.innerHTML = ''; 
        storedLogs.forEach(log => appendLogToUI(log, false));
        setTimeout(() => { consoleWindow.scrollTop = consoleWindow.scrollHeight; }, 100);
    }
    updateDashboardUI(currentStatus);

    if(commandForm) 
    {
        commandForm.addEventListener('submit', (e) => 
        {
            e.preventDefault();
            const cmd = commandInput.value.trim();
            if (cmd) 
            {
                socket.emit('send-command', cmd);
                commandInput.value = '';
            }
        });
    }
}

// 5.2-) appendLogToUI
function appendLogToUI(text, autoScroll = true) 
{
    const w = document.getElementById('console-window'); if(!w) return;
    const d = document.createElement('div');
    if (text.includes('WARN')) d.className = 'text-amber-400';
    else if (text.includes('ERR') || text.includes('Exception')) d.className = 'text-rose-400 font-bold';
    else if (text.includes('Done')) d.className = 'text-emerald-400 font-bold';
    else if (text.includes('INFO')) d.className = 'text-blue-200';
    else d.className = 'text-gray-400';
    
    d.textContent = text;
    d.className += ' break-words whitespace-pre-wrap font-mono text-xs md:text-sm mb-0.5';
    w.appendChild(d);
    if(autoScroll) w.scrollTop = w.scrollHeight;
}

// 15-) ARAYÜZ GÜNCELLEME YARDIMCILARI
// 15.1-) updateDashboardUI
function updateDashboardUI(status) 
{
    // Dashboard Sayfası
    const dLabel = document.getElementById('dash-status-label');
    const dDot = document.getElementById('dash-status-dot');
    const dHero = document.getElementById('hero-card');
    const dBtnStart = document.getElementById('dash-btn-start');
    const dBtnStop = document.getElementById('dash-btn-stop');

    if(dLabel && dDot) 
    {
        if (status === 'online') 
        {
            dLabel.textContent = "ONLINE";
            dLabel.className = "text-xl font-bold text-emerald-400 tracking-wide";
            dDot.className = "w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse";
            if(dHero) dHero.className = "relative bg-gradient-to-r from-gray-800 to-emerald-900/30 p-6 rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden transition-all duration-500";
            if(dBtnStart) { dBtnStart.disabled = true; dBtnStart.classList.add('opacity-50', 'cursor-not-allowed'); dBtnStart.innerHTML = 'BAŞLAT'; }
            if(dBtnStop) { dBtnStop.disabled = false; dBtnStop.classList.remove('opacity-50', 'cursor-not-allowed'); }
        } 
        else if (status === 'offline') 
        {
            dLabel.textContent = "OFFLINE";
            dLabel.className = "text-xl font-bold text-red-400 tracking-wide";
            dDot.className = "w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]";
            if(dHero) dHero.className = "relative bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden transition-all duration-500";
            if(dBtnStart) { dBtnStart.disabled = false; dBtnStart.classList.remove('opacity-50', 'cursor-not-allowed'); dBtnStart.innerHTML = 'BAŞLAT'; }
            if(dBtnStop) { dBtnStop.disabled = true; dBtnStop.classList.add('opacity-50', 'cursor-not-allowed'); }
            resetStats();
        } 
        else 
        {
            dLabel.textContent = "BAŞLATILIYOR...";
            dLabel.className = "text-xl font-bold text-amber-400 tracking-wide animate-pulse";
            dDot.className = "w-3 h-3 rounded-full bg-amber-500 animate-ping";
            if(dBtnStart) { dBtnStart.disabled = true; dBtnStart.innerHTML = '...'; }
            if(dBtnStop) dBtnStop.disabled = true;
        }
    }

    // Konsol Sayfası
    const c = document.getElementById('status-card'); 
    if(c) 
    {
        const i = document.getElementById('dash-status-icon'), t = document.getElementById('dash-status-text');
        i.className = "w-8 h-8 rounded-full shadow-inner transition-colors";
        if(status==='online') { c.classList.add('border-emerald-500'); t.textContent = "AÇIK"; i.classList.add('bg-emerald-500'); } 
        else if(status==='offline') { c.classList.remove('border-emerald-500'); t.textContent = "KAPALI"; i.classList.remove('bg-emerald-500'); }
        else { t.textContent = "BAŞLATILIYOR..."; }
    }
}

// 15.2-) resetStats
function resetStats() 
{
    const elCpu = document.getElementById('stat-cpu');
    const elRam = document.getElementById('stat-ram');
    const elPlayers = document.getElementById('stat-players');
    const liveInd = document.getElementById('live-indicator');
    
    if(elCpu) elCpu.textContent = "0%";
    if(elRam) elRam.textContent = "0 MB";
    if(elPlayers) elPlayers.textContent = "-- / 20";
    if(liveInd) liveInd.classList.add('hidden');

    const dRam = document.getElementById('dash-ram-text');
    const dCpu = document.getElementById('dash-cpu-text');
    if(dRam) dRam.textContent = "0 MB";
    if(dCpu) dCpu.textContent = "0%";
}

// 6-) DOSYA YÖNETİCİSİ (FILES)
// 6.1-) initFilesPage
function initFilesPage() 
{
    loadFileList(''); 
    const h=document.getElementById('fm-home'), b=document.getElementById('fm-btn-back'), f=document.getElementById('fm-btn-new-file'), d=document.getElementById('fm-btn-new-folder'), u=document.getElementById('fm-upload-input');
    if(h) h.onclick = () => loadFileList('');
    if(b) b.onclick = () => { if(!currentPath) return; currentPath = currentPath.split('/').slice(0, -1).join('/'); loadFileList(currentPath); };
    if(d) d.onclick = async () => { const n = prompt("Klasör Adı:"); if(n) createItem('dir', n); };
    if(f) f.onclick = async () => { const n = prompt("Dosya Adı:"); if(n) createItem('file', n); };
    if(u) u.onchange = async () => { const fs=u.files; const fd=new FormData(); for(let i=0;i<fs.length;i++)fd.append('files',fs[i]); await fetch(`/api/files/upload?path=${currentPath}`,{method:'POST',body:fd}); loadFileList(currentPath); };
}

// 6.2-) loadFileList
async function loadFileList(p) 
{
    currentPath = p; 
    const l = document.getElementById('fm-current-path'); 
    if(l) l.textContent = p ? '/' + p : '/'; 
    const b = document.getElementById('fm-btn-back'); 
    if(b) b.disabled = !p;

    try 
    {
        const res = await fetch(`/api/files/list?path=${encodeURIComponent(p)}`); 
        const f = await res.json();
        const t = document.getElementById('file-list-body'); 
        if(t) 
        {
            t.innerHTML = ''; 
            f.forEach(i => 
            {
                const tr = document.createElement('tr'); 
                tr.className = "hover:bg-gray-800/50 transition group border-b border-gray-800/50";
                
                let icon = i.isDir 
                    ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>` 
                    : `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`;
                
                let sizeStr = "-";
                if (!i.isDir) { if (i.size > 1024 * 1024) sizeStr = (i.size / (1024 * 1024)).toFixed(2) + ' MB'; else sizeStr = (i.size / 1024).toFixed(2) + ' KB'; }

                let deleteBtn = `<button onclick="deleteItem('${i.path}')" class="text-gray-500 hover:text-red-500 transition p-1" title="Sil"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;

                tr.innerHTML = `<td class="p-3 w-8">${icon}</td><td class="p-3 cursor-pointer text-gray-300 hover:text-white font-medium" onclick="clickFile('${i.path}',${i.isDir})">${i.name}</td><td class="p-3 text-gray-500 text-xs font-mono">${sizeStr}</td><td class="p-3 text-right">${deleteBtn}</td>`;
                t.appendChild(tr);
            });
        }
    } catch(e) {}
}

window.clickFile = (p, d) => { if(d) loadFileList(p); else openEditor(p); };
async function openEditor(p) 
{
    const m=document.getElementById('editor-modal'), t=document.getElementById('editor-content'), s=document.getElementById('editor-save'), c=document.getElementById('editor-close');
    const r=await fetch(`/api/files/read?path=${encodeURIComponent(p)}`); 
    if(!r.ok) { alert('Hata'); return; } 
    t.value = await r.text(); 
    m.classList.remove('hidden');
    s.onclick = async () => { await fetch('/api/files/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ path: p, content: t.value }) }); alert('Kaydedildi'); m.classList.add('hidden'); };
    c.onclick = () => m.classList.add('hidden');
}
async function createItem(t, n) { await fetch('/api/files/create', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type: t, name: n, currentPath }) }); loadFileList(currentPath); }
window.deleteItem = async (p) => { if(confirm('Sil?')) { await fetch(`/api/files/delete?path=${encodeURIComponent(p)}`, { method: 'DELETE' }); loadFileList(currentPath); } };

// 7-) YEDEKLEME SİSTEMİ (BACKUPS)
// 7.1-) initBackupsPage
function initBackupsPage() 
{ 
    loadBackupList(); 
    const b = document.getElementById('btn-create-backup'); 
    if(b) b.onclick = async () => 
    { 
        if(confirm('Yedek al?')) 
        { 
            showLoading(true);
            try { const res = await fetch('/api/backups/create', { method: 'POST' }); const data = await res.json(); if(data.success) loadBackupList(); else alert(data.error); }
            catch(e){ alert('Hata'); }
            finally{ showLoading(false); }
        } 
    }; 
}

// 7.2-) loadBackupList
async function loadBackupList() 
{ 
    const t = document.getElementById('backup-list-body'); if(!t) return; 
    const r = await fetch('/api/backups/list'); const b = await r.json(); t.innerHTML = ''; 
    
    if(b.length === 0) { t.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500 italic">Yedek yok.</td></tr>'; return; }

    b.forEach(i => 
    { 
        const tr = document.createElement('tr'); tr.className="hover:bg-gray-800/50 transition border-b border-gray-800/50"; 
        
        const btnDown = `<a href="/api/backups/download/${i.name}" class="text-blue-400 hover:text-white mr-2" title="İndir"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>`;
        const btnRest = `<button onclick="restoreBackup('${i.name}')" class="text-green-400 hover:text-white mr-2" title="Geri Yükle"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>`;
        const btnDel = `<button onclick="deleteBackup('${i.name}')" class="text-red-400 hover:text-white" title="Sil"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;

        tr.innerHTML = `<td class="p-3 text-yellow-100 font-mono text-sm">${i.name}</td><td class="p-3 text-gray-400 text-xs">${i.date}</td><td class="p-3 text-gray-400 text-xs">${i.size}</td><td class="p-3 text-right">${btnDown}${btnRest}${btnDel}</td>`; 
        t.appendChild(tr); 
    }); 
}

window.deleteBackup = async (n) => { if(confirm('Sil?')) { await fetch(`/api/backups/delete/${n}`, { method: 'DELETE' }); loadBackupList(); } };
window.restoreBackup = async (n) => { if(confirm('Geri Yükle?')) { await fetch(`/api/backups/restore/${n}`, { method: 'POST' }); alert('Bitti'); } };
function showLoading(show) { const el = document.getElementById('backup-loading'); if(el) { if(show) el.classList.remove('hidden'); else el.classList.add('hidden'); } }

// 8-) ZAMANLAYICI (SCHEDULES)
// 8.1-) initSchedulesPage
function initSchedulesPage() 
{
    socket.emit('get-schedules');
    const btnAdd = document.getElementById('btn-add-schedule');
    const modal = document.getElementById('schedule-modal');
    const btnSave = document.getElementById('sch-save');
    const btnCancel = document.getElementById('sch-cancel');
    const selType = document.getElementById('sch-type');
    const grpInt = document.getElementById('input-interval-group');
    const grpTime = document.getElementById('input-time-group');

    if(btnAdd) btnAdd.onclick = () => { document.getElementById('sch-name').value = ''; document.getElementById('sch-payload').value = ''; modal.classList.remove('hidden'); };
    if(btnCancel) btnCancel.onclick = () => modal.classList.add('hidden');
    if(selType) selType.onchange = () => { if(selType.value === 'interval') { grpInt.classList.remove('hidden'); grpTime.classList.add('hidden'); } else { grpInt.classList.add('hidden'); grpTime.classList.remove('hidden'); } };
    if(btnSave) btnSave.onclick = () => 
    {
        const n = document.getElementById('sch-name').value;
        const a = document.getElementById('sch-action').value;
        const p = document.getElementById('sch-payload').value;
        let c = "", d = "";
        
        if (selType.value === 'interval') 
        {
            const m = document.getElementById('sch-interval-min').value;
            if(!m) return;
            c = `0 */${m} * * * *`; 
            d = `Her ${m} dk`;
        } 
        else 
        {
            const t = document.getElementById('sch-fixed-time').value;
            if(!t) return;
            const [hh, mm] = t.split(':');
            c = `0 ${mm} ${hh} * * *`;
            d = `Saat ${t}`;
        }

        if(n) 
        {
            schedules.push({ id: Date.now(), name: n, action: a, payload: p, cron: c, display: d, enabled: true });
            socket.emit('save-schedules', schedules);
            modal.classList.add('hidden');
        }
    };
}

// 8.2-) updateScheduleList
function updateScheduleList(list) 
{
    schedules = list; 
    const d = document.getElementById('schedules-list'); 
    if(!d) return; 
    d.innerHTML = ''; 
    
    list.forEach((s, i) => 
    {
        const el = document.createElement('div'); 
        el.className = "bg-gray-800 p-3 rounded flex justify-between border border-gray-700 mb-2"; 
        el.innerHTML = `<div><h3 class="text-cyan-400 font-bold text-sm">${s.name}</h3><span class="text-xs text-gray-500">${s.display||s.cron}</span></div><button onclick="deleteSchedule(${i})" class="text-red-500 hover:text-white">Sil</button>`; 
        d.appendChild(el); 
    });
}

window.deleteSchedule = (i) => { if(confirm('Sil?')) { schedules.splice(i, 1); socket.emit('save-schedules', schedules); } };

// 9-) EKLENTİ YÖNETİMİ (PLUGINS)
// 9.1-) initPluginsPage
function initPluginsPage() 
{
    socket.emit('get-plugins');
    const i = document.getElementById('plugin-upload-input');
    if(i) i.onchange = async () => 
    {
        const f = i.files; const fd = new FormData(); 
        for(let k=0; k<f.length; k++) fd.append('files', f[k]); 
        await fetch('/api/plugins/upload', { method: 'POST', body: fd }); 
    };
}

// 9.2-) updatePluginList
function updatePluginList(l) 
{
    const t = document.getElementById('plugin-list-body'); if(!t) return; t.innerHTML = ''; 
    l.forEach(p => 
    {
        const tr = document.createElement('tr'); 
        tr.className = "border-b border-gray-800 hover:bg-gray-700/30 transition"; 
        tr.innerHTML = `<td class="p-3 ${p.enabled ? 'text-green-400' : 'text-red-400'}">${p.name}</td><td class="p-3 text-right"><button onclick="togglePlugin('${p.name}')" class="text-xs bg-gray-700 px-2 py-1 rounded text-white mr-2">${p.enabled ? 'Kapat' : 'Aç'}</button> <button onclick="deletePlugin('${p.name}')" class="text-xs text-red-500 px-2">Sil</button></td>`; 
        t.appendChild(tr); 
    });
}

window.togglePlugin = async (n) => { await fetch('/api/plugins/toggle', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: n }) }); };
window.deletePlugin = async (n) => { if(confirm('Sil?')) { await fetch('/api/plugins/delete', { method: 'DELETE', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: n }) }); } };

// 10-) YASAKLILAR (BANNED)
function initBannedPage() { socket.emit('get-banned'); }
function updateBannedList(l) 
{ 
    const d = document.getElementById('banned-list-container'); if(!d) return; d.innerHTML = ''; 
    if(l.length === 0) { d.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">Boş</div>'; return; }
    l.forEach(b => 
    {
        const el = document.createElement('div'); 
        el.className = "bg-gray-800 p-3 rounded border border-red-900/30 flex items-center gap-3"; 
        el.innerHTML = `<img src="https://mc-heads.net/avatar/${b.name}/40" class="rounded"><div class="flex-1"><h3 class="text-white text-sm">${b.name}</h3></div><button onclick="unban('${b.name}')" class="text-green-500 bg-green-900/30 px-2 rounded text-xs">Aç</button>`; 
        d.appendChild(el); 
    }); 
}
window.unban = (n) => socket.emit('unban-player', n);

// 11-) DENETİM KAYITLARI (AUDIT)
// 11.1-) initAuditPage
function initAuditPage() 
{
    socket.emit('get-audit');
    const limitSel = document.getElementById('audit-limit');
    const btnPrev = document.getElementById('audit-prev-btn');
    const btnNext = document.getElementById('audit-next-btn');
    
    const btnOpenModal = document.getElementById('btn-open-export-modal');
    const modal = document.getElementById('export-modal');
    const btnCloseModal = document.getElementById('btn-close-export');
    const btnConfirmExport = document.getElementById('btn-confirm-export');
    const inputStart = document.getElementById('export-start-date');
    const inputEnd = document.getElementById('export-end-date');

    if (limitSel) 
    {
        limitSel.value = auditPageSize === allAuditLogs.length ? 'all' : auditPageSize; 
        limitSel.onchange = () => 
        {
            auditPageSize = limitSel.value === 'all' ? allAuditLogs.length : parseInt(limitSel.value);
            auditPageIndex = 1; 
            renderAuditLogs();
        };
    }

    if (btnPrev) btnPrev.onclick = () => changeAuditPage(-1);
    if (btnNext) btnNext.onclick = () => changeAuditPage(1);

    if (btnOpenModal) 
    {
        btnOpenModal.onclick = () => 
        {
            const today = new Date();
            const lastYear = new Date();
            lastYear.setFullYear(today.getFullYear() - 1);

            if(inputEnd) inputEnd.value = today.toISOString().split('T')[0];
            if(inputStart) inputStart.value = lastYear.toISOString().split('T')[0];
            
            modal.classList.remove('hidden');
        };
    }

    if (btnCloseModal) btnCloseModal.onclick = () => modal.classList.add('hidden');

    if (btnConfirmExport) 
    {
        btnConfirmExport.onclick = () => 
        {
            const start = new Date(inputStart.value);
            const end = new Date(inputEnd.value);
            end.setHours(23, 59, 59); 

            let filtered = allAuditLogs.filter(log => 
            {
                try 
                {
                    const parts = log.time.split(' ')[0].split('.');
                    const logDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    return logDate >= start && logDate <= end;
                } 
                catch (e) { return false; }
            });

            if (filtered.length === 0) 
            {
                alert("Seçilen tarih aralığında kayıt yok.");
                return;
            }

            try 
            {
                const ws = XLSX.utils.json_to_sheet(filtered);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Denetim_Kayitlari");
                XLSX.writeFile(wb, `Audit_Export.xlsx`);
                modal.classList.add('hidden'); 
            } 
            catch (e) 
            {
                alert("Excel oluşturulamadı.");
            }
        };
    }
}

// 11.2-) renderAuditLogs
function renderAuditLogs() 
{
    const tbody = document.getElementById('audit-list-body');
    const pageInfo = document.getElementById('audit-page-info');
    const btnPrev = document.getElementById('audit-prev-btn');
    const btnNext = document.getElementById('audit-next-btn');

    if (!tbody) return;

    const totalItems = allAuditLogs.length;
    const totalPages = Math.ceil(totalItems / auditPageSize) || 1;
    
    if (auditPageIndex > totalPages) auditPageIndex = 1;

    const startIdx = (auditPageIndex - 1) * auditPageSize;
    const endIdx = startIdx + auditPageSize;
    const displayLogs = allAuditLogs.slice(startIdx, endIdx);

    tbody.innerHTML = '';

    if (displayLogs.length === 0) 
    {
        tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-gray-500">Kayıt yok.</td></tr>';
    } 
    else 
    {
        displayLogs.forEach(l => 
        {
            const tr = document.createElement('tr');
            tr.className = "border-b border-gray-800 hover:bg-gray-700/30";
            tr.innerHTML = `
                <td class="p-3 text-gray-400 font-mono text-xs">${l.time}</td>
                <td class="p-3 text-indigo-400 text-xs font-bold">${l.source}</td>
                <td class="p-3 text-gray-300 text-sm">
                    <span class="font-bold text-gray-400 mr-1">[${l.action}]</span>
                    ${l.details}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    if (pageInfo) pageInfo.textContent = `${auditPageIndex} / ${totalPages}`;
    if (btnPrev) btnPrev.disabled = (auditPageIndex === 1);
    if (btnNext) btnNext.disabled = (auditPageIndex === totalPages || totalPages === 0);
}

function changeAuditPage(dir) 
{
    const totalPages = Math.ceil(allAuditLogs.length / auditPageSize);
    const newPage = auditPageIndex + dir;
    if (newPage > 0 && newPage <= totalPages) { auditPageIndex = newPage; renderAuditLogs(); }
}

function updateAuditList(list) 
{
    allAuditLogs = list;
    renderAuditLogs();
}

// 12-) DISCORD ENTEGRASYONU
function initDiscordPage() 
{
    socket.emit('get-discord');
    const btn = document.getElementById('btn-save-discord');
    if(btn) btn.onclick = () => 
    {
        const conf = {
            chatUrl: document.getElementById('discord-url-chat').value,
            eventsUrl: document.getElementById('discord-url-events').value,
            adminUrl: document.getElementById('discord-url-admin').value,
            optChat: document.getElementById('discord-opt-chat').checked,
            optJoins: document.getElementById('discord-opt-joins').checked,
            optStatus: document.getElementById('discord-opt-status').checked,
            optDeaths: document.getElementById('discord-opt-deaths').checked,
            optAdv: document.getElementById('discord-opt-advancements').checked,
            optAdmin: document.getElementById('discord-opt-admin').checked
        };
        socket.emit('save-discord', conf);
    };
}

// 13-) DÜNYA YÖNETİCİSİ (WORLDS)
function initWorldsPage() { socket.emit('get-worlds'); }
function updateWorldsList(l) 
{ 
    const d = document.getElementById('worlds-list'); if(!d) return; d.innerHTML = ''; 
    l.forEach(w => 
    {
        const el = document.createElement('div'); 
        el.className = "bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col gap-3"; 
        el.innerHTML = `<div class="flex items-center gap-3"><div class="w-10 h-10 bg-pink-900/50 rounded flex items-center justify-center text-pink-500">🌍</div><h3 class="text-white font-bold">${w.name}</h3></div><button onclick="deleteWorld('${w.name}')" class="bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white py-2 rounded text-sm transition">SİL / SIFIRLA</button>`; 
        d.appendChild(el);
    }); 
}
window.deleteWorld = (n) => { if(confirm(`DİKKAT! "${n}" silinsin mi?`)) socket.emit('world-action', { action: 'delete', name: n }); };

// 14-) AYARLAR VE YÖNETİCİLER (SETTINGS & OPS)
// 14.1-) initSettingsPage
function initSettingsPage() 
{ 
    socket.emit('get-settings'); 
    const s = document.getElementById('btn-save-settings'); 
    if(s) s.onclick = () => 
    { 
        const d = { 
            ram: document.getElementById('set-ram-slider').value, 
            props: { 
                motd: document.getElementById('set-motd').value,
                'max-players': document.getElementById('set-max-players').value,
                'server-port': document.getElementById('set-server-port').value,
                'view-distance': document.getElementById('set-view-distance').value,
                'spawn-protection': document.getElementById('set-spawn-protection').value,
                'gamemode': document.getElementById('set-gamemode').value,
                'difficulty': document.getElementById('set-difficulty').value,
                'pvp': document.getElementById('set-pvp').checked,
                'allow-flight': document.getElementById('set-allow-flight').checked,
                'online-mode': document.getElementById('set-online-mode').checked,
                'white-list': document.getElementById('set-white-list').checked
            } 
        }; 
        socket.emit('save-settings', d); 
    }; 
}

function initOpsPage() 
{ 
    const f = document.getElementById('add-op-form'); 
    const i = document.getElementById('op-input-name'); 
    if(f) f.addEventListener('submit', (e) => 
    { 
        e.preventDefault(); 
        if(i.value) { socket.emit('admin-action', { action: 'op', target: i.value }); i.value = ''; } 
    }); 
}

// 14.2-) updateOpsList
// [DÜZELTİLDİ] Yöneticiler Listesi (İsim Görünmeme Sorunu Giderildi)
function updateOpsList(opsArray, onlinePlayersArray = []) 
{ 
    const listContainer = document.getElementById('ops-list-container'); 
    const badgeCount = document.getElementById('ops-count-badge'); 
    
    if(!listContainer) return; 
    
    // Sayıyı güncelle
    if(badgeCount) badgeCount.textContent = opsArray.length; 
    
    listContainer.innerHTML = ''; 

    if(opsArray.length === 0) 
    { 
        listContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10 italic">Hiç yönetici yok.</div>'; 
        return; 
    } 

    opsArray.forEach(name => 
    { 
        // Bu yönetici şu an oyunda mı?
        const isOnline = onlinePlayersArray.includes(name); 

        // Kart
        const card = document.createElement('div'); 
        card.className = "bg-gray-800 p-3 rounded-lg border border-purple-900/30 flex items-center gap-3 shadow-md hover:bg-gray-750 transition-colors group"; 
        
        // 1. Kafa Resmi (flex-shrink-0 önemli)
        const img = document.createElement('img'); 
        img.src = `https://mc-heads.net/avatar/${name}/50`; 
        img.className = "w-10 h-10 rounded-md shadow-sm bg-gray-900 flex-shrink-0"; 
        
        // 2. Bilgi Alanı (min-w-0 ismi görünür kılar)
        const infoDiv = document.createElement('div'); 
        infoDiv.className = "flex-1 min-w-0"; // <-- KRİTİK DÜZELTME
        
        const nameTitle = document.createElement('h3'); 
        nameTitle.className = "text-white font-bold text-sm truncate flex items-center gap-2"; 
        
        // Online ise yeşil nokta, değilse sadece isim
        let statusDot = ""; 
        if(isOnline) statusDot = '<span class="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)] flex-shrink-0" title="Oyunda"></span>'; 
        
        nameTitle.innerHTML = `${name} ${statusDot}`; 
        
        const roleSpan = document.createElement('span'); 
        roleSpan.className = "text-[10px] text-purple-400 font-bold tracking-wide block"; 
        roleSpan.textContent = "OPERATOR"; 
        
        infoDiv.appendChild(nameTitle); 
        infoDiv.appendChild(roleSpan); 
        
        // 3. Yetki Alma Butonu (Çöp Kutusu)
        const btnRemove = document.createElement('button'); 
        btnRemove.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>'; 
        btnRemove.className = "text-gray-500 hover:text-red-500 p-2 transition-colors flex-shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100"; 
        btnRemove.title = "Yetkiyi Al"; 
        btnRemove.onclick = () => 
        { 
            if(confirm(`${name} kullanıcısının yetkisini almak istediğine emin misin?`)) 
            { 
                socket.emit('admin-action', { action: 'deop', target: name }); 
            } 
        }; 
        
        card.appendChild(img); 
        card.appendChild(infoDiv); 
        card.appendChild(btnRemove); 
        
        listContainer.appendChild(card); 
    }); 
}
// 14.3-)
// --- DÜZELTİLMİŞ OYUNCU LİSTESİ GÜNCELLEME ---
// [DÜZELTME] Oyuncu Listesi ve Op Yetkisi
function updatePlayerList(playersArray, opsArray = []) 
{ 
    const listContainer = document.getElementById('player-list-container'); 
    const badgeCount = document.getElementById('player-count-badge'); 
    
    // Eğer o an oyuncular sayfasında değilsek çık
    if(!listContainer) return; 

    // Rozet sayısını güncelle
    if(badgeCount) badgeCount.textContent = playersArray.length; 
    
    // Listeyi temizle
    listContainer.innerHTML = ''; 

    // Eğer kimse yoksa mesaj göster
    if(playersArray.length === 0) 
    { 
        listContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10 italic">Şu an sunucuda kimse yok.</div>'; 
        return; 
    } 

    // Oyuncuları listele
    playersArray.forEach(name => 
    { 
        // Op kontrolü (Güvenli)
        const isOp = Array.isArray(opsArray) && opsArray.includes(name);

        // Kart Taşıyıcı
        const card = document.createElement('div'); 
        card.className = "bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center gap-3 shadow-md hover:bg-gray-750 transition-colors group"; 
        
        // 1. Kafa Resmi
        const img = document.createElement('img'); 
        img.src = `https://mc-heads.net/avatar/${name}/50`; 
        img.className = "w-10 h-10 rounded-md shadow-sm bg-gray-900 flex-shrink-0"; 
        
        // 2. İsim ve Durum
        const infoDiv = document.createElement('div'); 
        infoDiv.className = "flex-1 min-w-0"; 
        
        const nameTitle = document.createElement('h3'); 
        nameTitle.className = "text-white font-bold text-sm truncate flex items-center gap-2"; 
        nameTitle.innerHTML = name + (isOp ? ' <span class="text-[9px] bg-purple-600/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 flex-shrink-0">OP</span>' : ''); 
        
        const statusSpan = document.createElement('span'); 
        statusSpan.className = "text-[10px] text-green-500 flex items-center gap-1"; 
        statusSpan.innerHTML = "● Çevrimiçi"; 

        infoDiv.appendChild(nameTitle); 
        infoDiv.appendChild(statusSpan); 

        // 3. Buton Grubu
        const btnGroup = document.createElement('div'); 
        btnGroup.className = "flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0"; 
        
        // [DÜZELTİLDİ] Op Butonu Mantığı
        const btnOp = document.createElement('button'); 
        if (isOp) 
        { 
            // Zaten OP ise -> Yetkiyi Al (DEOP)
            btnOp.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" /></svg>'; 
            btnOp.className = "bg-gray-700 hover:bg-gray-600 text-gray-400 p-1.5 rounded transition shadow hover:text-white"; 
            btnOp.title = "Yetkiyi Al (Deop)";
            btnOp.onclick = () => 
            {
                if(confirm(`${name} kullanıcısının OP yetkisini almak istiyor musunuz?`)) {
                    socket.emit('admin-action', { action: 'deop', target: name }); 
                }
            };
        } 
        else 
        { 
            // OP değilse -> Yetki Ver (OP)
            btnOp.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>'; 
            btnOp.className = "bg-emerald-600/20 hover:bg-emerald-600 text-emerald-500 hover:text-white p-1.5 rounded transition shadow border border-emerald-600/30"; 
            btnOp.title = "Yetki Ver (Op)";
            btnOp.onclick = () => 
            {
                if(confirm(`${name} kullanıcısına OP yetkisi vermek istiyor musunuz?`)) {
                    socket.emit('admin-action', { action: 'op', target: name }); 
                }
            };
        } 
        
        // Kick Butonu
        const btnKick = document.createElement('button'); 
        btnKick.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>'; 
        btnKick.className = "bg-amber-600/20 hover:bg-amber-600 text-amber-500 hover:text-white p-1.5 rounded transition shadow border border-amber-600/30"; 
        btnKick.title = "At (Kick)";
        btnKick.onclick = () => socket.emit('admin-action', { action: 'kick', target: name }); 
        
        // Ban Butonu
        const btnBan = document.createElement('button'); 
        btnBan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>'; 
        btnBan.className = "bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white p-1.5 rounded transition shadow border border-rose-600/30"; 
        btnBan.title = "Yasakla (Ban)";
        btnBan.onclick = () => { if(confirm(`${name} sunucudan yasaklansın mı?`)) socket.emit('admin-action', { action: 'ban', target: name }); }; 
        
        // Birleştir
        btnGroup.appendChild(btnOp); 
        btnGroup.appendChild(btnKick); 
        btnGroup.appendChild(btnBan); 
        
        card.appendChild(img); 
        card.appendChild(infoDiv); 
        card.appendChild(btnGroup); 
        
        listContainer.appendChild(card); 
    }); 
}
window.deop = (n) => { if(confirm('Yetki al?')) socket.emit('admin-action', { action: 'deop', target: n }); };

// 15-) ARAYÜZ GÜNCELLEME YARDIMCILARI
function updateDashboardUI(s) 
{ 
    // Dashboard Sayfası
    const dLabel = document.getElementById('dash-status-label');
    const dDot = document.getElementById('dash-status-dot');
    const dHero = document.getElementById('hero-card');
    const dBtnStart = document.getElementById('dash-btn-start');
    const dBtnStop = document.getElementById('dash-btn-stop');

    if(dLabel && dDot) 
    {
        if(s === 'online') 
        {
            dLabel.textContent = "ONLINE";
            dLabel.className = "text-xl font-bold text-emerald-400 tracking-wide";
            dDot.className = "w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse";
            if(dHero) dHero.className = "relative bg-gradient-to-r from-gray-800 to-emerald-900/30 p-6 rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden transition-all duration-500";
            
            if(dBtnStart) { dBtnStart.disabled = true; dBtnStart.classList.add('opacity-50', 'cursor-not-allowed'); dBtnStart.innerHTML = 'BAŞLAT'; }
            if(dBtnStop) { dBtnStop.disabled = false; dBtnStop.classList.remove('opacity-50', 'cursor-not-allowed'); }
        } 
        else if(s === 'offline') 
        {
            dLabel.textContent = "OFFLINE";
            dLabel.className = "text-xl font-bold text-red-400 tracking-wide";
            dDot.className = "w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]";
            if(dHero) dHero.className = "relative bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden transition-all duration-500";
            
            if(dBtnStart) { dBtnStart.disabled = false; dBtnStart.classList.remove('opacity-50', 'cursor-not-allowed'); dBtnStart.innerHTML = 'BAŞLAT'; }
            if(dBtnStop) { dBtnStop.disabled = true; dBtnStop.classList.add('opacity-50', 'cursor-not-allowed'); }
            
            resetStats();
        } 
        else 
        {
            dLabel.textContent = "BAŞLATILIYOR...";
            dLabel.className = "text-xl font-bold text-amber-400 tracking-wide animate-pulse";
            dDot.className = "w-3 h-3 rounded-full bg-amber-500 animate-ping";
            
            if(dBtnStart) { dBtnStart.disabled = true; dBtnStart.innerHTML = '...'; }
            if(dBtnStop) dBtnStop.disabled = true;
        }
    }

    // Konsol Sayfası
    const c = document.getElementById('status-card'); 
    if(c) 
    {
        const i = document.getElementById('dash-status-icon'), t = document.getElementById('dash-status-text'); 
        i.className = "w-8 h-8 rounded-full shadow-inner transition-colors";
        if(s === 'online') { c.classList.add('border-emerald-500'); t.textContent = "AÇIK"; i.classList.add('bg-emerald-500'); } 
        else if(s === 'offline') { c.classList.remove('border-emerald-500'); t.textContent = "KAPALI"; i.classList.remove('bg-emerald-500'); }
        else { t.textContent = "BAŞLATILIYOR..."; }
    } 
}

// 16-) SOCKET.IO DİNLEYİCİLERİ
socket.on('log-history', (h) => { storedLogs=[]; if(h)h.split('\n').forEach(l=>storedLogs.push(l)); if(currentPage==='console')initDashboard(); });
socket.on('console-out', (m) => { if(m.trim()){ storedLogs.push(m.trim()); if(storedLogs.length>2000)storedLogs.shift(); if(currentPage==='console')appendLogToUI(m.trim()); } });
socket.on('log', (m) => { storedLogs.push(`[SİSTEM] ${m}`); if(currentPage==='console')appendLogToUI(`[SİSTEM] ${m}`); });
socket.on('status', (s) => { currentStatus = s; updateDashboardUI(s); }); 
socket.on('server-stats', (d) => {
    if(currentPage === 'dashboard') updateDashboardStats(d);
    const c=document.getElementById('stat-cpu'), r=document.getElementById('stat-ram'), p=document.getElementById('stat-players'), l=document.getElementById('live-indicator');
    if(c)c.textContent=`${d.cpu}%`; if(r)r.textContent=`${d.ram} MB`; if(p)p.textContent=`${Array.isArray(d.players)?d.players.length:0} / 20`;
    if(l){ if(currentStatus==='online'||parseFloat(d.cpu)>0) l.classList.remove('hidden'); else l.classList.add('hidden'); }
    if(currentPage==='players') updatePlayerList(d.players, d.ops||[]);
    if(currentPage==='ops') updateOpsList(d.ops, d.players||[]);
});
socket.on('audit-data', (l) => { if(currentPage==='audit') updateAuditList(l); });
socket.on('discord-data', (c) => { 
    if(currentPage === 'discord') {
        document.getElementById('discord-url-chat').value = c.chatUrl || '';
        document.getElementById('discord-url-events').value = c.eventsUrl || '';
        document.getElementById('discord-url-admin').value = c.adminUrl || '';
        const setChk = (id, val) => { const el = document.getElementById(id); if(el) el.checked = val; };
        setChk('discord-opt-chat', c.optChat); setChk('discord-opt-joins', c.optJoins); setChk('discord-opt-status', c.optStatus);
        setChk('discord-opt-deaths', c.optDeaths); setChk('discord-opt-advancements', c.optAdv); setChk('discord-opt-admin', c.optAdmin);
    }
});
socket.on('worlds-data', (l) => { if(currentPage === 'worlds') updateWorldsList(l); });
socket.on('schedules-data', (l) => { if(currentPage==='schedules') updateScheduleList(l); });
socket.on('plugins-data', (l) => { if(currentPage==='plugins') updatePluginList(l); });
socket.on('banned-data', (l) => { if(currentPage==='banned') updateBannedList(l); });
socket.on('settings-data', (d) => { 
    if(currentPage==='settings'){ 
        document.getElementById('set-ram-slider').value=parseInt(d.ram)||6; document.getElementById('set-ram-display').textContent=`${parseInt(d.ram)||6}G`; 
        if(d.props){
            const val = (id, k) => { const el = document.getElementById(id); if(el) el.value = d.props[k] || ''; };
            const chk = (id, k) => { const el = document.getElementById(id); if(el) el.checked = (d.props[k] === 'true'); };
            val('set-motd', 'motd'); val('set-max-players', 'max-players'); val('set-server-port', 'server-port'); 
            val('set-view-distance', 'view-distance'); val('set-spawn-protection', 'spawn-protection'); 
            val('set-gamemode', 'gamemode'); val('set-difficulty', 'difficulty'); 
            chk('set-pvp', 'pvp'); chk('set-allow-flight', 'allow-flight'); chk('set-online-mode', 'online-mode'); chk('set-white-list', 'white-list');
        }
    } 
    if(currentPage==='dashboard' && d.props) { 
        const m=document.getElementById('dash-motd'); if(m)m.textContent=d.props.motd||'Minecraft Sunucusu'; 
        const p=document.getElementById('dash-port'); if(p)p.textContent=d.props['server-port']||'25565'; 
    } 
});
socket.on('whitelist-data', (l) => { 
    const c=document.getElementById('whitelist-container'); if(!c)return; c.innerHTML=''; 
    l.forEach(i=>{ const d=document.createElement('div'); d.className="flex justify-between bg-gray-900 p-2 rounded"; d.innerHTML=`<span class="text-white">${i.name}</span><button class="text-red-500" onclick="removeWL('${i.name}')">X</button>`; c.appendChild(d); });
});

// Sidebar butonları olmadığı için bu event listenerları kaldırdık veya dashboard içine aldık

loadMenu();