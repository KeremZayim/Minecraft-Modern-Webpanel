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
// 0-) TOAST & CONFIRM YARDIMCI FONKSİYONLARI
// ============================================================================

/**
 * Ekranın sağ alt köşesinde bir toast bildirimi gösterir.
 * @param {string} message - Gösterilecek mesaj
 * @param {'success'|'error'|'info'|'warning'} type - Bildirim tipi
 * @param {number} duration - Gösterim süresi (ms)
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) { console.warn('[Toast]', message); return; }

  const colors = {
    success: { bg: '#052e16', border: '#16a34a', icon: '✅', text: '#4ade80' },
    error:   { bg: '#2d0a0a', border: '#dc2626', icon: '❌', text: '#f87171' },
    warning: { bg: '#1c1004', border: '#d97706', icon: '⚠️', text: '#fbbf24' },
    info:    { bg: '#0c1a2e', border: '#3b82f6', icon: 'ℹ️', text: '#60a5fa' },
  };
  const c = colors[type] || colors.info;

  const toast = document.createElement('div');
  toast.style.cssText = `
    pointer-events:auto;
    display:flex;align-items:flex-start;gap:10px;
    background:${c.bg};border:1px solid ${c.border};
    border-radius:10px;padding:12px 16px;
    min-width:240px;max-width:360px;
    box-shadow:0 8px 24px rgba(0,0,0,0.5);
    animation:toastIn 0.3s ease;
    font-family:sans-serif;
  `;
  toast.innerHTML = `
    <span style="font-size:18px;flex-shrink:0;margin-top:1px;">${c.icon}</span>
    <span style="color:#e2e8f0;font-size:13px;line-height:1.5;flex:1;">${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:16px;flex-shrink:0;padding:0;line-height:1;">×</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Tarayıcının confirm() yerine özel modal onay kutusu gösterir.
 * @param {string} message - Onay mesajı
 * @param {object} options - { title, icon, okText, cancelText, danger }
 * @returns {Promise<boolean>}
 */
function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const modal   = document.getElementById('confirm-modal');
    const iconEl  = document.getElementById('confirm-icon');
    const titleEl = document.getElementById('confirm-title');
    const msgEl   = document.getElementById('confirm-message');
    const okBtn   = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    if (!modal) { resolve(confirm(message)); return; }

    const {
      title      = 'Emin misiniz?',
      icon       = options.danger ? '⚠️' : '❓',
      okText     = 'Onayla',
      cancelText = 'İptal',
      danger     = false,
    } = options;

    iconEl.textContent  = icon;
    titleEl.textContent = title;
    msgEl.textContent   = message;
    okBtn.textContent   = okText;
    cancelBtn.textContent = cancelText;
    okBtn.style.background = danger ? '#dc2626' : '#6366f1';

    modal.style.display = 'flex';

    const cleanup = (result) => {
      modal.style.display = 'none';
      okBtn.onclick = null;
      cancelBtn.onclick = null;
      modal.onclick = null;
      resolve(result);
    };

    okBtn.onclick     = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
    modal.onclick     = (e) => { if (e.target === modal) cleanup(false); };
  });
}

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
  } catch (err) { }
}

// ============================================================================
// 3-) SAYFA YÖNLENDİRME SİSTEMİ
// ============================================================================
// 3.1-) loadPage
async function loadPage(pageId, activeBtn, pushToHistory = true) {
  currentPage = pageId;

  document
    .querySelectorAll("#sidebar-menu button")
    .forEach((b) =>
      b.classList.remove("bg-blue-600", "text-white", "hover:bg-blue-700")
    );

  let targetBtn = activeBtn;
  if (!targetBtn) {
    const allButtons = document.querySelectorAll("#sidebar-menu button");
    for (const btn of allButtons) {
      const onclickAttr = btn.getAttribute("onclick");
      if (onclickAttr && onclickAttr.includes(`'${pageId}'`)) {
        targetBtn = btn;
        break;
      }
    }
  }

  if (targetBtn) {
    targetBtn.classList.remove("text-gray-400", "hover:bg-gray-800");
    targetBtn.classList.add("bg-blue-600", "text-white", "hover:bg-blue-700");
  }

  if (pushToHistory) {
    history.pushState({ pageId: pageId }, "", "#" + pageId);
  }

  if (pageId === "dashboard") {
    const res = await fetch(`/pages/dashboard.html`);
    contentDiv.innerHTML = await res.text();
    initDashboardPage();
  } else {
    const res = await fetch(`/pages/${pageId}.html`);
    contentDiv.innerHTML = await res.text();

    if (pageId === "console") initConsolePage();
    if (pageId === "settings") initSettingsPage();
    if (pageId === "files") initFilesPage();
    if (pageId === "backups") initBackupsPage();
    if (pageId === "schedules") initSchedulesPage();
    if (pageId === "plugins") initPluginsPage();
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

// --- CHART.JS VE DASHBOARD GRAFİK DEĞİŞKENLERİ ---
let ramChart = null;
let cpuChart = null;
let chartLabels = [];
let ramDataPoints = [];
let cpuDataPoints = [];
const MAX_DATA_POINTS = 20;

function initCharts() {
  const ramCtx = document.getElementById("chart-ram");
  const cpuCtx = document.getElementById("chart-cpu");
  
  if (!ramCtx || !cpuCtx) return;

  // Eskileri varsa yok et (canvas binek olmasın)
  if (ramChart) ramChart.destroy();
  if (cpuChart) cpuChart.destroy();

  // Dizi uzunluklarını eşitle
  chartLabels = Array(MAX_DATA_POINTS).fill("");
  ramDataPoints = Array(MAX_DATA_POINTS).fill(0);
  cpuDataPoints = Array(MAX_DATA_POINTS).fill(0);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: {
        display: false,
        min: 0,
        max: 100
      }
    },
    elements: {
      point: { radius: 0 },
      line: { tension: 0.3, borderWidth: 2 }
    }
  };

  ramChart = new Chart(ramCtx, {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [{
        data: ramDataPoints,
        borderColor: "rgb(168, 85, 247)", // purple-500
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        fill: true
      }]
    },
    options: chartOptions
  });

  cpuChart = new Chart(cpuCtx, {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [{
        data: cpuDataPoints,
        borderColor: "rgb(249, 115, 22)", // orange-500
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        fill: true
      }]
    },
    options: chartOptions
  });
}

// 4.1-) initDashboardPage
function initDashboardPage() {
  socket.emit("get-settings");
  socket.emit("get-audit");
  socket.emit("get-stats-history");
  updateDashboardUI(currentStatus);
  initCharts();

  const dBtnStart = document.getElementById("dash-btn-start");
  const dBtnStop = document.getElementById("dash-btn-stop");

  if (dBtnStart) {
    dBtnStart.onclick = () => {
      socket.emit("start-server");
      updateDashboardUI("starting");
    };
  }

  if (dBtnStop) {
    dBtnStop.onclick = async () => {
      const ok = await showConfirm("Sunucuyu durdurmak istiyor musunuz?", {
        title: "Sunucuyu Durdur",
        icon: "🛑",
        okText: "Durdur",
        danger: true,
      });
      if (ok) socket.emit("stop-server");
    };
  }
}

// 4.2-) updateDashboardStats (RAM YÜZDESİ DÜZELTİLDİ)
// 4.2-) updateDashboardStats (RENKLENDİRME GÜNCELLENDİ)
function updateDashboardStats(data) {
  const ramBar = document.getElementById("dash-ram-bar");
  const ramText = document.getElementById("dash-ram-text");
  const ramPercent = document.getElementById("dash-ram-percent");

  let ramPercentVal = 0;
  let cpuPercentVal = parseFloat(data.cpu) || 0;

  // --- RAM HESAPLAMA VE RENKLENDİRME ---
  if (ramBar && ramText) {
    const currentRam = parseInt(data.ram);
    const maxRam = data.max || 4096;
    ramPercentVal = Math.min((currentRam / maxRam) * 100, 100);
    const percentStr = ramPercentVal.toFixed(1);

    // Renk Mantığı:
    // < 60 : Mor (Varsayılan)
    // 60-70: Sarı
    // 70-80: Turuncu
    // 80+  : Kırmızı
    let ramColorClass = "bg-purple-600"; // Varsayılan Mor
    if (ramPercentVal >= 80) ramColorClass = "bg-red-600";
    else if (ramPercentVal >= 70) ramColorClass = "bg-orange-500";
    else if (ramPercentVal >= 60) ramColorClass = "bg-yellow-500";

    ramText.textContent = `${data.ram} MB`;
    ramBar.style.width = `${ramPercentVal}%`;

    // Sınıfı uygula
    ramBar.className = `h-full rounded-full transition-all duration-500 ${ramColorClass}`;

    if (ramPercent) ramPercent.textContent = `${percentStr}%`;
  }

  // --- CPU HESAPLAMA VE RENKLENDİRME ---
  const cpuBar = document.getElementById("dash-cpu-bar");
  const cpuText = document.getElementById("dash-cpu-text");

  if (cpuBar && cpuText) {
    // Renk Mantığı:
    // < 60 : Amber/Turuncumsu (Varsayılan)
    // 60-70: Sarı
    // 70-80: Turuncu
    // 80+  : Kırmızı
    let cpuColorClass = "bg-amber-500"; // Varsayılan Turuncumsu
    if (cpuPercentVal >= 80) cpuColorClass = "bg-red-600";
    else if (cpuPercentVal >= 70) cpuColorClass = "bg-orange-500";
    else if (cpuPercentVal >= 60) cpuColorClass = "bg-yellow-500";

    cpuText.textContent = `${data.cpu}%`;
    cpuBar.style.width = `${Math.min(cpuPercentVal, 100)}%`;

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

  // --- GRAFİKLERİ GÜNCELLEME ---
  if (ramChart && cpuChart) {
    const newTime = new Date().toLocaleTimeString("tr-TR");
    chartLabels.push(newTime);
    
    ramDataPoints.push(ramPercentVal);
    cpuDataPoints.push(cpuPercentVal);

    const maxLimit = 150;
    if (ramDataPoints.length > maxLimit) {
      ramDataPoints.shift();
      cpuDataPoints.shift();
      chartLabels.shift();
    }

    ramChart.data.labels = chartLabels;
    ramChart.data.datasets[0].data = ramDataPoints;
    ramChart.update("none");

    cpuChart.data.labels = chartLabels;
    cpuChart.data.datasets[0].data = cpuDataPoints;
    cpuChart.update("none");
  }

  // --- UPTIME HESAPLAMA ---
  const elUptime = document.getElementById("dash-uptime");
  if (elUptime) {
    if (data.uptime > 0) {
      const sec = data.uptime;
      const h = Math.floor(sec / 3600).toString().padStart(2, "0");
      const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
      const s = (sec % 60).toString().padStart(2, "0");
      elUptime.textContent = `${h}:${m}:${s}`;
      elUptime.className = "text-emerald-400 font-bold font-mono";
    } else {
      elUptime.textContent = "KAPALI";
      elUptime.className = "text-gray-500 font-bold font-mono";
    }
  }

  // --- TPS GÜNCELLEME ---
  const elTps = document.getElementById("dash-tps");
  if (elTps) {
    const tpsVal = parseFloat(data.tps) || 20.0;
    elTps.textContent = tpsVal.toFixed(1);
    if (tpsVal >= 18.5) elTps.className = "text-emerald-400 font-bold font-mono";
    else if (tpsVal >= 15.0) elTps.className = "text-yellow-500 font-bold font-mono";
    else elTps.className = "text-red-500 font-bold font-mono";
  }

  // --- DÜNYA BOYUTU ---
  const elWorldSize = document.getElementById("dash-world-size");
  if (elWorldSize && data.disk) {
    const ws = parseFloat(data.disk.worldSize) || 0;
    if (ws > 1024) {
      elWorldSize.textContent = `${(ws / 1024).toFixed(2)} GB`;
    } else {
      elWorldSize.textContent = `${ws.toFixed(1)} MB`;
    }
  }

  // --- DİSK ALANI ---
  const elDiskSpace = document.getElementById("dash-disk-space");
  if (elDiskSpace && data.disk && data.disk.totalDisk) {
    elDiskSpace.textContent = `${data.disk.totalDisk} GB`;
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
    if (suggestionBox) {
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
      if (selected) selected.scrollIntoView({ block: "nearest" });
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
  } catch (e) { }
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
    showToast("Dosya okunamadı!", "error");
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
    showToast("Kaydedildi", "success");
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
  const ok = await showConfirm("Bu dosyayı/klasörü silmek istediğinize emin misiniz?", {
    title: "Dosya Sil",
    icon: "🗑️",
    okText: "Sil",
    danger: true,
  });
  if (ok) {
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
    showToast("Dosya okunamadı!", "error");
    return;
  }
  const content = await r.text();

  // Modal'ı Aç
  m.classList.remove("hidden");
  if (fNameEl) fNameEl.textContent = p.split("/").pop();

  // --- MONACO EDITOR BAŞLATMA (DÜZELTİLDİ) ---
  // 1. Önce loader (require) var mı kontrol et
  if (!window.require) {
    showToast("Monaco Loader bulunamadı! index.html dosyanıza script tag ekleyin.", "error", 5000);
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
    showToast("Dosya Kaydedildi!", "success");
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
      const ok = await showConfirm("Sunucunun yedeğini almak istiyor musunuz?", {
        title: "Yedek Al",
        icon: "💾",
        okText: "Yedek Al",
      });
      if (ok) {
        showLoading(true);
        try {
          const res = await fetch("/api/backups/create", { method: "POST" });
          const data = await res.json();
          if (data.success) { loadBackupList(); showToast("Yedek başarıyla alındı!", "success"); }
          else showToast(data.error || "Yedek alınamadı.", "error");
        } catch (e) {
          showToast("Yedek alınırken bir hata oluştu.", "error");
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
  const ok = await showConfirm(`"${n}" yedeğini silmek istediğinize emin misiniz?`, {
    title: "Yedeği Sil",
    icon: "🗑️",
    okText: "Sil",
    danger: true,
  });
  if (ok) {
    await fetch(`/api/backups/delete/${n}`, { method: "DELETE" });
    loadBackupList();
    showToast("Yedek silindi.", "success");
  }
};
window.restoreBackup = async (n) => {
  const ok = await showConfirm(`"${n}" yedeğini geri yüklemek istiyor musunuz?\nBu işlem mevcut sunucu dosyalarının üzerine yazacaktır.`, {
    title: "Yedeği Geri Yükle",
    icon: "⚠️",
    okText: "Geri Yükle",
    danger: true,
  });
  if (ok) {
    await fetch(`/api/backups/restore/${n}`, { method: "POST" });
    showToast("Yedek geri yüklendi!", "success");
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
    el.innerHTML = `<div><h3 class="text-cyan-400 font-bold text-sm">${s.name
      }</h3><span class="text-xs text-gray-500">${s.display || s.cron
      }</span></div><button onclick="deleteSchedule(${i})" class="text-red-500 hover:text-white">Sil</button>`;
    d.appendChild(el);
  });
}

window.deleteSchedule = async (i) => {
  const ok = await showConfirm("Bu zamanlanmış görevi silmek istediğinize emin misiniz?", {
    title: "Görevi Sil",
    icon: "⏰",
    okText: "Sil",
    danger: true,
  });
  if (ok) {
    schedules.splice(i, 1);
    socket.emit("save-schedules", schedules);
    showToast("Zamanlanmış görev silindi.", "info");
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
      showToast("Dosyalar yüklendi! Listeyi görmek için 'Yüklü Eklentiler' butonuna basın.", "success", 5000);
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

  // Sayfa açıldığında popüler eklentileri getir
  setTimeout(searchPlugins, 100);

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
  const sourceSelect = document.getElementById("plugin-source-select");
  const source = sourceSelect ? sourceSelect.value : "all";
  const resultsDiv = document.getElementById("market-results");

  resultsDiv.innerHTML =
    '<div class="col-span-full text-center text-blue-400 animate-pulse py-10">Aranıyor...</div>';

  try {
    const res = await fetch(
      `/api/plugins/search?q=${encodeURIComponent(query)}&source=${source}`
    );

    const textData = await res.text();
    let data = [];

    try {
      data = JSON.parse(textData);
    } catch (err) {
      console.error("JSON Parse Hatası:", err);
      throw new Error("Sunucu markete bağlanamadı.");
    }

    resultsDiv.innerHTML = "";

    if (!data || data.length === 0) {
      resultsDiv.innerHTML =
        '<div class="col-span-full text-center text-gray-500 py-10">Sonuç bulunamadı veya Market erişilemiyor.</div>';
      return;
    }

    data.forEach((p) => {
      let iconUrl = p.source === "modrinth"
        ? "https://cdn.modrinth.com/assets/logo.svg"
        : p.source === "devbukkit"
          ? "https://dev.bukkit.org/assets/images/favicon.ico"
          : "https://static.spigotmc.org/img/spigot.png";
      
      if (p.icon && p.icon.url) {
        iconUrl = p.icon.url.startsWith("http")
          ? p.icon.url
          : `https://www.spigotmc.org/${p.icon.url}`;
      }

      const sourceBadge = p.source === "modrinth"
        ? `<span class="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0">Modrinth</span>`
        : p.source === "devbukkit"
          ? `<span class="bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0">DevBukkit</span>`
          : `<span class="bg-orange-500/20 text-orange-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase shrink-0">SpigotMC</span>`;

      const card = document.createElement("div");
      card.className =
        "bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col gap-3 hover:border-blue-500 transition shadow-lg";

      const safeName = p.name.replace(/'/g, "\\'");

      card.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${iconUrl}" class="w-12 h-12 rounded-lg bg-gray-900 object-cover shrink-0" onerror="this.src='${p.source === "modrinth" ? "https://cdn.modrinth.com/assets/logo.svg" : p.source === "devbukkit" ? "https://dev.bukkit.org/assets/images/favicon.ico" : "https://static.spigotmc.org/img/spigot.png"}'">
                    <div class="overflow-hidden flex-1">
                        <div class="flex items-center gap-2 justify-between">
                            <h3 class="text-white font-bold text-sm truncate" title="${p.name}">${p.name}</h3>
                            ${sourceBadge}
                        </div>
                        <p class="text-xs text-gray-500 truncate" title="${p.tag || "Etiket yok"}">${p.tag || "Etiket yok"}</p>
                    </div>
                </div>
                <div class="flex justify-between items-center text-xs text-gray-400 border-t border-gray-700 pt-2 mt-auto">
                    <span>⬇ ${p.downloads || 0}</span>
                    <span>⭐ ${p.rating && p.rating.average
          ? p.rating.average.toFixed(1)
          : "0.0"
        }</span>
                </div>
                <button onclick="installRemotePlugin('${p.id}', '${safeName}', '${p.source}')" class="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-lg font-bold text-sm transition mt-1 flex justify-center items-center gap-2">
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
window.installRemotePlugin = async (id, name, source) => {
  const okInstall = await showConfirm(`"${name}" eklentisi sunucuya kurulsun mu?`, {
    title: "Eklenti Kur",
    icon: "🔌",
    okText: "Kur",
  });
  if (!okInstall) return;

  try {
    const res = await fetch("/api/plugins/install-remote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, source, fileType: ".jar" }),
    });
    const d = await res.json();

    if (d.success)
      showToast("Kurulum Başarılı! Aktif olması için sunucuyu yeniden başlatın.", "success", 6000);
    else showToast("Hata: " + (d.error || "Bilinmeyen hata"), "error");
  } catch (e) {
    showToast("Bağlantı hatası.", "error");
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
                <button onclick="togglePlugin('${p.name
      }')" class="text-xs bg-gray-700 px-3 py-1.5 rounded text-white mr-2 hover:bg-gray-600 transition">
                    ${p.enabled ? "Kapat" : "Aç"}
                </button> 
                <button onclick="deletePlugin('${p.name
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
  const ok = await showConfirm(`"${n}" eklentisini silmek istediğinize emin misiniz?`, {
    title: "Eklenti Sil",
    icon: "🗑️",
    okText: "Sil",
    danger: true,
  });
  if (ok) {
    await fetch("/api/plugins/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n }),
    });
    showToast(`"${n}" eklentisi silindi.`, 'info');
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
      if (btnPanel) btnPanel.className = "px-4 py-1.5 rounded-md text-xs font-bold transition bg-indigo-600 text-white shadow";
      if (btnGame) btnGame.className = "px-4 py-1.5 rounded-md text-xs font-bold transition text-gray-400 hover:text-white hover:bg-gray-800";

      // Panel modunda oyuncu filtresini gizle ve temizle
      if (playerFilterWrapper) playerFilterWrapper.classList.add("hidden");
      if (playerFilterInput) playerFilterInput.value = "";
    } else {
      if (btnPanel) btnPanel.className = "px-4 py-1.5 rounded-md text-xs font-bold transition text-gray-400 hover:text-white hover:bg-gray-800";
      if (btnGame) btnGame.className = "px-4 py-1.5 rounded-md text-xs font-bold transition bg-amber-600 text-white shadow";

      // Oyun modunda filtreyi göster ve doldur
      if (playerFilterWrapper) playerFilterWrapper.classList.remove("hidden");
      updatePlayerFilterList();
    }
    renderAuditLogs();
  };

  // [YENİ] Datalist'i benzersiz oyuncu isimleriyle doldur
  const updatePlayerFilterList = () => {
    if (!playerDatalist) return;
    const players = new Set();
    // Sadece 'game' tipindeki logların 'source' (oyuncu adı) kısmını al
    allAuditLogs.forEach(log => {
      if (log.type === 'game' && log.source) {
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
  if (playerFilterInput) {
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
  const btnClearAudit = document.getElementById("btn-clear-audit-logs");
  if (btnClearAudit) {
    btnClearAudit.onclick = async () => {
      const typeLabel = currentAuditFilter === "panel" ? "Panel İşlemleri" : "Oyun Komutları";
      const ok = await showConfirm(`Sadece "${typeLabel}" kategorisindeki kayıtları silmek istediğinize emin misiniz?`, {
        title: `${typeLabel} Kayıtlarını Temizle`,
        icon: "🗑️",
        okText: "Kayıtları Sil",
        danger: true,
      });
      if (ok) {
        socket.emit("clear-audit", { type: currentAuditFilter });
      }
    };
  }

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
      if (typeof XLSX === 'undefined') { showToast("Excel kütüphanesi yüklenemedi!", "error"); return; }

      const startVal = inputStart.value;
      const endVal = inputEnd.value;
      if (!startVal || !endVal) { showToast("Lütfen başlangıç ve bitiş tarihi seçin.", "warning"); return; }

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

      if (filtered.length === 0) { showToast("Seçilen tarih aralığında kayıt bulunamadı.", "info"); return; }

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
        if (currentAuditFilter === 'game' && playerFilterVal) fileName += `_${playerFilterVal}`;
        fileName += `.xlsx`;

        XLSX.utils.book_append_sheet(wb, ws, "Loglar");
        XLSX.writeFile(wb, fileName);
        modal.classList.add("hidden");
      } catch (e) { showToast("Excel dışa aktarılırken bir hata oluştu.", "error"); }
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
      if (hasDetails) {
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
            if (!detailRow.classList.contains("hidden")) {
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

  // --- Yeni Dünya Oluştur Butonu ---
  const btnCreate   = document.getElementById("btn-create-world");
  const createModal = document.getElementById("create-world-modal");
  const nameInput   = document.getElementById("new-world-name");
  const btnConfirm  = document.getElementById("btn-create-world-confirm");
  const btnCancel   = document.getElementById("btn-create-world-cancel");

  if (btnCreate && createModal) {
    btnCreate.onclick = () => {
      if (nameInput) nameInput.value = "";
      createModal.classList.remove("hidden");
      setTimeout(() => nameInput && nameInput.focus(), 50);
    };

    btnCancel.onclick = () => createModal.classList.add("hidden");

    // Modal dışına tıklayınca kapat
    createModal.onclick = (e) => {
      if (e.target === createModal) createModal.classList.add("hidden");
    };

    // Enter tuşu desteği
    if (nameInput) {
      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btnConfirm && btnConfirm.click();
        if (e.key === "Escape") createModal.classList.add("hidden");
      });
    }

    if (btnConfirm) {
      btnConfirm.onclick = async () => {
        const rawName = nameInput ? nameInput.value.trim() : "";

        // Doğrulama
        if (!rawName) {
          showToast("Lütfen bir dünya adı girin!", "warning");
          nameInput && nameInput.focus();
          return;
        }
        if (!/^[a-zA-Z0-9_\-]+$/.test(rawName)) {
          showToast("Dünya adı yalnızca harf, rakam, _ ve - içerebilir.", "warning");
          nameInput && nameInput.focus();
          return;
        }

        createModal.classList.add("hidden");

        // Onay al
        const ok = await showConfirm(`"${rawName}" adında yeni bir dünya klasörü oluşturulsun mu?`, {
          title: "Yeni Dünya Oluştur",
          icon: "🌱",
          okText: "Oluştur",
        });

        if (!ok) return;

        socket.emit("create-world", { name: rawName });
        showToast(`"${rawName}" oluşturuluyor...`, "info");
      };
    }
  }

  // Dosya Yükleme Dinleyicisi
  const inp = document.getElementById("world-upload-input");
  const progress = document.getElementById("world-upload-progress");

  if (inp)
    inp.onchange = async () => {
      if (inp.files.length === 0) return;

      const okWorld = await showConfirm("Bu ZIP dosyasını yüklemek istediğinize emin misiniz?\nDosya sunucu ana dizinine açılacak.", {
        title: "Dünya Yükle",
        icon: "🌍",
        okText: "Yükle",
      });
      if (!okWorld) {
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
          showToast("Dünya başarıyla yüklendi!", "success");
          socket.emit("get-worlds"); // Listeyi yenile
        } else {
          showToast("Hata: " + (data.error || "Bilinmeyen hata"), "error");
        }
      } catch (e) {
        showToast("Bağlantı hatası!", "error");
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
                    <h3 class="text-white font-bold text-lg break-all">${w.name
      }</h3>
                    ${statusText}
                </div>
            </div>
            
            <div class="flex items-center gap-2 w-full md:w-auto">
                ${!w.isActive
        ? `
                <button onclick="activateWorld('${w.name}')" class="flex-1 md:flex-none bg-emerald-600/20 hover:bg-emerald-600 text-emerald-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 border border-emerald-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                    AKTİF DÜNYA YAP
                </button>`
        : ""
      }

                <a href="/api/worlds/download/${w.name
      }" target="_blank" class="flex-1 md:flex-none bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 border border-blue-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0L8 8m4-4v12" /></svg>
                    İNDİR
                </a>

                <button onclick="deleteWorld('${w.name}', ${w.isActive})" class="flex-1 md:flex-none bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 border border-rose-600/30">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    SİL
                </button>
            </div>
        `;
    d.appendChild(el);
  });
}

// Dünyayı Aktif Etme Fonksiyonu
window.activateWorld = async (n) => {
  const ok = await showConfirm(`"${n}" dünyası aktif edilecek.\nEtkili olması için sunucuyu yeniden başlatmanız gerekir.`, {
    title: "Dünyayı Aktif Et",
    icon: "🌍",
    okText: "Aktif Et",
  });
  if (ok) socket.emit("world-action", { action: "activate", name: n });
};

window.deleteWorld = (worldName, isActive) => {
  const modal = document.getElementById("delete-world-modal");
  const titleSpan = document.getElementById("delete-world-target-name");
  const activeWarning = document.getElementById("delete-world-active-warning");
  const backupToggle = document.getElementById("delete-world-backup-toggle");
  const btnConfirm = document.getElementById("btn-delete-world-confirm");
  const btnCancel = document.getElementById("btn-delete-world-cancel");

  if (!modal || !titleSpan || !btnConfirm || !btnCancel) return;

  // Başlığı ve uyarıyı doldur
  titleSpan.textContent = worldName;
  if (isActive) {
    activeWarning.classList.remove("hidden");
  } else {
    activeWarning.classList.add("hidden");
  }

  // Yedek toggle'ı varsayılan olarak açık yap
  if (backupToggle) backupToggle.checked = true;

  modal.classList.remove("hidden");

  btnCancel.onclick = () => modal.classList.add("hidden");

  // Modal dışına tıklanınca kapat
  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  };

  btnConfirm.onclick = () => {
    modal.classList.add("hidden");
    const backupEnabled = backupToggle ? backupToggle.checked : false;

    socket.emit("world-action", {
      action: "delete",
      name: worldName,
      backup: backupEnabled
    });

    if (backupEnabled) {
      showToast(`"${worldName}" yedekleniyor ve siliniyor...`, "info");
    } else {
      showToast(`"${worldName}" siliniyor...`, "info");
    }
  };
};

// ============================================================================
// 14-) AYARLAR VE YÖNETİCİLER (SETTINGS & OPS)
// 14.1-) initSettingsPage (Auto-Restart Destekli)
function initSettingsPage() {
  socket.off("settings-data");
  socket.off("sistem-bilgileri");
  socket.off("java-list-data");
  socket.off("refresh-java-success");

  socket.emit("get-settings");
  socket.emit("get-system-info");
  socket.emit("get-java-list");

  const ramSlider = document.getElementById("set-ram-slider");
  const ramDisplay = document.getElementById("set-ram-display");
  const ramMaxLabel = document.getElementById("ram-max-label");
  const btnSave = document.getElementById("btn-save-settings");
  const chkAutoRestart = document.getElementById("set-auto-restart"); // YENİ
  const selectJavaPath = document.getElementById("set-java-path"); // YENİ
  const btnRefreshJava = document.getElementById("btn-refresh-java"); // YENİ

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

    // Java Sürümü Yükle
    if (selectJavaPath && d.config) {
      originalSettings.javaPath = d.config.javaPath || "java";
      selectJavaPath.value = d.config.javaPath || "java";
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

  socket.on("java-list-data", (list) => {
    if (!selectJavaPath) return;
    selectJavaPath.innerHTML = "";
    list.forEach(java => {
      const opt = document.createElement("option");
      opt.value = java.path;
      opt.textContent = java.name;
      selectJavaPath.appendChild(opt);
    });
    if (originalSettings && originalSettings.javaPath) {
      selectJavaPath.value = originalSettings.javaPath;
    }
  });

  if (btnRefreshJava) {
    btnRefreshJava.onclick = () => {
      const icon = document.getElementById("icon-refresh-java");
      const text = document.getElementById("text-refresh-java");
      if (icon) icon.classList.add("animate-spin");
      if (text) text.textContent = "TARANIYOR...";
      btnRefreshJava.disabled = true;
      socket.emit("refresh-java-list");
    };
  }

  socket.on("refresh-java-success", () => {
    const btn = document.getElementById("btn-refresh-java");
    const icon = document.getElementById("icon-refresh-java");
    const text = document.getElementById("text-refresh-java");
    if (icon) icon.classList.remove("animate-spin");
    if (text) text.textContent = "SÜRÜMLERİ YENİLE";
    if (btn) btn.disabled = false;
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

      // Java Sürümü Kontrol
      if (selectJavaPath) {
        const curJava = selectJavaPath.value;
        const oldJava = originalSettings.javaPath || "java";
        if (curJava !== oldJava) {
          const curText = selectJavaPath.options[selectJavaPath.selectedIndex]?.text || curJava;
          let oldText = oldJava;
          for (let o of selectJavaPath.options) {
            if (o.value === oldJava) {
              oldText = o.text;
              break;
            }
          }
          if (oldJava === "java" && oldText === "java") oldText = "Sistem Varsayılanı";
          changes.push({
            name: "Java Sürümü",
            old: oldText,
            new: curText
          });
        }
      }


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
        showToast("Değişiklik yok. Hiçbir ayar güncellenmedi.", "info");
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
        javaPath: selectJavaPath ? selectJavaPath.value : "java",
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
        showToast("Lütfen sadece .zip dosyası yükleyin!", "warning");
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
          showToast(`Kaynak paketi yüklendi! SHA1: ${data.sha1}\nSunucuyu yeniden başlatın.`, "success", 6000);
          if (rpStatus) {
            rpStatus.textContent = "✅ Paket Yüklü";
            rpStatus.className =
              "text-[10px] text-green-400 mb-2 truncate font-bold";
          }
        } else {
          showToast("Hata: " + (data.error || "Bilinmiyor"), "error");
          if (rpStatus) rpStatus.textContent = "Hata oluştu.";
        }
      } catch (e) {
        showToast("Sunucu hatası.", "error");
      }
      rpInput.value = ""; // Inputu temizle
    };
  }

  // Silme İşlemi
  if (btnDeleteRP) {
    btnDeleteRP.onclick = async () => {
      const okRp = await showConfirm("Kaynak paketini silmek ve sunucu ayarlarından kaldırmak istiyor musunuz?", {
        title: "Kaynak Paketini Sil",
        icon: "🗑️",
        okText: "Sil",
        danger: true,
      });
      if (!okRp) return;

      try {
        const res = await fetch("/api/delete-rp", { method: "DELETE" });
        const data = await res.json();

        if (data.success) {
          showToast("Kaynak paketi silindi.", "success");
          if (rpStatus) {
            rpStatus.textContent = "Yüklü paket yok.";
            rpStatus.className = "text-[10px] text-gray-500 mb-2 truncate";
          }
        } else {
          showToast("Hata veya paket zaten yok.", "error");
        }
      } catch (e) {
        showToast("Bir hata oluştu.", "error");
      }
    };
  }

  setupSettingsExtraLogic();
}

// 14.2-) initOpsPage
function initOpsPage() {
  const btnAdd = document.getElementById("btn-add-op");
  const i = document.getElementById("op-input-name");
  if (btnAdd && i) {
    btnAdd.onclick = () => {
      if (i.value.trim()) {
        socket.emit("admin-action", { action: "op", target: i.value.trim() });
        i.value = "";
      }
    };
    i.onkeydown = (e) => {
      if (e.key === "Enter") {
        if (i.value.trim()) {
          socket.emit("admin-action", { action: "op", target: i.value.trim() });
          i.value = "";
        }
      }
    };
  }

  // datalist'i mevcut allPlayersData ile doldur
  updateOpsDatalist();
}

// Yöneticiler giriş alanı için otomatik doldurma (datalist) güncelleyici
function updateOpsDatalist() {
  const datalist = document.getElementById("ops-players-datalist");
  if (!datalist) return;
  datalist.innerHTML = "";

  const players = allPlayersData || [];
  players.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.name;
    datalist.appendChild(option);
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

    btnRemove.onclick = async () => {
      const ok = await showConfirm(`"${name}" kullanıcısının yetkisini almak istediğine emin misin?`, {
        title: "Yetkiyi Al",
        icon: "🛡️",
        okText: "Yetkiyi Al",
        danger: true,
      });
      if (ok) {
        socket.emit("admin-action", { action: "deop", target: name });
        card.remove();
        if (badgeCount) {
          const currentCount = parseInt(badgeCount.textContent) || 0;
          badgeCount.textContent = Math.max(0, currentCount - 1);
        }
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
                    ${isOp
        ? '<span class="text-[9px] bg-purple-600/30 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30 flex-shrink-0">OP</span>'
        : ""
      }
                </h3>
                <span class="text-[10px] text-green-500 flex items-center gap-1">● Çevrimiçi</span>
            </div>
            <div class="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onclick="playerOpAction('${name}', '${actionType}')" class="${btnOpClass} p-1.5 rounded transition shadow" title="${btnOpTitle}">${btnOpIcon}</button>
                <button onclick="socket.emit('admin-action', { action: 'kick', target: '${name}' })" class="bg-amber-600/20 hover:bg-amber-600 text-amber-500 hover:text-white p-1.5 rounded border border-amber-600/30 transition shadow" title="At (Kick)"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
                <button onclick="playerBanAction('${name}')" class="bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white p-1.5 rounded border border-rose-600/30 transition shadow" title="Yasakla (Ban)"><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
            </div>
        `;
    listContainer.appendChild(card);
  });
}

window.deop = async (n) => {
  const ok = await showConfirm(`"${n}" kullanıcısının yetkisini almak istediğine emin misin?`, {
    title: "Yetkiyi Al",
    icon: "🛡️",
    okText: "Yetkiyi Al",
    danger: true,
  });
  if (ok) socket.emit("admin-action", { action: "deop", target: n });
};

// Oyuncu listesindeki op/deop butonu için ayrı fonksiyon (HTML string içinden çağrılır)
window.playerOpAction = async (name, action) => {
  const label = action === "deop" ? "yetkisini almak" : "yetki vermek";
  const ok = await showConfirm(`"${name}" kullanıcısına ${label} istiyor musunuz?`, {
    title: action === "deop" ? "Yetkiyi Al" : "Yetki Ver",
    icon: "🛡️",
    okText: action === "deop" ? "Yetkiyi Al" : "Yetki Ver",
    danger: action === "deop",
  });
  if (ok) socket.emit("admin-action", { action, target: name });
};

// Oyuncu ban butonu için ayrı fonksiyon
window.playerBanAction = async (name) => {
  const ok = await showConfirm(`"${name}" oyuncusunu sunucudan yasaklamak istiyor musunuz?`, {
    title: "Oyuncuyu Yasakla",
    icon: "🚫",
    okText: "Yasakla",
    danger: true,
  });
  if (ok) socket.emit("admin-action", { action: "ban", target: name });
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
          "flex-shrink-0 relative bg-gradient-to-r from-gray-800 to-emerald-900/30 p-6 rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden transition-all duration-500";

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
          "flex-shrink-0 relative bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden transition-all duration-500";

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

socket.on("stats-history-data", (history) => {
  if (currentPage === "dashboard" && ramChart && cpuChart) {
    ramDataPoints = [];
    cpuDataPoints = [];
    chartLabels = [];

    if (!history || history.length === 0) {
      ramDataPoints = Array(MAX_DATA_POINTS).fill(0);
      cpuDataPoints = Array(MAX_DATA_POINTS).fill(0);
      chartLabels = Array(MAX_DATA_POINTS).fill("");
    } else {
      history.forEach(item => {
        const ramMB = parseInt(item.ram);
        const maxRam = item.max || 4096;
        const ramPercentVal = Math.min((ramMB / maxRam) * 100, 100);
        
        ramDataPoints.push(ramPercentVal);
        cpuDataPoints.push(parseFloat(item.cpu) || 0);
        chartLabels.push(item.time || "");
      });

      // 20'den az veri varsa sol tarafı doldur
      while (ramDataPoints.length < MAX_DATA_POINTS) {
        ramDataPoints.unshift(0);
        cpuDataPoints.unshift(0);
        chartLabels.unshift("");
      }
    }

    ramChart.data.labels = chartLabels;
    ramChart.data.datasets[0].data = ramDataPoints;
    ramChart.update();

    cpuChart.data.labels = chartLabels;
    cpuChart.data.datasets[0].data = cpuDataPoints;
    cpuChart.update();
  }
});

// Veri Dinleyicileri
socket.on("audit-data", (l) => {
  if (currentPage === "audit") updateAuditList(l);
  if (currentPage === "dashboard") updateDashboardAuditList(l);
});

function updateDashboardAuditList(list) {
  const tbody = document.getElementById("dash-audit-body");
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="py-4 text-center text-gray-500 italic">Kayıt bulunamadı.</td></tr>';
    return;
  }

  // Son 5 kaydı al
  const lastFive = list.slice(0, 5);
  tbody.innerHTML = "";

  lastFive.forEach((log) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-white/5 transition-colors border-b border-gray-700/30 last:border-0";
    
    const badgeColor = log.type === "game" ? "bg-orange-950 text-orange-400 border-orange-900/30" : "bg-blue-950 text-blue-400 border-blue-900/30";
    const typeLabel = log.type === "game" ? "Oyun" : "Panel";

    tr.innerHTML = `
      <td class="py-3 font-mono text-gray-400">${log.time.split(" ")[1] || log.time}</td>
      <td class="py-3 font-semibold text-gray-200">
        <span class="px-2 py-0.5 rounded text-[10px] border ${badgeColor} mr-1.5">${typeLabel}</span>
        ${log.source}
      </td>
      <td class="py-3 font-bold text-purple-400">${log.action}</td>
      <td class="py-3 text-gray-400 max-w-[200px] truncate" title="${log.details}">${log.details}</td>
    `;
    tbody.appendChild(tr);
  });
}
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
socket.on("world-create-result", (res) => {
  if (res.success) {
    showToast(`"${res.name}" dünyası başarıyla oluşturuldu!`, "success");
  } else {
    showToast("Dünya oluşturulamadı: " + (res.error || "Bilinmeyen hata"), "error");
  }
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
    document.getElementById("set-ram-display").textContent = `${parseInt(d.ram) || 6
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
let currentSoftwareType = "paper";
let currentSetupSoftwareType = "paper";

window.changeSoftwareType = (type) => {
  currentSoftwareType = type;
  const types = ["paper", "spigot", "craftbukkit"];
  types.forEach((t) => {
    const btn = document.getElementById(`btn-soft-${t}`);
    if (btn) {
      if (t === type) {
        btn.className = "flex-1 py-2 px-4 rounded-lg font-bold text-sm transition bg-purple-600 text-white shadow-md";
      } else {
        btn.className = "flex-1 py-2 px-4 rounded-lg font-bold text-sm transition bg-gray-900 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700";
      }
    }
  });
  initSoftwarePage();
};

window.changeSetupSoftwareType = (type) => {
  currentSetupSoftwareType = type;
  const types = ["paper", "spigot", "craftbukkit"];
  types.forEach((t) => {
    const btn = document.getElementById(`btn-setup-${t}`);
    if (btn) {
      if (t === type) {
        btn.className = "flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition bg-purple-600 text-white shadow-md";
      } else {
        btn.className = "flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition bg-gray-955 text-gray-400 hover:bg-gray-800 hover:text-white border border-gray-800/80";
      }
    }
  });
  loadSetupScreenVersions();
};

function initSoftwarePage() {
  const listDiv = document.getElementById("software-list");
  if (!listDiv) return;

  listDiv.innerHTML =
    '<div class="col-span-full text-center text-gray-500 py-10">Stable sürümler yükleniyor...</div>';

  fetch(`/api/software/list?type=${currentSoftwareType}`)
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
        const badge = v.stable
          ? `<span class="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-800 font-medium">Kararlı</span>`
          : `<span class="text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded border border-amber-800 font-medium">Deneysel</span>`;
        card.innerHTML = `<div><h3 class="text-white font-bold text-lg">${v.type} ${v.version}</h3><div class="mt-1">${badge}</div></div><button onclick="installVersion('${v.version}')" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold text-sm transition">KUR</button>`;
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
  const type = isFullScreen ? currentSetupSoftwareType : currentSoftwareType;
  const typeName = type === "paper" ? "Paper" : type === "spigot" ? "Spigot" : "CraftBukkit";
  const okSoftware = await showConfirm(`${typeName} ${version} sürümü kurulacak. Onaylıyor musunuz?`, {
    title: "Yazılım Kur",
    icon: "📦",
    okText: "Kur",
  });
  if (!okSoftware) return;

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
      body: JSON.stringify({ version, type }),
    });

    const data = await res.json();

    if (!data.success) {
      showToast("Hata: " + (data.error || "Bilinmeyen hata"), "error");
      if (isFullScreen) location.reload();
      else initSoftwarePage();
    } else {
      // Başarılı
      setTimeout(() => {
        showToast("Kurulum tamamlandı! Yönlendiriliyorsunuz...", "success");
        // Sayfayı yenile ki yeni mod (Dashboard) açılsın
        location.reload();
      }, 1000);
    }
  } catch (e) {
    showToast("Sunucu hatası!", "error");
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
      const hash = window.location.hash.replace("#", "").split("?")[0];
      if (hash) {
        loadPage(hash, null, false);
        history.replaceState({ pageId: hash }, "", "#" + hash);
      } else {
        loadPage("dashboard", null, false);
        history.replaceState({ pageId: "dashboard" }, "", "#dashboard");
      }
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

  fetch(`/api/software/list?type=${currentSetupSoftwareType}`)
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

        const badgeText = v.stable ? "Kararlı Sürüm" : "Deneysel Sürüm";
        const badgeColorClass = v.stable ? "text-purple-400" : "text-amber-400";
        const bgIconColorClass = v.stable ? "bg-purple-900/50 text-purple-400" : "bg-amber-900/50 text-amber-400";

        div.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 ${bgIconColorClass} rounded-full flex items-center justify-center font-bold text-xs group-hover:bg-purple-600 group-hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <div>
                            <h3 class="text-white font-bold">${v.type} ${v.version}</h3>
                            <p class="text-xs ${badgeColorClass} font-semibold">${badgeText}</p>
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
  if (tabName === "ops") {
    socket.emit("get-ops");
    socket.emit("get-all-players");
    initOpsPage();
  }
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

window.unbanIp = async (ip) => {
  const ok = await showConfirm(`"${ip}" adresinin IP yasağı kaldırılsın mı?`, {
    title: "IP Ban Kaldır",
    icon: "🚫",
    okText: "Kaldır",
  });
  if (ok) socket.emit("unban-ip", ip);
};

// --- [YENİ] TÜM OYUNCULAR VE ENVANTER MANTIĞI ---

// 1. Sunucudan Listeyi Al
socket.on("all-players-data", (list) => {
  allPlayersData = list; // {name, uuid, online}
  renderAllPlayers();
  if (typeof updateOpsDatalist === "function") {
    updateOpsDatalist();
  }
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
                <img src="https://mc-heads.net/avatar/${p.name
        }/40" class="rounded shadow-sm">
                <div class="overflow-hidden">
                    <h4 class="font-bold text-sm text-gray-200 truncate group-hover:text-white">${p.name
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
  history.pushState({ pageId: currentPage, modalOpen: true }, "", window.location.hash + "?modal=inventory");
  socket.emit("get-player-inventory", { uuid });
}

// Envanter Kapatma Fonksiyonu (Tarayıcı geçmişini korur)
window.closePlayerInventory = () => {
  const modal = document.getElementById("inventory-modal");
  if (modal) modal.classList.add("hidden");
  if (history.state && history.state.modalOpen) {
    history.back(); // Modal durumunu geçmişten kaldır
  }
};
// ============================================================================
// [DÜZELTME] 1. OYUNCU ENVANTERİ (AYRI BLOK)
// ============================================================================
socket.on("player-inventory-data", (data) => {
  if (!data) {
    showToast("Envanter verisi okunamadı!", "error");
    return;
  }
  if (data.error) {
    showToast(data.error, "error");
    const modal = document.getElementById("inventory-modal");
    if (modal) modal.classList.add("hidden");
    return;
  }

  // Slot Oluşturucu Yardımcı Fonksiyon (Sadece bu blok içinde lazım)
  const createSlot = (item) => {
    const div = document.createElement("div");
    div.className = "mc-slot";
    if (item) {
      // Mod ID'sini kaldır (örn: simplyswords:iron_spear -> iron_spear)
      let itemId = item.id.split(":").pop();
      const img = document.createElement("img");
      img.src = `https://assets.mcasset.cloud/1.20.1/assets/minecraft/textures/item/${itemId}.png`;
      img.className = "w-6 h-6 object-contain";
      img.title = `${item.id} (x${item.Count})`;

      img.onerror = () => {
        // 1. item bulunamazsa block klasörünü dene
        img.onerror = () => {
          // 2. block da bulunamazsa (modlu eşya veya kırık vanilla ise) şık bir harfli placeholder çiz
          img.style.display = "none";
          const placeholder = document.createElement("div");
          placeholder.className = "w-6 h-6 flex items-center justify-center bg-indigo-900/40 border border-indigo-500/30 rounded text-[9px] font-bold text-indigo-300 uppercase select-none";
          placeholder.textContent = itemId.slice(0, 2); // Eşyanın ilk 2 harfi (örn: "ir", "sc")
          placeholder.title = `${item.id} (x${item.Count})`;
          div.insertBefore(placeholder, div.firstChild);
        };
        img.src = `https://assets.mcasset.cloud/1.20.1/assets/minecraft/textures/block/${itemId}.png`;
      };

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
    if (!c) return;
    c.innerHTML = "";
    const itemsList = items || [];
    for (let i = 0; i < size; i++) {
      let found = itemsList.find((x) => x.Slot == i + offset);
      c.appendChild(createSlot(found));
    }
  };

  // 1. Armor
  const armorDiv = document.getElementById("inv-armor");
  if (armorDiv) {
    armorDiv.innerHTML = "";
    const invList = data.inventory || [];
    [103, 102, 101, 100].forEach((slotId) => {
      let item = invList.find((x) => x.Slot == slotId);
      armorDiv.appendChild(createSlot(item));
    });
  }

  // 2. Offhand
  const offhandDiv = document.getElementById("inv-offhand");
  if (offhandDiv) {
    offhandDiv.innerHTML = "";
    const invList = data.inventory || [];
    let offItem = invList.find((x) => x.Slot == -106);
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
                <span class="font-mono text-gray-500 font-bold w-4 text-center">${i + 1}.</span>
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
                <span class="font-mono text-gray-500 font-bold w-4 text-center">${i + 1}.</span>
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
                <span class="font-mono text-gray-500 font-bold w-4 text-center">${i + 1}.</span>
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
  if (!container) return;

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

// Tarayıcı geri/ileri tuşları ve mouse 4/5 hareketlerini SPA sayfalarına yönlendir
window.addEventListener("popstate", (event) => {
  // 1. Açık bir envanter modalı varsa kapat
  const invModal = document.getElementById("inventory-modal");
  if (invModal && !invModal.classList.contains("hidden")) {
    if (!event.state || !event.state.modalOpen) {
      invModal.classList.add("hidden");
      return; // Sadece modalı kapat, sayfa değiştirmeye gerek yok
    }
  }

  // 2. Sayfayı yükle
  if (event.state && event.state.pageId) {
    loadPage(event.state.pageId, null, false);
  } else {
    // URL hash'ine göre yükle yoksa dashboard'a dön
    const hash = window.location.hash.replace("#", "").split("?")[0];
    if (hash) {
      loadPage(hash, null, false);
    } else {
      loadPage("dashboard", null, false);
    }
  }
});
