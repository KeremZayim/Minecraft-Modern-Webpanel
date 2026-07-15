# Değişiklik Günlüğü (Changelog)

Bu belgede, GitHub'daki son kararlı sürüm (**V4**) ile yerel geliştirme ortamındaki bu yeni sürüm arasında gerçekleştirilen tüm güncellemeler, yeni özellikler ve hata düzeltmeleri listelenmiştir.

---

## 🚀 Yeni Özellikler & Geliştirmeler

### 1. 👥 Gelişmiş Oyuncu Yönetimi & Sekmeli (Tab) Arayüz
* **Sekmeli Yapı:** Oyuncu yönetim sayfası tamamen yenilenerek sekmeli (Tab) bir tasarıma geçiş yapıldı:
  * **Çevrimiçi (`online`):** Aktif oyuncuları anlık listeler.
  * **Tüm Oyuncular (`all`):** Sunucuya en az bir kere giriş yapmış tüm oyuncuları listeler.
  * **Yöneticiler (`ops`):** Yetkili listesini ve yetki seviyelerini yönetir.
  * **Yasaklılar (`banned`):** Sunucudan yasaklanan oyuncuların listesidir.
  * **IP Yasaklıları (`ipban`):** IP adresi üzerinden yasaklananları listeler ve yasak kaldırma işlemini destekler.
  * **İstatistikler (`stats`):** Sunucudaki oyuncular için liderlik tablolarını gösterir.
* **Otomatik Yetki Önerileri:** Yeni yönetici (op) ekleme ekranına, sunucuya daha önce girmiş oyuncuların isimlerini otomatik tamamlayan bir veri listesi (`ops-players-datalist`) eklendi.

### 2. 🎒 Çevrimdışı Oyuncu Envanter & Ender Chest Görüntüleyici (Inventory Viewer)
* **Görsel Envanter Arayüzü:** Çevrimdışı veya çevrimiçi fark etmeksizin tüm oyuncuların envanterlerini görsel olarak slot slot görüntüleyen yeni bir modal sistem eklendi.
* **NBT Veri Çözümleme:** Sunucudaki oyuncu `.dat` dosyaları (NBT formatı) arka planda çözümlenerek şu bilgiler çekilmektedir:
  * Ana envanter slotları ve eşya miktarları.
  * Zırh slotları (Kask, Göğüslük, Pantolon, Bot).
  * İkincil el (Off-hand) eşyası.
  * Ender Sandığı (Ender Chest) içeriği.
  * Koordinatlar, can ve tecrübe seviyesi gibi hayati veriler.
  * *Minecraft 1.20.5+* sürümleriyle gelen yeni zırh ve ekipman veri etiketlerine tam uyumluluk sağlandı.
* **Eşya İkonları:** Çözümlenen eşyalar için görsel ikon desteği eklendi.

### 3. 📊 Oyuncu İstatistik Liderlik Tabloları
* Oyuncu istatistik dosyaları (`stats/*.json`) taranarak dinamik olarak en iyiler listesi oluşturulur:
  * **En Çok Oynayanlar** (Saat cinsinden toplam oyun süresi)
  * **En Çok Yaratık Öldürenler** (Mob Kills)
  * **En Çok Ölenler** (Deaths)

### 4. 🧩 Mod & Eklenti Mağazası (Plugin / Mod Search & Installer)
* Panel üzerinden doğrudan mod ve eklenti arayıp tek tıkla yüklemeyi sağlayan yeni bir sistem eklendi:
  * **Modrinth API:** Modrinth veri tabanında eklenti/mod arama ve doğrudan indirme.
  * **Spiget API:** SpigotMC eklentilerini arama ve sunucunun `plugins/` klasörüne otomatik olarak indirme.
  * **DevBukkit (CurseForge Proxy):** DevBukkit / CurseForge üzerindeki eklentileri arama ve indirme desteği.
  * İndirilen eklentiler otomatik olarak doğru klasöre yerleştirilir.

### 5. 🖥️ Sunucu Yazılımı Kurulum & Sürüm Yöneticisi
* Sunucu kurulum arayüzü ve API'leri genişletildi:
  * **Paper, Spigot ve CraftBukkit** sürümleri API üzerinden dinamik olarak sorgulanır.
  * Sürümlerin **Kararlı (Stable)** veya **Deneysel (Experimental)** olduğu arayüzde renkli rozetlerle belirtilir.
  * Seçilen sürüm ve en son derlemesi (Build) otomatik olarak indirilip kurulur.

### 6. ☕ Dinamik Java Sürüm Seçici & Tarayıcı
* Sunucunun çalıştırılacağı Java yolunu elle yazmak yerine, sistemdeki mevcut Java kurulumlarını tarayan bir altyapı eklendi:
  * Sistemdeki Java yolları otomatik olarak taranır ve sürüm bilgileriyle (`Java 17`, `Java 21` vb.) birlikte ayarlar sekmesindeki açılır menüye eklenir.
  * Tek tıkla Java listesini yenileme butonu eklenmiştir.

### 7. 📦 Kaynak Paketi (Resource Pack) Yönetimi
* Sunucuya özel kaynak paketi yükleme ve yönetme özelliği eklendi:
  * Panel üzerinden `.zip` kaynak paketleri yüklenebilir.
  * Yüklenen paketin SHA-1 hash kodu arka planda otomatik olarak hesaplanır ve sunucunun `server.properties` dosyasına yazılır.
  * Kaynak paketini silme ve devre dışı bırakma işlevleri eklendi.

### 8. 🌍 Gelişmiş Dünya Yönetimi
* **Dünya Oluşturucu:** Panel üzerinden doğrudan yeni dünya klasörü tanımlayabilme özelliği.
* **Güvenli Silme:** Dünyayı silerken isteğe bağlı olarak önce yedeğini alma seçeneği (`delete-world-backup-toggle`).
* **Sürükle-Bırak Yükleme:** Dünya dosyalarını `.zip` olarak sürükleyip bırakarak yükleme desteği.

### 9. 📈 Performans Geçmişi & TPS İzleme
* **Kullanım Grafikleri:** Sunucu CPU ve RAM kullanım geçmişini kaydeden ve frontend tarafında Chart.js ile görselleştiren dinamik performans geçmişi tablosu eklendi.
* **TPS Takibi:** Sunucu konsolundan `/tps` çıktısı düzenli ifadelerle (regex) taranarak sunucu anlık TPS değerleri izlenmeye başlandı.

---

## ⚙️ İyileştirmeler & Hata Düzeltmeleri

* **ops.json Temizleyici (`cleanOpsJson`):** Offline mod (çevrimdışı) UUID uyumsuzluklarından kaynaklanan mükerrer op kayıtlarını ve geçersiz girişleri otomatik temizleyen arka plan görevi eklendi.
* **Sayfalandırılmış Denetim Günlükleri (Audit Pagination):** Denetim kayıtlarının tamamını tek seferde yüklemek yerine sayfalandırma altyapısı getirildi.
* **Excel Dışa Aktarımı:** Denetim kayıtları SheetJS (`xlsx.full.min.js`) kütüphanesi kullanılarak Excel formatında indirilebilir hale getirildi.
* **Disk ve Boyut Ölçümleri:** Sunucu ve panel disk boyutlarının PowerShell scriptleri aracılığıyla doğru ve GB biriminde hesaplanması optimize edildi.
* **Güvenlik:** Hassas yapılandırma dosyaları, loglar ve geçici veriler (`temp_uploads/`, `debug_nbt.json`, `debug_stats.json`) `.gitignore` dosyasına eklenerek güvenli hale getirildi.
