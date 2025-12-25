/*
// ============================================================================
//  MC ADMIN PANEL - CLIENT SIDE (APP.JS)
// ============================================================================
//
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
//      9.2-) searchPlugins: Marketten arama yapar.
//      9.3-) installRemotePlugin: Marketten indirir.
//      9.4-) updatePluginList: Pluginleri listeler.
//
// 10-) YASAKLILAR
//      10.1-) initBannedPage: Yasaklılar sayfasını başlatır.
//      10.2-) updateBannedList: Listeyi günceller.
//
// 11-) DENETİM KAYITLARI
//      11.1-) initAuditPage: Audit sayfasını başlatır.
//      11.2-) renderAuditLogs: Logları listeler.
//
// 12-) DISCORD ENTEGRASYONU
//      12.1-) initDiscordPage: Discord ayarlarını yönetir.
//
// 13-) DÜNYA YÖNETİCİSİ
//      13.1-) initWorldsPage: Dünya yükleme ve listeleme.
//      13.2-) updateWorldsList: Dünya listesini günceller.
//
// 14-) AYARLAR VE YÖNETİCİLER
//      14.1-) initSettingsPage: Ayarlar sayfasını başlatır.
//      14.2-) initOpsPage: Ops sayfasını başlatır.
//      14.3-) updateOpsList: Yönetici listesini günceller.
//      14.4-) updatePlayerList: Oyuncu listesini günceller.
//
// 15-) ARAYÜZ GÜNCELLEME
//      15.1-) updateDashboardUI: Online/Offline durumunu yansıtır.
//      15.2-) resetStats: İstatistikleri sıfırlar.
//
// 16-) SOCKET.IO DİNLEYİCİLERİ
//      - Sunucudan gelen verileri işler.
//
// 17-) YAZILIM YÖNETİCİSİ
//      17.1-) initSoftwarePage: Yazılım sayfasını başlatır.
//      17.2-) setupInstallListener: Kurulum ilerlemesini dinler.
//
// 18-) BAŞLANGIÇ MANTIĞI
//      18.1-) initApp: Uygulamayı başlatır.
//
// 19-) GELİŞMİŞ OYUNCU YÖNETİMİ
//      19.1-) switchPlayerTab: Sekmeler arası geçiş.
//      19.2-) updateIpBanList: IP Ban listesini günceller.
// ============================================================================
*/

// ============================================================================
// 1-) DEĞİŞKENLER VE ELEMENT SEÇİMLERİ
// ============================================================================
const socket = io();
const contentDiv = document.getElementById("main-content");
const menuContainer = document.getElementById("sidebar-menu");

const btnStart = document.getElementById("btn-start");
const btnStop = document.getElementById("btn-stop");

let currentAuditFilter = "panel";
let storedLogs = [];
let currentStatus = "offline";
let currentPage = "dashboard";
let schedules = [];
let currentPath = "";
let allAuditLogs = [];
let auditPageIndex = 1;
let auditPageSize = 50;

let currentOnlinePlayers = []; // Oyuncuları burada tutacağız

// Oyuncu Sayfalama Değişkenleri
let allPlayersData = [];
let allPlayersPage = 1;
let allPlayersLimit = 50;

// En çok kullanılan komutları buraya ekledim, istersen artırabilirsin
const commonCommands = [
  "ban",
  "ban-ip",
  "pardon",
  "pardon-ip",
  "kick",
  "kill",
  "op",
  "deop",
  "gamemode",
  "gamerule",
  "tp",
  "time set",
  "weather",
  "say",
  "stop",
  "whitelist",
  "save-all",
  "list",
  "me",
];

// ============================================================================
// 2-) MENÜ YÖNETİMİ
// ============================================================================
// 2.1-) loadMenu
async function loadMenu() {
  try {
    const res = await fetch("/api/menu");
    const items = await res.json();
    menuContainer.innerHTML = "";

    const dashBtn = document.createElement("button");
    dashBtn.id = "menu-btn-dashboard";
    dashBtn.className =
      "w-full text-left px-4 py-3 rounded-lg text-white hover:bg-gray-800 transition-colors text-sm font-bold uppercase tracking-wide flex items-center gap-3";
    dashBtn.innerHTML =
      '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> DASHBOARD';
    dashBtn.onclick = () => loadPage("dashboard", dashBtn);
    menuContainer.appendChild(dashBtn);

    const icons = {
      console:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>',
      players:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
      files:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>',
      plugins:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>',
      settings:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>',
      schedules:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      backups:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>',
      audit:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 100 4 2 2 0 000-4zm-8 5a2 2 0 110-4 2 2 0 010 4z" /></svg>',
      discord:
        '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
      worlds:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
      software:
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>',
    };

    items.forEach((item) => {
      if (item.id === "dashboard") return;
      // Eğer ops veya banned id'li sayfalar varsa onları menüde gösterme (Players içinde birleşti)
      if (item.id === "ops" || item.id === "banned") return;

      const btn = document.createElement("button");
      btn.id = `menu-btn-${item.id}`;
      btn.className =
        "w-full text-left px-4 py-3 rounded-lg text-white hover:bg-gray-800 transition-colors text-sm font-bold uppercase tracking-wide flex items-center gap-3";
      const icon =
        icons[item.id] ||
        '<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>';
      btn.innerHTML = `${icon} ${item.name}`;
      btn.onclick = () => loadPage(item.id, btn);
      menuContainer.appendChild(btn);
    });
  } catch (err) {}
}

// ============================================================================
// 3-) SAYFA YÖNLENDİRME SİSTEMİ
// ============================================================================
// 3.1-) loadPage
async function loadPage(pageId, activeBtn) {
  currentPage = pageId;

  document
    .querySelectorAll("#sidebar-menu button")
    .forEach((b) =>
      b.classList.remove("bg-blue-600", "text-white", "hover:bg-blue-700")
    );

  if (activeBtn) {
    activeBtn.classList.remove("text-gray-400", "hover:bg-gray-800");
    activeBtn.classList.add("bg-blue-600", "text-white", "hover:bg-blue-700");
  }

  if (pageId === "dashboard") {
    const res = await fetch(`/pages/dashboard.html`);
    contentDiv.innerHTML = await res.text();
    initDashboardPage();
  } else {
    const res = await fetch(`/pages/${pageId}.html`);
    contentDiv.innerHTML = await res.text();

    if (pageId === "console") initConsolePage();
    //if (pageId === 'ops') initOpsPage();
    if (pageId === "settings") initSettingsPage();
    if (pageId === "files") initFilesPage();
    if (pageId === "backups") initBackupsPage();
    if (pageId === "schedules") initSchedulesPage();
    if (pageId === "plugins") initPluginsPage();
    //if (pageId === 'banned') initBannedPage();
    if (pageId === "audit") initAuditPage();
    if (pageId === "discord") initDiscordPage();
    if (pageId === "worlds") initWorldsPage();
    if (pageId === "software") initSoftwarePage();
    if (pageId === "players") {
      setTimeout(() => {
        setupPlayersPage();
      }, 100);
    }
  }
}

// ============================================================================
// 4-) DASHBOARD (ÖZET) MANTIĞI
// ============================================================================
// 4.1-) initDashboardPage
function initDashboardPage() {
  socket.emit("get-settings");
  updateDashboardUI(currentStatus);

  const dBtnStart = document.getElementById("dash-btn-start");
  const dBtnStop = document.getElementById("dash-btn-stop");

  if (dBtnStart) {
    dBtnStart.onclick = () => {
      socket.emit("start-server");
      updateDashboardUI("starting");
    };
  }

  if (dBtnStop) {
    dBtnStop.onclick = () => {
      if (confirm("Sunucuyu durdurmak istiyor musunuz?")) {
        socket.emit("stop-server");
      }
    };
  }
}

// 4.2-) updateDashboardStats (RAM YÜZDESİ DÜZELTİLDİ)
// 4.2-) updateDashboardStats (RENKLENDİRME GÜNCELLENDİ)
function updateDashboardStats(data) {
  const ramBar = document.getElementById("dash-ram-bar");
  const ramText = document.getElementById("dash-ram-text");
  const ramPercent = document.getElementById("dash-ram-percent");

  // --- RAM HESAPLAMA VE RENKLENDİRME ---
  if (ramBar && ramText) {
    const currentRam = parseInt(data.ram);
    const maxRam = data.max || 4096;
    const percent = Math.min((currentRam / maxRam) * 100, 100).toFixed(1);

    // Renk Mantığı:
    // < 60 : Mor (Varsayılan)
    // 60-70: Sarı
    // 70-80: Turuncu
    // 80+  : Kırmızı
    let ramColorClass = "bg-purple-600"; // Varsayılan Mor
    if (percent >= 80) ramColorClass = "bg-red-600";
    else if (percent >= 70) ramColorClass = "bg-orange-500";
    else if (percent >= 60) ramColorClass = "bg-yellow-500";

    ramText.textContent = `${data.ram} MB`;
    ramBar.style.width = `${percent}%`;

    // Sınıfı uygula
    ramBar.className = `h-full rounded-full transition-all duration-500 ${ramColorClass}`;

    if (ramPercent) ramPercent.textContent = `${percent}%`;
  }

  // --- CPU HESAPLAMA VE RENKLENDİRME ---
  const cpuBar = document.getElementById("dash-cpu-bar");
  const cpuText = document.getElementById("dash-cpu-text");

  if (cpuBar && cpuText) {
    const cpuVal = parseFloat(data.cpu);

    // Renk Mantığı:
    // < 60 : Amber/Turuncumsu (Varsayılan)
    // 60-70: Sarı
    // 70-80: Turuncu
    // 80+  : Kırmızı
    let cpuColorClass = "bg-amber-500"; // Varsayılan Turuncumsu
    if (cpuVal >= 80) cpuColorClass = "bg-red-600";
    else if (cpuVal >= 70) cpuColorClass = "bg-orange-500";
    else if (cpuVal >= 60) cpuColorClass = "bg-yellow-500";

    cpuText.textContent = `${data.cpu}%`;
    cpuBar.style.width = `${Math.min(data.cpu, 100)}%`;

    // Sınıfı uygula
    cpuBar.className = `h-full rounded-full transition-all duration-500 ${cpuColorClass}`;
  }

  // --- OYUNCU KAFA LİSTESİ (Değişmedi) ---
  const playerText = document.getElementById("dash-player-text");
  const headContainer = document.getElementById("dash-player-heads");
  if (playerText) {
    const count = Array.isArray(data.players) ? data.players.length : 0;
    playerText.textContent = `${count} / 20`;

    if (headContainer) {
      if (count === 0)
        headContainer.innerHTML =
          '<span class="text-xs text-gray-600 italic">Kimse yok...</span>';
      else {
        headContainer.innerHTML = "";
        data.players.forEach((p) => {
          const img = document.createElement("img");
          img.src = `https://mc-heads.net/avatar/${p}/24`;
          img.className =
            "w-8 h-8 rounded-full border-2 border-gray-800 inline-block -ml-2 first:ml-0";
          headContainer.appendChild(img);
        });
      }
    }
  }
}

// ============================================================================
// 5-) KONSOL SAYFASI MANTIĞI
// ============================================================================
// ============================================================================
// 5-) KONSOL SAYFASI MANTIĞI
// ============================================================================
// 5.1-) initConsolePage (GELİŞMİŞ AUTO-COMPLETE)
function initConsolePage() {
    const consoleWindow = document.getElementById("console-window");
    const commandForm = document.getElementById("command-form");
    const commandInput = document.getElementById("command-input");
    
    // Eğer HTML'de yoksa dinamik olarak oluştur (Garanti olsun)
    let suggestionBox = document.getElementById("autocomplete-list");
    if (!suggestionBox && commandForm) {
        suggestionBox = document.createElement("ul");
        suggestionBox.id = "autocomplete-list";
        suggestionBox.className = "hidden absolute bottom-12 left-0 w-full bg-gray-800 border border-gray-700 rounded-t-lg shadow-2xl max-h-48 overflow-y-auto z-50";
        commandForm.appendChild(suggestionBox);
        
        // Form relative olsun ki liste düzgün dursun
        commandForm.classList.add("relative");
    }

    let suggestionIndex = -1; 
    let currentSuggestions = [];

    // Konsol Geçmişini Yükle
    if (consoleWindow) {
        consoleWindow.innerHTML = "";
        storedLogs.forEach((log) => appendLogToUI(log, false));
        setTimeout(() => { consoleWindow.scrollTop = consoleWindow.scrollHeight; }, 100);
    }
    updateDashboardUI(currentStatus);

    // --- YARDIMCI FONKSİYONLAR ---

    const closeSuggestions = () => {
        if(suggestionBox) {
            suggestionBox.classList.add("hidden");
            suggestionBox.innerHTML = "";
        }
        currentSuggestions = [];
        suggestionIndex = -1;
    };

    const selectSuggestion = (value) => {
        const parts = commandInput.value.split(" ");
        parts[parts.length - 1] = value; // Son yazılan kelimeyi tamamla
        commandInput.value = parts.join(" ") + " "; // Sonuna boşluk ekle
        commandInput.focus();
        closeSuggestions();
    };

    const renderSuggestions = (list) => {
        suggestionBox.innerHTML = "";
        if (list.length === 0) {
            closeSuggestions();
            return;
        }

        list.forEach((item, index) => {
            const li = document.createElement("li");
            li.className = "px-4 py-2 cursor-pointer hover:bg-gray-700 transition text-gray-200 border-b border-gray-700/50 last:border-0 flex items-center gap-2";
            
            // Seçili eleman stili
            if (index === suggestionIndex) li.classList.add("bg-gray-700", "text-white");

            // İkon belirle
            const isCommand = commonCommands.includes(item);
            const icon = isCommand 
                ? `<span class="text-blue-400">/</span>` 
                : `<img src="https://mc-heads.net/avatar/${item}/16" class="w-4 h-4 rounded-sm">`;

            li.innerHTML = `${icon} <span class="font-mono text-sm">${item}</span>`;
            
            li.onclick = () => selectSuggestion(item);
            suggestionBox.appendChild(li);
        });
        
        // Listeyi göster (ve yukarı kaydır)
        suggestionBox.classList.remove("hidden");
        // Scroll ayarı (seçili öğe görünür olsun)
        if (suggestionIndex > -1) {
            const selected = suggestionBox.children[suggestionIndex];
            if(selected) selected.scrollIntoView({ block: "nearest" });
        }
    };

    // --- EVENT LISTENERS ---

    if (commandForm && commandInput) {
        
        // 1. INPUT EVENT (YAZARKEN ÇALIŞAN KISIM)
        commandInput.addEventListener("input", () => {
            const val = commandInput.value;
            const parts = val.split(" ");
            const lastWord = parts[parts.length - 1]; // Son kelimeyi al

            // Eğer son kelime boşsa veya çok kısaysa kapat
            if (lastWord.length < 1) {
                closeSuggestions();
                return;
            }

            // Kaynak belirle: İlk kelimeyse Komutlar, değilse Oyuncular
            let source = [];
            if (parts.length === 1) {
                // Başında / varsa kaldırıp ara, yoksa direkt ara
                const searchCmd = lastWord.startsWith("/") ? lastWord.substring(1) : lastWord;
                source = commonCommands; 
                // Filtrele
                currentSuggestions = source.filter(c => c.startsWith(searchCmd.toLowerCase()));
            } else {
                source = currentOnlinePlayers;
                // Filtrele
                currentSuggestions = source.filter(p => p.toLowerCase().startsWith(lastWord.toLowerCase()));
            }

            // Listeyi Oluştur
            if (currentSuggestions.length > 0) {
                suggestionIndex = 0; // İlkini otomatik seç
                renderSuggestions(currentSuggestions);
            } else {
                closeSuggestions();
            }
        });

        // 2. KEYDOWN (YÖN TUŞLARI VE SEÇİM)
        commandInput.addEventListener("keydown", (e) => {
            const isListOpen = !suggestionBox.classList.contains("hidden") && currentSuggestions.length > 0;

            if (isListOpen) {
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    suggestionIndex = (suggestionIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
                    renderSuggestions(currentSuggestions);
                    return;
                }
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    suggestionIndex = (suggestionIndex + 1) % currentSuggestions.length;
                    renderSuggestions(currentSuggestions);
                    return;
                }
                if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault(); // Form göndermeyi veya odak kaybını engelle
                    if (suggestionIndex > -1) {
                        selectSuggestion(currentSuggestions[suggestionIndex]);
                    }
                    return;
                }
                if (e.key === "Escape") {
                    closeSuggestions();
                    return;
                }
            } else {
                // Liste kapalıyken TAB'a basarsa manuel tetikle (Eski usül)
                if (e.key === "Tab") {
                    e.preventDefault();
                    // Input eventini manuel tetikle
                    commandInput.dispatchEvent(new Event('input'));
                }
            }
        });

        // 3. FORM SUBMIT
        commandForm.addEventListener("submit", (e) => {
            e.preventDefault();
            // Liste açıksa enter seçim yapar, kapalıysa komut gönderir
            if (!suggestionBox.classList.contains("hidden")) return;

            const cmd = commandInput.value.trim();
            if (cmd) {
                socket.emit("send-command", cmd);
                commandInput.value = "";
                closeSuggestions();
            }
        });

        // Dışarı tıklayınca kapat
        document.addEventListener("click", (e) => {
            if (!commandForm.contains(e.target)) closeSuggestions();
        });
    }
}

// 5.2-) appendLogToUI
function appendLogToUI(text, autoScroll = true) {
  const w = document.getElementById("console-window");
  if (!w) return;
  const d = document.createElement("div");
  if (text.includes("WARN")) d.className = "text-amber-400";
  else if (text.includes("ERR") || text.includes("Exception"))
    d.className = "text-rose-400 font-bold";
  else if (text.includes("Done")) d.className = "text-emerald-400 font-bold";
  else if (text.includes("INFO")) d.className = "text-blue-200";
  else d.className = "text-gray-400";

  d.textContent = text;
  d.className +=
    " break-words whitespace-pre-wrap font-mono text-xs md:text-sm mb-0.5";
  w.appendChild(d);
  if (autoScroll) w.scrollTop = w.scrollHeight;
}

// ============================================================================
// 6-) DOSYA YÖNETİCİSİ (FILES)
// ============================================================================
// 6.1-) initFilesPage
function initFilesPage() {
  loadFileList("");
  const h = document.getElementById("fm-home"),
    b = document.getElementById("fm-btn-back"),
    f = document.getElementById("fm-btn-new-file"),
    d = document.getElementById("fm-btn-new-folder"),
    u = document.getElementById("fm-upload-input");
  if (h) h.onclick = () => loadFileList("");
  if (b)
    b.onclick = () => {
      if (!currentPath) return;
      currentPath = currentPath.split("/").slice(0, -1).join("/");
      loadFileList(currentPath);
    };
  if (d)
    d.onclick = async () => {
      const n = prompt("Klasör Adı:");
      if (n) createItem("dir", n);
    };
  if (f)
    f.onclick = async () => {
      const n = prompt("Dosya Adı:");
      if (n) createItem("file", n);
    };
  if (u)
    u.onchange = async () => {
      const fs = u.files;
      const fd = new FormData();
      for (let i = 0; i < fs.length; i++) fd.append("files", fs[i]);
      await fetch(`/api/files/upload?path=${currentPath}`, {
        method: "POST",
        body: fd,
      });
      loadFileList(currentPath);
    };
}

// 6.2-) loadFileList
async function loadFileList(p) {
  currentPath = p;
  const l = document.getElementById("fm-current-path");
  if (l) l.textContent = p ? "/" + p : "/";
  const b = document.getElementById("fm-btn-back");
  if (b) b.disabled = !p;

  try {
    const res = await fetch(`/api/files/list?path=${encodeURIComponent(p)}`);
    const f = await res.json();
    const t = document.getElementById("file-list-body");
    if (t) {
      t.innerHTML = "";
      f.forEach((i) => {
        const tr = document.createElement("tr");
        tr.className =
          "hover:bg-gray-800/50 transition group border-b border-gray-800/50";

        let icon = i.isDir
          ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/></svg>`
          : `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>`;

        let sizeStr = "-";
        if (!i.isDir) {
          if (i.size > 1024 * 1024)
            sizeStr = (i.size / (1024 * 1024)).toFixed(2) + " MB";
          else sizeStr = (i.size / 1024).toFixed(2) + " KB";
        }

        let deleteBtn = `<button onclick="deleteItem('${i.path}')" class="text-gray-500 hover:text-red-500 transition p-1" title="Sil"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;

        tr.innerHTML = `<td class="p-3 w-8">${icon}</td><td class="p-3 cursor-pointer text-gray-300 hover:text-white font-medium" onclick="clickFile('${i.path}',${i.isDir})">${i.name}</td><td class="p-3 text-gray-500 text-xs font-mono">${sizeStr}</td><td class="p-3 text-right">${deleteBtn}</td>`;
        t.appendChild(tr);
      });
    }
  } catch (e) {}
}

window.clickFile = (p, d) => {
  if (d) loadFileList(p);
  else openEditor(p);
};
async function openEditor(p) {
  const m = document.getElementById("editor-modal"),
    t = document.getElementById("editor-content"),
    s = document.getElementById("editor-save"),
    c = document.getElementById("editor-close");
  const r = await fetch(`/api/files/read?path=${encodeURIComponent(p)}`);
  if (!r.ok) {
    alert("Hata");
    return;
  }
  t.value = await r.text();
  m.classList.remove("hidden");
  s.onclick = async () => {
    await fetch("/api/files/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: p, content: t.value }),
    });
    alert("Kaydedildi");
    m.classList.add("hidden");
  };
  c.onclick = () => m.classList.add("hidden");
}
async function createItem(t, n) {
  await fetch("/api/files/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: t, name: n, currentPath }),
  });
  loadFileList(currentPath);
}
window.deleteItem = async (p) => {
  if (confirm("Sil?")) {
    await fetch(`/api/files/delete?path=${encodeURIComponent(p)}`, {
      method: "DELETE",
    });
    loadFileList(currentPath);
  }
};

// 6.3-) openEditor (Monaco Editor Entegrasyonu - DÜZELTİLDİ)
let monacoEditor = null; // Editör örneğini tutacak global değişken

async function openEditor(p) {
  const m = document.getElementById("editor-modal");
  const tContainer = document.getElementById("monaco-editor-container");
  const s = document.getElementById("editor-save");
  const c = document.getElementById("editor-close");
  const fNameEl = document.getElementById("editor-filename");

  // Dosyayı Sunucudan Oku
  const r = await fetch(`/api/files/read?path=${encodeURIComponent(p)}`);
  if (!r.ok) {
    alert("Dosya okunamadı!");
    return;
  }
  const content = await r.text();

  // Modal'ı Aç
  m.classList.remove("hidden");
  if (fNameEl) fNameEl.textContent = p.split("/").pop();

  // --- MONACO EDITOR BAŞLATMA (DÜZELTİLDİ) ---
  // 1. Önce loader (require) var mı kontrol et
  if (!window.require) {
    alert(
      "Monaco Loader (Script) bulunamadı! index.html dosyanıza script tag'ini eklediğinizden emin olun."
    );
    return;
  }

  // Dosya uzantısına göre dil belirle
  const ext = p.split(".").pop();
  let lang = "plaintext";
  if (ext === "js") lang = "javascript";
  else if (ext === "json") lang = "json";
  else if (ext === "html") lang = "html";
  else if (ext === "css") lang = "css";
  else if (ext === "yml" || ext === "yaml") lang = "yaml";
  else if (ext === "properties" || ext === "ini") lang = "ini";
  else if (ext === "xml") lang = "xml";
  else if (ext === "sh") lang = "shell";

  // 2. Editör zaten varsa sadece içeriği ve dili güncelle
  if (monacoEditor) {
    monaco.editor.setModelLanguage(monacoEditor.getModel(), lang);
    monacoEditor.setValue(content);
  }
  // 3. Editör yoksa sıfırdan oluştur
  else {
    // CDN yolunu ayarla
    require.config({
      paths: {
        vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
      },
    });

    // Modülleri yükle ve editörü oluştur
    require(["vs/editor/editor.main"], function () {
      // Container içini temizle (Garanti olsun)
      tContainer.innerHTML = "";

      monacoEditor = monaco.editor.create(tContainer, {
        value: content,
        language: lang,
        theme: "vs-dark", // Koyu tema
        automaticLayout: true, // Pencere boyutu değişince uyarla
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
      });
    });
  }
  // -----------------------------

  // Kaydet Butonu
  s.onclick = async () => {
    // İçeriği editörden al (Hala yükleniyorsa boş dönebilir, kontrol edelim)
    const val = monacoEditor ? monacoEditor.getValue() : content;

    await fetch("/api/files/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: p, content: val }),
    });
    alert("Dosya Kaydedildi!");
    m.classList.add("hidden");
  };

  // Kapat Butonu
  c.onclick = () => m.classList.add("hidden");
}

// ============================================================================
// 7-) YEDEKLEME SİSTEMİ (BACKUPS)
// ============================================================================
// 7.1-) initBackupsPage
function initBackupsPage() {
  loadBackupList();
  const b = document.getElementById("btn-create-backup");
  if (b)
    b.onclick = async () => {
      if (confirm("Yedek al?")) {
        showLoading(true);
        try {
          const res = await fetch("/api/backups/create", { method: "POST" });
          const data = await res.json();
          if (data.success) loadBackupList();
          else alert(data.error);
        } catch (e) {
          alert("Hata");
        } finally {
          showLoading(false);
        }
      }
    };
}

// 7.2-) loadBackupList
async function loadBackupList() {
  const t = document.getElementById("backup-list-body");
  if (!t) return;
  const r = await fetch("/api/backups/list");
  const b = await r.json();
  t.innerHTML = "";

  if (b.length === 0) {
    t.innerHTML =
      '<tr><td colspan="4" class="p-4 text-center text-gray-500 italic">Yedek yok.</td></tr>';
    return;
  }

  b.forEach((i) => {
    const tr = document.createElement("tr");
    tr.className =
      "hover:bg-gray-800/50 transition border-b border-gray-800/50";

    const btnDown = `<a href="/api/backups/download/${i.name}" class="text-blue-400 hover:text-white mr-2" title="İndir"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></a>`;
    const btnRest = `<button onclick="restoreBackup('${i.name}')" class="text-green-400 hover:text-white mr-2" title="Geri Yükle"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>`;
    const btnDel = `<button onclick="deleteBackup('${i.name}')" class="text-red-400 hover:text-white" title="Sil"><svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;

    tr.innerHTML = `<td class="p-3 text-yellow-100 font-mono text-sm">${i.name}</td><td class="p-3 text-gray-400 text-xs">${i.date}</td><td class="p-3 text-gray-400 text-xs">${i.size}</td><td class="p-3 text-right">${btnDown}${btnRest}${btnDel}</td>`;
    t.appendChild(tr);
  });
}

window.deleteBackup = async (n) => {
  if (confirm("Sil?")) {
    await fetch(`/api/backups/delete/${n}`, { method: "DELETE" });
    loadBackupList();
  }
};
window.restoreBackup = async (n) => {
  if (confirm("Geri Yükle?")) {
    await fetch(`/api/backups/restore/${n}`, { method: "POST" });
    alert("Bitti");
  }
};
function showLoading(show) {
  const el = document.getElementById("backup-loading");
  if (el) {
    if (show) el.classList.remove("hidden");
    else el.classList.add("hidden");
  }
}

// ============================================================================
// 8-) ZAMANLAYICI (SCHEDULES)
// ============================================================================
// 8.1-) initSchedulesPage
function initSchedulesPage() {
  socket.emit("get-schedules");
  const btnAdd = document.getElementById("btn-add-schedule");
  const modal = document.getElementById("schedule-modal");
  const btnSave = document.getElementById("sch-save");
  const btnCancel = document.getElementById("sch-cancel");
  const selType = document.getElementById("sch-type");
  const grpInt = document.getElementById("input-interval-group");
  const grpTime = document.getElementById("input-time-group");

  if (btnAdd)
    btnAdd.onclick = () => {
      document.getElementById("sch-name").value = "";
      document.getElementById("sch-payload").value = "";
      modal.classList.remove("hidden");
    };
  if (btnCancel) btnCancel.onclick = () => modal.classList.add("hidden");
  if (selType)
    selType.onchange = () => {
      if (selType.value === "interval") {
        grpInt.classList.remove("hidden");
        grpTime.classList.add("hidden");
      } else {
        grpInt.classList.add("hidden");
        grpTime.classList.remove("hidden");
      }
    };
  if (btnSave)
    btnSave.onclick = () => {
      const n = document.getElementById("sch-name").value;
      const a = document.getElementById("sch-action").value;
      const p = document.getElementById("sch-payload").value;
      let c = "",
        d = "";

      if (selType.value === "interval") {
        const m = document.getElementById("sch-interval-min").value;
        if (!m) return;
        c = `0 */${m} * * * *`;
        d = `Her ${m} dk`;
      } else {
        const t = document.getElementById("sch-fixed-time").value;
        if (!t) return;
        const [hh, mm] = t.split(":");
        c = `0 ${mm} ${hh} * * *`;
        d = `Saat ${t}`;
      }

      if (n) {
        schedules.push({
          id: Date.now(),
          name: n,
          action: a,
          payload: p,
          cron: c,
          display: d,
          enabled: true,
        });
        socket.emit("save-schedules", schedules);
        modal.classList.add("hidden");
      }
    };
}

// 8.2-) updateScheduleList
function updateScheduleList(list) {
  schedules = list;
  const d = document.getElementById("schedules-list");
  if (!d) return;
  d.innerHTML = "";

  list.forEach((s, i) => {
    const el = document.createElement("div");
    el.className =
      "bg-gray-800 p-3 rounded flex justify-between border border-gray-700 mb-2";
    el.innerHTML = `<div><h3 class="text-cyan-400 font-bold text-sm">${
      s.name
    }</h3><span class="text-xs text-gray-500">${
      s.display || s.cron
    }</span></div><button onclick="deleteSchedule(${i})" class="text-red-500 hover:text-white">Sil</button>`;
    d.appendChild(el);
  });
}

window.deleteSchedule = (i) => {
  if (confirm("Sil?")) {
    schedules.splice(i, 1);
    socket.emit("save-schedules", schedules);
  }
};

// ============================================================================
// 9-) EKLENTİ YÖNETİMİ (MARKET + YÖNETİM)
// ============================================================================

// 9.1-) initPluginsPage
function initPluginsPage() {
  // Dosya Yükleme (Eski mantık)
  const inpUpload = document.getElementById("plugin-upload-input");
  if (inpUpload)
    inpUpload.onchange = async () => {
      const f = inpUpload.files;
      const fd = new FormData();
      for (let k = 0; k < f.length; k++) fd.append("files", f[k]);
      await fetch("/api/plugins/upload", { method: "POST", body: fd });
      alert(
        "Dosyalar yüklendi! Listeyi görmek için 'Yüklü Eklentiler' butonuna basın."
      );
    };

  // --- A) MARKET KISMI ---
  const inpSearch = document.getElementById("plugin-search-input");
  const btnSearch = document.getElementById("btn-search-plugin");

  // Enter tuşu desteği
  if (inpSearch)
    inpSearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") searchPlugins();
    });
  if (btnSearch) btnSearch.onclick = searchPlugins;

  // --- B) YÖNETİM KISMI (MODAL) ---
  const btnManage = document.getElementById("btn-manage-plugins");
  const modal = document.getElementById("plugins-modal");
  const btnClose = document.getElementById("close-plugins-modal");

  if (btnManage)
    btnManage.onclick = () => {
      socket.emit("get-plugins"); // Listeyi iste
      modal.classList.remove("hidden");
    };

  if (btnClose) btnClose.onclick = () => modal.classList.add("hidden");
}

// 9.2-) searchPlugins: Marketten arama yapar
async function searchPlugins() {
  const query = document.getElementById("plugin-search-input").value.trim();
  const resultsDiv = document.getElementById("market-results");

  if (!query) return alert("Lütfen bir eklenti adı yazın!");

  resultsDiv.innerHTML =
    '<div class="col-span-full text-center text-blue-400 animate-pulse py-10">Aranıyor...</div>';

  try {
    const res = await fetch(
      `/api/plugins/search?q=${encodeURIComponent(query)}`
    );

    // Yanıtın JSON olup olmadığını kontrol etmeden önce text olarak alıp deneyelim
    const textData = await res.text();
    let data = [];

    try {
      data = JSON.parse(textData);
    } catch (err) {
      console.error("JSON Parse Hatası:", err);
      // Eğer JSON değilse sunucu HTML hata sayfası göndermiştir
      throw new Error("Sunucu markete bağlanamadı (Spiget Offline).");
    }

    resultsDiv.innerHTML = "";

    if (!data || data.length === 0) {
      resultsDiv.innerHTML =
        '<div class="col-span-full text-center text-gray-500 py-10">Sonuç bulunamadı veya Market erişilemiyor.</div>';
      return;
    }

    data.forEach((p) => {
      let iconUrl = "https://static.spigotmc.org/img/spigot.png";
      if (p.icon && p.icon.url) {
        // URL kontrolü
        iconUrl = p.icon.url.startsWith("http")
          ? p.icon.url
          : `https://www.spigotmc.org/${p.icon.url}`;
      }

      const card = document.createElement("div");
      card.className =
        "bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col gap-3 hover:border-blue-500 transition shadow-lg";

      card.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${iconUrl}" class="w-12 h-12 rounded-lg bg-gray-900 object-cover" onerror="this.src='https://static.spigotmc.org/img/spigot.png'">
                    <div class="overflow-hidden">
                        <h3 class="text-white font-bold text-md truncate" title="${
                          p.name
                        }">${p.name}</h3>
                        <p class="text-xs text-gray-500 truncate">${
                          p.tag || "Etiket yok"
                        }</p>
                    </div>
                </div>
                <div class="flex justify-between items-center text-xs text-gray-400 border-t border-gray-700 pt-2 mt-auto">
                    <span>⬇ ${p.downloads || 0}</span>
                    <span>⭐ ${
                      p.rating && p.rating.average
                        ? p.rating.average.toFixed(1)
                        : "0.0"
                    }</span>
                </div>
                <button onclick="installRemotePlugin('${p.id}', '${
        p.name
      }')" class="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-lg font-bold text-sm transition mt-1 flex justify-center items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    İNDİR VE KUR
                </button>
            `;
      resultsDiv.appendChild(card);
    });
  } catch (e) {
    console.error(e);
    resultsDiv.innerHTML = `<div class="col-span-full text-center text-red-500 py-10">Bağlantı Hatası: ${e.message}</div>`;
  }
}

// 9.3-) installRemotePlugin: Marketten indirir
window.installRemotePlugin = async (id, name) => {
  if (!confirm(`${name} eklentisi indirilsin mi?`)) return;

  // UI Feedback (Butonu bulup değiştirme şansımız yoksa genel loading verebiliriz veya alert)
  // Basitlik için alert kullanıyoruz.

  try {
    const res = await fetch("/api/plugins/install-remote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, fileType: ".jar" }),
    });
    const d = await res.json();

    if (d.success)
      alert(
        "✅ Kurulum Başarılı! Aktif olması için sunucuyu yeniden başlatın."
      );
    else alert("❌ Hata: " + (d.error || "Bilinmeyen hata"));
  } catch (e) {
    alert("Bağlantı hatası.");
  }
};

// 9.4-) updatePluginList: Yüklü eklentileri (Modal içine) doldurur
function updatePluginList(l) {
  const t = document.getElementById("plugin-list-body");
  if (!t) return;

  t.innerHTML = "";

  if (l.length === 0) {
    t.innerHTML =
      '<tr><td colspan="2" class="p-4 text-center text-gray-500">Hiç eklenti yok.</td></tr>';
    return;
  }

  l.forEach((p) => {
    const tr = document.createElement("tr");
    tr.className = "border-b border-gray-700 hover:bg-gray-800/50 transition";

    // Durum rengi
    const statusClass = p.enabled
      ? "text-green-400"
      : "text-red-400 line-through decoration-red-500/50";
    const statusText = p.enabled ? "Aktif" : "Pasif";

    tr.innerHTML = `
            <td class="p-4">
                <div class="font-bold ${statusClass}">${p.name}</div>
                <div class="text-[10px] text-gray-500">${statusText}</div>
            </td>
            <td class="p-4 text-right">
                <button onclick="togglePlugin('${
                  p.name
                }')" class="text-xs bg-gray-700 px-3 py-1.5 rounded text-white mr-2 hover:bg-gray-600 transition">
                    ${p.enabled ? "Kapat" : "Aç"}
                </button> 
                <button onclick="deletePlugin('${
                  p.name
                }')" class="text-xs bg-red-900/30 text-red-400 px-3 py-1.5 rounded hover:bg-red-600 hover:text-white transition">
                    Sil
                </button>
            </td>`;

    t.appendChild(tr);
  });
}

// Global buton fonksiyonları (Aynı kalıyor)
window.togglePlugin = async (n) => {
  await fetch("/api/plugins/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: n }),
  });
};
window.deletePlugin = async (n) => {
  if (confirm("Sil?")) {
    await fetch("/api/plugins/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n }),
    });
  }
};

// ============================================================================
// 10-) YASAKLILAR (BANNED)
// ============================================================================
// 10.1-) initBannedPage
function initBannedPage() {
  socket.emit("get-banned");
}
// 10.2-) updateBannedList
function updateBannedList(l) {
  const d = document.getElementById("banned-list-container");
  if (!d) return;
  d.innerHTML = "";
  if (l.length === 0) {
    d.innerHTML =
      '<div class="col-span-full text-center text-gray-500 py-10">Boş</div>';
    return;
  }
  l.forEach((b) => {
    const el = document.createElement("div");
    el.className =
      "bg-gray-800 p-3 rounded border border-red-900/30 flex items-center gap-3";
    el.innerHTML = `<img src="https://mc-heads.net/avatar/${b.name}/40" class="rounded"><div class="flex-1"><h3 class="text-white text-sm">${b.name}</h3></div><button onclick="unban('${b.name}')" class="text-green-500 bg-green-900/30 px-2 rounded text-xs">Aç</button>`;
    d.appendChild(el);
  });
}
window.unban = (n) => socket.emit("unban-player", n);

// ============================================================================
// 11-) DENETİM KAYITLARI (AUDIT)
// ============================================================================

// 11.1-) initAuditPage (GÜNCELLENMİŞ OYUNCU FİLTRESİ)
function initAuditPage() {
    socket.emit("get-audit");

    const btnPanel = document.getElementById("btn-audit-filter-panel");
    const btnGame = document.getElementById("btn-audit-filter-game");
    
    // [YENİ] Oyuncu Filtresi Elementleri
    const playerFilterWrapper = document.getElementById("audit-player-filter-wrapper");
    const playerFilterInput = document.getElementById("audit-player-filter-input");
    const playerDatalist = document.getElementById("audit-players-datalist");

    const setFilter = (type) => {
        currentAuditFilter = type;
        auditPageIndex = 1;

        if (type === "panel") {
            if(btnPanel) btnPanel.className = "px-4 py-1.5 rounded-md text-xs font-bold transition bg-indigo-600 text-white shadow";
            if(btnGame) btnGame.className = "px-4 py-1.5 rounded-md text-xs font-bold transition text-gray-400 hover:text-white hover:bg-gray-800";
            
            // Panel modunda oyuncu filtresini gizle ve temizle
            if(playerFilterWrapper) playerFilterWrapper.classList.add("hidden");
            if(playerFilterInput) playerFilterInput.value = ""; 
        } else {
            if(btnPanel) btnPanel.className = "px-4 py-1.5 rounded-md text-xs font-bold transition text-gray-400 hover:text-white hover:bg-gray-800";
            if(btnGame) btnGame.className = "px-4 py-1.5 rounded-md text-xs font-bold transition bg-amber-600 text-white shadow";
            
            // Oyun modunda filtreyi göster ve doldur
            if(playerFilterWrapper) playerFilterWrapper.classList.remove("hidden");
            updatePlayerFilterList();
        }
        renderAuditLogs();
    };

    // [YENİ] Datalist'i benzersiz oyuncu isimleriyle doldur
    const updatePlayerFilterList = () => {
        if(!playerDatalist) return;
        const players = new Set();
        // Sadece 'game' tipindeki logların 'source' (oyuncu adı) kısmını al
        allAuditLogs.forEach(log => {
            if(log.type === 'game' && log.source) {
                players.add(log.source);
            }
        });
        
        playerDatalist.innerHTML = "";
        players.forEach(player => {
            const option = document.createElement("option");
            option.value = player;
            playerDatalist.appendChild(option);
        });
    };

    // [YENİ] Filtre inputuna yazıldıkça tabloyu yenile
    if(playerFilterInput) {
        playerFilterInput.oninput = () => {
            auditPageIndex = 1; // Aramada ilk sayfaya dön
            renderAuditLogs();
        };
    }

    if (btnPanel) btnPanel.onclick = () => setFilter("panel");
    if (btnGame) btnGame.onclick = () => setFilter("game");

    const limitSel = document.getElementById("audit-limit");
    const btnPrev = document.getElementById("audit-prev-btn");
    const btnNext = document.getElementById("audit-next-btn");

    const btnOpenModal = document.getElementById("btn-open-export-modal");
    const modal = document.getElementById("export-modal");
    const btnCloseModal = document.getElementById("btn-close-export");
    const btnConfirmExport = document.getElementById("btn-confirm-export");
    const inputStart = document.getElementById("export-start-date");
    const inputEnd = document.getElementById("export-end-date");

    if (limitSel) {
        limitSel.value = auditPageSize === allAuditLogs.length ? "all" : auditPageSize;
        limitSel.onchange = () => {
            auditPageSize = limitSel.value === "all" ? allAuditLogs.length : parseInt(limitSel.value);
            auditPageIndex = 1;
            renderAuditLogs();
        };
    }

    if (btnPrev) btnPrev.onclick = () => changeAuditPage(-1);
    if (btnNext) btnNext.onclick = () => changeAuditPage(1);

    if (btnOpenModal) {
        btnOpenModal.onclick = () => {
            const today = new Date();
            const lastYear = new Date();
            lastYear.setFullYear(today.getFullYear() - 1);
            if (inputEnd) inputEnd.value = today.toISOString().split("T")[0];
            if (inputStart) inputStart.value = lastYear.toISOString().split("T")[0];
            modal.classList.remove("hidden");
        };
    }
    if (btnCloseModal) btnCloseModal.onclick = () => modal.classList.add("hidden");
    
    // EXPORT KISMI (Filtre duyarlı)
    if (btnConfirmExport) {
        btnConfirmExport.onclick = () => {
            if (typeof XLSX === 'undefined') { alert("Excel kütüphanesi yüklenemedi!"); return; }
            
            const startVal = inputStart.value;
            const endVal = inputEnd.value;
            if (!startVal || !endVal) { alert("Tarih seçin."); return; }
            
            const startDate = new Date(startVal);
            const endDate = new Date(endVal);
            endDate.setHours(23, 59, 59);

            // Aktif Oyuncu Filtresini Al
            const playerFilterVal = document.getElementById("audit-player-filter-input")?.value.toLowerCase() || "";

            let filtered = allAuditLogs.filter((log) => {
                // 1. Tarih Kontrolü
                try {
                    const parts = log.time.split(" ")[0].split(".");
                    const logDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    if (logDate < startDate || logDate > endDate) return false;
                } catch (e) { return false; }

                // 2. Kategori Kontrolü
                const logType = log.type || "panel";
                if (logType !== currentAuditFilter) return false;

                // 3. Oyuncu Adı Kontrolü
                if (currentAuditFilter === 'game' && playerFilterVal) {
                    if (!log.source.toLowerCase().includes(playerFilterVal)) return false;
                }

                return true;
            });

            if (filtered.length === 0) { alert("Kayıt yok."); return; }

            const excelData = filtered.map(log => ({
                "Tarih": log.time,
                "Kaynak": log.source,
                "Tür": log.type === 'game' ? 'Oyun İçi' : 'Panel',
                "İşlem": log.action,
                "Detaylar": log.details ? log.details.replace(/<[^>]*>?/gm, ' ') : ''
            }));

            try {
                const ws = XLSX.utils.json_to_sheet(excelData);
                const wb = XLSX.utils.book_new();
                
                let fileName = `Loglar_${currentAuditFilter}`;
                if(currentAuditFilter === 'game' && playerFilterVal) fileName += `_${playerFilterVal}`;
                fileName += `.xlsx`;

                XLSX.utils.book_append_sheet(wb, ws, "Loglar");
                XLSX.writeFile(wb, fileName);
                modal.classList.add("hidden");
            } catch (e) { alert("Hata oluştu."); }
        };
    }
}

// 11.2-) renderAuditLogs (OYUNCU FİLTRESİ DESTEKLİ)
function renderAuditLogs() {
    const tbody = document.getElementById("audit-list-body");
    const pageInfo = document.getElementById("audit-page-info");
    const btnPrev = document.getElementById("audit-prev-btn");
    const btnNext = document.getElementById("audit-next-btn");
    
    // [YENİ] Input değerini al
    const playerFilterVal = document.getElementById("audit-player-filter-input")?.value.toLowerCase() || "";

    if (!tbody) return;

    // Filtreleme Mantığı
    const filteredLogs = allAuditLogs.filter(l => {
        const logType = l.type || "panel"; 
        
        // 1. Tip Kontrolü (Panel mi Oyun mu?)
        if (logType !== currentAuditFilter) return false;

        // 2. [YENİ] Oyuncu Adı Kontrolü (Sadece Oyun Komutlarında ve input doluysa)
        if (currentAuditFilter === 'game' && playerFilterVal) {
            // Kaynak (Oyuncu Adı) aranan kelimeyi içeriyor mu?
            if (!l.source.toLowerCase().includes(playerFilterVal)) return false;
        }

        return true;
    });

    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / auditPageSize) || 1;

    if (auditPageIndex > totalPages) auditPageIndex = 1;

    const startIdx = (auditPageIndex - 1) * auditPageSize;
    const endIdx = startIdx + auditPageSize;
    const displayLogs = filteredLogs.slice(startIdx, endIdx);

    tbody.innerHTML = "";

    if (displayLogs.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="3" class="p-4 text-center text-gray-500">Kayıt bulunamadı.</td></tr>';
    } else {
        displayLogs.forEach((l, index) => {
            const detailRowId = `audit-detail-${index}`;
            const hasDetails = l.details && l.details.includes("<ul");
            const cursorClass = hasDetails ? "cursor-pointer hover:bg-gray-700" : "hover:bg-gray-700/50";
            const expandIcon = hasDetails ? '<span class="text-[10px] text-gray-500 ml-2">▼</span>' : '';

            const tr = document.createElement("tr");
            tr.className = `border-b border-gray-800 transition ${cursorClass}`;
            
            let sourceColor = "text-indigo-400";
            if (l.type === "game") sourceColor = "text-amber-400";

            let summaryText = l.details;
            if(hasDetails) {
                summaryText = '<span class="text-blue-400 font-bold text-xs italic">Detayları görmek için tıklayın...</span>';
            }

            tr.innerHTML = `
                <td class="p-3 text-gray-400 font-mono text-xs whitespace-nowrap align-top">${l.time}</td>
                <td class="p-3 ${sourceColor} text-xs font-bold font-mono tracking-wide align-top">
                    ${l.type === 'game' ? '👤 ' : ''}${l.source}
                </td>
                <td class="p-3 text-gray-300 text-sm break-all align-top">
                    <div class="flex items-center">
                        <span class="font-bold text-gray-500 mr-2 text-xs bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">[${l.action}]</span>
                        <span>${summaryText}</span>
                        ${expandIcon}
                    </div>
                </td>
            `;

            if (hasDetails) {
                tr.onclick = () => {
                    const detailRow = document.getElementById(detailRowId);
                    if (detailRow) {
                        detailRow.classList.toggle("hidden");
                        if(!detailRow.classList.contains("hidden")){
                            tr.classList.add("bg-gray-800");
                        } else {
                            tr.classList.remove("bg-gray-800");
                        }
                    }
                };
            }
            tbody.appendChild(tr);

            if (hasDetails) {
                const trDetail = document.createElement("tr");
                trDetail.id = detailRowId;
                trDetail.className = "hidden bg-gray-900/50 border-b border-gray-800 shadow-inner";
                trDetail.innerHTML = `
                    <td colspan="3" class="p-4 pl-12">
                        <div class="bg-gray-800 rounded p-3 border border-gray-700">
                            <h4 class="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Değişiklik Raporu:</h4>
                            ${l.details} </div>
                    </td>
                `;
                tbody.appendChild(trDetail);
            }
        });
    }

    if (pageInfo) pageInfo.textContent = `${auditPageIndex} / ${totalPages}`;
    if (btnPrev) btnPrev.disabled = auditPageIndex === 1;
    if (btnNext) btnNext.disabled = auditPageIndex === totalPages || totalPages === 0;
}

function changeAuditPage(dir) {
    // Mevcut filtreye göre toplam sayfa sayısını hesapla
    const playerFilterVal = document.getElementById("audit-player-filter-input")?.value.toLowerCase() || "";
    
    const filteredLogs = allAuditLogs.filter((l) => {
        const logType = l.type || "panel";
        if (logType !== currentAuditFilter) return false;
        if (currentAuditFilter === 'game' && playerFilterVal) {
            if (!l.source.toLowerCase().includes(playerFilterVal)) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filteredLogs.length / auditPageSize) || 1;
    const newPage = auditPageIndex + dir;

    if (newPage > 0 && newPage <= totalPages) {
        auditPageIndex = newPage;
        renderAuditLogs();
    }
}

function updateAuditList(list) {
    allAuditLogs = list;
    renderAuditLogs();
}

// ============================================================================
// 12-) DISCORD ENTEGRASYONU
// ============================================================================
// 12.1-) initDiscordPage
function initDiscordPage() {
  socket.emit("get-discord");
  const btn = document.getElementById("btn-save-discord");
  if (btn)
    btn.onclick = () => {
      const conf = {
        chatUrl: document.getElementById("discord-url-chat").value,
        eventsUrl: document.getElementById("discord-url-events").value,
        adminUrl: document.getElementById("discord-url-admin").value,
        optChat: document.getElementById("discord-opt-chat").checked,
        optJoins: document.getElementById("discord-opt-joins").checked,
        optStatus: document.getElementById("discord-opt-status").checked,
        optDeaths: document.getElementById("discord-opt-deaths").checked,
        optAdv: document.getElementById("discord-opt-advancements").checked,
        optAdmin: document.getElementById("discord-opt-admin").checked,
      };
      socket.emit("save-discord", conf);
    };
}

// ============================================================================
// 13-) DÜNYA YÖNETİCİSİ (GELİŞMİŞ)
// ============================================================================
// 13.1-) initWorldsPage
function initWorldsPage() {
  socket.emit("get-worlds");

  // Dosya Yükleme Dinleyicisi
  const inp = document.getElementById("world-upload-input");
  const progress = document.getElementById("world-upload-progress");

  if (inp)
    inp.onchange = async () => {
      if (inp.files.length === 0) return;

      if (
        !confirm(
          "Bu ZIP dosyasını yüklemek istediğinize emin misiniz? Dosya sunucu ana dizinine açılacak."
        )
      ) {
        inp.value = "";
        return;
      }

      // UI: Yükleniyor göster
      if (progress) progress.classList.remove("hidden");

      const fd = new FormData();
      fd.append("world", inp.files[0]);

      try {
        const res = await fetch("/api/worlds/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json();

        if (data.success) {
          alert("✅ Dünya başarıyla yüklendi!");
          socket.emit("get-worlds"); // Listeyi yenile
        } else {
          alert("❌ Hata: " + (data.error || "Bilinmeyen hata"));
        }
      } catch (e) {
        alert("Bağlantı hatası!");
      } finally {
        if (progress) progress.classList.add("hidden");
        inp.value = "";
      }
    };
}

// 13.2-) updateWorldsList
function updateWorldsList(list) {
  const d = document.getElementById("worlds-list");
  if (!d) return;

  d.innerHTML = "";

  if (list.length === 0) {
    d.innerHTML =
      '<div class="text-center text-gray-500 py-10">Hiç dünya klasörü bulunamadı.</div>';
    return;
  }

  list.forEach((w) => {
    const el = document.createElement("div");
    // Aktif ise yeşil çerçeve, değilse normal gri
    const borderClass = w.isActive
      ? "border-green-500/50 bg-green-900/10"
      : "border-gray-700 bg-gray-800";
    const iconColor = w.isActive
      ? "text-green-400 bg-green-900/30"
      : "text-gray-400 bg-gray-700/50";
    const statusText = w.isActive
      ? '<span class="text-xs text-green-400 font-bold border border-green-500/30 px-2 py-0.5 rounded">AKTİF DÜNYA</span>'
      : "";

    el.className = `p-4 rounded-xl border ${borderClass} flex flex-col md:flex-row justify-between items-center gap-4 transition hover:border-gray-500`;

    el.innerHTML = `
            <div class="flex items-center gap-4 w-full md:w-auto">
                <div class="w-12 h-12 rounded-lg ${iconColor} flex items-center justify-center flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h3 class="text-white font-bold text-lg break-all">${
                      w.name
                    }</h3>
                    ${statusText}
                </div>
            </div>
            
            <div class="flex items-center gap-2 w-full md:w-auto">
                ${
                  !w.isActive
                    ? `
                <button onclick="activateWorld('${w.name}')" class="flex-1 md:flex-none bg-emerald-600/20 hover:bg-emerald-600 text-emerald-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 border border-emerald-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                    AKTİF DÜNYA YAP
                </button>`
                    : ""
                }

                <a href="/api/worlds/download/${
                  w.name
                }" target="_blank" class="flex-1 md:flex-none bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 border border-blue-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12" /></svg>
                    İNDİR
                </a>

                ${
                  !w.isActive
                    ? `
                <button onclick="deleteWorld('${w.name}')" class="flex-1 md:flex-none bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 border border-red-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    SİL
                </button>`
                    : ""
                }
            </div>
        `;
    d.appendChild(el);
  });
}

// Dünyayı Aktif Etme Fonksiyonu
window.activateWorld = (n) => {
  if (
    confirm(
      `⚠️ DİKKAT!\n\n"${n}" dünyası aktif edilecek.\nBunun etkili olması için sunucuyu YENİDEN BAŞLATMANIZ gerekir.\n\nOnaylıyor musunuz?`
    )
  ) {
    socket.emit("world-action", { action: "activate", name: n });
  }
};

window.deleteWorld = (n) => {
  if (
    confirm(
      `DİKKAT! "${n}" klasörü ve içindeki her şey kalıcı olarak silinecek.\nBunun geri dönüşü yoktur!\n\nSilmek istiyor musunuz?`
    )
  ) {
    socket.emit("world-action", { action: "delete", name: n });
  }
};

// ============================================================================
// 14-) AYARLAR VE YÖNETİCİLER (SETTINGS & OPS)
// 14.1-) initSettingsPage (Auto-Restart Destekli)
function initSettingsPage() {
  socket.off("settings-data");
  socket.off("sistem-bilgileri");

  socket.emit("get-settings");
  socket.emit("get-system-info");

  const ramSlider = document.getElementById("set-ram-slider");
  const ramDisplay = document.getElementById("set-ram-display");
  const ramMaxLabel = document.getElementById("ram-max-label");
  const btnSave = document.getElementById("btn-save-settings");
  const chkAutoRestart = document.getElementById("set-auto-restart"); // YENİ

  const modalConfirm = document.getElementById("settings-confirm-modal");
  const changesListDiv = document.getElementById("settings-changes-list");
  const btnConfirm = document.getElementById("btn-confirm-changes");
  const btnCancel = document.getElementById("btn-cancel-changes");

  let kayitliRamMiktari = 4;
  let originalSettings = {};

  const fieldMap = [
    { id: "set-motd", key: "motd", name: "Sunucu Açıklaması", type: "text" },
    {
      id: "set-max-players",
      key: "max-players",
      name: "Max Oyuncu",
      type: "number",
    },
    { id: "set-server-port", key: "server-port", name: "Port", type: "number" },
    {
      id: "set-view-distance",
      key: "view-distance",
      name: "Görüş Mesafesi",
      type: "number",
    },
    {
      id: "set-spawn-protection",
      key: "spawn-protection",
      name: "Spawn Koruması",
      type: "number",
    },
    { id: "set-gamemode", key: "gamemode", name: "Oyun Modu", type: "select" },
    { id: "set-difficulty", key: "difficulty", name: "Zorluk", type: "select" },
    { id: "set-pvp", key: "pvp", name: "PVP", type: "checkbox" },
    {
      id: "set-allow-flight",
      key: "allow-flight",
      name: "Uçuş",
      type: "checkbox",
    },
    {
      id: "set-online-mode",
      key: "online-mode",
      name: "Online Mode",
      type: "checkbox",
    },
    {
      id: "set-white-list",
      key: "white-list",
      name: "Whitelist",
      type: "checkbox",
    },
  ];

  if (ramSlider) {
    ramSlider.max = 8;
    ramSlider.oninput = () => {
      ramDisplay.textContent = `${ramSlider.value}G`;
    };
  }
  if (ramMaxLabel) ramMaxLabel.textContent = "(Hesaplanıyor...)";

  socket.on("settings-data", (d) => {
    if (!document.getElementById("set-ram-slider")) return;
    originalSettings = JSON.parse(JSON.stringify(d));

    if (d.ram) {
      kayitliRamMiktari = parseInt(d.ram);
      originalSettings.ramAmount = kayitliRamMiktari;
    }

    // Auto Restart Yükle
    if (chkAutoRestart) {
      chkAutoRestart.checked = d.config && d.config.autoRestart === true;
      originalSettings.autoRestart = d.config ? d.config.autoRestart : false;
    }

    if (ramSlider) {
      if (kayitliRamMiktari > parseInt(ramSlider.max))
        ramSlider.max = kayitliRamMiktari;
      ramSlider.value = kayitliRamMiktari;
      if (ramDisplay) ramDisplay.textContent = `${kayitliRamMiktari}G`;
    }

    if (d.props) {
      fieldMap.forEach((f) => {
        const el = document.getElementById(f.id);
        if (!el) return;
        const val = d.props[f.key];
        if (f.type === "checkbox") el.checked = val === "true";
        else el.value = val || "";
      });
    }
  });

  socket.on("sistem-bilgileri", (data) => {
    if (!document.getElementById("set-ram-slider")) return;
    if (ramSlider) {
      ramSlider.min = 4;
      ramSlider.max = data.maxSlider;
      if (kayitliRamMiktari > data.maxSlider)
        kayitliRamMiktari = data.maxSlider;
      ramSlider.value = kayitliRamMiktari;
      if (ramDisplay) ramDisplay.textContent = `${kayitliRamMiktari}G`;
      if (ramMaxLabel) {
        ramMaxLabel.textContent = `(Sistem Limiti: ${data.maxSlider} GB)`;
        ramMaxLabel.classList.remove("text-gray-500");
        ramMaxLabel.classList.add("text-green-400");
      }
    }
  });

  if (btnSave) {
    btnSave.onclick = () => {
      let changes = [];
      const currentRam = parseInt(ramSlider.value);
      const oldRam = originalSettings.ramAmount || 4;
      if (currentRam !== oldRam)
        changes.push({
          name: "RAM Miktarı",
          old: `${oldRam} GB`,
          new: `${currentRam} GB`,
        });

      // Auto Restart Kontrol
      const curAR = chkAutoRestart.checked;
      const oldAR = originalSettings.autoRestart === true;
      if (curAR !== oldAR)
        changes.push({
          name: "Oto-Restart",
          old: oldAR ? "Aktif" : "Pasif",
          new: curAR ? "Aktif" : "Pasif",
        });

      fieldMap.forEach((f) => {
        const el = document.getElementById(f.id);
        if (!el) return;
        let currentVal, oldVal;
        if (f.type === "checkbox") {
          currentVal = el.checked;
          oldVal = originalSettings.props[f.key] === "true";
        } else {
          currentVal = String(el.value);
          oldVal = String(originalSettings.props[f.key] || "");
        }
        if (String(currentVal) !== String(oldVal)) {
          if (f.type === "checkbox") {
            oldVal = oldVal ? "Açık" : "Kapalı";
            currentVal = currentVal ? "Açık" : "Kapalı";
          }
          changes.push({
            name: f.name,
            old: oldVal || "(Boş)",
            new: currentVal || "(Boş)",
          });
        }
      });

      if (changes.length === 0) {
        alert("Değişiklik yok.");
        return;
      }

      changesListDiv.innerHTML = "";
      changes.forEach((c) => {
        const item = document.createElement("div");
        item.className =
          "flex justify-between items-center border-b border-gray-700 pb-1 last:border-0";
        item.innerHTML = `<span class="text-gray-400">${c.name}</span><div class="flex items-center gap-2"><span class="text-red-400 line-through text-xs opacity-70">${c.old}</span><span class="text-gray-500">➜</span><span class="text-green-400 font-bold">${c.new}</span></div>`;
        changesListDiv.appendChild(item);
      });
      modalConfirm.classList.remove("hidden");
    };
  }

  if (btnCancel) btnCancel.onclick = () => modalConfirm.classList.add("hidden");

  if (btnConfirm) {
    btnConfirm.onclick = () => {
      const d = {
        ram: ramSlider.value,
        config: { autoRestart: chkAutoRestart.checked },
        props: {},
      };
      fieldMap.forEach((f) => {
        const el = document.getElementById(f.id);
        if (f.type === "checkbox") d.props[f.key] = el.checked;
        else d.props[f.key] = el.value;
      });

      btnConfirm.innerHTML = "KAYDEDİLİYOR...";
      btnConfirm.disabled = true;
      socket.emit("save-settings", d);

      setTimeout(() => {
        modalConfirm.classList.add("hidden");
        btnConfirm.innerHTML = "KAYDET VE UYGULA";
        btnConfirm.disabled = false;
        socket.emit("get-settings");
      }, 1000);
    };
  }
  // --- RESOURCE PACK MANTIĞI ---
  const rpInput = document.getElementById("rp-upload");
  const rpStatus = document.getElementById("rp-status");
  const btnDeleteRP = document.getElementById("btn-delete-rp");

  // Sayfa açılınca durumu kontrol et
  if (rpStatus) {
    fetch("/api/check-rp")
      .then((r) => r.json())
      .then((d) => {
        if (d.exists) {
          rpStatus.textContent = "✅ Paket Yüklü";
          rpStatus.className =
            "text-[10px] text-green-400 mb-2 truncate font-bold";
        } else {
          rpStatus.textContent = "Yüklü paket yok.";
          rpStatus.className = "text-[10px] text-gray-500 mb-2 truncate";
        }
      });
  }

  // Yükleme İşlemi
  if (rpInput) {
    rpInput.onchange = async () => {
      const file = rpInput.files[0];
      if (!file) return;

      if (!file.name.endsWith(".zip")) {
        alert("Lütfen sadece .zip dosyası yükleyin!");
        return;
      }

      // Yükleniyor efekti
      if (rpStatus) {
        rpStatus.textContent = "⏳ Yükleniyor ve Hash hesaplanıyor...";
        rpStatus.className =
          "text-[10px] text-yellow-400 mb-2 truncate animate-pulse";
      }

      const fd = new FormData();
      fd.append("pack", file);

      try {
        const res = await fetch("/api/upload-rp", { method: "POST", body: fd });
        const data = await res.json();

        if (data.success) {
          alert(
            `Başarılı!\nSHA1 Hash: ${data.sha1}\n\nSunucu ayarları güncellendi. Etkili olması için sunucuyu yeniden başlatın.`
          );
          if (rpStatus) {
            rpStatus.textContent = "✅ Paket Yüklü";
            rpStatus.className =
              "text-[10px] text-green-400 mb-2 truncate font-bold";
          }
        } else {
          alert("Hata: " + (data.error || "Bilinmiyor"));
          if (rpStatus) rpStatus.textContent = "Hata oluştu.";
        }
      } catch (e) {
        alert("Sunucu hatası.");
      }
      rpInput.value = ""; // Inputu temizle
    };
  }

  // Silme İşlemi
  if (btnDeleteRP) {
    btnDeleteRP.onclick = async () => {
      if (
        !confirm(
          "Kaynak paketini silmek ve sunucu ayarlarından kaldırmak istiyor musunuz?"
        )
      )
        return;

      try {
        const res = await fetch("/api/delete-rp", { method: "DELETE" });
        const data = await res.json();

        if (data.success) {
          alert("Paket silindi.");
          if (rpStatus) {
            rpStatus.textContent = "Yüklü paket yok.";
            rpStatus.className = "text-[10px] text-gray-500 mb-2 truncate";
          }
        } else {
          alert("Hata veya paket zaten yok.");
        }
      } catch (e) {
        alert("Hata.");
      }
    };
  }

  setupSettingsExtraLogic();
}

// 14.2-) initOpsPage
function initOpsPage() {
  const f = document.getElementById("add-op-form");
  const i = document.getElementById("op-input-name");
  if (f)
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (i.value) {
        socket.emit("admin-action", { action: "op", target: i.value });
        i.value = "";
      }
    });
}

// 14.3-) updateOpsList
// [DÜZELTİLDİ] Yöneticiler Listesi (İkonlu Silme Butonu)
function updateOpsList(opsArray, onlinePlayersArray = []) {
  const listContainer = document.getElementById("ops-list-container");
  const badgeCount = document.getElementById("ops-count-badge");

  if (!listContainer) return;

  // Sayıyı güncelle
  if (badgeCount) badgeCount.textContent = opsArray.length;

  listContainer.innerHTML = "";

  if (opsArray.length === 0) {
    listContainer.innerHTML =
      '<div class="col-span-full text-center text-gray-500 py-10 italic">Hiç yönetici yok.</div>';
    return;
  }

  opsArray.forEach((name) => {
    // Bu yönetici şu an oyunda mı?
    const isOnline = onlinePlayersArray.includes(name);

    // Kart
    const card = document.createElement("div");
    card.className =
      "bg-gray-800 p-3 rounded-lg border border-purple-900/30 flex items-center gap-3 shadow-md hover:bg-gray-750 transition-colors group";

    // 1. Kafa Resmi (flex-shrink-0 önemli)
    const img = document.createElement("img");
    img.src = `https://mc-heads.net/avatar/${name}/50`;
    img.className = "w-10 h-10 rounded-md shadow-sm bg-gray-900 flex-shrink-0";

    // 2. Bilgi Alanı (min-w-0 ismi görünür kılar)
    const infoDiv = document.createElement("div");
    infoDiv.className = "flex-1 min-w-0";

    const nameTitle = document.createElement("h3");
    nameTitle.className =
      "text-white font-bold text-sm truncate flex items-center gap-2";

    // Online ise yeşil nokta, değilse sadece isim
    let statusDot = "";
    if (isOnline)
      statusDot =
        '<span class="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_5px_rgba(34,197,94,0.8)] flex-shrink-0" title="Oyunda"></span>';

    nameTitle.innerHTML = `${name} ${statusDot}`;

    const roleSpan = document.createElement("span");
    roleSpan.className =
      "text-[10px] text-purple-400 font-bold tracking-wide block";
    roleSpan.textContent = "OPERATOR";

    infoDiv.appendChild(nameTitle);
    infoDiv.appendChild(roleSpan);

    // 3. Yetki Alma Butonu (Files'taki Çöp Kutusu İkonu)
    const btnRemove = document.createElement("button");
    btnRemove.className =
      "text-gray-500 hover:text-red-500 p-2 transition-colors flex-shrink-0 opacity-100 md:opacity-0 group-hover:opacity-100";
    btnRemove.title = "Yetkiyi Al";
    // SVG İkonu Buraya Eklendi
    btnRemove.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>`;

    btnRemove.onclick = () => {
      if (
        confirm(`${name} kullanıcısının yetkisini almak istediğine emin misin?`)
      ) {
        socket.emit("admin-action", { action: "deop", target: name });
      }
    };

    card.appendChild(img);
    card.appendChild(infoDiv);
    card.appendChild(btnRemove);

    listContainer.appendChild(card);
  });
}

// 14.4-) updatePlayerList
// [GÜNCELLENDİ] Oyuncu Listesi (Boş Durum ve Yükleme Mesajı Düzeltildi)
function updatePlayerList(playersArray, opsArray = []) {
  // HTML'deki doğru ID'yi hedefliyoruz (tab-content-online)
  const listContainer = document.getElementById("tab-content-online");
  const badgeCount = document.getElementById("player-count-badge");

  // Eğer sayfada değilsek çık
  if (!listContainer) return;

  // Rozet sayısını güncelle (Varsa)
  if (badgeCount)
    badgeCount.textContent = playersArray ? playersArray.length : 0;

  // Listeyi temizle
  listContainer.innerHTML = "";

  // Eğer kimse yoksa veya veri boşsa mesaj göster
  if (!playersArray || playersArray.length === 0) {
    listContainer.innerHTML =
      '<div class="col-span-full text-center text-gray-500 py-10 italic flex flex-col items-center gap-2"><svg class="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg><span>Şu an sunucuda kimse yok.</span></div>';
    return;
  }

  // Oyuncuları listele
  playersArray.forEach((name) => {
    // Op kontrolü (Güvenli)
    const isOp = Array.isArray(opsArray) && opsArray.includes(name);

    const card = document.createElement("div");
    card.className =
      "bg-gray-800 p-3 rounded-lg border border-gray-700 flex items-center gap-3 shadow-md hover:bg-gray-750 transition-colors group";

    // OP ve Kick/Ban Butonları
    const btnOpIcon = isOp
      ? '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016zM12 9v2m0 4h.01" /></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>';

    const btnOpClass = isOp
      ? "bg-gray-700 hover:bg-gray-600 text-gray-400 border border-gray-600"
      : "bg-emerald-600/20 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-600/30";

    const btnOpTitle = isOp ? "Yetkiyi Al (Deop)" : "Yetki Ver (Op)";
    const actionType = isOp ? "deop" : "op";

    card.innerHTML = `
            <img src="https://mc-heads.net/avatar/${name}/50" class="w-10 h-10 rounded-md shadow-sm bg-gray-900 flex-shrink-0">
            <div class="flex-1 min-w-0">
                <h3 class="text-white font-bold text-sm truncate flex items-center gap-2">
                    ${name} 
                    ${
                      isOp
                        ? '<span class="text-[9px] bg-purple-600/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 flex-shrink-0">OP</span>'
                        : ""
                    }
                </h3>
                <span class="text-[10px] text-green-500 flex items-center gap-1">● Çevrimiçi</span>
            </div>
            <div class="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onclick="if(confirm('${name} kullanıcısına ${
      isOp ? "yetkisini almak" : "yetki vermek"
    } istiyor musunuz?')) socket.emit('admin-action', { action: '${actionType}', target: '${name}' })" class="${btnOpClass} p-1.5 rounded transition shadow" title="${btnOpTitle}">${btnOpIcon}</button>
                <button onclick="socket.emit('admin-action', { action: 'kick', target: '${name}' })" class="bg-amber-600/20 hover:bg-amber-600 text-amber-500 hover:text-white p-1.5 rounded border border-amber-600/30 transition shadow" title="At (Kick)"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
                <button onclick="if(confirm('${name} sunucudan yasaklansın mı?')) socket.emit('admin-action', { action: 'ban', target: '${name}' })" class="bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white p-1.5 rounded border border-rose-600/30 transition shadow" title="Yasakla (Ban)"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
            </div>
        `;
    listContainer.appendChild(card);
  });
}

window.deop = (n) => {
  if (confirm("Yetki al?"))
    socket.emit("admin-action", { action: "deop", target: n });
};

// ============================================================================
// 15-) ARAYÜZ GÜNCELLEME
// ============================================================================
// 15.1-) updateDashboardUI
function updateDashboardUI(s) {
  // Dashboard Sayfası
  const dLabel = document.getElementById("dash-status-label");
  const dDot = document.getElementById("dash-status-dot");
  const dHero = document.getElementById("hero-card");
  const dBtnStart = document.getElementById("dash-btn-start");
  const dBtnStop = document.getElementById("dash-btn-stop");

  if (dLabel && dDot) {
    if (s === "online") {
      dLabel.textContent = "ONLINE";
      dLabel.className = "text-xl font-bold text-emerald-400 tracking-wide";
      dDot.className =
        "w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse";
      if (dHero)
        dHero.className =
          "relative bg-gradient-to-r from-gray-800 to-emerald-900/30 p-6 rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden transition-all duration-500";

      if (dBtnStart) {
        dBtnStart.disabled = true;
        dBtnStart.classList.add("opacity-50", "cursor-not-allowed");
        dBtnStart.innerHTML = "BAŞLAT";
      }
      if (dBtnStop) {
        dBtnStop.disabled = false;
        dBtnStop.classList.remove("opacity-50", "cursor-not-allowed");
      }
    } else if (s === "offline") {
      dLabel.textContent = "OFFLINE";
      dLabel.className = "text-xl font-bold text-red-400 tracking-wide";
      dDot.className =
        "w-3 h-3 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]";
      if (dHero)
        dHero.className =
          "relative bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden transition-all duration-500";

      if (dBtnStart) {
        dBtnStart.disabled = false;
        dBtnStart.classList.remove("opacity-50", "cursor-not-allowed");
        dBtnStart.innerHTML = "BAŞLAT";
      }
      if (dBtnStop) {
        dBtnStop.disabled = true;
        dBtnStop.classList.add("opacity-50", "cursor-not-allowed");
      }

      resetStats();
    } else {
      dLabel.textContent = "BAŞLATILIYOR...";
      dLabel.className =
        "text-xl font-bold text-amber-400 tracking-wide animate-pulse";
      dDot.className = "w-3 h-3 rounded-full bg-amber-500 animate-ping";

      if (dBtnStart) {
        dBtnStart.disabled = true;
        dBtnStart.innerHTML = "...";
      }
      if (dBtnStop) dBtnStop.disabled = true;
    }
  }

  // Konsol Sayfası
  const c = document.getElementById("status-card");
  if (c) {
    const i = document.getElementById("dash-status-icon"),
      t = document.getElementById("dash-status-text");
    i.className = "w-8 h-8 rounded-full shadow-inner transition-colors";
    if (s === "online") {
      c.classList.add("border-emerald-500");
      t.textContent = "AÇIK";
      i.classList.add("bg-emerald-500");
    } else if (s === "offline") {
      c.classList.remove("border-emerald-500");
      t.textContent = "KAPALI";
      i.classList.remove("bg-emerald-500");
    } else {
      t.textContent = "BAŞLATILIYOR...";
    }
  }
}

// 15.2-) resetStats
function resetStats() {
  const elCpu = document.getElementById("stat-cpu");
  const elRam = document.getElementById("stat-ram");
  const elPlayers = document.getElementById("stat-players");
  const liveInd = document.getElementById("live-indicator");

  if (elCpu) elCpu.textContent = "0%";
  if (elRam) elRam.textContent = "0 MB";
  if (elPlayers) elPlayers.textContent = "-- / 20";
  if (liveInd) liveInd.classList.add("hidden");

  const dRam = document.getElementById("dash-ram-text");
  const dCpu = document.getElementById("dash-cpu-text");
  if (dRam) dRam.textContent = "0 MB";
  if (dCpu) dCpu.textContent = "0%";
}

// ============================================================================
// 16-) SOCKET.IO DİNLEYİCİLERİ
// ============================================================================

// Temel Dinleyiciler
socket.on("log-history", (h) => {
  storedLogs = [];
  if (h) h.split("\n").forEach((l) => storedLogs.push(l));
  if (currentPage === "console") initConsolePage();
});
socket.on("console-out", (m) => {
  if (m.trim()) {
    storedLogs.push(m.trim());
    if (storedLogs.length > 2000) storedLogs.shift();
    if (currentPage === "console") appendLogToUI(m.trim());
  }
});
socket.on("log", (m) => {
  storedLogs.push(`[SİSTEM] ${m}`);
  if (currentPage === "console") appendLogToUI(`[SİSTEM] ${m}`);
});
socket.on("status", (s) => {
  currentStatus = s;
  updateDashboardUI(s);
});

// İstatistik Dinleyicisi
socket.on("server-stats", (d) => {
  if (d.players) currentOnlinePlayers = d.players;
  if (currentPage === "dashboard") updateDashboardStats(d);

  const c = document.getElementById("stat-cpu"),
    r = document.getElementById("stat-ram"),
    p = document.getElementById("stat-players"),
    l = document.getElementById("live-indicator");
  if (c) c.textContent = `${d.cpu}%`;
  if (r) r.textContent = `${d.ram} MB`;
  if (p)
    p.textContent = `${Array.isArray(d.players) ? d.players.length : 0} / 20`;
  if (l) {
    if (currentStatus === "online" || parseFloat(d.cpu) > 0)
      l.classList.remove("hidden");
    else l.classList.add("hidden");
  }

  if (currentPage === "players") updatePlayerList(d.players, d.ops || []);
  if (currentPage === "ops") updateOpsList(d.ops, d.players || []);
});

// Veri Dinleyicileri
socket.on("audit-data", (l) => {
  if (currentPage === "audit") updateAuditList(l);
});
socket.on("discord-data", (c) => {
  if (currentPage === "discord") {
    document.getElementById("discord-url-chat").value = c.chatUrl || "";
    document.getElementById("discord-url-events").value = c.eventsUrl || "";
    document.getElementById("discord-url-admin").value = c.adminUrl || "";
    const setChk = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = val;
    };
    setChk("discord-opt-chat", c.optChat);
    setChk("discord-opt-joins", c.optJoins);
    setChk("discord-opt-status", c.optStatus);
    setChk("discord-opt-deaths", c.optDeaths);
    setChk("discord-opt-advancements", c.optAdv);
    setChk("discord-opt-admin", c.optAdmin);
  }
});
socket.on("worlds-data", (l) => {
  if (currentPage === "worlds") updateWorldsList(l);
});
socket.on("schedules-data", (l) => {
  if (currentPage === "schedules") updateScheduleList(l);
});
socket.on("plugins-data", (l) => {
  if (currentPage === "plugins") updatePluginList(l);
});
socket.on("banned-data", (l) => {
  if (currentPage === "players" || currentPage === "banned")
    updateBannedList(l);
});
socket.on("ops-data", (l) => {
  if (currentPage === "players" || currentPage === "ops") updateOpsList(l);
});
socket.on("banned-ips-data", (l) => {
  if (currentPage === "players") updateIpBanList(l);
});
socket.on("whitelist-data", (l) => {
  const c = document.getElementById("whitelist-container");
  if (!c) return;
  c.innerHTML = "";
  l.forEach((i) => {
    const d = document.createElement("div");
    d.className = "flex justify-between bg-gray-900 p-2 rounded";
    d.innerHTML = `<span class="text-white">${i.name}</span><button class="text-red-500" onclick="removeWL('${i.name}')">X</button>`;
    c.appendChild(d);
  });
});

// Ayarlar Dinleyicisi
socket.on("settings-data", (d) => {
  if (currentPage === "settings") {
    document.getElementById("set-ram-slider").value = parseInt(d.ram) || 6;
    document.getElementById("set-ram-display").textContent = `${
      parseInt(d.ram) || 6
    }G`;
    if (d.props) {
      const val = (id, k) => {
        const el = document.getElementById(id);
        if (el) el.value = d.props[k] || "";
      };
      const chk = (id, k) => {
        const el = document.getElementById(id);
        if (el) el.checked = d.props[k] === "true";
      };
      val("set-motd", "motd");
      val("set-max-players", "max-players");
      val("set-server-port", "server-port");
      val("set-view-distance", "view-distance");
      val("set-spawn-protection", "spawn-protection");
      val("set-gamemode", "gamemode");
      val("set-difficulty", "difficulty");
      chk("set-pvp", "pvp");
      chk("set-allow-flight", "allow-flight");
      chk("set-online-mode", "online-mode");
      chk("set-white-list", "white-list");
    }
  }
  // Dashboard verisi dolumu (Sürüm eklendi)
  if (currentPage === "dashboard" && d.props) {
    const m = document.getElementById("dash-motd");
    if (m) m.textContent = d.props.motd || "Minecraft Sunucusu";
    const p = document.getElementById("dash-port");
    if (p) p.textContent = d.props["server-port"] || "25565";
    const v = document.getElementById("dash-version");
    if (v && d.info) v.textContent = `${d.info.type} ${d.info.version}`;
  }
});

// IP Ban İşlemleri
socket.on("get-banned-ips", () =>
  socket.emit("banned-ips-data", getBannedIPs())
);
socket.on("ban-ip", (ip) => {
  if (mcProcess) {
    mcProcess.stdin.write(`ban-ip ${ip}\n`);
  }
  setTimeout(() => {
    io.emit("banned-ips-data", getBannedIPs());
  }, 1000);
});
socket.on("unban-ip", (ip) => {
  if (mcProcess) {
    mcProcess.stdin.write(`pardon-ip ${ip}\n`);
  }
  setTimeout(() => {
    io.emit("banned-ips-data", getBannedIPs());
  }, 1000);
});

// ============================================================================
// 17-) YAZILIM YÖNETİCİSİ
// ============================================================================
// 17.1-) initSoftwarePage
function initSoftwarePage() {
  const listDiv = document.getElementById("software-list");
  if (!listDiv) return;

  listDiv.innerHTML =
    '<div class="col-span-full text-center text-gray-500 py-10">Stable sürümler yükleniyor...</div>';

  fetch("/api/software/list")
    .then((res) => res.json())
    .then((versions) => {
      listDiv.innerHTML = "";
      if (!versions || versions.length === 0) {
        listDiv.innerHTML =
          '<div class="col-span-full text-center text-red-500 py-10">Uygun sürüm bulunamadı.</div>';
        return;
      }

      versions.forEach((v) => {
        const card = document.createElement("div");
        card.className =
          "bg-gray-900 p-4 rounded-lg border border-gray-700 flex justify-between items-center hover:border-purple-500 transition shadow-md";
        card.innerHTML = `<div><h3 class="text-white font-bold text-lg">Paper ${v.version}</h3><span class="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-800">Stable</span></div><button onclick="installVersion('${v.version}')" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold text-sm transition">KUR</button>`;
        listDiv.appendChild(card);
      });
    })
    .catch((err) => {
      listDiv.innerHTML =
        '<div class="col-span-full text-center text-red-500 py-10">Bağlantı hatası!</div>';
    });

  // Normal panel içindeki kurulum dinleyicisi
  setupInstallListener(false);
}

// 17.2-) setupInstallListener
function setupInstallListener(isFullScreen) {
  socket.off("install-progress");
  socket.on("install-progress", (percent) => {
    // A) Tam Ekran Modu İçin Elementler
    const fsBar = document.getElementById("setup-progress-bar");
    const fsText = document.getElementById("setup-progress-text");

    // B) Normal Panel İçin Elementler (software.html içindeki ID'ler)
    const pCard = document.getElementById("install-progress-card");
    const pBar = document.getElementById("install-progress-bar");
    const pText = document.getElementById("install-progress-text");

    if (isFullScreen) {
      if (fsBar) fsBar.style.width = `${percent}%`;
      if (fsText) fsText.textContent = `%${percent}`;
    } else {
      if (pCard) pCard.classList.remove("hidden");
      if (pBar) pBar.style.width = `${percent}%`;
      if (pText) pText.textContent = `%${percent}`;
    }
  });
}

// 17.3-) installVersion
window.installVersion = async (version, isFullScreen = false) => {
  if (!confirm(`PaperMC ${version} sürümü kurulacak. Onaylıyor musunuz?`))
    return;

  // UI Güncelleme
  if (isFullScreen) {
    document.getElementById("setup-version-list").classList.add("hidden");
    document
      .getElementById("setup-progress-container")
      .classList.remove("hidden");
    setupInstallListener(true);
  } else {
    const listDiv = document.getElementById("software-list");
    if (listDiv) listDiv.classList.add("hidden");
    setupInstallListener(false);
  }

  try {
    const res = await fetch("/api/software/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version }),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Hata: " + (data.error || "Bilinmeyen hata"));
      if (isFullScreen) location.reload();
      else initSoftwarePage();
    } else {
      // Başarılı
      setTimeout(() => {
        alert("Kurulum tamamlandı! Yönlendiriliyorsunuz...");
        // Sayfayı yenile ki yeni mod (Dashboard) açılsın
        location.reload();
      }, 1000);
    }
  } catch (e) {
    alert("Sunucu hatası!");
    if (isFullScreen) location.reload();
    else initSoftwarePage();
  }
};

// ============================================================================
// 18-) BAŞLANGIÇ MANTIĞI
// ============================================================================
// 18.1-) initApp
async function initApp() {
  try {
    const res = await fetch("/api/check-setup");
    const data = await res.json();

    if (data.installed) {
      // --- SENARYO A: SUNUCU KURULU ---
      // 1. Dashboard Layout'u göster
      document.getElementById("dashboard-layout").classList.remove("hidden");
      // 2. Setup Layout'u gizle
      document.getElementById("setup-layout").classList.add("hidden");
      // 3. Menüyü ve Sayfayı Yükle
      await loadMenu();
      loadPage("dashboard");
    } else {
      // --- SENARYO B: SUNUCU YOK (KURULUM MODU) ---
      // 1. Dashboard Layout'u gizle
      document.getElementById("dashboard-layout").classList.add("hidden");
      // 2. Setup Layout'u göster
      document.getElementById("setup-layout").classList.remove("hidden");

      // 3. Sürüm listesini Setup ekranına yükle
      loadSetupScreenVersions();
    }
  } catch (e) {
    console.error("Başlangıç hatası:", e);
  }
}

// Tam Ekran Kurulum Listesini Dolduran Fonksiyon
function loadSetupScreenVersions() {
  const container = document.getElementById("setup-version-list");

  fetch("/api/software/list")
    .then((res) => res.json())
    .then((versions) => {
      container.innerHTML = "";
      if (!versions || versions.length === 0) {
        container.innerHTML =
          '<div class="col-span-full text-center text-red-400">Liste alınamadı. İnternet bağlantınızı kontrol edin.</div>';
        return;
      }

      versions.forEach((v) => {
        const div = document.createElement("div");
        div.className =
          "bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center hover:border-purple-500 hover:bg-gray-750 transition cursor-pointer group";
        div.onclick = () => installVersion(v.version, true); // true = fullscreen mod

        div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-purple-900/50 rounded-full flex items-center justify-center text-purple-400 font-bold text-xs group-hover:bg-purple-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <div>
                            <h3 class="text-white font-bold">Paper ${v.version}</h3>
                            <p class="text-xs text-gray-500 group-hover:text-gray-400">En stabil sürüm</p>
                        </div>
                    </div>
                    <div class="text-gray-600 group-hover:text-white transition">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                `;
        container.appendChild(div);
      });
    });
}

// ============================================================================
// 19-) GELİŞMİŞ OYUNCU YÖNETİMİ (SEKMELİ YAPI)
// ============================================================================
// 19.1-) switchPlayerTab (GÜNCELLENDİ - STATS EKLENDİ)
window.switchPlayerTab = (tabName) => {
    // Tüm sekmelerin listesi
    const tabs = ["online", "all", "ops", "banned", "ipban", "stats"];

    // 1. Önce hepsini gizle ve pasif yap
    tabs.forEach((t) => {
        const content = document.getElementById(`tab-content-${t}`);
        const btn = document.getElementById(`tab-btn-${t}`);
        
        // İçeriği gizle
        if (content) content.classList.add("hidden");
        
        // Butonu pasif hale getir
        if (btn) {
            // Aktif renkleri temizle
            btn.classList.remove("bg-blue-600", "bg-yellow-600", "text-white", "shadow-lg");
            // Pasif renkleri ekle
            btn.classList.add("bg-gray-700", "text-gray-400");
        }
    });

    // 2. Seçilen sekmeyi aç ve aktif yap
    const activeContent = document.getElementById(`tab-content-${tabName}`);
    const activeBtn = document.getElementById(`tab-btn-${tabName}`);

    if (activeContent) activeContent.classList.remove("hidden");
    
    if (activeBtn) {
        activeBtn.classList.remove("bg-gray-700", "text-gray-400");
        
        // "stats" sekmesi ise SARI, diğerleri ise MAVİ yap
        if (tabName === 'stats') {
            activeBtn.classList.add("bg-yellow-600", "text-white", "shadow-lg");
        } else {
            activeBtn.classList.add("bg-blue-600", "text-white", "shadow-lg");
        }
    }

    // 3. Gerekli veriyi sunucudan iste
    if (tabName === "ops") socket.emit("get-ops");
    if (tabName === "banned") socket.emit("get-banned");
    if (tabName === "ipban") socket.emit("get-banned-ips");
    if (tabName === "all") socket.emit("get-all-players");
    if (tabName === "stats") socket.emit("get-player-stats"); // [YENİ]
};
// 19.2-) updateIpBanList
function updateIpBanList(list) {
  const c = document.getElementById("ip-ban-list-container");
  if (!c) return;
  c.innerHTML = "";
  if (!list || list.length === 0) {
    c.innerHTML =
      '<div class="text-center text-gray-500 italic py-10">Yasaklı IP yok.</div>';
    return;
  }
  list.forEach((item) => {
    const d = document.createElement("div");
    d.className =
      "flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-red-900/30";
    d.innerHTML = `<div class="min-w-0"><div class="text-white font-mono font-bold truncate">${item.target}</div><div class="text-[10px] text-gray-500 truncate">Oluşturan: ${item.source}</div></div><button onclick="unbanIp('${item.target}')" class="bg-green-600/20 text-green-500 hover:text-white px-3 py-1 rounded text-xs font-bold">KALDIR</button>`;
    c.appendChild(d);
  });
}

// 19.3-) setupPlayersPage
const setupPlayersPage = () => {
  // Varsayılan sekme
  switchPlayerTab("online");

  // Op Ekleme Butonu
  const btnOp = document.getElementById("btn-add-op");
  const inpOp = document.getElementById("op-input-name");
  if (btnOp)
    btnOp.onclick = () => {
      if (inpOp.value) {
        socket.emit("admin-action", {
          action: "op",
          target: inpOp.value.trim(),
        });
        inpOp.value = "";
      }
    };

  // IP Ban Ekleme Butonu
  const btnIp = document.getElementById("btn-add-ipban");
  const inpIp = document.getElementById("ip-ban-input");
  if (btnIp)
    btnIp.onclick = () => {
      if (inpIp.value) {
        socket.emit("ban-ip", inpIp.value.trim());
        inpIp.value = "";
      }
    };
  // [YENİ] Tüm Oyuncular Sayfalama Olayları
  const limitSel = document.getElementById("all-players-limit");
  const searchInp = document.getElementById("all-players-search");
  const btnPrev = document.getElementById("btn-all-prev");
  const btnNext = document.getElementById("btn-all-next");

  if (limitSel) {
    limitSel.onchange = () => {
      allPlayersLimit = parseInt(limitSel.value);
      allPlayersPage = 1;
      renderAllPlayers();
    };
  }
  if (searchInp) {
    searchInp.oninput = () => {
      allPlayersPage = 1;
      renderAllPlayers();
    };
  }
  if (btnPrev)
    btnPrev.onclick = () => {
      if (allPlayersPage > 1) {
        allPlayersPage--;
        renderAllPlayers();
      }
    };
  if (btnNext)
    btnNext.onclick = () => {
      allPlayersPage++;
      renderAllPlayers();
    };
};

window.unbanIp = (ip) => {
  if (confirm("IP ban kaldırılsın mı?")) socket.emit("unban-ip", ip);
};

// --- [YENİ] TÜM OYUNCULAR VE ENVANTER MANTIĞI ---

// 1. Sunucudan Listeyi Al
socket.on("all-players-data", (list) => {
  allPlayersData = list; // {name, uuid, online}
  renderAllPlayers();
});

// 2. Listeyi Filtrele ve Çiz
function renderAllPlayers() {
  const container = document.getElementById("all-players-list");
  const pageInfo = document.getElementById("all-page-info");
  const searchVal = document
    .getElementById("all-players-search")
    .value.toLowerCase();

  if (!container) return;

  // A) Filtreleme (Arama)
  let filtered = allPlayersData.filter((p) =>
    p.name.toLowerCase().includes(searchVal)
  );

  // B) Sıralama (Online En Üstte, Sonra A-Z)
  filtered.sort((a, b) => {
    if (a.online === b.online) return a.name.localeCompare(b.name);
    return a.online ? -1 : 1;
  });

  // C) Sayfalama
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / allPlayersLimit) || 1;
  if (allPlayersPage > totalPages) allPlayersPage = 1;

  const start = (allPlayersPage - 1) * allPlayersLimit;
  const end = start + allPlayersLimit;
  const pageItems = filtered.slice(start, end);

  // D) HTML Basma
  container.innerHTML = "";
  if (pageItems.length === 0) {
    container.innerHTML =
      '<div class="col-span-full text-center text-gray-500">Oyuncu bulunamadı.</div>';
  } else {
    pageItems.forEach((p) => {
      const isOnline = p.online;
      const statusColor = isOnline ? "text-green-400" : "text-gray-500";
      const borderClass = isOnline
        ? "border-green-500/30 bg-green-900/10"
        : "border-gray-700 bg-gray-800";

      const div = document.createElement("div");
      div.className = `p-3 rounded-lg border ${borderClass} flex items-center gap-3 cursor-pointer hover:bg-gray-700 transition group`;
      div.onclick = () => openInventory(p.name, p.uuid);

      div.innerHTML = `
                <img src="https://mc-heads.net/avatar/${
                  p.name
                }/40" class="rounded shadow-sm">
                <div class="overflow-hidden">
                    <h4 class="font-bold text-sm text-gray-200 truncate group-hover:text-white">${
                      p.name
                    }</h4>
                    <span class="text-[10px] ${statusColor} font-bold flex items-center gap-1">
                        ${isOnline ? "● ONLINE" : "○ OFFLINE"}
                    </span>
                </div>
                <div class="ml-auto opacity-0 group-hover:opacity-100 transition text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                </div>
            `;
      container.appendChild(div);
    });
  }

  if (pageInfo) pageInfo.textContent = `${allPlayersPage} / ${totalPages}`;
  document.getElementById("btn-all-prev").disabled = allPlayersPage === 1;
  document.getElementById("btn-all-next").disabled =
    allPlayersPage >= totalPages;
}

// 3. Envanter Açma İsteği
function openInventory(name, uuid) {
  document.getElementById("inv-player-name").textContent = name + " Envanteri";
  document.getElementById(
    "inv-player-head"
  ).src = `https://mc-heads.net/avatar/${name}/32`;

  // Temizle
  const clear = (id) =>
    (document.getElementById(id).innerHTML =
      '<span class="text-xs p-2">Yükleniyor...</span>');
  clear("inv-armor");
  clear("inv-offhand");
  clear("inv-main");
  clear("inv-hotbar");
  clear("inv-ender");

  document.getElementById("inventory-modal").classList.remove("hidden");
  socket.emit("get-player-inventory", { uuid });
}
// ============================================================================
// [DÜZELTME] 1. OYUNCU ENVANTERİ (AYRI BLOK)
// ============================================================================
socket.on("player-inventory-data", (data) => {
    if (!data) {
        alert("Envanter verisi okunamadı!");
        return;
    }

    // Slot Oluşturucu Yardımcı Fonksiyon (Sadece bu blok içinde lazım)
    const createSlot = (item) => {
        const div = document.createElement("div");
        div.className = "mc-slot";
        if (item) {
            let itemId = item.id.replace("minecraft:", "");
            const img = document.createElement("img");
            img.src = `https://assets.mcasset.cloud/1.20.1/assets/minecraft/textures/item/${itemId}.png`;
            img.onerror = () => {
                img.src = `https://assets.mcasset.cloud/1.20.1/assets/minecraft/textures/block/${itemId}.png`;
            };
            img.className = "w-6 h-6 object-contain";
            img.title = `${itemId} (x${item.Count})`;
            div.appendChild(img);

            if (item.Count > 1) {
                const span = document.createElement("span");
                span.className = "mc-item-count";
                span.innerText = item.Count;
                div.appendChild(span);
            }
        }
        return div;
    };

    const fillGrid = (containerId, items, size, offset = 0) => {
        const c = document.getElementById(containerId);
        if(!c) return;
        c.innerHTML = "";
        for (let i = 0; i < size; i++) {
            let found = items.find((x) => x.Slot === i + offset);
            c.appendChild(createSlot(found));
        }
    };

    // 1. Armor
    const armorDiv = document.getElementById("inv-armor");
    if(armorDiv) {
        armorDiv.innerHTML = "";
        [103, 102, 101, 100].forEach((slotId) => {
            let item = data.inventory.find((x) => x.Slot === slotId);
            armorDiv.appendChild(createSlot(item));
        });
    }

    // 2. Offhand
    const offhandDiv = document.getElementById("inv-offhand");
    if(offhandDiv) {
        offhandDiv.innerHTML = "";
        let offItem = data.inventory.find((x) => x.Slot === -106);
        offhandDiv.appendChild(createSlot(offItem));
    }

    // 3. Diğerleri
    fillGrid("inv-main", data.inventory, 27, 9);
    fillGrid("inv-hotbar", data.inventory, 9, 0);
    fillGrid("inv-ender", data.ender, 27, 0);
});

// ============================================================================
// [DÜZELTME] 2. İSTATİSTİK VERİSİ (AYRI BLOK - DIŞARIDA OLMALI)
// ============================================================================
socket.on("player-stats-data", (stats) => {
    // 1. En Çok Oynayanlar
    const sortedByTime = [...stats].sort((a, b) => b.playTime - a.playTime).slice(0, 10);
    renderStatsList("stats-playtime-list", sortedByTime, (p, i) => `
        <div class="flex items-center justify-between bg-black/20 p-2 rounded hover:bg-black/40 transition">
            <div class="flex items-center gap-3">
                <span class="font-mono text-gray-500 font-bold w-4 text-center">${i+1}.</span>
                <img src="https://mc-heads.net/avatar/${p.name}/24" class="w-6 h-6 rounded shadow-sm">
                <span class="text-sm font-bold text-gray-300">${p.name}</span>
            </div>
            <span class="text-xs font-mono font-bold text-blue-400">${p.playTime} Saat</span>
        </div>
    `);

    // 2. En Çok Mob Öldürenler
    const sortedByMobKills = [...stats].sort((a, b) => b.mobKills - a.mobKills).slice(0, 10);
    renderStatsList("stats-kills-list", sortedByMobKills, (p, i) => `
        <div class="flex items-center justify-between bg-black/20 p-2 rounded hover:bg-black/40 transition">
            <div class="flex items-center gap-3">
                <span class="font-mono text-gray-500 font-bold w-4 text-center">${i+1}.</span>
                <img src="https://mc-heads.net/avatar/${p.name}/24" class="w-6 h-6 rounded shadow-sm">
                <span class="text-sm font-bold text-gray-300">${p.name}</span>
            </div>
            <span class="text-xs font-mono font-bold text-green-400">${p.mobKills} Kill</span>
        </div>
    `);

    // 3. En Çok Ölenler
    const sortedByDeaths = [...stats].sort((a, b) => b.deaths - a.deaths).slice(0, 10);
    renderStatsList("stats-deaths-list", sortedByDeaths, (p, i) => `
        <div class="flex items-center justify-between bg-black/20 p-2 rounded hover:bg-black/40 transition">
            <div class="flex items-center gap-3">
                <span class="font-mono text-gray-500 font-bold w-4 text-center">${i+1}.</span>
                <img src="https://mc-heads.net/avatar/${p.name}/24" class="w-6 h-6 rounded shadow-sm">
                <span class="text-sm font-bold text-gray-300">${p.name}</span>
            </div>
            <span class="text-xs font-mono font-bold text-red-400">${p.deaths} Ölüm</span>
        </div>
    `);
});

// Yardımcı Render Fonksiyonu
function renderStatsList(elementId, data, templateFunc) {
    const container = document.getElementById(elementId);
    if(!container) return;
    
    container.innerHTML = "";
    if (data.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">Kayıtlı istatistik yok.</div>';
        return;
    }

    data.forEach((player, index) => {
        container.innerHTML += templateFunc(player, index);
    });
}

// Uygulamayı Başlat
initApp();
