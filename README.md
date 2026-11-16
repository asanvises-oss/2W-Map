# ไกด์ร้านยางมอเตอร์ไซค์ กรุงเทพฯ

เว็บแผนที่ร้าน (static site) ใช้ MapLibre GL + แผนที่ OpenFreeMap (© OpenMapTiles, ข้อมูล © OpenStreetMap)

## ไฟล์
- `index.html`, `style.css`, `app.js` หน้าเว็บ
- `data.js` ข้อมูลร้าน 2,426 ร้าน (สร้างจาก Google Maps ผ่าน Apify) ไม่มีราคา ไม่มีเบอร์ติดต่อเจ้าของจากลิสต์เครือข่าย
- `vendor/` ไลบรารี MapLibre GL 4.7.1 (ใส่ไว้ในโปรเจกต์ ไม่ต้องพึ่ง CDN)

## Deploy บน GitHub Pages
1. สร้าง repository ใหม่บน GitHub (เช่น `tire-shop-guide`)
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ไว้ที่ root ของ repo (รวมโฟลเดอร์ `vendor` และไฟล์ `.nojekyll`)
3. ไปที่ Settings > Pages > Source เลือก "Deploy from a branch" > Branch `main` โฟลเดอร์ `/ (root)` > Save
4. รอ 1-2 นาที เว็บจะอยู่ที่ `https://<ชื่อผู้ใช้>.github.io/tire-shop-guide/`

## ทดสอบในเครื่อง
`python3 -m http.server 8000` แล้วเปิด http://localhost:8000
(เพิ่ม `?basemap=none` ต่อท้าย URL เพื่อปิดพื้นแผนที่ ใช้ตอนทดสอบออฟไลน์)

## อัปเดตข้อมูล
แก้ `data.js` (ตัวแปร `DATA`) ฟิลด์ท้ายสุดของแต่ละร้าน (0/1) คือเครื่องหมายร้านเครือข่ายมิชลิน
