/*
// ============================================================================
//  MC ADMIN PANEL - SERVER SIDE (SERVER.JS)
// ============================================================================
*/

// 1-) AYARLAR VE MODÜLLER
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { spawn, exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const pidusage = require("pidusage");
const os = require("os");
const multer = require("multer");
const AdmZip = require("adm-zip");
const cron = require("node-cron");
const axios = require("axios");
const nbt = require('prismarine-nbt');
const util = require('util');
const parseNbt = util.promisify(nbt.parse);
const crypto = require('crypto'); // SHA1 hesaplamak için gerekli

// --- KLASÖR YAPILANDIRMASI ---
const SERVER_FOLDER_NAME = "mc-server";
const MC_SERVER_PATH = path.resolve(__dirname, "..", SERVER_FOLDER_NAME);
const JAR_NAME = "server.jar";

// [YENİ] Config Klasörü
const CONFIG_DIR = path.join(__dirname, "config");

// Dosya Yolları (Artık CONFIG_DIR içinde)
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const SCHEDULES_FILE = path.join(CONFIG_DIR, "schedules.json");
const AUDIT_FILE = path.join(CONFIG_DIR, "audit.json");
const DISCORD_CONFIG_FILE = path.join(CONFIG_DIR, "discord-config.json");

// Minecraft Sunucusu İçindeki Dosyalar (Bunlar sunucu klasöründe kalmalı)
const PROPS_FILE = path.join(MC_SERVER_PATH, "server.properties");
const WHITELIST_FILE = path.join(MC_SERVER_PATH, "whitelist.json");
const BANNED_PLAYERS_FILE = path.join(MC_SERVER_PATH, "banned-players.json");
const ICON_FILE = path.join(MC_SERVER_PATH, "server-icon.png");
const LOG_FILE = path.join(MC_SERVER_PATH, "logs", "latest.log");
const PLUGINS_DIR = path.join(MC_SERVER_PATH, "plugins");

// Yedekler ve Geçici Yüklemeler
const BACKUP_DIR = path.join(__dirname, "backups");
const uploadWorld = multer({ dest: path.join(__dirname, "temp_uploads") });

const PORT = 1717;

let isManualStop = false; // Global değişken
let serverStartTime = null;
let currentTps = 20.0;
let tpsInterval = null;
let diskDataCache = { totalDisk: 0, freeDisk: 0, usedDisk: 0, diskPercent: 0, worldSize: 0 };
let serverStatsHistory = [];

// 2-) BAŞLANGIÇ KONTROLLERİ
console.log("[Panel] Başlatılıyor...");

// [YENİ] Config Klasörünü Kontrol Et / Oluştur
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  console.log("[Panel] 'config' klasörü oluşturuldu.");
} else {
  console.log("[Panel] 'config' klasörü doğrulandı.");
}

// Sunucu Klasörü Kontrolü
if (!fs.existsSync(MC_SERVER_PATH)) {
  console.error(`[Panel] ❌ HATA: '${SERVER_FOLDER_NAME}' klasörü bulunamadı!`);
} else {
  console.log("[Panel] Sunucu klasörü doğrulandı.");
}


const CPU_CORE_COUNT = os.cpus().length;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// 3-) YARDIMCI FONKSİYONLAR

// 3.1-) getFolderSize
function getFolderSize(dirPath) {
  let size = 0;
  if (fs.existsSync(dirPath)) {
    try {
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) size += stats.size;
      });
    } catch (e) { }
  }
  return (size / 1024 / 1024).toFixed(2) + " MB";
}

// 3.2-) logAudit - GÜNCELLENDİ (Type ve Source desteği eklendi)
// Mevcut kullanımları bozmamak için varsayılan değerler ekledik.
function logAudit(action, details, source = "Panel", type = "panel") {
  let audits = [];
  if (fs.existsSync(AUDIT_FILE))
    try {
      audits = JSON.parse(fs.readFileSync(AUDIT_FILE));
    } catch (e) { }

  const newLog = {
    time: new Date().toLocaleString("tr-TR"),
    source: source, // Artık dinamik (Panel veya Oyuncu Adı)
    type: type, // 'panel' veya 'game'
    action: action,
    details: details,
  };

  audits.unshift(newLog);
  // Kayıt sayısını biraz artıralım, oyun logları çok olabilir.
  if (audits.length > 500) audits.pop();

  fs.writeFileSync(AUDIT_FILE, JSON.stringify(audits, null, 2));
  io.emit("audit-data", audits);
}

// 3.3-) sendDiscord
function sendDiscord(msg, type = "event") {
  if (!fs.existsSync(DISCORD_CONFIG_FILE)) return;
  try {
    const conf = JSON.parse(fs.readFileSync(DISCORD_CONFIG_FILE));
    let targetUrl = "";
    if (type === "chat") targetUrl = conf.chatUrl;
    else if (type === "admin") targetUrl = conf.adminUrl;
    else targetUrl = conf.eventsUrl;

    if (targetUrl && targetUrl.startsWith("http")) {
      axios.post(targetUrl, { content: msg }).catch(() => { });
    }
  } catch (e) { }
}

// 3.4-) getDiscordConfig
function getDiscordConfig() {
  const def = {
    chatUrl: "",
    eventsUrl: "",
    adminUrl: "",
    optChat: false,
    optStatus: true,
    optJoins: true,
    optDeaths: false,
    optAdv: false,
    optAdmin: true,
  };
  if (!fs.existsSync(DISCORD_CONFIG_FILE)) return def;
  try {
    return { ...def, ...JSON.parse(fs.readFileSync(DISCORD_CONFIG_FILE)) };
  } catch (e) {
    return def;
  }
}

// 3.5-) getPanelConfig
function getPanelConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    const def = { ramMin: "8G", ramMax: "12G" };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(def));
    return def;
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE));
}

// 3.6-) savePanelConfig
function savePanelConfig(nc) {
  const c = getPanelConfig();
  const u = { ...c, ...nc };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(u, null, 2));
}

// 3.7-) getProperties
function getProperties() {
  if (!fs.existsSync(PROPS_FILE)) return {};
  const c = fs.readFileSync(PROPS_FILE, "utf8");
  const p = {};
  c.split("\n").forEach((l) => {
    if (l && !l.startsWith("#") && l.includes("=")) {
      const [k, ...r] = l.split("=");
      p[k.trim()] = r.join("=").trim();
    }
  });
  return p;
}

// 3.8-) saveProperties
function saveProperties(np) {
  if (!fs.existsSync(PROPS_FILE)) return;
  let c = fs.readFileSync(PROPS_FILE, "utf8");
  const l = c.split("\n");
  const ul = l.map((line) => {
    if (line && !line.startsWith("#") && line.includes("=")) {
      const k = line.split("=")[0].trim();
      if (np.hasOwnProperty(k)) return `${k}=${np[k]}`;
    }
    return line;
  });
  fs.writeFileSync(PROPS_FILE, ul.join("\n"));
}

// 3.9-) getWhitelist
function getWhitelist() {
  if (!fs.existsSync(WHITELIST_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(WHITELIST_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

// 3.10-) getOps
function getOps() {
  const p = path.join(MC_SERVER_PATH, "ops.json");
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")).map((op) => op.name);
  } catch (e) {
    return [];
  }
}

// 3.11-) getBannedPlayers
function getBannedPlayers() {
  if (!fs.existsSync(BANNED_PLAYERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(BANNED_PLAYERS_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

function getBannedIPs() {
  const p = path.join(MC_SERVER_PATH, "banned-ips.json");
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return [];
  }
}

// 3.12-) getLatestLogs
function getLatestLogs(lc = 100) {
  if (!fs.existsSync(LOG_FILE)) return "--- Log dosyası henüz oluşmadı. ---";
  try {
    return fs
      .readFileSync(LOG_FILE, "utf8")
      .split(/\r?\n/)
      .slice(-lc)
      .join("\n");
  } catch (e) {
    return "Log hatası: " + e.message;
  }
}

// 3.13-) getPlugins
function getPlugins() {
  if (!fs.existsSync(PLUGINS_DIR)) return [];
  try {
    return fs
      .readdirSync(PLUGINS_DIR)
      .filter((f) => f.endsWith(".jar") || f.endsWith(".jar.disabled"))
      .map((f) => ({ name: f, enabled: !f.endsWith(".disabled") }));
  } catch (e) {
    return [];
  }
}

// 3.14-) getSchedules
function getSchedules() {
  if (!fs.existsSync(SCHEDULES_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(SCHEDULES_FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

// 3.15-) [YENİ] Sistem RAM Bilgisi Hesaplama
function getSystemRamInfo() {
  try {
    const totalMemBytes = os.totalmem();
    const totalMemGB = Math.floor(totalMemBytes / (1024 * 1024 * 1024));

    // Max slider = Toplam RAM - 4GB. Eğer sistem RAM'i azsa en az 4 dönsün.
    const maxSliderValue = Math.max(4, totalMemGB - 4);

    return {
      totalRam: totalMemGB,
      maxSlider: maxSliderValue,
    };
  } catch (e) {
    // Hata olursa varsayılan 8 döndür
    return { totalRam: 16, maxSlider: 12 };
  }
}

// 3.16-) [YENİ] Java Sürümlerini Tarama
let cachedJavaList = [];
function getJavaVersionAsync(javaPath) {
  return new Promise((resolve) => {
    exec(`"${javaPath}" -version`, (error, stdout, stderr) => {
      const output = (stdout || "") + (stderr || "");
      const match = output.match(/(openjdk version|java version|openjdk|java)\s+"([^"]+)"/i);
      if (match && match[2]) {
        resolve(match[2]);
      } else {
        resolve(null);
      }
    });
  });
}

async function scanJavaVersions() {
  const javaList = [];

  // 1. Sistem varsayılanı java'yı ekle
  const defaultVersion = await getJavaVersionAsync("java");
  if (defaultVersion) {
    javaList.push({
      name: `Sistem Varsayılanı (${defaultVersion})`,
      path: "java",
      version: defaultVersion
    });
  } else {
    javaList.push({
      name: "Sistem Varsayılanı (java)",
      path: "java",
      version: "Bilinmiyor"
    });
  }

  // 2. Klasörleri tara (Windows)
  const searchDirs = [
    "C:\\Program Files\\Java",
    "C:\\Program Files (x86)\\Java"
  ];

  for (const baseDir of searchDirs) {
    if (fs.existsSync(baseDir)) {
      try {
        const folders = fs.readdirSync(baseDir);
        for (const folder of folders) {
          const javaBinPath = path.join(baseDir, folder, "bin", "java.exe");
          if (fs.existsSync(javaBinPath)) {
            if (!javaList.some(item => item.path.toLowerCase() === javaBinPath.toLowerCase())) {
              const version = await getJavaVersionAsync(javaBinPath);
              javaList.push({
                name: `${folder} (${version || 'Bilinmiyor'})`,
                path: javaBinPath,
                version: version || "Bilinmiyor"
              });
            }
          }
        }
      } catch (e) {
        console.error("Klasör tarama hatası: " + baseDir, e);
      }
    }
  }

  // 3. Registry'den ek tarama yapalım (Windows için)
  try {
    const registryPaths = await new Promise((resolve) => {
      const cmd = `powershell -command "Get-ItemProperty -Path 'HKLM:\\SOFTWARE\\JavaSoft\\JDK\\*', 'HKLM:\\SOFTWARE\\JavaSoft\\Java Runtime Environment\\*', 'HKLM:\\SOFTWARE\\JavaSoft\\Java Development Kit\\*' -ErrorAction SilentlyContinue | ForEach-Object { $_.JavaHome }"`;
      exec(cmd, (err, stdout) => {
        if (err || !stdout) return resolve([]);
        const pathsFound = stdout.split(/\r?\n/).map(p => p.trim()).filter(p => p.length > 0);
        resolve([...new Set(pathsFound)]); // Benzersiz yollar
      });
    });

    for (const jHome of registryPaths) {
      const javaBinPath = path.join(jHome, "bin", "java.exe");
      if (fs.existsSync(javaBinPath)) {
        if (!javaList.some(item => item.path.toLowerCase() === javaBinPath.toLowerCase())) {
          const version = await getJavaVersionAsync(javaBinPath);
          const folderName = path.basename(jHome);
          javaList.push({
            name: `${folderName} (${version || 'Registry'})`,
            path: javaBinPath,
            version: version || "Bilinmiyor"
          });
        }
      }
    }
  } catch (e) {
    console.error("Registry tarama hatası:", e);
  }

  return javaList;
}


// 4-) MULTER AYARLARI (DOSYA YÜKLEME)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(MC_SERVER_PATH))
        fs.mkdirSync(MC_SERVER_PATH, { recursive: true });
      cb(null, MC_SERVER_PATH);
    },
    filename: (req, file, cb) => cb(null, "server-icon.png"),
  }),
});

const uploadFile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      let relPath = req.query.path || "";
      relPath = relPath.replace(/\.\./g, "");
      const targetPath = path.join(MC_SERVER_PATH, relPath);
      if (!fs.existsSync(targetPath))
        fs.mkdirSync(targetPath, { recursive: true });
      cb(null, targetPath);
    },
    filename: (req, file, cb) => {
      file.originalname = Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      );
      cb(null, file.originalname);
    },
  }),
});

const uploadPlugin = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(PLUGINS_DIR))
        fs.mkdirSync(PLUGINS_DIR, { recursive: true });
      cb(null, PLUGINS_DIR);
    },
    filename: (req, file, cb) => cb(null, file.originalname),
  }),
});

// Resource Pack Klasörü
const RP_DIR = path.join(__dirname, "public", "resourcepacks");
if (!fs.existsSync(RP_DIR)) fs.mkdirSync(RP_DIR, { recursive: true });

// Resource Pack için Multer
const uploadRP = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, RP_DIR),
    filename: (req, file, cb) => cb(null, "server-resourcepack.zip"), // Sabit isimle kaydediyoruz
  }),
});

// 5-) ROUTE'LAR (API ENDPOINTS)

// --- [YENİ] DÜNYA YÖNETİCİSİ API ---
app.post("/api/worlds/upload", uploadWorld.single("world"), (req, res) => {
  if (!req.file) return res.json({ success: false, error: "Dosya yok." });
  try {
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(MC_SERVER_PATH, true);
    fs.unlinkSync(req.file.path);
    logAudit("Dünya", `Yeni dünya yüklendi: ${req.file.originalname}`);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.json({ success: false, error: "Zip açılamadı: " + e.message });
  }
});

app.get("/api/worlds/download/:name", (req, res) => {
  const worldName = req.params.name;
  const worldPath = path.join(MC_SERVER_PATH, worldName);
  if (!fs.existsSync(worldPath))
    return res.status(404).send("Dünya bulunamadı.");
  try {
    const zip = new AdmZip();
    zip.addLocalFolder(worldPath, worldName);
    const downloadName = `${worldName}_backup.zip`;
    const buffer = zip.toBuffer();
    res.set("Content-Type", "application/octet-stream");
    res.set("Content-Disposition", `attachment; filename=${downloadName}`);
    res.set("Content-Length", buffer.length);
    res.send(buffer);
  } catch (e) {
    res.status(500).send("Zipleme hatası: " + e.message);
  }
});

// 5.1-) İkon İşlemleri
app.get("/server-icon.png", (req, res) => {
  if (fs.existsSync(ICON_FILE)) res.sendFile(ICON_FILE);
  else res.status(404).send("Icon not found");
});

app.post("/api/upload-icon", upload.single("icon"), (req, res) => {
  logAudit("İkon", "Sunucu ikonu değiştirildi.");
  res.json({ success: true });
});

app.delete("/api/delete-icon", (req, res) => {
  if (fs.existsSync(ICON_FILE)) {
    fs.unlinkSync(ICON_FILE);
    logAudit("İkon", "İkon silindi.");
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// 5.2-) Plugin İşlemleri
app.post("/api/plugins/upload", uploadPlugin.array("files"), (req, res) => {
  logAudit("Plugin", "Yeni plugin yüklendi.");
  res.json({ success: true });
  io.emit("plugins-data", getPlugins());
});

app.get("/api/plugins/search", async (req, res) => {
  const query = (req.query.q || "").trim();
  const source = req.query.source || "all";

  const promises = [];

  if (source === "all" || source === "spigot") {
    promises.push((async () => {
      try {
        let url = "";
        let params = {};
        if (query) {
          url = `https://api.spiget.org/v2/search/resources/${encodeURIComponent(query)}`;
          params = { size: 12, fields: "id,name,tag,downloads,rating,icon" };
        } else {
          url = `https://api.spiget.org/v2/resources`;
          params = { size: 12, sort: "-downloads", fields: "id,name,tag,downloads,rating,icon" };
        }

        const response = await axios.get(url, {
          params: params,
          headers: { "User-Agent": "MC-WebPanel/3.0" },
        });

        if (Array.isArray(response.data)) {
          let mapped = response.data.map((item) => {
            const downloads = item.downloads || 0;
            let matchScore = 0;
            if (query) {
              const lowerName = item.name.toLowerCase();
              const lowerQ = query.toLowerCase();
              if (lowerName === lowerQ) matchScore = 1000000000;
              else if (lowerName.startsWith(lowerQ)) matchScore = 500000000;
              else if (lowerName.includes(lowerQ)) matchScore = 100000000;
            }
            return {
              id: item.id.toString(),
              name: item.name,
              tag: item.tag || "",
              downloads: downloads,
              rating: { average: item.rating ? (item.rating.average || 0.0) : 0.0 },
              icon: { url: (item.icon && item.icon.url) ? (item.icon.url.startsWith("http") ? item.icon.url : `https://www.spigotmc.org/${item.icon.url}`) : "https://static.spigotmc.org/img/spigot.png" },
              source: "spigot",
              score: matchScore + downloads
            };
          });

          if (query) {
            mapped = mapped.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
          }
          return mapped;
        }
      } catch (e) {
        console.error("Spiget arama hatası:", e.message);
      }
      return [];
    })());
  }

  if (source === "all" || source === "modrinth") {
    promises.push((async () => {
      try {
        let params = { facets: '[["project_type:plugin"]]', limit: 12 };
        if (query) {
          params.query = query;
        }

        const response = await axios.get(`https://api.modrinth.com/v2/search`, {
          params: params,
          headers: { "User-Agent": "MC-WebPanel/3.0" },
        });

        if (response.data && Array.isArray(response.data.hits)) {
          let mapped = response.data.hits.map((hit) => {
            const downloads = hit.downloads || 0;
            let matchScore = 0;
            if (query) {
              const lowerName = hit.title.toLowerCase();
              const lowerQ = query.toLowerCase();
              if (lowerName === lowerQ) matchScore = 1000000000;
              else if (lowerName.startsWith(lowerQ)) matchScore = 500000000;
              else if (lowerName.includes(lowerQ)) matchScore = 100000000;
            }
            return {
              id: hit.slug || hit.project_id,
              name: hit.title,
              tag: hit.description || "",
              downloads: downloads,
              rating: { average: 5.0 },
              icon: { url: hit.icon_url || "https://cdn.modrinth.com/assets/logo.svg" },
              source: "modrinth",
              score: matchScore + downloads
            };
          });

          if (query) {
            mapped = mapped.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
          }
          return mapped;
        }
      } catch (e) {
        console.error("Modrinth arama hatası:", e.message);
      }
      return [];
    })());
  }

  if (source === "all" || source === "devbukkit") {
    promises.push((async () => {
      try {
        let params = { gameId: 432, classId: 5, pageSize: 12 };
        if (query) {
          params.searchFilter = query;
        } else {
          params.sortField = 2; // Popularity
          params.sortOrder = "desc";
        }

        const response = await axios.get(`https://api.curse.tools/v1/cf/mods/search`, {
          params: params,
          headers: { "User-Agent": "MC-WebPanel/3.0" },
        });

        if (response.data && Array.isArray(response.data.data)) {
          let mapped = response.data.data.map((item) => {
            const downloads = item.downloadCount || 0;
            let matchScore = 0;
            if (query) {
              const lowerName = item.name.toLowerCase();
              const lowerQ = query.toLowerCase();
              if (lowerName === lowerQ) matchScore = 1000000000;
              else if (lowerName.startsWith(lowerQ)) matchScore = 500000000;
              else if (lowerName.includes(lowerQ)) matchScore = 100000000;
            }
            return {
              id: item.id.toString(),
              name: item.name,
              tag: item.summary || "",
              downloads: downloads,
              rating: { average: 5.0 },
              icon: { url: (item.logo && item.logo.thumbnailUrl) ? item.logo.thumbnailUrl : "https://dev.bukkit.org/assets/images/favicon.ico" },
              source: "devbukkit",
              score: matchScore + downloads
            };
          });

          if (query) {
            mapped = mapped.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
          }
          return mapped;
        }
      } catch (e) {
        console.error("DevBukkit arama hatası:", e.message);
      }
      return [];
    })());
  }

  try {
    const results = await Promise.all(promises);
    let merged = [];
    results.forEach((r) => { merged = merged.concat(r); });
    merged.sort((a, b) => b.score - a.score);
    res.json(merged);
  } catch (err) {
    console.error("Arama birleştirme hatası:", err);
    res.json([]);
  }
});

app.post("/api/plugins/install-remote", async (req, res) => {
  const { id, name, source } = req.body;
  if (!id) return res.json({ success: false, error: "ID eksik." });
  const activeSource = source || "modrinth";

  if (activeSource === "modrinth") {
    try {
      const versionRes = await axios.get(
        `https://api.modrinth.com/v2/project/${id}/version`,
        { headers: { "User-Agent": "MC-WebPanel/3.0" } }
      );
      if (!versionRes.data || versionRes.data.length === 0)
        return res.json({ success: false, error: "Sürüm yok." });
      const latestVersion = versionRes.data[0];
      const primaryFile =
        latestVersion.files.find((f) => f.primary) || latestVersion.files[0];
      const targetPath = path.join(PLUGINS_DIR, primaryFile.filename);
      const writer = fs.createWriteStream(targetPath);
      const response = await axios({
        url: primaryFile.url,
        method: "GET",
        responseType: "stream",
      });
      response.data.pipe(writer);
      writer.on("finish", () => {
        logAudit("Plugin", `Marketten kuruldu (Modrinth): ${primaryFile.filename}`);
        io.emit("plugins-data", getPlugins());
        res.json({ success: true });
      });
      writer.on("error", () =>
        res.json({ success: false, error: "Yazma hatası." })
      );
    } catch (e) {
      res.json({ success: false, error: "İndirme başarısız." });
    }
  } else if (activeSource === "spigot") {
    try {
      const downloadUrl = `https://api.spiget.org/v2/resources/${id}/download`;
      const response = await axios({
        url: downloadUrl,
        method: "GET",
        responseType: "stream",
        headers: { "User-Agent": "MC-WebPanel/3.0" }
      });

      let filename = `${name.replace(/[^a-zA-Z0-9_\.-]/g, "_")}.jar`;
      const disposition = response.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const targetPath = path.join(PLUGINS_DIR, filename);
      const writer = fs.createWriteStream(targetPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        logAudit("Plugin", `Marketten kuruldu (SpigotMC): ${filename}`);
        io.emit("plugins-data", getPlugins());
        res.json({ success: true });
      });
      writer.on("error", () =>
        res.json({ success: false, error: "Yazma hatası." })
      );
    } catch (e) {
      console.error("Spigot eklenti indirme hatası:", e.message);
      res.json({ success: false, error: "İndirme başarısız veya eklenti harici bir bağlantı gerektiriyor." });
    }
  } else if (activeSource === "devbukkit") {
    try {
      const filesRes = await axios.get(
        `https://api.curse.tools/v1/cf/mods/${id}/files`,
        { headers: { "User-Agent": "MC-WebPanel/3.0" } }
      );
      if (!filesRes.data || !Array.isArray(filesRes.data.data) || filesRes.data.data.length === 0)
        return res.json({ success: false, error: "Sürüm yok." });
      
      const latestFile = filesRes.data.data[0];
      const targetPath = path.join(PLUGINS_DIR, latestFile.fileName);
      const writer = fs.createWriteStream(targetPath);
      
      const response = await axios({
        url: latestFile.downloadUrl,
        method: "GET",
        responseType: "stream",
      });
      response.data.pipe(writer);
      
      writer.on("finish", () => {
        logAudit("Plugin", `Marketten kuruldu (DevBukkit): ${latestFile.fileName}`);
        io.emit("plugins-data", getPlugins());
        res.json({ success: true });
      });
      writer.on("error", () =>
        res.json({ success: false, error: "Yazma hatası." })
      );
    } catch (e) {
      console.error("DevBukkit eklenti indirme hatası:", e.message);
      res.json({ success: false, error: "İndirme başarısız." });
    }
  } else {
    res.json({ success: false, error: "Bilinmeyen kaynak." });
  }
});

app.post("/api/plugins/toggle", (req, res) => {
  const { name } = req.body;
  const oldPath = path.join(PLUGINS_DIR, name);
  let newPath = "";
  if (name.endsWith(".jar")) newPath = oldPath + ".disabled";
  else if (name.endsWith(".disabled"))
    newPath = oldPath.replace(".disabled", "");
  else return res.json({ success: false });
  try {
    fs.renameSync(oldPath, newPath);
    logAudit("Plugin", `${name} durumu değiştirildi.`);
    res.json({ success: true });
    io.emit("plugins-data", getPlugins());
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.delete("/api/plugins/delete", (req, res) => {
  try {
    fs.unlinkSync(path.join(PLUGINS_DIR, req.body.name));
    res.json({ success: true });
    io.emit("plugins-data", getPlugins());
  } catch (e) {
    res.json({ success: false });
  }
});

// 5.3-) Dosya Yönetimi
app.get("/api/files/list", (req, res) => {
  let relPath = req.query.path || "";
  if (relPath.includes("..")) return res.status(403).json({ error: "Yasak" });
  const targetDir = path.join(MC_SERVER_PATH, relPath);
  if (!fs.existsSync(targetDir))
    return res.status(404).json({ error: "Klasör yok" });
  fs.readdir(targetDir, { withFileTypes: true }, (err, items) => {
    if (err) return res.status(500).json({ error: "Hata" });
    const files = items.map((item) => {
      const itemPath = path.join(targetDir, item.name);
      let size = 0;
      try {
        size = fs.statSync(itemPath).size;
      } catch (e) { }
      return {
        name: item.name,
        isDir: item.isDirectory(),
        size: size,
        path: path.join(relPath, item.name).replace(/\\/g, "/"),
      };
    });
    files.sort((a, b) => (a.isDir === b.isDir ? 0 : a.isDir ? -1 : 1));
    res.json(files);
  });
});

app.get("/api/files/read", (req, res) => {
  let relPath = req.query.path || "";
  if (relPath.includes("..")) return res.status(403).send("Yasak");
  const target = path.join(MC_SERVER_PATH, relPath);
  if (!fs.existsSync(target)) return res.status(404).send("Yok");
  try {
    res.send(fs.readFileSync(target, "utf8"));
  } catch (e) {
    res.status(500).send("Hata");
  }
});

app.post("/api/files/save", (req, res) => {
  const { path: relPath, content } = req.body;
  if (!relPath || relPath.includes(".."))
    return res.status(403).json({ error: "Yasak" });
  try {
    fs.writeFileSync(path.join(MC_SERVER_PATH, relPath), content, "utf8");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/files/create", (req, res) => {
  const { type, name, currentPath } = req.body;
  let safePath = (currentPath || "").replace(/\.\./g, "");
  const target = path.join(MC_SERVER_PATH, safePath, name);
  try {
    if (type === "dir") {
      if (!fs.existsSync(target)) fs.mkdirSync(target);
    } else {
      if (!fs.existsSync(target)) fs.writeFileSync(target, "");
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/files/delete", (req, res) => {
  const relPath = req.query.path;
  if (!relPath || relPath.includes(".."))
    return res.status(403).json({ error: "Yasak" });
  const target = path.join(MC_SERVER_PATH, relPath);
  try {
    if (fs.lstatSync(target).isDirectory())
      fs.rmSync(target, { recursive: true, force: true });
    else fs.unlinkSync(target);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/files/upload", uploadFile.array("files"), (req, res) =>
  res.json({ success: true })
);

// 5.4-) Yedekleme Sistemi
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR);

app.get("/api/backups/list", (req, res) => {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) return res.json([]);
    const backups = files
      .filter((f) => f.endsWith(".zip"))
      .map((f) => {
        try {
          const stat = fs.statSync(path.join(BACKUP_DIR, f));
          return {
            name: f,
            size: (stat.size / 1024 / 1024).toFixed(2) + " MB",
            date: stat.mtime.toLocaleString("tr-TR"),
          };
        } catch (e) {
          return null;
        }
      })
      .filter((x) => x !== null)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(backups);
  });
});

app.post("/api/backups/create", (req, res) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `backup-${timestamp}.zip`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  if (mcProcess) {
    mcProcess.stdin.write("say [Panel] Yedekleme basliyor...\n");
    mcProcess.stdin.write("save-off\n");
    mcProcess.stdin.write("save-all flush\n");
  }
  setTimeout(() => {
    try {
      const zip = new AdmZip();
      fs.readdirSync(MC_SERVER_PATH, { withFileTypes: true }).forEach(
        (dirent) => {
          if (dirent.isDirectory()) {
            if (dirent.name.startsWith("world") || dirent.name === "plugins") {
              zip.addLocalFolder(
                path.join(MC_SERVER_PATH, dirent.name),
                dirent.name,
                (filename) => {
                  if (filename.includes("session.lock")) return false;
                  if (filename.includes("cache")) return false;
                  return true;
                }
              );
            }
          }
        }
      );
      fs.readdirSync(MC_SERVER_PATH).forEach((file) => {
        const fullPath = path.join(MC_SERVER_PATH, file);
        if (fs.lstatSync(fullPath).isFile()) {
          if (
            file.endsWith(".properties") ||
            file.endsWith(".json") ||
            file.endsWith(".yml") ||
            file.endsWith(".yaml")
          ) {
            zip.addLocalFile(fullPath);
          }
        }
      });
      zip.writeZip(backupPath);
      logAudit("Yedek", "Yeni yedek oluşturuldu.");
      res.json({ success: true, name: backupName });
    } catch (e) {
      res.json({ success: false, error: e.message });
    } finally {
      if (mcProcess) {
        mcProcess.stdin.write("save-on\n");
        mcProcess.stdin.write("say [Panel] Yedekleme tamamlandi.\n");
      }
    }
  }, 2000);
});

app.delete("/api/backups/delete/:name", (req, res) => {
  const filePath = path.join(BACKUP_DIR, req.params.name);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false });
    }
  } else {
    res.json({ success: false });
  }
});

app.get("/api/backups/download/:name", (req, res) => {
  const filePath = path.join(BACKUP_DIR, req.params.name);
  if (fs.existsSync(filePath)) res.download(filePath);
  else res.status(404).send("Dosya yok");
});

app.post("/api/backups/restore/:name", (req, res) => {
  const filePath = path.join(BACKUP_DIR, req.params.name);
  if (!fs.existsSync(filePath))
    return res.json({ success: false, error: "Yedek bulunamadı" });
  if (mcProcess)
    return res.json({
      success: false,
      error: "Sunucu açıkken geri yüklenemez!",
    });
  try {
    const zip = new AdmZip(filePath);
    zip.extractAllTo(MC_SERVER_PATH, true);
    logAudit("Yedek", "Geri yükleme yapıldı.");
    res.json({ success: true });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// 5.5-) Menü API
app.get("/api/menu", (req, res) => {
  const pagesDir = path.join(__dirname, "public/pages");
  const nameMap = {
    dashboard: "Ana Sayfa",
    players: "Oyuncular",
    banned: "Ban Listesi",
    ops: "Yöneticiler",
    files: "Dosyalar",
    plugins: "Eklentiler",
    console: "Konsol",
    schedules: "Zamanlayıcılar",
    audit: "Denetim Kaydı",
    discord: "Discord",
    settings: "Ayarlar",
    worlds: "Dünyalar",
    backups: "Yedekler",
  };
  fs.readdir(pagesDir, (err, files) => {
    if (err) return res.json([]);
    const menuItems = files
      .filter((f) => f.endsWith(".html"))
      .map((f) => {
        const id = f.replace(".html", "");
        return { id: id, name: nameMap[id] || id.toUpperCase(), file: f };
      });
    const order = [
      "settings",
      "console",
      "discord",
      "audit",
      "players",
      "software",
      "plugins",
      "schedules",
      "files",
      "worlds",
      "backups",
    ];
    menuItems.sort((a, b) => {
      let ia = order.indexOf(a.id);
      let ib = order.indexOf(b.id);
      if (ia === -1) ia = 99;
      if (ib === -1) ib = 99;
      return ia - ib;
    });
    res.json(menuItems);
  });
});

// 5.6-) YAZILIM YÖNETİCİSİ
app.get("/api/software/list", async (req, res) => {
  const type = req.query.type || "paper"; // paper, spigot, craftbukkit
  try {
    const response = await axios.get(
      "https://fill.papermc.io/v3/projects/paper",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      }
    );
    const allVersionsMap = response.data.versions;
    const allVersionsList = [];
    for (const group in allVersionsMap) {
      allVersionsList.push(...allVersionsMap[group]);
    }

    const groups = {};
    allVersionsList.forEach((v) => {
      if (!/^\d+\.\d+(\.\d+)?(-[a-zA-Z0-9.]+)?$/.test(v)) return;
      const parts = v.split('-')[0].split('.').map(Number);

      // Spigot/CraftBukkit için sadece Minecraft 1.x.x sürümleri geçerlidir (Paper 26.x gibi sürümleri hariç tut).
      if ((type === "spigot" || type === "craftbukkit") && parts[0] !== 1) return;

      if (parts[0] === 1 && parts[1] < 8) return;

      const baseVersion = v.split('-')[0];
      const isStable = !v.includes('-');

      if (!groups[baseVersion]) {
        groups[baseVersion] = v;
      } else {
        const currentIsStable = !groups[baseVersion].includes('-');
        if (isStable && !currentIsStable) {
          groups[baseVersion] = v; // Stable olan unstable olanı ezer.
        } else if (!isStable && !currentIsStable) {
          groups[baseVersion] = v; // İkisi de unstable ise en günceli tutulur.
        }
      }
    });

    const sortedVersions = Object.values(groups).sort((a, b) => {
      const cleanA = a.split('-')[0];
      const cleanB = b.split('-')[0];
      const partsA = cleanA.split('.').map(Number);
      const partsB = cleanB.split('.').map(Number);

      const len = Math.max(partsA.length, partsB.length);
      for (let i = 0; i < len; i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA !== numB) {
          return numB - numA; // En yeni en üstte
        }
      }
      return b.localeCompare(a);
    });

    const formattedList = sortedVersions.map((v) => ({
      version: v,
      type: type === "paper" ? "Paper" : type === "spigot" ? "Spigot" : "CraftBukkit",
      stable: !v.includes('-')
    }));
    res.json(formattedList);
  } catch (error) {
    res.json([]);
  }
});

app.post("/api/software/install", async (req, res) => {
  const version = req.body.version;
  const type = req.body.type || "paper"; // paper, spigot, craftbukkit
  if (!version) return res.json({ success: false, error: "Sürüm seçilmedi." });
  if (mcProcess)
    return res.json({
      success: false,
      error: "Sunucu açıkken kurulum yapılamaz!",
    });
  try {
    let downloadUrl = "";
    if (type === "paper") {
      const buildRes = await axios.get(
        `https://fill.papermc.io/v3/projects/paper/versions/${version}/builds`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        }
      );
      const builds = buildRes.data;
      const latestBuild = builds[builds.length - 1];
      downloadUrl = latestBuild.downloads["server:default"].url;
    } else if (type === "spigot") {
      downloadUrl = `https://cdn.getbukkit.org/spigot/spigot-${version}.jar`;
    } else if (type === "craftbukkit") {
      downloadUrl = `https://cdn.getbukkit.org/craftbukkit/craftbukkit-${version}.jar`;
    }

    if (!downloadUrl) throw new Error("İndirme adresi bulunamadı.");

    if (!fs.existsSync(MC_SERVER_PATH)) {
      fs.mkdirSync(MC_SERVER_PATH, { recursive: true });
    }
    const targetPath = path.join(MC_SERVER_PATH, JAR_NAME);
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    const writer = fs.createWriteStream(targetPath);
    const response = await axios({
      url: downloadUrl,
      method: "GET",
      responseType: "stream",
    });
    const totalLength = response.headers["content-length"];
    let downloadedLength = 0;
    response.data.on("data", (chunk) => {
      downloadedLength += chunk.length;
      if (totalLength) {
        const progress = ((downloadedLength / totalLength) * 100).toFixed(0);
        io.emit("install-progress", progress);
      }
    });
    response.data.pipe(writer);
    writer.on("finish", () => {
      const typeName = type === "paper" ? "Paper" : type === "spigot" ? "Spigot" : "CraftBukkit";
      logAudit("Yazılım", `${typeName} ${version} kuruldu.`);
      savePanelConfig({ serverType: typeName, serverVersion: version });
      try {
        fs.writeFileSync(path.join(MC_SERVER_PATH, "eula.txt"), "eula=true\n");
      } catch (e) { }
      res.json({ success: true });
      setTimeout(() => {
        startServerFunc();
      }, 1500);
    });
    writer.on("error", () =>
      res.json({ success: false, error: "Dosya yazma hatası." })
    );
  } catch (error) {
    res.json({ success: false, error: "İndirme başarısız." });
  }
});

app.get("/api/check-setup", (req, res) => {
  const isInstalled = fs.existsSync(path.join(MC_SERVER_PATH, JAR_NAME));
  res.json({ installed: isInstalled });
});

// 5.7-) ResourcePack
// --- RESOURCE PACK İŞLEMLERİ ---

// 1. Yükleme ve Hash Hesaplama
app.post("/api/upload-rp", uploadRP.single("pack"), (req, res) => {
  if (!req.file) return res.json({ success: false, error: "Dosya yok." });

  try {
    const filePath = path.join(RP_DIR, "server-resourcepack.zip");
    const fileBuffer = fs.readFileSync(filePath);

    // SHA1 Hash Hesapla
    const shasum = crypto.createHash('sha1');
    shasum.update(fileBuffer);
    const sha1 = shasum.digest('hex');

    // İndirme Linkini Oluştur (Sunucunun o anki host adresi üzerinden)
    // Not: Eğer panel ve oyun sunucusu aynı IP'deyse bu çalışır.
    // req.headers.host "localhost:3000" veya "192.168.1.5:3000" gibi döner.
    const downloadUrl = `http://${req.headers.host}/resourcepacks/server-resourcepack.zip`;

    // server.properties Güncelle
    const props = getProperties();
    props['resource-pack'] = downloadUrl;
    props['resource-pack-sha1'] = sha1;
    saveProperties(props);

    logAudit("Ayarlar", "Yeni kaynak paketi yüklendi.");
    res.json({ success: true, sha1: sha1 });

  } catch (e) {
    console.error(e);
    res.json({ success: false, error: "İşlem sırasında hata oluştu." });
  }
});

// 2. Silme
app.delete("/api/delete-rp", (req, res) => {
  const filePath = path.join(RP_DIR, "server-resourcepack.zip");
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);

      // Properties'den kaldır
      const props = getProperties();
      props['resource-pack'] = "";
      props['resource-pack-sha1'] = "";
      saveProperties(props);

      logAudit("Ayarlar", "Kaynak paketi silindi.");
      res.json({ success: true });
    } catch (e) {
      res.json({ success: false, error: e.message });
    }
  } else {
    res.json({ success: false, error: "Paket bulunamadı." });
  }
});

// 3. Durum Kontrolü (Sayfa açılınca dolu mu boş mu görelim)
app.get("/api/check-rp", (req, res) => {
  const filePath = path.join(RP_DIR, "server-resourcepack.zip");
  const exists = fs.existsSync(filePath);
  res.json({ exists: exists });
});

// 6-) ZAMANLAYICI
let activeCronJobs = [];
function loadSchedules() {
  activeCronJobs.forEach((job) => job.stop());
  activeCronJobs = [];
  const schedules = getSchedules();
  schedules.forEach((task) => {
    if (task.enabled && cron.validate(task.cron)) {
      const job = cron.schedule(task.cron, () => {
        console.log(`[Zamanlayıcı] Görev: ${task.name}`);
        io.emit("log", `🕒 Zamanlayıcı: ${task.name} çalıştırılıyor...`);
        if (task.action === "command" && mcProcess) {
          mcProcess.stdin.write(task.payload + "\n");
        } else if (task.action === "restart" || task.action === "start") {
          startServerFunc();
        } else if (task.action === "stop" && mcProcess) {
          mcProcess.stdin.write("stop\n");
        }
      });
      activeCronJobs.push(job);
    }
  });
}

// 7-) GLOBAL SUNUCU BAŞLATMA
function startServerFunc() {
  if (mcProcess) return;
  const config = getPanelConfig();
  if (!fs.existsSync(path.join(MC_SERVER_PATH, JAR_NAME))) {
    io.emit("log", `❌ HATA: ${JAR_NAME} dosyası bulunamadı!`);
    return;
  }
  io.emit("status", "starting");
  const conf = getDiscordConfig();
  if (conf.optStatus) sendDiscord("🟢 Sunucu başlatılıyor...", "event");

  // Panelden başlatıldığı için source="Panel", type="panel" (Varsayılanlar)
  logAudit("Sunucu", "Sunucu başlatıldı.");

  // Hangi java kullanılacak?
  let javaExecutable = "java";
  if (config.javaPath && config.javaPath !== "java") {
    if (fs.existsSync(config.javaPath)) {
      javaExecutable = config.javaPath;
    } else {
      io.emit("log", `⚠️ UYARI: Seçilen Java yolu bulunamadı (${config.javaPath}). Sistem varsayılanı kullanılıyor.`);
    }
  }

  let javaLogName = "Sistem Varsayılanı";
  if (javaExecutable !== "java") {
    try {
      javaLogName = path.basename(path.dirname(path.dirname(javaExecutable)));
    } catch (e) {
      javaLogName = javaExecutable;
    }
  }

  io.emit("log", `🚀 Başlatılıyor (${config.ramMax}) | Java: ${javaLogName}...`);

  onlinePlayers = [];
  correctPid = null;
  try {
    mcProcess = spawn(
      javaExecutable,
      [
        `-Xms${config.ramMin}`,
        `-Xmx${config.ramMax}`,
        "-jar",
        JAR_NAME,
        "nogui",
      ],
      { cwd: MC_SERVER_PATH }
    );

    if (mcProcess.stdin) {
      mcProcess.stdin.on("error", (err) => {
        // Sunucu kapanırken veya kapandığında EPIPE hatası oluşabilir, bunu yakalayıp çökmeyi önlüyoruz.
        console.warn("mcProcess.stdin hatası (EPIPE yok sayıldı):", err.message);
      });
    }

    mcProcess.on("error", (err) => {
      io.emit("log", `❌ HATA: Sunucu süreci hatası: ${err.message}`);
    });

    // --- KONSOL ÇIKTILARINI DİNLEME ---
    mcProcess.stdout.on("data", (data) => {
      const line = data.toString();
      io.emit("console-out", line);
      const dConf = getDiscordConfig();

      // [YENİ] OYUN İÇİ KOMUTLARI YAKALAMA VE AUDIT'E KAYDETME
      if (line.includes("issued server command:")) {
        try {
          // Regex: ": <OyuncuAdı> issued server command: </komut>"
          // Örnek Log: [12:00:00 INFO]: Kerem issued server command: /gamemode creative
          const regex = /:\s(.*?)\sissued\sserver\scommand:\s(\/.*)/;
          const match = line.match(regex);

          if (match) {
            const playerName = match[1]; // Oyuncunun Adı
            const command = match[2]; // Yazdığı Komut

            // logAudit(Action, Details, Source, Type)
            logAudit("Oyun Komutu", command, playerName, "game");
          }
        } catch (e) {
          console.error("Log parse hatası:", e);
        }
      }
      // -------------------------------------------------------

      if (line.includes("<") && line.includes(">")) {
        if (dConf.optChat) sendDiscord(`**[Chat]** ${line.trim()}`, "chat");
      }
      if (line.includes("joined the game")) {
        const n = line.split(":").pop().replace(" joined the game", "").trim();
        if (n && !onlinePlayers.includes(n)) onlinePlayers.push(n);
        if (dConf.optJoins) sendDiscord(`➕ **${n}** oyuna katıldı.`, "event");
      }
      if (line.includes("left the game")) {
        const n = line.split(":").pop().replace(" left the game", "").trim();
        onlinePlayers = onlinePlayers.filter((p) => p !== n);
        if (dConf.optJoins)
          sendDiscord(`➖ **${n}** oyundan ayrıldı.`, "event");
      }
      if (
        dConf.optDeaths &&
        (line.includes("slain by") ||
          line.includes("drowned") ||
          line.includes("fell from") ||
          line.includes("blown up"))
      ) {
        sendDiscord(`💀 ${line.split("]: ")[1] || line}`, "event");
      }
      if (dConf.optAdv && line.includes("has made the advancement")) {
        sendDiscord(`🏆 ${line.split("]: ")[1] || line}`, "event");
      }
      // TPS Logunu Yakalama
      if (line.includes("TPS from last")) {
        try {
          const tpsRegex = /TPS from last 1m, 5m, 15m:\s*\*?([\d\.]+)/;
          const match = line.match(tpsRegex);
          if (match && match[1]) {
            const parsedTps = parseFloat(match[1]);
            if (!isNaN(parsedTps)) currentTps = parsedTps;
          }
        } catch (e) {}
      }

      if (line.includes("Done") || line.includes("For help")) {
        io.emit("status", "online");
        serverStartTime = Date.now();
        // TPS Sorgulama döngüsünü başlat
        if (!tpsInterval) {
          tpsInterval = setInterval(() => {
            if (mcProcess && mcProcess.stdin) {
              try {
                mcProcess.stdin.write("tps\n");
              } catch (e) {}
            }
          }, 15000);
        }
      }
    });

    mcProcess.stderr.on("data", (data) =>
      io.emit("console-out", `ERR: ${data.toString()}`)
    );

    mcProcess.on("close", (code) => {
      serverStartTime = null;
      currentTps = 20.0;
      serverStatsHistory = [];
      if (tpsInterval) {
        clearInterval(tpsInterval);
        tpsInterval = null;
      }
      // Sunucu kapandıktan hemen sonra diske yazılan hatalı UUID'leri temizle
      cleanOpsJson();

      io.emit("log", `🛑 Sunucu Kapandı. Çıkış Kodu: ${code}`);
      io.emit("status", "offline");

      const dConf = getDiscordConfig();
      if (dConf.optStatus)
        sendDiscord(`🔴 Sunucu kapandı. (Kod: ${code})`, "event");

      logAudit("Sunucu", `Sunucu kapandı (Kod: ${code}).`);

      // --- [YENİ] AUTO RESTART MANTIĞI ---
      const currentConfig = getPanelConfig(); // Config'i taze oku

      // Eğer manuel durdurulmadıysa VE çıkış kodu 0 değilse (hata varsa) VE ayar açıksa
      // Not: Bazen normal kapanışta bile kod 0 olmayabilir, o yüzden isManualStop çok önemli.
      if (!isManualStop && currentConfig.autoRestart === true) {
        io.emit(
          "log",
          "⚠️ OTO-RESTART: Sunucu beklenmedik şekilde kapandı! 10 saniye içinde yeniden başlatılıyor..."
        );

        setTimeout(() => {
          io.emit("log", "🔄 Otomatik yeniden başlatma başlatılıyor...");
          startServerFunc();
        }, 10000); // 10 Saniye bekle
      }

      isManualStop = false; // Bayrağı sıfırla
      // ------------------------------------

      if (correctPid)
        try {
          pidusage.unmonitor(correctPid);
        } catch (e) { }
      mcProcess = null;
      onlinePlayers = [];
    });
  } catch (error) {
    io.emit("log", `Hata: ${error.message}`);
  }
}

let mcProcess = null;
let correctPid = null;
let onlinePlayers = [];
loadSchedules();

// --- ASENKRON DİSK VE DÜNYA BOYUTU SORGULARI ---
function updateDiskAndWorldStats() {
  const webpanelPath = path.resolve(__dirname);
  const diskCmd = `powershell -command "Get-ChildItem -Path '${webpanelPath}','${MC_SERVER_PATH}' -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum | ForEach-Object { $_.Sum }"`;
  
  exec(diskCmd, (err, stdout) => {
    if (!err && stdout) {
      const sumBytes = parseInt(stdout.trim());
      if (!isNaN(sumBytes)) {
        const sizeGB = (sumBytes / (1024 * 1024 * 1024)).toFixed(2); // GB
        diskDataCache.totalDisk = sizeGB;
        diskDataCache.usedDisk = sizeGB;
        diskDataCache.diskPercent = 100;
      }
    }
  });

  try {
    const props = getProperties();
    const levelName = props['level-name'] || 'world';
    const worldPath = path.join(MC_SERVER_PATH, levelName);
    const netherPath = path.join(MC_SERVER_PATH, `${levelName}_nether`);
    const endPath = path.join(MC_SERVER_PATH, `${levelName}_the_end`);

    let pathsToMeasure = [];
    if (fs.existsSync(worldPath)) pathsToMeasure.push(`'${worldPath}'`);
    if (fs.existsSync(netherPath)) pathsToMeasure.push(`'${netherPath}'`);
    if (fs.existsSync(endPath)) pathsToMeasure.push(`'${endPath}'`);

    if (pathsToMeasure.length > 0) {
      const cmd = `powershell -command "Get-ChildItem -Path ${pathsToMeasure.join(',')} -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum | ForEach-Object { $_.Sum }"`;
      exec(cmd, (err, stdout) => {
        if (!err && stdout) {
          const sumBytes = parseInt(stdout.trim());
          if (!isNaN(sumBytes)) {
            diskDataCache.worldSize = (sumBytes / (1024 * 1024)).toFixed(1); // MB
          }
        }
      });
    }
  } catch (e) {
    console.error("Dünya boyutu hesaplama hatası:", e);
  }
}

// Her 30 saniyede bir çalıştır
setInterval(updateDiskAndWorldStats, 30000);
// İlk çalıştırma
setTimeout(updateDiskAndWorldStats, 5000);

function pushStatsToHistory(stats) {
  if (!mcProcess) return;
  serverStatsHistory.push({
    cpu: stats.cpu,
    ram: stats.ram,
    max: stats.max,
    time: new Date().toLocaleTimeString("tr-TR")
  });
  if (serverStatsHistory.length > 150) {
    serverStatsHistory.shift();
  }
}

// 8-) İSTATİSTİK DÖNGÜSÜ
setInterval(() => {
  const cOps = getOps();

  // [YENİ] Config'den o anki Max RAM ayarını alıp MB'a çeviriyoruz
  // Böylece Dashboard'da % hesaplaması doğru yapılır (Örn: 16GB ayarlıysa 16384 MB üzerinden hesaplar)
  const conf = getPanelConfig();
  const maxRamMB = conf.ramMax ? parseInt(conf.ramMax) * 1024 : 4096;

  // 'max' parametresini ekledik
  let statsData = { cpu: 0, ram: 0, max: maxRamMB, players: onlinePlayers, ops: cOps, uptime: serverStartTime ? Math.floor((Date.now() - serverStartTime) / 1000) : 0, tps: currentTps, disk: diskDataCache };

  if (!mcProcess) {
    correctPid = null;
    onlinePlayers = [];
    io.emit("server-stats", { ...statsData, players: [], ops: cOps });
    return;
  }

  if (!correctPid) {
    const cmd = `powershell -command "Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like '*${JAR_NAME}*' } | Sort-Object WorkingSetSize -Descending | Select-Object -First 1 | ForEach-Object { $_.ProcessId.ToString() + ' ' + $_.WorkingSetSize.ToString() }"`;
    exec(cmd, (e, out) => {
      if (!e && out && out.trim()) {
        const p = out.trim().split(" ");
        if (p.length === 2) {
          const pid = parseInt(p[0]);
          const b = parseInt(p[1]);
          if (!isNaN(pid) && !isNaN(b)) {
            const mb = (b / 1048576).toFixed(0);
            pidusage(pid, (err, s) => {
              let cpu = 0;
              if (!err && s) cpu = (s.cpu / CPU_CORE_COUNT).toFixed(1);
              if (cpu > 100) cpu = 100;
              statsData.cpu = cpu;
              statsData.ram = mb;
              pushStatsToHistory(statsData);
              // statsData içinde artık 'max' verisi de var, frontend bunu kullanacak
              io.emit("server-stats", statsData);
            });
            correctPid = pid;
          }
        }
      } else {
        pushStatsToHistory(statsData);
        io.emit("server-stats", statsData);
      }
    });
  } else {
    pidusage(correctPid, (e, s) => {
      if (e) {
        correctPid = null;
        pushStatsToHistory(statsData);
        io.emit("server-stats", statsData);
        return;
      }
      if (s) {
        let cpu = (s.cpu / CPU_CORE_COUNT).toFixed(1);
        if (cpu > 100) cpu = 100;
        statsData.cpu = cpu;
        statsData.ram = (s.memory / 1048576).toFixed(0);
        pushStatsToHistory(statsData);
        // statsData içinde artık 'max' verisi de var, frontend bunu kullanacak
        io.emit("server-stats", statsData);
      }
    });
  }
}, 2000);

// 9-) SOCKET.IO BAĞLANTILARI
io.on("connection", (socket) => {
  socket.on("get-system-info", () => {
    const info = getSystemRamInfo();
    socket.emit("sistem-bilgileri", info);
  });

  socket.on("get-stats-history", () => {
    socket.emit("stats-history-data", serverStatsHistory);
  });

  socket.emit("status", mcProcess ? "online" : "offline");
  socket.emit("log-history", getLatestLogs(200));
  socket.on("get-java-list", () => {
    socket.emit("java-list-data", cachedJavaList);
  });
  socket.on("refresh-java-list", async () => {
    const list = await scanJavaVersions();
    cachedJavaList = list;
    io.emit("java-list-data", cachedJavaList);
    socket.emit("log", "🔄 Java sürümleri başarıyla yenilendi.");
    socket.emit("refresh-java-success"); // Arayüze bittiğini haber vermek için
  });
  socket.on("get-settings", () => {
    const c = getPanelConfig(); // config.json'u oku
    const p = getProperties();
    socket.emit("settings-data", {
      ram: c.ramMax ? c.ramMax.replace("G", "") : "4",
      config: c,
      props: p,
      info: {
        type: c.serverType || "Bilinmiyor",
        version: c.serverVersion || "-",
      },
    });
  });
  // AYARLARI KAYDETME VE DETAYLI LOGLAMA (GÜNCELLENDİ)
  socket.on("save-settings", (d) => {
    // 1. Eski Ayarları Yedekle
    const oldConfig = getPanelConfig();
    const oldProps = getProperties();
    let changes = []; // Değişiklikleri burada toplayacağız

    // [YENİ] Java Sürümü Değişimi
    if (d.javaPath !== undefined) {
      const oldJava = oldConfig.javaPath || "java";
      const newJava = d.javaPath;
      if (oldJava !== newJava) {
        let oldDisplay = "Sistem Varsayılanı";
        let newDisplay = "Sistem Varsayılanı";
        if (oldJava !== "java") {
          try {
            oldDisplay = path.basename(path.dirname(path.dirname(oldJava)));
          } catch (e) { oldDisplay = oldJava; }
        }
        if (newJava !== "java") {
          try {
            newDisplay = path.basename(path.dirname(path.dirname(newJava)));
          } catch (e) { newDisplay = newJava; }
        }
        changes.push(`<b>Java Sürümü:</b> ${oldDisplay} ➝ ${newDisplay}`);
        savePanelConfig({ javaPath: d.javaPath });
      }
    }

    // 2. RAM Karşılaştırması
    if (d.ram) {
      const oldRam = oldConfig.ramMax ? oldConfig.ramMax.replace("G", "") : "?";
      const newRam = d.ram;

      if (oldRam !== newRam) {
        changes.push(`<b>RAM:</b> ${oldRam}GB ➝ ${newRam}GB`);
        savePanelConfig({
          ramMin: `${d.ram}G`,
          ramMax: `${d.ram}G`,
        });
      }
    }


    // [YENİ] Config (Auto Restart) Değişimi
    if (d.config) {
      if (oldConfig.autoRestart !== d.config.autoRestart) {
        changes.push(
          `<b>Oto-Restart:</b> ${oldConfig.autoRestart ? "Aktif" : "Pasif"} ➝ ${d.config.autoRestart ? "Aktif" : "Pasif"
          }`
        );
        savePanelConfig({ autoRestart: d.config.autoRestart });
      }
    }

    // 3. Properties (Oyun Ayarları) Karşılaştırması
    if (d.props) {
      // Değişen ayarları bul
      Object.keys(d.props).forEach((key) => {
        let oldVal = oldProps[key];
        let newVal = String(d.props[key]); // Karşılaştırma için string yap

        // Boolean değerleri düzelt (true/false bazen "true"/"false" string gelir)
        if (oldVal === "true") oldVal = "Açık";
        else if (oldVal === "false") oldVal = "Kapalı";

        if (newVal === "true") newVal = "Açık";
        else if (newVal === "false") newVal = "Kapalı";

        // Eğer değer değişmişse listeye ekle
        if (oldProps[key] !== String(d.props[key])) {
          // Key ismini güzelleştir (örn: max-players -> Max Players)
          const readableKey = key.replace(/-/g, " ").toUpperCase();
          changes.push(`<b>${readableKey}:</b> ${oldVal} ➝ ${newVal}`);
        }
      });

      // Yeni ayarları kaydet
      saveProperties(d.props);

      // Sunucuya canlı komut gönder (Eğer açıksa)
      if (mcProcess) {
        if (d.props["difficulty"])
          mcProcess.stdin.write(`difficulty ${d.props["difficulty"]}\n`);
        if (d.props["gamemode"])
          mcProcess.stdin.write(`defaultgamemode ${d.props["gamemode"]}\n`);
        if (d.props["white-list"] === true)
          mcProcess.stdin.write(`whitelist on\n`);
        else if (d.props["white-list"] === false)
          mcProcess.stdin.write(`whitelist off\n`);
      }
    }

    // 4. Loglama (Eğer değişiklik varsa detaylı, yoksa standart yaz)
    if (changes.length > 0) {
      // Değişiklikleri alt alta liste olarak formatla
      const detailsHTML = `<ul class="list-disc pl-4 space-y-1 text-gray-300 text-xs">${changes
        .map((c) => `<li>${c}</li>`)
        .join("")}</ul>`;
      logAudit("Ayarlar", detailsHTML, "Panel Admin", "panel");
      io.emit("log", "✅ Ayarlar güncellendi ve kaydedildi.");
    } else {
      io.emit("log", "ℹ️ Herhangi bir değişiklik algılanmadı.");
    }
  });
  socket.on("get-whitelist", () => {
    socket.emit("whitelist-data", getWhitelist());
  });
  socket.on("whitelist-add", (n) => {
    if (mcProcess) {
      mcProcess.stdin.write(`whitelist add ${n}\n`);
    }
    setTimeout(() => {
      io.emit("whitelist-data", getWhitelist());
    }, 1000);
  });
  socket.on("whitelist-remove", (n) => {
    if (mcProcess) {
      mcProcess.stdin.write(`whitelist remove ${n}\n`);
    }
    setTimeout(() => {
      io.emit("whitelist-data", getWhitelist());
    }, 1000);
  });
  socket.on("get-ops", () => socket.emit("ops-data", getOps()));
  socket.on("get-audit", () => {
    if (fs.existsSync(AUDIT_FILE))
      socket.emit("audit-data", JSON.parse(fs.readFileSync(AUDIT_FILE)));
    else socket.emit("audit-data", []);
  });
  socket.on("clear-audit", (data) => {
    try {
      const type = data ? data.type : null;
      let audits = [];
      if (fs.existsSync(AUDIT_FILE)) {
        audits = JSON.parse(fs.readFileSync(AUDIT_FILE));
      }

      let updatedAudits = [];
      let label = "Tüm";
      if (type === "panel") {
        // Sadece panel dışındaki logları (yani game loglarını) tut
        updatedAudits = audits.filter(log => log.type !== "panel");
        label = "Panel İşlemleri";
      } else if (type === "game") {
        // Sadece game dışındaki logları (yani panel loglarını) tut
        updatedAudits = audits.filter(log => log.type !== "game");
        label = "Oyun Komutları";
      } else {
        // Hiçbiri değilse tamamını temizle
        updatedAudits = [];
      }

      fs.writeFileSync(AUDIT_FILE, JSON.stringify(updatedAudits, null, 2));
      io.emit("audit-data", updatedAudits);
      socket.emit("log", `🗑️ ${label} denetim kayıtları temizlendi.`);
    } catch (e) {
      socket.emit("log", "Hata: Denetim kayıtları temizlenemedi. " + e.message);
    }
  });
  socket.on("get-discord", () => {
    socket.emit("discord-data", getDiscordConfig());
  });
  socket.on("save-discord", (config) => {
    fs.writeFileSync(DISCORD_CONFIG_FILE, JSON.stringify(config, null, 2));
    logAudit("Ayarlar", "Discord ayarları güncellendi.");
    socket.emit("log", "✅ Discord kaydedildi.");
  });
  socket.on("get-worlds", () => {
    const worlds = [];
    if (fs.existsSync(MC_SERVER_PATH)) {
      fs.readdirSync(MC_SERVER_PATH).forEach((file) => {
        if (
          file.startsWith("world") &&
          fs.lstatSync(path.join(MC_SERVER_PATH, file)).isDirectory()
        ) {
          worlds.push({ name: file });
        }
      });
    }
    socket.emit("worlds-data", worlds);
  });
  socket.on("world-action", (data) => {
    if (mcProcess)
      return socket.emit(
        "log",
        "⚠️ Sunucu açıkken dünya işlemi yapılamaz! Sunucuyu durdurun."
      );
    const targetPath = path.join(MC_SERVER_PATH, data.name);
    if (data.action === "delete") {
      if (!fs.existsSync(targetPath)) return;
      try {
        // Yedek istenmişse silmeden önce yedekle
        if (data.backup === true) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const backupName = `backup-${data.name}-${timestamp}.zip`;
          if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
          }
          const backupPath = path.join(BACKUP_DIR, backupName);
          const zip = new AdmZip();
          zip.addLocalFolder(targetPath, data.name);
          zip.writeZip(backupPath);
          logAudit("Yedek", `${data.name} silinmeden önce yedeklendi.`);
          socket.emit("log", `💾 Silinmeden önce yedek alındı: ${backupName}`);
        }

        // Eğer aktif dünya siliniyorsa level-name'i "world" yapalım
        let currentProps = {};
        try {
          currentProps = getProperties();
        } catch (e) { }

        if (currentProps["level-name"] === data.name) {
          currentProps["level-name"] = "world";
          try {
            saveProperties(currentProps);
            logAudit("Ayarlar", `Aktif dünya silindiği için level-name varsayılan 'world' yapıldı.`);
          } catch (e) {
            console.error("Properties kaydedilemedi:", e.message);
          }
        }

        fs.rmSync(targetPath, { recursive: true, force: true });
        logAudit("Dünya", `${data.name} silindi.`);
        socket.emit("log", `🗑️ ${data.name} silindi.`);

        const worlds = [];
        if (fs.existsSync(MC_SERVER_PATH)) {
          const updatedProps = getProperties();
          const activeLevel = updatedProps["level-name"] || "world";
          fs.readdirSync(MC_SERVER_PATH).forEach((file) => {
            if (
              fs.lstatSync(path.join(MC_SERVER_PATH, file)).isDirectory() &&
              (file.startsWith("world") || file === activeLevel)
            ) {
              worlds.push({
                name: file,
                isActive: file === activeLevel,
              });
            }
          });
        }
        socket.emit("worlds-data", worlds);
      } catch (e) {
        socket.emit("log", "Hata: " + e.message);
      }
    }
    if (data.action === "activate") {
      try {
        const props = getProperties();
        props["level-name"] = data.name;
        saveProperties(props);
        logAudit("Dünya", `Aktif dünya değiştirildi: ${data.name}`);
        socket.emit("log", `🌍 Aktif dünya: ${data.name} olarak ayarlandı.`);
        const worlds = [];
        fs.readdirSync(MC_SERVER_PATH).forEach((file) => {
          if (fs.lstatSync(path.join(MC_SERVER_PATH, file)).isDirectory()) {
            worlds.push({ name: file, isActive: file === data.name });
          }
        });
        const filteredWorlds = worlds.filter(
          (w) =>
            w.name.startsWith("world") || w.name === data.name || w.isActive
        );
        socket.emit("worlds-data", filteredWorlds);
      } catch (e) {
        socket.emit("log", "Ayarlar kaydedilemedi: " + e.message);
      }
    }
  });

  // Yeni Dünya Oluştur
  socket.on("create-world", (data) => {
    if (mcProcess)
      return socket.emit("log", "⚠️ Sunucu açıkken dünya oluşturulamaz! Sunucuyu durdurun.");

    const name = (data.name || "").trim();

    // İsim doğrulama
    if (!name || !/^[a-zA-Z0-9_\-]+$/.test(name)) {
      return socket.emit("world-create-result", { success: false, error: "Geçersiz dünya adı." });
    }

    const newWorldPath = path.join(MC_SERVER_PATH, name);

    if (fs.existsSync(newWorldPath)) {
      return socket.emit("world-create-result", { success: false, error: `"${name}" zaten mevcut.` });
    }

    try {
      fs.mkdirSync(newWorldPath, { recursive: true });
      logAudit("Dünya", `Yeni dünya oluşturuldu: ${name}`);
      socket.emit("log", `🌱 Yeni dünya oluşturuldu: ${name}`);

      // Güncel dünya listesini gönder
      const props = getProperties();
      const activeLevel = props["level-name"] || "world";
      const worlds = [];
      fs.readdirSync(MC_SERVER_PATH).forEach((file) => {
        if (fs.lstatSync(path.join(MC_SERVER_PATH, file)).isDirectory()) {
          if (file.startsWith("world") || file === activeLevel || file === name) {
            worlds.push({ name: file, isActive: file === activeLevel });
          }
        }
      });
      socket.emit("world-create-result", { success: true, name });
      socket.emit("worlds-data", worlds);
    } catch (e) {
      socket.emit("world-create-result", { success: false, error: e.message });
    }
  });

  socket.on("get-worlds", () => {

    const worlds = [];
    if (fs.existsSync(MC_SERVER_PATH)) {
      const props = getProperties();
      const activeLevel = props["level-name"] || "world";
      fs.readdirSync(MC_SERVER_PATH).forEach((file) => {
        if (fs.lstatSync(path.join(MC_SERVER_PATH, file)).isDirectory()) {
          if (file.startsWith("world") || file === activeLevel) {
            worlds.push({ name: file, isActive: file === activeLevel });
          }
        }
      });
    }
    socket.emit("worlds-data", worlds);
  });
  socket.on("get-banned", () => socket.emit("banned-data", getBannedPlayers()));
  socket.on("unban-player", (n) => {
    if (mcProcess) {
      mcProcess.stdin.write(`pardon ${n}\n`);
    }
    setTimeout(() => {
      io.emit("banned-data", getBannedPlayers());
    }, 1000);
  });
  socket.on("get-plugins", () => socket.emit("plugins-data", getPlugins()));
  socket.on("get-schedules", () =>
    socket.emit("schedules-data", getSchedules())
  );
  socket.on("save-schedules", (schedules) => {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2));
    loadSchedules();
    io.emit("log", "⏰ Zamanlayıcılar güncellendi.");
    io.emit("schedules-data", schedules);
  });
  socket.on("start-server", () => startServerFunc());
  socket.on(
    "send-command",
    (cmd) => mcProcess && mcProcess.stdin.write(cmd + "\n")
  );
  socket.on("stop-server", () => {
    if (mcProcess) {
      isManualStop = true;
      io.emit("log", "⏳ Sunucu verileri kaydediliyor (save-all)...");
      try {
        mcProcess.stdin.write("say [Panel] Dunya kaydediliyor, sunucu kapatilacak...\n");
        mcProcess.stdin.write("save-all\n");
      } catch (e) {
        io.emit("log", `⚠️ save-all komutu gönderilemedi: ${e.message}`);
      }

      // 2 saniye save işleminin tamamlanmasını bekle, sonra stop komutunu gönder
      setTimeout(() => {
        if (mcProcess) {
          io.emit("log", "⏳ Sunucu kapatılıyor (stop komutu gönderildi)...");
          try {
            mcProcess.stdin.write("stop\n");
          } catch (e) {
            io.emit("log", `⚠️ stop komutu gönderilemedi: ${e.message}`);
          }
        }
      }, 2000);

      // 12 saniyelik timeout (Kapanmazsa zorla kapat)
      setTimeout(() => {
        if (mcProcess) {
          io.emit("log", "⚠️ Sunucu normal şekilde kapanmadı. Zorla sonlandırılıyor...");
          try {
            mcProcess.kill("SIGKILL");
          } catch (e) {
            const { exec } = require("child_process");
            exec(`taskkill /pid ${mcProcess.pid} /f /t`);
          }
        }
      }, 12000);
    }
  });
  socket.on("admin-action", (d) => {
    if (!mcProcess) return;
    let c = "";
    switch (d.action) {
      case "kick":
        c = `kick ${d.target}`;
        break;
      case "ban":
        c = `ban ${d.target}`;
        break;
      case "op":
        c = `op ${d.target}`;
        break;
      case "deop":
        c = `deop ${d.target}`;
        break;
    }
    if (c) {
      mcProcess.stdin.write(c + "\n");
      io.emit("console-out", `> [PANEL] ${c}\n`);
      logAudit(
        "Yönetim",
        `${d.action.toUpperCase()} uygulandı: ${d.target}`,
        "Panel Admin",
        "panel"
      );

      // OP / DEOP için ops.json dosyasını doğrudan güncelle (Offline Mode UUID uyumsuzluğunu düzeltir)
      if (d.action === "op" || d.action === "deop") {
        try {
          const opsFilePath = path.join(MC_SERVER_PATH, "ops.json");
          const userCachePath = path.join(MC_SERVER_PATH, "usercache.json");

          let opsList = [];
          if (fs.existsSync(opsFilePath)) {
            opsList = JSON.parse(fs.readFileSync(opsFilePath, "utf8"));
          }

          if (d.action === "deop") {
            // İsme göre listeden çıkar (büyük/küçük harf duyarsız)
            opsList = opsList.filter(op => op.name.toLowerCase() !== d.target.toLowerCase());
          } else if (d.action === "op") {
            // usercache'ten gerçek UUID bulmaya çalış
            let realUuid = "";
            if (fs.existsSync(userCachePath)) {
              try {
                const cache = JSON.parse(fs.readFileSync(userCachePath, "utf8"));
                const cachedUser = cache.find(u => u.name.toLowerCase() === d.target.toLowerCase());
                if (cachedUser) {
                  realUuid = cachedUser.uuid;
                }
              } catch (e) { }
            }

            if (realUuid) {
              // Zaten listede yoksa ekle
              const exists = opsList.some(op => op.name.toLowerCase() === d.target.toLowerCase());
              if (!exists) {
                opsList.push({
                  uuid: realUuid,
                  name: d.target,
                  level: 4,
                  bypassesPlayerLimit: false
                });
              }
            }
          }

          fs.writeFileSync(opsFilePath, JSON.stringify(opsList, null, 2), "utf8");
          // Değişikliği anında istemcilere gönder
          io.emit("ops-data", opsList.map(op => op.name));
        } catch (e) {
          console.error("ops.json güncelleme hatası:", e.message);
        }
      }

      const conf = getDiscordConfig();
      if (conf.optAdmin) sendDiscord(`🛡️ **Admin:** ${c}`, "admin");
      setTimeout(() => {
        if (d.action === "ban") io.emit("banned-data", getBannedPlayers());
        if (d.action === "op" || d.action === "deop") {
          cleanOpsJson();
          io.emit("ops-data", getOps());
        }
      }, 500);

      setTimeout(() => {
        if (d.action === "op" || d.action === "deop") {
          cleanOpsJson();
          io.emit("ops-data", getOps());
        }
      }, 2000);
    }
  });
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


  socket.on("get-all-players", async () => {
    let worldName = "world";
    try {
      const props = getProperties();
      worldName = props["level-name"] || "world";
    } catch (e) { }

    // Olası playerdata yolları
    const pdataPaths = [
      path.join(MC_SERVER_PATH, worldName, "playerdata"),
      path.join(MC_SERVER_PATH, "world", "playerdata"),
      path.join(MC_SERVER_PATH, worldName, "players", "data"),
      path.join(MC_SERVER_PATH, "world", "players", "data"),
    ];

    // Gerçekten var olan UUID'leri bul (dosya adlarından)
    const existingUuids = new Set();
    pdataPaths.forEach(pDir => {
      if (fs.existsSync(pDir)) {
        try {
          fs.readdirSync(pDir).forEach(file => {
            if (file.endsWith(".dat")) {
              const uuid = file.replace(".dat", "");
              existingUuids.add(uuid);
            }
          });
        } catch (e) {
          console.error("Playerdata tarama hatası:", pDir, e.message);
        }
      }
    });

    const userCachePath = path.join(MC_SERVER_PATH, "usercache.json");
    let allPlayers = [];
    let cacheMap = {};

    // 1. usercache.json oku
    if (fs.existsSync(userCachePath)) {
      try {
        const cache = JSON.parse(fs.readFileSync(userCachePath));
        cache.forEach(p => {
          cacheMap[p.uuid] = p.name;
        });
      } catch (e) { console.error("Usercache okuma hatası", e); }
    }

    // 2. Sadece playerdata dosyası var olan UUID'leri listeye ekle
    existingUuids.forEach(uuid => {
      const name = cacheMap[uuid] || "Bilinmiyor";
      // İsmi bilinmeyen oyuncuları "Bilinmiyor (UUID)" şeklinde gösterebiliriz veya sadece Bilinmiyor yapabiliriz
      allPlayers.push({
        name: name !== "Bilinmiyor" ? name : `Bilinmiyor (${uuid.slice(0, 8)})`,
        uuid: uuid,
        online: onlinePlayers.includes(name)
      });
    });

    // 3. O an çevrimiçi olan ama henüz playerdata dosyası oluşmamış/diske yazılmamış olabilecek oyuncuları ekle
    onlinePlayers.forEach(pName => {
      const found = allPlayers.find(p => p.name === pName);
      if (!found) {
        // usercache'ten UUID bulmaya çalış
        let uuid = "unknown";
        for (const [u, name] of Object.entries(cacheMap)) {
          if (name === pName) {
            uuid = u;
            break;
          }
        }
        allPlayers.push({ name: pName, uuid: uuid, online: true });
      }
    });

    socket.emit("all-players-data", allPlayers);
  });

  // [YENİ] OYUNCU ENVANTERİ GETİR (NBT Parsing)
  // [DÜZELTİLDİ] OYUNCU ENVANTERİ GETİR (NBT Parsing)
  socket.on("get-player-inventory", async ({ uuid }) => {
    // Aktif dünya klasörünü bul, bulamazsan "world" kullan
    let worldName = "world";
    try {
      const props = getProperties();
      worldName = props["level-name"] || "world";
    } catch (e) { /* getProperties hata verirse world kullan */ }

    // Olası playerdata konumlarını sırayla dene
    const candidatePaths = [
      path.join(MC_SERVER_PATH, worldName, "playerdata", `${uuid}.dat`),
      path.join(MC_SERVER_PATH, "world", "playerdata", `${uuid}.dat`),
      path.join(MC_SERVER_PATH, worldName, "players", "data", `${uuid}.dat`),
      path.join(MC_SERVER_PATH, "world", "players", "data", `${uuid}.dat`),
    ];
    const playerDataPath = candidatePaths.find(p => fs.existsSync(p)) || null;

    let result = { inventory: [], ender: [], found: false };

    if (playerDataPath) {
      result.found = true;
      try {
        const buffer = fs.readFileSync(playerDataPath);

        const parsedData = await new Promise((resolve, reject) => {
          nbt.parse(buffer, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });

        // prismarine-nbt'nin simplify() metodu ile tüm NBT'yi düz JS objesine indirge
        const simplified = nbt.simplify(parsedData);



        const inventoryList = simplified.Inventory;
        const enderList = simplified.EnderItems;
        const equipment = simplified.equipment; // 1.20.5+ Zırh/Ekipman etiketi

        if (Array.isArray(inventoryList)) {
          result.inventory = inventoryList.map(item => ({
            id: item.id || "minecraft:air",
            Count: item.count !== undefined ? item.count : (item.Count || 1),
            Slot: item.Slot || 0
          }));
        }

        // Yeni sürümlerde zırhlar equipment altında tutulur, eski slot ID'leriyle normalize edip ekleyelim
        if (equipment) {
          const equipSlots = {
            head: 103,
            chest: 102,
            legs: 101,
            feet: 100,
            offhand: -106
          };

          for (const [key, slot] of Object.entries(equipSlots)) {
            const eqItem = equipment[key];
            if (eqItem && eqItem.id && eqItem.id !== "minecraft:air") {
              const exists = result.inventory.some(x => x.Slot == slot);
              if (!exists) {
                result.inventory.push({
                  id: eqItem.id,
                  Count: eqItem.count !== undefined ? eqItem.count : (eqItem.Count || 1),
                  Slot: slot
                });
              }
            }
          }
        }

        if (Array.isArray(enderList)) {
          result.ender = enderList.map(item => ({
            id: item.id || "minecraft:air",
            Count: item.count !== undefined ? item.count : (item.Count || 1),
            Slot: item.Slot || 0
          }));
        }

      } catch (e) {
        console.error("NBT Parse Hatası:", uuid, e.message);
        result.error = "NBT okunamadı: " + e.message;
      }
    } else {
      result.error = "Oyuncu verisi bulunamadı. Oyuncu hiç giriş yapmamış olabilir.";
    }

    socket.emit("player-inventory-data", result);
  });

  // [GÜNCELLENDİ] OYUNCU İSTATİSTİKLERİNİ GETİR (DÜZELTİLMİŞ)
  socket.on("get-player-stats", () => {
    // 1. Doğru Dünya Klasörünü Bul
    let worldName = "world";
    try {
      const props = getProperties();
      worldName = props["level-name"] || "world";
    } catch (e) { }

    // Olası stats dizin konumlarını sırayla dene
    const statsCandidates = [
      path.join(MC_SERVER_PATH, worldName, "stats"),  // aktif dünya (1.13+)
      path.join(MC_SERVER_PATH, "world", "stats"),    // fallback: varsayılan "world"
      path.join(MC_SERVER_PATH, worldName, "players", "stats"), // Spigot/Paper oyuncu stats yolu
      path.join(MC_SERVER_PATH, "world", "players", "stats"),   // Fallback oyuncu stats yolu
      path.join(MC_SERVER_PATH, "stats"),             // bazı eski/özel kurulumlar
    ];
    const statsDir = statsCandidates.find(d => fs.existsSync(d)) || null;

    const userCachePath = path.join(MC_SERVER_PATH, "usercache.json");

    let stats = [];
    let uuidToName = {};

    // 2. İsimleri Önbelleğe Al
    if (fs.existsSync(userCachePath)) {
      try {
        const cache = JSON.parse(fs.readFileSync(userCachePath));
        cache.forEach(u => uuidToName[u.uuid] = u.name);
      } catch (e) { }
    }

    // 3. İstatistik Dosyalarını Oku
    if (statsDir) {
      try {
        const files = fs.readdirSync(statsDir);
        files.forEach(file => {
          if (file.endsWith(".json")) {
            const uuid = file.replace(".json", "");
            const name = uuidToName[uuid] || "Bilinmiyor";

            try {
              const content = JSON.parse(fs.readFileSync(path.join(statsDir, file)));

              let playTimeTicks = 0;
              let deaths = 0;
              let mobKills = 0;
              let playerKills = 0;

              // --- YENİ SÜRÜM (1.13+): content.stats["minecraft:custom"] ---
              if (content.stats && content.stats["minecraft:custom"]) {
                const custom = content.stats["minecraft:custom"];
                // play_time için tüm bilinen alan adları (sürüme göre değişir)
                playTimeTicks =
                  custom["minecraft:play_time"] ||
                  custom["minecraft:play_one_minute"] ||
                  custom["minecraft:total_world_time"] || 0;

                deaths = custom["minecraft:deaths"] || 0;
                mobKills = custom["minecraft:mob_kills"] || 0;
                playerKills = custom["minecraft:player_kills"] || 0;
              }
              // --- ESKİ SÜRÜM (1.12 ve altı): düz anahtar ---
              else if (content["stat.playOneMinute"] !== undefined || content["stat.deaths"] !== undefined) {
                playTimeTicks = content["stat.playOneMinute"] || 0;
                deaths = content["stat.deaths"] || 0;
                mobKills = content["stat.mobKills"] || 0;
                playerKills = content["stat.playerKills"] || 0;
              }
              // --- Çok Eski Sürüm (1.8 öncesi bazılar) ---
              else if (content.stats) {
                // Bazı sürümler istatistiği düz stats altında koyar (namespace'siz)
                const s = content.stats;
                playTimeTicks = s["play_time"] || s["play_one_minute"] || 0;
                deaths = s["deaths"] || 0;
                mobKills = s["mob_kills"] || 0;
                playerKills = s["player_kills"] || 0;
              }

              // Ticks → Saat Çevrimi (1 saniye = 20 tick)
              const playTimeHours = (playTimeTicks / 20 / 3600).toFixed(2);

              stats.push({
                name: name,
                uuid: uuid,
                playTime: parseFloat(playTimeHours),
                deaths: deaths,
                mobKills: mobKills,
                playerKills: playerKills
              });

            } catch (err) { }
          }
        });
      } catch (e) { }
    }

    // Veriyi Frontend'e Gönder
    socket.emit("player-stats-data", stats);
  });
});

// ops.json temizleyici - Offline mod UUID uyumsuzluklarını ve mükerrer kayıtları temizler
function cleanOpsJson() {
  try {
    const opsFilePath = path.join(MC_SERVER_PATH, "ops.json");
    const userCachePath = path.join(MC_SERVER_PATH, "usercache.json");

    if (!fs.existsSync(opsFilePath)) return;

    let opsList = JSON.parse(fs.readFileSync(opsFilePath, "utf8"));
    let cacheMap = {};

    if (fs.existsSync(userCachePath)) {
      try {
        const cache = JSON.parse(fs.readFileSync(userCachePath, "utf8"));
        cache.forEach(p => {
          if (p.name && p.uuid) {
            cacheMap[p.name.toLowerCase()] = p.uuid;
          }
        });
      } catch (e) { }
    }

    const cleaned = [];
    const seenNames = new Set();

    // 1. Önce usercache'teki gerçek/çevrimdışı UUID ile eşleşen op kayıtlarını ekle (öncelikli)
    opsList.forEach(op => {
      if (!op.name) return;
      const nameLower = op.name.toLowerCase();
      const cachedUuid = cacheMap[nameLower];

      if (cachedUuid && op.uuid === cachedUuid) {
        cleaned.push(op);
        seenNames.add(nameLower);
      }
    });

    // 2. Kalan op kayıtlarını ekle (eğer isim daha önce eklenmemişse VE usercache'te kaydı yoksa)
    opsList.forEach(op => {
      if (!op.name) return;
      const nameLower = op.name.toLowerCase();
      const hasCache = cacheMap[nameLower] !== undefined;

      if (!seenNames.has(nameLower) && !hasCache) {
        cleaned.push(op);
        seenNames.add(nameLower);
      }
    });

    fs.writeFileSync(opsFilePath, JSON.stringify(cleaned, null, 2), "utf8");
    console.log("[Panel] ops.json temizlendi.");
  } catch (err) {
    try {
      fs.writeFileSync(path.join(__dirname, "clean_error.log"), err.stack);
    } catch (e) { }
    console.error("ops.json temizleme hatası:", err.message);
  }
}

// İlk başlangıçta Java sürümlerini tarayalım
console.log("[Panel] Java sürümleri taranıyor...");
scanJavaVersions().then((list) => {
  cachedJavaList = list;
  console.log(`[Panel] Java sürümleri tarandı (${cachedJavaList.length} sürüm bulundu).`);
}).catch(err => {
  console.error("[Panel] ❌ Java ilk tarama hatası:", err);
});

// Başlangıçta ops.json temizliğini bir kez yap
cleanOpsJson();

server.listen(PORT, () => console.log(`[Panel] http://localhost:${PORT} adresinde hazır.`));
