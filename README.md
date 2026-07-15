# 🎮 Minecraft Web Yönetim Paneli

Bu proje, Minecraft sunucunuzu web tarayıcısı üzerinden **tam kapsamlı, modern ve etkileşimli** bir şekilde yönetmenizi sağlayan, **Node.js** tabanlı gelişmiş bir yönetim panelidir.

> 🚀 **WebPanel V5 Güncellemesi (Yeni Sürüm):**
> 👥 **Oyuncu Yönetimi:** Online, Tüm Oyuncular, Ops, Banlılar ve IP Ban listeleri gelişmiş sekmeli (Tabs) yapıya geçirildi.
> 🎒 **Envanter Görüntüleyici:** Çevrimdışı/çevrimiçi oyuncuların envanter ve Ender Chest içerikleri görsel slotlar halinde çözümlenip listeleniyor.
> 🧩 **Mod & Eklenti Mağazası:** Modrinth, Spiget ve DevBukkit entegrasyonu ile panelden doğrudan eklenti arama ve tek tıkla yükleme eklendi.
> ☕ **Java Sürüm Seçici:** Sistemdeki Java sürümleri otomatik taranıp ayarlardan kolayca değiştirilebilir hale getirildi.
> 📦 **Kaynak Paketi (Resource Pack):** Sunucu için .zip paketi yükleme, SHA-1 otomatik hesaplama ve silme eklendi.
> 🌍 **Dünya Yöneticisi:** Panelden yeni dünya oluşturma ve silerken yedekleme alma desteği sağlandı.
> 📈 **Performans Grafikleri:** Chart.js ile CPU/RAM geçmişi ve regex ile konsoldan anlık TPS izleme eklendi.
 
## ✨ Yeni ve Temel Özellikler
 
### 🔥 Öne Çıkan Yenilikler
* **🧠 Akıllı Konsol:** Minecraft komutları ve oyuncu isimleri için **TAB ile otomatik tamamlama**, komut geçmişi (yukarı/aşağı ok) ve çok seçenekli öneri kutusu.
* **🌍 Gelişmiş Dünya Yöneticisi:**
    * **Yükle:** Kendi haritanızı `.zip` olarak sürükleyip bırakın.
    * **İndir:** Sunucudaki dünyaları tek tıkla `.zip` olarak yedekleyin.
    * **Aktif Et:** `server.properties` ile uğraşmadan panelden aktif dünyayı seçin.
* **👥 Modern Oyuncu Yönetimi:**
    * **Sekmeli Yapı:** Online, Yöneticiler (Ops), Banlılar ve **IP Ban** listeleri tek sayfada.
    * **Anlık Tepki:** Oyuncu işlemleri sayfa yenilemeden (Optimistic UI) gerçekleşir.
* **💬 İki Yönlü Discord Botu:**
    * Oyundan Discord'a log akışı.
    * Discord'dan oyuna mesaj gönderme (Slash Command: `/gönder mesaj`).
* **📊 Canlı Grafikler:** Chart.js ile geçmişe dönük CPU ve RAM kullanım grafikleri.

### ⚙️ Temel Özellikler
* **📂 Dosya Yöneticisi:** Web üzerinden dosya düzenleme, silme, oluşturma ve yükleme.
* **🧩 Eklenti (Plugin) Yöneticisi:** Marketten (Modrinth/Spiget/DevBukkit) veya dosya yükleyerek plugin kurma, açma/kapama.
* **💾 Yedekleme Sistemi:** Sunucu açıkken bile güvenli (Hot Backup) yedek alma ve geri yükleme.
* **⏱️ Zamanlayıcı (Cron):** Otomatik restart, komut gönderme veya yedekleme görevleri.
* **📋 Denetim Kaydı (Audit):** Panel üzerindeki tüm işlemlerin (IP, Tarih, İşlem) kaydı.
* **🛠️ Yazılım Yöneticisi:** PaperMC sürümlerini otomatik listeleme ve tek tıkla kurma/güncelleme.

## 🛠️ Gereksinimler

* **Node.js** (v16 veya üzeri önerilir)
* **Java** (Minecraft sürümünüze uygun Java sürümü - örn: 1.16.5 için Java 8/11, 1.20+ için Java 17/21)
* Modern bir Web Tarayıcısı

## 🚀 Kurulum

1.  **Projeyi İndirin:**
    ```bash
    git clone <https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git>
    ```
2.  **Klasöre Girin ve Modülleri Yükleyin:**
    ```bash
    cd proje-klasoru
    npm install
    ```

## ⚙️ Klasör Yapısı (ÖNEMLİ)

Panelin sunucunuzu bulabilmesi için klasör yapınız aşağıdaki gibi **yan yana** olmalıdır:

```text
Masaüstü/
├── Ana_Klasör/
│   ├── webpanel/       <-- (Bu projenin dosyaları)
│   │   ├── server.js
│   │   ├── config/     <-- (Ayarlar buraya otomatik oluşur)
│   │   └── ...
│   └── mc-server/      <-- (Minecraft sunucu dosyanız burada olmalı)
        ├── server.jar
        ├── server.properties
        └── ...

        Not: Eğer sunucu klasörünüzün adı mc-server değilse, server.js dosyasını açıp en üstteki SERVER_FOLDER_NAME değişkenini kendi klasör adınıza göre düzenleyin.
```

## ▶️ Çalıştırma

1. Terminali açın ve panel klasörüne gelin.

2. Paneli başlatın:
    ```bash
    node server.js
    ```
3. Tarayıcınızdan şu adrese gidin: http://localhost:1717 (Panel varsayılan olarak **1717** portunu kullanmaktadır.)

## 🧩 Discord Entegrasyonu Nasıl Yapılır?

    1. Panelden DISCORD sayfasına gidin.

    2. Discord sunucunuzda 3 farklı kanal için (Sohbet, Olaylar, Admin) Webhook oluşturun.

    3. Webhook linklerini ilgili kutulara yapıştırın ve KAYDET butonuna basın.
    

## 📞 Destek ve Hata Bildirimi

Herhangi bir hata ile karşılaşırsanız veya geliştirme öneriniz varsa lütfen iletişime geçin.

    Geliştirici: Kerem Zayim

    GitHub: https://github.com/KeremZayim

    Hata Bildirimi: Lütfen GitHub Issues kısmını kullanın.


### Kullanıcı Neleri Değiştirmeli? (Özet)

Projeyi indiren birisi sadece şunlara dikkat etmeli:

1.  **Klasör Yapısı:** `server.js` dosyasının bulunduğu klasör ile Minecraft sunucu klasörü **yan yana** olmalıdır.
2.  **Klasör Adı:** `server.js` içindeki `const SERVER_FOLDER_NAME = 'mc-server';` satırı, yan taraftaki klasörün adıyla **birebir aynı** olmalıdır.
3.  **Jar Adı:** Sunucu dosyasının adı `server.jar` olmalıdır (veya koddan değiştirilmelidir).
4.  **Kurulum:** `npm install` komutu ile kütüphaneleri indirmelidir.

## 📖 Sürüm Değişiklik Günlüğü (Changelog)

<details>
  <summary><b>🛠️ WebPanel V5 Güncelleme Detaylarını Göster (Tıkla Aç)</b></summary>

### 🚀 Yeni Özellikler & Geliştirmeler

* **👥 Sekmeli Oyuncu Yönetimi:** Online, Tüm Oyuncular, Ops, Banlılar, IP Banlılar ve İstatistikler sekmeleri eklendi. Oyuncu ismi önerme desteği sağlandı.
* **🎒 Çevrimdışı Oyuncu Envanter Görüntüleyici:** Oyuncu `.dat` dosyaları (NBT) çözümlenerek envanter, zırh, ikincil el (off-hand) ve Ender Chest içerikleri görsel slotlar halinde modala döküldü (Minecraft 1.20.5+ dahil).
* **📊 Liderlik Tabloları:** En çok oynayanlar, en çok yaratık öldürenler ve en çok ölenler istatistikleri taranarak sıralandı.
* **🧩 Mod & Eklenti Mağazası:** Modrinth, Spiget ve DevBukkit API entegrasyonu ile panel üzerinden doğrudan eklenti/mod arama ve yükleme özelliği getirildi.
* **🖥️ Sunucu Yazılım & Sürüm Yöneticisi:** Paper, Spigot ve CraftBukkit için kararlı/deneysel sürüm tespiti ve otomatik kurulum sistemi kuruldu.
* **☕ Dinamik Java Sürüm Seçici:** Sistemdeki yüklü Java yollarını otomatik tarayan ve ayarlardan tek tıkla seçebilmeyi sağlayan sistem entegre edildi.
* **📦 Kaynak Paketi (Resource Pack) Yönetimi:** Kaynak paketi yükleme, indirme, SHA-1 kodunun otomatik hesaplanarak `server.properties`'e işlenmesi ve silinmesi eklendi.
* **🌍 Dünya Yönetimi Yenilikleri:** Yeni dünya oluşturma modalı, silerken önce yedekleme seçeneği ve sürükle-bırak zip yükleme desteği eklendi.
* **📈 Performans & TPS İzleme:** Chart.js grafikleriyle CPU/RAM izleme ve konsol loglarından anlık TPS değerini regex ile yakalama sistemi kuruldu.
* **⚙️ Güvenlik & İyileştirmeler:** `ops.json` temizleyici (`cleanOpsJson`) ile UUID mükerrer kayıtları düzeltildi, denetim günlüklerine sayfalandırma (pagination) ve Excel dışa aktarım desteği (SheetJS) eklendi. `.gitignore` güncellenerek hassas veriler koruma altına alındı.

</details>

## Panel Resimleri

<img width="1920" height="1080" alt="Screenshot_1263" src="https://github.com/user-attachments/assets/d32bea5a-1261-432b-b835-c7f3c055176c" />
<img width="1920" height="1080" alt="Screenshot_1264" src="https://github.com/user-attachments/assets/a4d1594e-0944-4c72-a037-18df9d077894" />
<img width="1920" height="1080" alt="Screenshot_1265" src="https://github.com/user-attachments/assets/d7a2d787-8295-4ab1-906d-e22ba2863847" />
<img width="1920" height="1080" alt="Screenshot_1266" src="https://github.com/user-attachments/assets/2af9cb77-e770-4acb-b8cf-e488fcc88697" />
<img width="1920" height="1080" alt="Screenshot_1267" src="https://github.com/user-attachments/assets/c8f8a3f6-a36a-496b-965c-63727775d226" />
<img width="1920" height="1080" alt="Screenshot_1268" src="https://github.com/user-attachments/assets/b9af222b-52a6-4cd6-ae81-2204ed0a8864" />
<img width="1920" height="1080" alt="Screenshot_1269" src="https://github.com/user-attachments/assets/044b5f7b-4318-4c48-991a-ae2518946a9f" />
<img width="1920" height="1080" alt="Screenshot_1270" src="https://github.com/user-attachments/assets/7aff5ca4-e60d-42f7-8602-0858efb4b9f8" />
<img width="1920" height="1080" alt="Screenshot_1271" src="https://github.com/user-attachments/assets/f5221e97-8249-4b0d-8b8f-4a977ecbc36e" />
<img width="1920" height="1080" alt="Screenshot_1272" src="https://github.com/user-attachments/assets/8451c56f-8cc1-4001-98a2-01839d323bbd" />
<img width="1920" height="1080" alt="Screenshot_1273" src="https://github.com/user-attachments/assets/64a7bed4-14dd-45aa-9ff8-254a56e9e41e" />
<img width="1920" height="1080" alt="Screenshot_1274" src="https://github.com/user-attachments/assets/011e6452-a926-4a71-944a-3160d7ef3398" />
<img width="1920" height="1080" alt="Screenshot_1275" src="https://github.com/user-attachments/assets/76757c02-96ae-41d4-bcfb-e5341d5f103f" />

## 🌟 Projeyi Beğendiniz mi?

Eğer bu proje işinize yaradıysa veya geliştirmemi desteklemek istiyorsanız, lütfen sağ üst köşedeki **Star (Yıldız) ⭐** butonuna tıklamayı unutmayın!

Bu, projeyi geliştirmeye devam etmem için beni motive edecektir. Teşekkürler! ❤️

[![GitHub stars](https://img.shields.io/github/stars/KeremZayim/Minecraft-Modern-Webpanel?style=social)](https://github.com/KeremZayim/Minecraft-Modern-Webpanel)
