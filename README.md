# 🗺️ Türkiye İlişki Haritası

Bu proje, Türkiye'deki illeri farklı ilişki kategorilerine (Flört, Sevgili, Hoşlanma, vb.) göre işaretlemenizi ve bu verileri görsel bir harita üzerinde takip etmenizi sağlayan etkileşimli bir web uygulamasıdır.

## ✨ Özellikler

* **Etkileşimli Harita:** D3.js kullanılarak oluşturulan dinamik Türkiye haritası üzerinde illere tıklayarak işaretleme yapabilirsiniz. [cite: 5]
* **Kategori Yönetimi:** Varsayılan kategorilerin (Flört, Sevgili, Hoşlanma, Kızları/Oğlanları İyidir) yanı sıra kendi özel kategorilerinizi ve renklerinizi ekleyebilirsiniz. [cite: 4]
* **İstatistik Takibi:** Hangi kategoride kaç ilin işaretlendiğini anlık olarak görebilirsiniz. [cite: 4]
* **Dışa Aktarma:** Oluşturduğunuz haritayı istatistikleri ve lejantı ile birlikte **PNG**, **JPG** veya **PDF** formatlarında indirebilirsiniz. [cite: 3, 4]
* **Tema Desteği:** Açık ve koyu mod desteği ile kullanım kolaylığı sağlar. [cite: 4]
* **Mobil Uyumlu:** Küçük ekranlarda şehir isimleri otomatik olarak kısaltılarak okunabilirlik korunur. [cite: 4]

## 🚀 Teknolojiler

* **Frontend:** HTML5, CSS3, JavaScript [cite: 3, 4]
* **Harita Çizimi:** [D3.js](https://d3js.org/) [cite: 3]
* **Dışa Aktarma:** [html2canvas](https://html2canvas.hertzen.com/) ve [jsPDF](https://rawgit.com/MrRio/jsPDF/master/docs/index.html) [cite: 3]
* **Backend:** [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) [cite: 1, 2]
* **Deployment:** [Vercel](https://vercel.com/) [cite: 6]

## 🛠️ Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için şu adımları izleyin:

1.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    ```

2.  Uygulamayı başlatın:
    ```bash
    npm start
    ```
    Uygulama varsayılan olarak `http://localhost:3000` adresinde çalışacaktır. [cite: 2]

## 📂 Dosya Yapısı

* `server.js`: Uygulamayı sunan Node.js/Express sunucusu. [cite: 2]
* `public/index.html`: Uygulamanın ana arayüzü. [cite: 3]
* `public/app.js`: Harita etkileşimi ve uygulama mantığı. [cite: 4]
* `public/style.css`: Modern ve kullanıcı dostu tasarım stilleri.
* `public/tr-cities.json`: Türkiye illerinin GeoJSON koordinat verileri. [cite: 4]
* `vercel.json`: Vercel üzerinde dağıtım için gerekli yapılandırma dosyası. [cite: 6]

## 📄 Lisans

Bu proje **ISC** lisansı ile lisanslanmıştır. [cite: 1]

---
**Harita Verisi Kaynağı:** [ozanyerli/turkeyvisited](https://github.com/ozanyerli/turkeyvisited) [cite: 3]
