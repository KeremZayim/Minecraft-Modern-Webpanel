/*
// ============================================================================
//  MC ADMIN PANEL - SERVER SIDE (SERVER.JS)
// ============================================================================
//
// 1-) AYARLAR VE MODÜLLER
//      - Gerekli kütüphaneler ve sabit dosya yolları.
//
// 2-) BAŞLANGIÇ KONTROLLERİ
//      - Sunucu klasörünün varlığını kontrol eder.
//
// 3-) YARDIMCI FONKSİYONLAR
//      3.1-) getFolderSize: Klasör boyutunu hesaplar.
//      3.2-) logAudit: Denetim kaydı tutar.
//      3.3-) sendDiscord: Discord webhook gönderir.
//      3.4-) getDiscordConfig: Discord ayarlarını okur.
//      3.5-) getPanelConfig: RAM ayarlarını okur.
//      3.6-) savePanelConfig: RAM ayarlarını kaydeder.
//      3.7-) getProperties: server.properties okur.
//      3.8-) saveProperties: server.properties kaydeder.
//      3.9-) getWhitelist: Whitelist okur.
//      3.10-) getOps: Yönetici listesini okur.
//      3.11-) getBannedPlayers: Banlı oyuncuları okur.
//      3.12-) getLatestLogs: Log dosyasını okur.
//      3.13-) getPlugins: Pluginleri listeler.
//      3.14-) getSchedules: Zamanlayıcı görevlerini okur.
//
// 4-) MULTER AYARLARI (DOSYA YÜKLEME)
//      - İkon, genel dosya ve plugin yükleme konfigürasyonları.
//
// 5-) ROUTE'LAR (API ENDPOINTS)
//      5.1-) İkon İşlemleri
//      5.2-) Plugin İşlemleri
//      5.3-) Dosya Yönetimi
//      5.4-) Yedekleme Sistemi
//      5.5-) Menü API
//
// 6-) ZAMANLAYICI (CRON JOBS)
//      - Otomatik görevleri yükler ve çalıştırır.
//
// 7-) GLOBAL SUNUCU BAŞLATMA
//      - startServerFunc: Java işlemini başlatır.
//
// 8-) İSTATİSTİK DÖNGÜSÜ
//      - CPU, RAM ve Oyuncu verilerini periyodik olarak çeker.
//
// 9-) SOCKET.IO BAĞLANTILARI
//      - Frontend ile gerçek zamanlı iletişim.
// ============================================================================
*/

// 1-) AYARLAR VE MODÜLLER
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const pidusage = require('pidusage'); 
const os = require('os');
const multer = require('multer');
const AdmZip = require('adm-zip');
const cron = require('node-cron'); 
const axios = require('axios');

const SERVER_FOLDER_NAME = 'mc-server'; 
const MC_SERVER_PATH = path.resolve(__dirname, '..', SERVER_FOLDER_NAME);
const JAR_NAME = 'server.jar'; 
const CONFIG_FILE = path.join(__dirname, 'config.json');
const SCHEDULES_FILE = path.join(__dirname, 'schedules.json');
const AUDIT_FILE = path.join(__dirname, 'audit.json');
const DISCORD_CONFIG_FILE = path.join(__dirname, 'discord-config.json');
const PROPS_FILE = path.join(MC_SERVER_PATH, 'server.properties');
const WHITELIST_FILE = path.join(MC_SERVER_PATH, 'whitelist.json');
const BANNED_PLAYERS_FILE = path.join(MC_SERVER_PATH, 'banned-players.json');
const ICON_FILE = path.join(MC_SERVER_PATH, 'server-icon.png');
const LOG_FILE = path.join(MC_SERVER_PATH, 'logs', 'latest.log');
const PLUGINS_DIR = path.join(MC_SERVER_PATH, 'plugins');
const BACKUP_DIR = path.join(__dirname, 'backups');
const PORT = 3000;

// 2-) BAŞLANGIÇ KONTROLLERİ
console.log("==========================================");
console.log(">> PANEL BAŞLATILIYOR...");
console.log(`>> Hedef Sunucu: ${MC_SERVER_PATH}`);

if (!fs.existsSync(MC_SERVER_PATH))
{
    console.error(`❌ HATA: '${SERVER_FOLDER_NAME}' klasörü bulunamadı!`);
}
else
{
    console.log("✅ Sunucu klasörü doğrulandı.");
}
console.log("==========================================");

const CPU_CORE_COUNT = os.cpus().length; 
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 3-) YARDIMCI FONKSİYONLAR

// 3.1-) getFolderSize
function getFolderSize(dirPath) 
{
    let size = 0;
    if (fs.existsSync(dirPath)) 
    {
        try 
        {
            const files = fs.readdirSync(dirPath);
            files.forEach(file => 
            {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isFile()) size += stats.size;
            });
        } 
        catch(e) {}
    }
    return (size / 1024 / 1024).toFixed(2) + ' MB';
}

// 3.2-) logAudit
function logAudit(action, details) 
{
    let audits = [];
    if (fs.existsSync(AUDIT_FILE)) try { audits = JSON.parse(fs.readFileSync(AUDIT_FILE)); } catch(e){}
    
    const newLog = {
        time: new Date().toLocaleString('tr-TR'),
        source: 'Panel',
        action: action,
        details: details
    };
    
    audits.unshift(newLog);
    if (audits.length > 100) audits.pop();
    
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(audits, null, 2));
    io.emit('audit-data', audits);
}

// 3.3-) sendDiscord
function sendDiscord(msg, type = 'event') 
{
    if (!fs.existsSync(DISCORD_CONFIG_FILE)) return;
    try 
    {
        const conf = JSON.parse(fs.readFileSync(DISCORD_CONFIG_FILE));
        let targetUrl = '';

        // Hangi URL'yi kullanacağımızı seçelim
        if (type === 'chat') targetUrl = conf.chatUrl;
        else if (type === 'admin') targetUrl = conf.adminUrl;
        else targetUrl = conf.eventsUrl; // Varsayılan events

        // Eğer o kanal için URL girilmemişse gönderme
        if (targetUrl && targetUrl.startsWith('http')) 
        {
            axios.post(targetUrl, { content: msg }).catch(() => {});
        }
    } 
    catch(e) {}
}

// 3.4-) getDiscordConfig
function getDiscordConfig() 
{
    const def = { 
        chatUrl: '', 
        eventsUrl: '', 
        adminUrl: '', 
        optChat: false, 
        optStatus: true, 
        optJoins: true,
        optDeaths: false,
        optAdv: false,
        optAdmin: true
    };

    if (!fs.existsSync(DISCORD_CONFIG_FILE)) return def;
    try { return { ...def, ...JSON.parse(fs.readFileSync(DISCORD_CONFIG_FILE)) }; } 
    catch(e) { return def; }
}

// 3.5-) getPanelConfig
function getPanelConfig() 
{ 
    if (!fs.existsSync(CONFIG_FILE)) { const def = { ramMin: '4G', ramMax: '6G' }; fs.writeFileSync(CONFIG_FILE, JSON.stringify(def)); return def; } 
    return JSON.parse(fs.readFileSync(CONFIG_FILE)); 
}

// 3.6-) savePanelConfig
function savePanelConfig(nc) 
{ 
    const c = getPanelConfig(); const u = { ...c, ...nc }; 
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(u, null, 2)); 
}

// 3.7-) getProperties
function getProperties() 
{ 
    if (!fs.existsSync(PROPS_FILE)) return {}; 
    const c = fs.readFileSync(PROPS_FILE, 'utf8'); const p = {}; 
    c.split('\n').forEach(l => { if (l && !l.startsWith('#') && l.includes('=')) { const [k, ...r] = l.split('='); p[k.trim()] = r.join('=').trim(); } }); 
    return p; 
}

// 3.8-) saveProperties
function saveProperties(np) 
{ 
    if (!fs.existsSync(PROPS_FILE)) return; 
    let c = fs.readFileSync(PROPS_FILE, 'utf8'); 
    const l = c.split('\n'); 
    const ul = l.map(line => { if (line && !line.startsWith('#') && line.includes('=')) { const k = line.split('=')[0].trim(); if (np.hasOwnProperty(k)) return `${k}=${np[k]}`; } return line; }); 
    fs.writeFileSync(PROPS_FILE, ul.join('\n')); 
}

// 3.9-) getWhitelist
function getWhitelist() 
{ 
    if (!fs.existsSync(WHITELIST_FILE)) return []; 
    try { return JSON.parse(fs.readFileSync(WHITELIST_FILE, 'utf8')); } catch (e) { return []; } 
}

// 3.10-) getOps
function getOps() 
{ 
    const p = path.join(MC_SERVER_PATH, 'ops.json'); 
    if (!fs.existsSync(p)) return []; 
    try { return JSON.parse(fs.readFileSync(p, 'utf8')).map(op => op.name); } catch (e) { return []; } 
}

// 3.11-) getBannedPlayers
function getBannedPlayers() 
{ 
    if (!fs.existsSync(BANNED_PLAYERS_FILE)) return []; 
    try { return JSON.parse(fs.readFileSync(BANNED_PLAYERS_FILE, 'utf8')); } catch (e) { return []; } 
}

// 3.12-) getLatestLogs
function getLatestLogs(lc = 100) 
{ 
    if (!fs.existsSync(LOG_FILE)) return "--- Log dosyası henüz oluşmadı. ---"; 
    try { return fs.readFileSync(LOG_FILE, 'utf8').split(/\r?\n/).slice(-lc).join('\n'); } catch (e) { return "Log hatası: " + e.message; } 
}

// 3.13-) getPlugins
function getPlugins() 
{
    if (!fs.existsSync(PLUGINS_DIR)) return [];
    try 
    {
        return fs.readdirSync(PLUGINS_DIR)
            .filter(f => f.endsWith('.jar') || f.endsWith('.jar.disabled'))
            .map(f => ({ name: f, enabled: !f.endsWith('.disabled') }));
    } catch(e) { return []; }
}

// 3.14-) getSchedules
function getSchedules() 
{
    if (!fs.existsSync(SCHEDULES_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf8')); } catch(e){ return []; }
}


// 4-) MULTER AYARLARI (DOSYA YÜKLEME)
const upload = multer({ 
    storage: multer.diskStorage({ 
        destination: (req, file, cb) => { 
            if (!fs.existsSync(MC_SERVER_PATH)) fs.mkdirSync(MC_SERVER_PATH, { recursive: true }); 
            cb(null, MC_SERVER_PATH); 
        }, 
        filename: (req, file, cb) => cb(null, 'server-icon.png') 
    }) 
});

const uploadFile = multer({ 
    storage: multer.diskStorage({ 
        destination: (req, file, cb) => { 
            let relPath = req.query.path || ''; 
            relPath = relPath.replace(/\.\./g, ''); 
            const targetPath = path.join(MC_SERVER_PATH, relPath); 
            if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true }); 
            cb(null, targetPath); 
        }, 
        filename: (req, file, cb) => { 
            file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8'); 
            cb(null, file.originalname); 
        } 
    }) 
});

const uploadPlugin = multer({ 
    storage: multer.diskStorage({ 
        destination: (req, file, cb) => { 
            if (!fs.existsSync(PLUGINS_DIR)) fs.mkdirSync(PLUGINS_DIR, { recursive: true }); 
            cb(null, PLUGINS_DIR); 
        }, 
        filename: (req, file, cb) => cb(null, file.originalname) 
    }) 
});

// 5-) ROUTE'LAR (API ENDPOINTS)

// 5.1-) İkon İşlemleri
app.get('/server-icon.png', (req, res) => { 
    if (fs.existsSync(ICON_FILE)) res.sendFile(ICON_FILE); 
    else res.status(404).send('Icon not found'); 
});

app.post('/api/upload-icon', upload.single('icon'), (req, res) => { 
    logAudit('İkon', 'Sunucu ikonu değiştirildi.'); 
    res.json({ success: true }); 
});

app.delete('/api/delete-icon', (req, res) => { 
    if (fs.existsSync(ICON_FILE)) { 
        fs.unlinkSync(ICON_FILE); 
        logAudit('İkon', 'İkon silindi.'); 
        res.json({ success: true }); 
    } else {
        res.json({ success: false }); 
    }
});

// 5.2-) Plugin İşlemleri
app.post('/api/plugins/upload', uploadPlugin.array('files'), (req, res) => {
    logAudit('Plugin', 'Yeni plugin yüklendi.');
    res.json({ success: true });
    io.emit('plugins-data', getPlugins()); 
});

app.post('/api/plugins/toggle', (req, res) => {
    const { name } = req.body; 
    const oldPath = path.join(PLUGINS_DIR, name); 
    let newPath = "";
    if (name.endsWith('.jar')) newPath = oldPath + '.disabled'; 
    else if (name.endsWith('.disabled')) newPath = oldPath.replace('.disabled', ''); 
    else return res.json({ success: false });
    try { 
        fs.renameSync(oldPath, newPath); 
        logAudit('Plugin', `${name} durumu değiştirildi.`);
        res.json({ success: true }); 
        io.emit('plugins-data', getPlugins()); 
    } catch(e) { 
        res.json({ success: false, error: e.message }); 
    }
});

app.delete('/api/plugins/delete', (req, res) => { 
    try { 
        fs.unlinkSync(path.join(PLUGINS_DIR, req.body.name)); 
        res.json({ success: true }); 
        io.emit('plugins-data', getPlugins());
    } catch(e) { 
        res.json({ success: false }); 
    } 
});

// 5.3-) Dosya Yönetimi
app.get('/api/files/list', (req, res) => {
    let relPath = req.query.path || '';
    if (relPath.includes('..')) return res.status(403).json({ error: "Yasak" });
    const targetDir = path.join(MC_SERVER_PATH, relPath);
    if (!fs.existsSync(targetDir)) return res.status(404).json({ error: "Klasör yok" });
    fs.readdir(targetDir, { withFileTypes: true }, (err, items) => {
        if (err) return res.status(500).json({ error: "Hata" });
        const files = items.map(item => {
            const itemPath = path.join(targetDir, item.name);
            let size = 0; try { size = fs.statSync(itemPath).size; } catch(e){}
            return { name: item.name, isDir: item.isDirectory(), size: size, path: path.join(relPath, item.name).replace(/\\/g, '/') };
        });
        files.sort((a, b) => (a.isDir === b.isDir ? 0 : a.isDir ? -1 : 1));
        res.json(files);
    });
});

app.get('/api/files/read', (req, res) => { 
    let relPath = req.query.path || ''; if (relPath.includes('..')) return res.status(403).send("Yasak"); 
    const target = path.join(MC_SERVER_PATH, relPath); if (!fs.existsSync(target)) return res.status(404).send("Yok"); 
    try { res.send(fs.readFileSync(target, 'utf8')); } catch (e) { res.status(500).send("Hata"); } 
});

app.post('/api/files/save', (req, res) => { 
    const { path: relPath, content } = req.body; if (!relPath || relPath.includes('..')) return res.status(403).json({error:"Yasak"}); 
    try { fs.writeFileSync(path.join(MC_SERVER_PATH, relPath), content, 'utf8'); res.json({success:true}); } catch(e) { res.status(500).json({error:e.message}); } 
});

app.post('/api/files/create', (req, res) => { 
    const { type, name, currentPath } = req.body; let safePath = (currentPath || '').replace(/\.\./g, ''); const target = path.join(MC_SERVER_PATH, safePath, name); 
    try { if (type === 'dir') { if (!fs.existsSync(target)) fs.mkdirSync(target); } else { if (!fs.existsSync(target)) fs.writeFileSync(target, ''); } res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.delete('/api/files/delete', (req, res) => { 
    const relPath = req.query.path; if (!relPath || relPath.includes('..')) return res.status(403).json({error:"Yasak"}); const target = path.join(MC_SERVER_PATH, relPath); 
    try { if (fs.lstatSync(target).isDirectory()) fs.rmSync(target, { recursive: true, force: true }); else fs.unlinkSync(target); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); } 
});

app.post('/api/files/upload', uploadFile.array('files'), (req, res) => res.json({ success: true }));

// 5.4-) Yedekleme Sistemi
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

app.get('/api/backups/list', (req, res) => { 
    fs.readdir(BACKUP_DIR, (err, files) => { 
        if (err) return res.json([]); 
        const backups = files.filter(f => f.endsWith('.zip')).map(f => { try { const stat = fs.statSync(path.join(BACKUP_DIR, f)); return { name: f, size: (stat.size / 1024 / 1024).toFixed(2) + ' MB', date: stat.mtime.toLocaleString('tr-TR') }; } catch(e) { return null; } }).filter(x => x !== null).sort((a, b) => new Date(b.date) - new Date(a.date)); 
        res.json(backups); 
    }); 
});

app.post('/api/backups/create', (req, res) => { 
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); 
    const backupName = `backup-${timestamp}.zip`; 
    const backupPath = path.join(BACKUP_DIR, backupName); 
    if (mcProcess) { mcProcess.stdin.write("say [Panel] Yedekleme basliyor...\n"); mcProcess.stdin.write("save-off\n"); mcProcess.stdin.write("save-all flush\n"); } 
    setTimeout(() => { 
        try { 
            const zip = new AdmZip(); 
            fs.readdirSync(MC_SERVER_PATH, { withFileTypes: true }).forEach(dirent => { if (dirent.isDirectory()) { if (dirent.name.startsWith('world') || dirent.name === 'plugins') { zip.addLocalFolder(path.join(MC_SERVER_PATH, dirent.name), dirent.name, (filename) => { if (filename.includes('session.lock')) return false; if (filename.includes('cache')) return false; return true; }); } } }); 
            fs.readdirSync(MC_SERVER_PATH).forEach(file => { const fullPath = path.join(MC_SERVER_PATH, file); if (fs.lstatSync(fullPath).isFile()) { if (file.endsWith('.properties') || file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml')) { zip.addLocalFile(fullPath); } } }); 
            zip.writeZip(backupPath); logAudit('Yedek', 'Yeni yedek oluşturuldu.'); res.json({ success: true, name: backupName }); 
        } catch (e) { res.json({ success: false, error: e.message }); } 
        finally { if (mcProcess) { mcProcess.stdin.write("save-on\n"); mcProcess.stdin.write("say [Panel] Yedekleme tamamlandi.\n"); } } 
    }, 2000); 
});

app.delete('/api/backups/delete/:name', (req, res) => { 
    const filePath = path.join(BACKUP_DIR, req.params.name); 
    if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); res.json({ success: true }); } catch(e) { res.json({ success: false }); } } else { res.json({ success: false }); } 
});

app.get('/api/backups/download/:name', (req, res) => { 
    const filePath = path.join(BACKUP_DIR, req.params.name); 
    if (fs.existsSync(filePath)) res.download(filePath); else res.status(404).send('Dosya yok'); 
});

app.post('/api/backups/restore/:name', (req, res) => { 
    const filePath = path.join(BACKUP_DIR, req.params.name); 
    if (!fs.existsSync(filePath)) return res.json({ success: false, error: "Yedek bulunamadı" }); 
    if (mcProcess) return res.json({ success: false, error: "Sunucu açıkken geri yüklenemez!" }); 
    try { const zip = new AdmZip(filePath); zip.extractAllTo(MC_SERVER_PATH, true); logAudit('Yedek', 'Geri yükleme yapıldı.'); res.json({ success: true }); } catch (e) { res.json({ success: false, error: e.message }); } 
});

// 5.5-) Menü API
app.get('/api/menu', (req, res) => 
{
    const pagesDir = path.join(__dirname, 'public/pages');
    const nameMap = {
        'dashboard': 'Ana Sayfa',
        'players': 'Oyuncular',
        'banned': 'Ban Listesi',
        'ops': 'Yöneticiler',
        'files': 'Dosyalar',
        'plugins': 'Eklentiler',
        'console': 'Konsol',
        'schedules': 'Zamanlayıcılar',
        'audit': 'Denetim Kaydı',
        'discord': 'Discord',
        'settings': 'Ayarlar',
        'worlds': 'Dünyalar', 
        'backups': 'Yedekler'
    };
    fs.readdir(pagesDir, (err, files) => 
    {
        if (err) return res.json([]);
        const menuItems = files.filter(f => f.endsWith('.html')).map(f => { const id = f.replace('.html', ''); return { id: id, name: nameMap[id] || id.toUpperCase(), file: f }; });
        const order = [
            'players',
            'banned',
            'ops',
            'files',
            'plugins',
            'console',
            'schedules',
            'audit',
            'discord',
            'settings',
            'worlds',
            'backups'
        ];
        menuItems.sort((a, b) => { let ia = order.indexOf(a.id); let ib = order.indexOf(b.id); if (ia === -1) ia = 99; if (ib === -1) ib = 99; return ia - ib; });
        res.json(menuItems);
    });
});

// 6-) ZAMANLAYICI (CRON JOBS)
let activeCronJobs = [];
function loadSchedules() 
{
    activeCronJobs.forEach(job => job.stop()); activeCronJobs = [];
    const schedules = getSchedules();
    schedules.forEach(task => {
        if(task.enabled && cron.validate(task.cron)) {
            const job = cron.schedule(task.cron, () => {
                console.log(`[Zamanlayıcı] Görev: ${task.name}`);
                io.emit('log', `🕒 Zamanlayıcı: ${task.name} çalıştırılıyor...`);
                if (task.action === 'command' && mcProcess) { mcProcess.stdin.write(task.payload + '\n'); }
                else if (task.action === 'restart' || task.action === 'start') { startServerFunc(); }
                else if (task.action === 'stop' && mcProcess) { mcProcess.stdin.write('stop\n'); }
            });
            activeCronJobs.push(job);
        }
    });
}

// 7-) GLOBAL SUNUCU BAŞLATMA
function startServerFunc() 
{
    if (mcProcess) return;
    const config = getPanelConfig();
    if (!fs.existsSync(path.join(MC_SERVER_PATH, JAR_NAME))) { io.emit('log', `❌ HATA: ${JAR_NAME} dosyası bulunamadı!`); return; }
    
    io.emit('log', `🚀 Başlatılıyor (${config.ramMax})...`);
    io.emit('status', 'starting');
    
    const conf = getDiscordConfig();
    if (conf.optStatus) sendDiscord('🟢 Sunucu başlatılıyor...', 'event');
    
    logAudit('Sunucu', 'Sunucu başlatıldı.');
    onlinePlayers = []; correctPid = null;

    try 
    {
        mcProcess = spawn('java', [`-Xms${config.ramMin}`, `-Xmx${config.ramMax}`, '-jar', JAR_NAME, 'nogui'], { cwd: MC_SERVER_PATH });
        mcProcess.stdout.on('data', (data) => 
        {
            const line = data.toString();
            io.emit('console-out', line);
            const dConf = getDiscordConfig();

            // Discord CHAT
            if (line.includes('<') && line.includes('>')) { if (dConf.optChat) sendDiscord(`**[Chat]** ${line.trim()}`, 'chat'); }
            
            // GİRİŞ
            if (line.includes('joined the game')) { 
                const n = line.split(':').pop().replace(' joined the game', '').trim(); 
                if(n && !onlinePlayers.includes(n)) onlinePlayers.push(n);
                if (dConf.optJoins) sendDiscord(`➕ **${n}** oyuna katıldı.`, 'event');
            }
            
            // ÇIKIŞ
            if (line.includes('left the game')) { 
                const n = line.split(':').pop().replace(' left the game', '').trim(); 
                onlinePlayers = onlinePlayers.filter(p => p !== n);
                if (dConf.optJoins) sendDiscord(`➖ **${n}** oyundan ayrıldı.`, 'event');
            }
            
            // ÖLÜM (Basit tespit)
            if (dConf.optDeaths && (line.includes('slain by') || line.includes('drowned') || line.includes('fell from') || line.includes('blown up'))) {
                sendDiscord(`💀 ${line.split(']: ')[1] || line}`, 'event');
            }

            // BAŞARIM
            if (dConf.optAdv && line.includes('has made the advancement')) {
                sendDiscord(`🏆 ${line.split(']: ')[1] || line}`, 'event');
            }

            if (line.includes('Done') || line.includes('For help')) io.emit('status', 'online');
        });
        
        mcProcess.stderr.on('data', (data) => io.emit('console-out', `ERR: ${data.toString()}`));
        mcProcess.on('close', (code) => {
            io.emit('log', `🛑 Kapandı: ${code}`);
            io.emit('status', 'offline');
            const dConf = getDiscordConfig();
            if (dConf.optStatus) sendDiscord('🔴 Sunucu kapandı.', 'event');
            logAudit('Sunucu', 'Sunucu kapandı.');
            if(correctPid) try{ pidusage.unmonitor(correctPid); }catch(e){}
            mcProcess = null; onlinePlayers = [];
        });
    } 
    catch (error) { io.emit('log', `Hata: ${error.message}`); }
}

let mcProcess = null;
let correctPid = null;
let onlinePlayers = [];

loadSchedules();

// 8-) İSTATİSTİK DÖNGÜSÜ
setInterval(() => {
    const cOps = getOps();
    let statsData = { cpu: 0, ram: 0, players: onlinePlayers, ops: cOps };

    if (!mcProcess) {
        correctPid = null; onlinePlayers = [];
        io.emit('server-stats', { ...statsData, players: [], ops: cOps });
        return;
    }

    if (!correctPid) {
        const cmd = `powershell -command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*${JAR_NAME}*' } | Sort-Object WorkingSetSize -Descending | Select-Object -First 1 | ForEach-Object { $_.ProcessId.ToString() + ' ' + $_.WorkingSetSize.ToString() }"`;
        exec(cmd, (e, out) => { 
            if (!e && out && out.trim()) { 
                const p = out.trim().split(' '); 
                if (p.length === 2) { 
                    const pid = parseInt(p[0]); const b = parseInt(p[1]); 
                    if (!isNaN(pid) && !isNaN(b)) { 
                        const mb = (b / 1048576).toFixed(0); 
                        pidusage(pid, (err, s) => { 
                            let cpu = 0; if (!err && s) cpu = (s.cpu / CPU_CORE_COUNT).toFixed(1); if(cpu>100) cpu=100; 
                            statsData.cpu = cpu; statsData.ram = mb; io.emit('server-stats', statsData); 
                        }); correctPid = pid; 
                    } 
                } 
            } else { io.emit('server-stats', statsData); }
        });
    } else {
        pidusage(correctPid, (e, s) => { 
            if (e) { correctPid = null; io.emit('server-stats', statsData); return; } 
            if (s) { 
                let cpu = (s.cpu / CPU_CORE_COUNT).toFixed(1); if(cpu>100) cpu=100; 
                statsData.cpu = cpu; statsData.ram = (s.memory / 1048576).toFixed(0); io.emit('server-stats', statsData); 
            } 
        });
    }
}, 2000);

// 9-) SOCKET.IO BAĞLANTILARI
io.on('connection', (socket) => {
    socket.emit('status', mcProcess ? 'online' : 'offline');
    socket.emit('log-history', getLatestLogs(200));

    socket.on('get-settings', () => { const c = getPanelConfig(); const p = getProperties(); socket.emit('settings-data', { ram: c.ramMax.replace('G',''), props: p }); });
    socket.on('save-settings', (d) => { if(d.ram) savePanelConfig({ ramMin: '4G', ramMax: `${d.ram}G` }); if(d.props) { saveProperties(d.props); if (mcProcess) { if (d.props['difficulty']) mcProcess.stdin.write(`difficulty ${d.props['difficulty']}\n`); if (d.props['gamemode']) mcProcess.stdin.write(`defaultgamemode ${d.props['gamemode']}\n`); if (d.props['white-list'] === true) mcProcess.stdin.write(`whitelist on\n`); else if (d.props['white-list'] === false) mcProcess.stdin.write(`whitelist off\n`); } } logAudit('Ayarlar', 'Ayarlar güncellendi.'); io.emit('log', '✅ Ayarlar kaydedildi!'); });
    socket.on('get-whitelist', () => { socket.emit('whitelist-data', getWhitelist()); });
    socket.on('whitelist-add', (n) => { if(mcProcess) { mcProcess.stdin.write(`whitelist add ${n}\n`); } setTimeout(() => { io.emit('whitelist-data', getWhitelist()); }, 1000); });
    socket.on('whitelist-remove', (n) => { if(mcProcess) { mcProcess.stdin.write(`whitelist remove ${n}\n`); } setTimeout(() => { io.emit('whitelist-data', getWhitelist()); }, 1000); });
    
    socket.on('get-audit', () => { if (fs.existsSync(AUDIT_FILE)) socket.emit('audit-data', JSON.parse(fs.readFileSync(AUDIT_FILE))); else socket.emit('audit-data', []); });
    socket.on('get-discord', () => { socket.emit('discord-data', getDiscordConfig()); });
    socket.on('save-discord', (config) => { fs.writeFileSync(DISCORD_CONFIG_FILE, JSON.stringify(config, null, 2)); logAudit('Ayarlar', 'Discord ayarları güncellendi.'); socket.emit('log', '✅ Discord kaydedildi.'); });

    socket.on('get-worlds', () => { const worlds = []; if (fs.existsSync(MC_SERVER_PATH)) { fs.readdirSync(MC_SERVER_PATH).forEach(file => { if (file.startsWith('world') && fs.lstatSync(path.join(MC_SERVER_PATH, file)).isDirectory()) { worlds.push({ name: file }); } }); } socket.emit('worlds-data', worlds); });
    socket.on('world-action', (data) => { if (mcProcess) return socket.emit('log', '⚠️ Sunucu açıkken silinemez!'); const targetPath = path.join(MC_SERVER_PATH, data.name); if (!fs.existsSync(targetPath)) return; if (data.action === 'delete') { try { fs.rmSync(targetPath, { recursive: true, force: true }); logAudit('Dünya', `${data.name} silindi.`); socket.emit('log', `🗑️ ${data.name} silindi.`); const worlds = fs.readdirSync(MC_SERVER_PATH).filter(f => f.startsWith('world')); socket.emit('worlds-data', worlds.map(w => ({name: w}))); } catch(e) { socket.emit('log', 'Hata: ' + e.message); } } });

    socket.on('get-banned', () => socket.emit('banned-data', getBannedPlayers()));
    socket.on('unban-player', (n) => { if(mcProcess) { mcProcess.stdin.write(`pardon ${n}\n`); } setTimeout(() => { io.emit('banned-data', getBannedPlayers()); }, 1000); });
    socket.on('get-plugins', () => socket.emit('plugins-data', getPlugins()));
    socket.on('get-schedules', () => socket.emit('schedules-data', getSchedules()));
    socket.on('save-schedules', (schedules) => { fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2)); loadSchedules(); io.emit('log', '⏰ Zamanlayıcılar güncellendi.'); io.emit('schedules-data', schedules); });

    socket.on('start-server', () => startServerFunc());
    socket.on('send-command', (cmd) => mcProcess && mcProcess.stdin.write(cmd + '\n'));
    socket.on('stop-server', () => mcProcess && mcProcess.stdin.write('stop\n'));
    socket.on('admin-action', (d) => 
    { 
        if (!mcProcess) return; 
        let c = ""; 
        switch(d.action) { case 'kick': c = `kick ${d.target}`; break; case 'ban': c = `ban ${d.target}`; break; case 'op': c = `op ${d.target}`; break; case 'deop': c = `deop ${d.target}`; break; } 
        if(c) { 
            mcProcess.stdin.write(c+'\n'); 
            io.emit('console-out', `> [PANEL] ${c}\n`); 
            logAudit('Admin', `${d.action.toUpperCase()} -> ${d.target}`);
            const conf = getDiscordConfig(); if(conf.optAdmin) sendDiscord(`🛡️ **Admin:** ${c}`, 'admin');
            
            if (d.action === 'ban') setTimeout(() => io.emit('banned-data', getBannedPlayers()), 1000);
        } 
    });
});

server.listen(PORT, () => console.log(`✅ Panel: http://localhost:${PORT}`));