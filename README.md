# 🎮 Minecraft Web Yönetim Paneli (Modular v3.0)

Bu proje, Minecraft sunucunuzu web tarayıcısı üzerinden tam kapsamlı olarak yönetmenizi sağlayan, **Node.js** tabanlı modern ve modüler bir yönetim panelidir.

## ✨ Özellikler

* **🖥️ Dashboard:** Sunucu durumu, RAM/CPU kullanımı ve anlık oyuncu sayısı özeti.
* **💻 Konsol:** Canlı sunucu loglarını izleme ve komut gönderme.
* **👥 Oyuncu Yönetimi:** Online oyuncuları görme, Kick/Ban/Op işlemleri.
* **📂 Dosya Yöneticisi:** Sunucu dosyalarını web üzerinden düzenleme, silme ve yükleme.
* **🧩 Eklenti (Plugin) Yöneticisi:** `.jar` dosyalarını yükleme ve tek tıkla devre dışı bırakma.
* **⏱️ Zamanlayıcı (Cron):** Otomatik restart, duyuru veya yedekleme görevleri oluşturma.
* **💾 Yedekleme Sistemi:** Sunucu açıkken bile güvenli (Hot Backup) yedek alma ve geri yükleme.
* **👾 Discord Entegrasyonu:** Sohbet, Olaylar ve Admin loglarını 3 farklı Discord kanalına aktarma.
* **📋 Denetim Kaydı (Audit):** Panel üzerinde kimin ne yaptığını (IP, Tarih, İşlem) kayıt altına alma.
* **🌍 Dünya Yöneticisi:** Gereksiz dünyaları tek tıkla silme/sıfırlama.

## 🛠️ Gereksinimler

* **Node.js** (v14 veya üzeri)
* **Java** (Minecraft sunucusunu çalıştırmak için gerekli sürüm)
* Modern bir Web Tarayıcısı

## 🚀 Kurulum

1.  Bu projeyi bilgisayarınıza indirin veya klonlayın:
    ```bash
    git clone [https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git](https://github.com/KULLANICI_ADINIZ/REPO_ADINIZ.git)
    ```
2.  Proje klasörüne girin ve gerekli modülleri yükleyin:
    ```bash
    cd proje-klasoru
    npm install
    ```

## ⚙️ Yapılandırma (ÖNEMLİ)

Panelin çalışması için klasör yapınızın şu şekilde olması önerilir:

```text
Masaüstü/
├── Ana_Klasör/
│   ├── webpanel/       <-- (Bu projenin dosyaları burada)
│   │   ├── server.js
│   │   ├── public/
│   │   └── ...
│   └── mc-server/      <-- (Minecraft sunucu dosyanız burada)
        ├── server.jar
        ├── server.properties
        └── ...
```

1. Sunucu Klasörünü Tanıtma

server.js dosyasını bir metin editörü ile açın ve en üstteki şu satırı kendi Minecraft klasör adınıza göre düzenleyin:

  ```bash
  // server.js - Satır 14
  const SERVER_FOLDER_NAME = 'mc-server'; 
  // Eğer klasörünüzün adı 'survival' ise burayı 'survival' yapın.
  ```
2. Jar Dosyası İsmi

Panel varsayılan olarak server.jar dosyasını arar. Eğer sizin dosyanızın adı farklıysa (örn: paper.jar), server.js içindeki şu satırı değiştirin:

  ```bash
  const JAR_NAME = 'server.jar';
  ```

## ▶️ Çalıştırma

1. Terminali açın ve panel klasörüne gelin.

2. Paneli başlatın:
    ```bash
    node server.js
    ```
3. Tarayıcınızdan şu adrese gidin: http://localhost:3000

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

## 🌟 Projeyi Beğendiniz mi?

Eğer bu proje işinize yaradıysa veya geliştirmemi desteklemek istiyorsanız, lütfen sağ üst köşedeki **Star (Yıldız) ⭐** butonuna tıklamayı unutmayın!

Bu, projeyi geliştirmeye devam etmem için beni motive edecektir. Teşekkürler! ❤️

[![GitHub stars](https://img.shields.io/github/stars/KeremZayim/Minecraft-Modern-Webpanel?style=social)](https://github.com/KeremZayim/Minecraft-Modern-Webpanel)
