# PT Abnan Inti Trans — CRM System

Full-stack CRM enterprise dengan Landing Page, sistem penjualan, keuangan, komisi, dan dokumen beacukai.

---

## 🚀 QUICK START

### 1. Database Setup

```bash
mysql -u root -p
```

```sql
SOURCE /path/to/backend/database.sql;
```

> Semua password default: **`password`** — ganti segera setelah login pertama!

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — isi DB_PASSWORD, JWT_SECRET, dll
npm install
npm run dev
# Berjalan di http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
npm install
npm start
# Berjalan di http://localhost:3000
```

---

## 🔑 LOGIN DEMO

| ID Karyawan | Role | Nama |
|---|---|---|
| ADM001 | Super Admin | Super Administrator |
| GM001 | General Manager | Budi Santoso |
| SM001 | Sales Manager | Saripin |
| SL001 | Sales | Awinet |
| SL002 | Sales | Fen |
| SL003 | Sales | Raju |
| SL004 | Sales | Tink Net |
| FIN001 | Finance | Dewi Rahayu |

**Password semua: `password`**

---

## 🏗️ STRUKTUR PROJECT

```
abnan-inti-trans/
├── backend/
│   ├── src/
│   │   ├── app.js              — Express app
│   │   ├── server.js           — Entry point
│   │   ├── config/db.js        — MySQL pool
│   │   ├── middlewares/auth.js — JWT + RBAC
│   │   ├── models/             — Database models
│   │   ├── routes/index.js     — Semua routes
│   │   └── utils/response.js   — Helper
│   ├── database.sql            — Schema + seed
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/index.html       — SEO + Tailwind CDN
    └── src/
        ├── App.js              — Routes
        ├── index.js
        ├── contexts/AuthContext.js
        ├── services/api.js     — Semua API calls
        ├── utils/format.js     — Helper format
        ├── components/layout/CRMLayout.js
        └── pages/
            ├── LandingPage.js    — Website publik
            ├── LoginPage.js      — Login ID Karyawan
            ├── DashboardPage.js  — Dashboard per role
            ├── CustomersPage.js  — CRUD customer + rating
            ├── InvoicesPage.js   — Invoice + pajak + Midtrans
            └── OtherPages.js     — Finance, Komisi, dll
```

---

## 🎯 FITUR LENGKAP

### Website Publik (Landing Page)
- ✅ Navbar transparan saat scroll, jadi putih saat discroll
- ✅ Menu burger icon di mobile
- ✅ Hero Carousel 3 slide auto-rotate
- ✅ Section Tentang: history, mitra (Awinet, Fen, Raju, Tink Net)
- ✅ Brand: Agroplush, Huawei, Juniper, ZTE, dll
- ✅ Pengalaman 3 tahun, penghematan 1-6 Miliar
- ✅ Metode pembayaran: Indomaret, Alfamart, Midtrans, VA
- ✅ Formulir kontak + email marketing
- ✅ Alamat kantor (placeholder)
- ✅ Chatbot assistant (keyword-based)
- ✅ SEO: meta title, description, OG tags
- ✅ Footer lengkap

### CRM System
- ✅ Login menggunakan **ID Karyawan** (bukan email)
- ✅ Role: super_admin, general_manager, sales_manager, sales, finance

### Role-Based Access Control
| Fitur | SA | GM | SM | Sales | Finance |
|---|---|---|---|---|---|
| Lihat semua | ✅ | ✅ | - | - | - |
| Dashboard | ✅ | ✅ | Summary | Sendiri | Keuangan |
| Customer | ✅ | ✅ | ✅ | Sendiri | - |
| Invoice | ✅ | ✅ | ✅ | Sendiri | ✅ |
| Keuangan | ✅ | ✅ | - | - | ✅ |
| Komisi approve | ✅ | ✅ | SM step | - | Finance step |
| Laporan Pajak | ✅ | ✅ | - | - | ✅ |
| Kelola User | ✅ | - | - | - | - |

### Invoice & Pembayaran
- ✅ Buat invoice dengan item, diskon per item
- ✅ Diskon keseluruhan + event diskon
- ✅ PPN 11% otomatis + catatan pajak custom
- ✅ Payment Gateway Midtrans (dummy mode, siap prod)
- ✅ Virtual Account: BNI, BRI, Mandiri, BCA
- ✅ Indomaret & Alfamart
- ✅ Real-time kurs mata uang di topbar

### Alur Komisi
```
Sales input invoice → Invoice lunas →
Komisi otomatis pending →
Sales ajukan → SM approve →
Finance approve → Finance bayar
```
Min. pencairan: Rp 100.000.000

### Alur Pengajuan Lunas
```
Sales buat payment request →
Sales Manager review & approve →
Finance konfirmasi & bayar
```

### Finance
- ✅ Catat pemasukan/pengeluaran
- ✅ Upload bukti pembayaran
- ✅ Hitung & submit laporan pajak
- ✅ Approve pembayaran
- ✅ Ringkasan keuangan

### Dokumen & Shipment
- ✅ Buat dokumen: invoice, packing list, B/L, bea cukai, dll
- ✅ Tracking pengiriman export/import
- ✅ Status customs clearance

### Knowledge Base
- ✅ Artikel produk (Agroplush, Huawei, Juniper, ZTE, dll)
- ✅ Search & kategori

---

## ⚙️ KONFIGURASI MIDTRANS

Edit `backend/.env`:
```
MIDTRANS_SERVER_KEY=SB-Mid-server-XXXXXXXXXX  # dari dashboard Midtrans
MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXXXXX
MIDTRANS_IS_PRODUCTION=false  # ganti true untuk produksi
```

Untuk aktivasi Midtrans production di `backend/src/routes/index.js`,
ganti bagian dummy payment dengan:

```javascript
const midtransClient = require('midtrans-client');
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});
const transaction = await snap.createTransaction({ ... });
```

---

## 🔧 ENVIRONMENT VARIABLES

### Backend `.env`
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=abnan_crm
JWT_SECRET=ganti_dengan_string_panjang_random_ini
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🛡️ SECURITY CHECKLIST

- [ ] Ganti semua password default karyawan
- [ ] Ganti JWT_SECRET dengan string random panjang
- [ ] Aktifkan HTTPS di production
- [ ] Batasi CORS ke domain production
- [ ] Setup rate limiting
- [ ] Aktifkan Midtrans production key

---

## 📦 STACK TEKNOLOGI

**Backend:** Node.js, Express.js, MySQL2, JWT, Bcrypt, Midtrans Client  
**Frontend:** React 18, React Router v6, Axios, Recharts, React Hot Toast  
**CSS:** Tailwind CSS (via CDN)  
**Font:** Plus Jakarta Sans (Google Fonts)  
**Database:** MySQL 8+

---

## 📞 SUPPORT

Email: marketing@abnanintitrans.com
