# CRM Enterprise Upgrade Blueprint

## 1. Prinsip Upgrade

Dokumen ini memposisikan sistem existing sebagai fondasi utama. Upgrade dilakukan dengan prinsip:

- tidak rewrite total
- tidak memutus flow existing customer -> invoice -> payment -> shipment
- backward compatible terhadap tabel lama dan endpoint lama
- modul baru masuk bertahap melalui API versioning, migration additive, dan feature flag operasional

Current state codebase:

- backend masih bercampur antara route, business rule, dan SQL query
- frontend sudah punya layout dan visual language yang cukup matang untuk dipertahankan
- schema database sudah mencakup inti CRM + finance + shipment + document + activity + knowledge base

Kesimpulan:

- sistem sudah lebih dekat ke CRM-ERP hybrid daripada CRUD biasa
- bottleneck utama ada di modularitas backend, extensibility role/permission, dan agregasi data lintas modul

## 2. Target Arsitektur

### Backend

Gunakan arsitektur pragmatis berlapis:

- `routes/` untuk HTTP contract dan versioning
- `controllers/` untuk request orchestration
- `services/` untuk business rules
- `repositories/` untuk query SQL dan data access
- `middlewares/` untuk auth, validation, rate limit, error handling
- `jobs/` untuk overdue reminder, shipment update sync, auto assignment, follow-up reminder

Recommended structure:

```text
backend/
├── migrations/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── logger.js
│   ├── middlewares/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   ├── validation.js
│   │   └── rateLimit.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── customer360Controller.js
│   │   ├── leadController.js
│   │   ├── dealController.js
│   │   ├── pipelineController.js
│   │   ├── invoiceController.js
│   │   ├── paymentController.js
│   │   ├── shipmentController.js
│   │   ├── financeController.js
│   │   ├── documentController.js
│   │   ├── notificationController.js
│   │   ├── analyticsController.js
│   │   ├── exportController.js
│   │   ├── importController.js
│   │   └── searchController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── customerService.js
│   │   ├── customer360Service.js
│   │   ├── leadService.js
│   │   ├── dealService.js
│   │   ├── pipelineService.js
│   │   ├── analyticsService.js
│   │   ├── exportService.js
│   │   ├── importService.js
│   │   ├── notificationService.js
│   │   └── searchService.js
│   ├── repositories/
│   │   ├── userRepository.js
│   │   ├── customerRepository.js
│   │   ├── customer360Repository.js
│   │   ├── leadRepository.js
│   │   ├── dealRepository.js
│   │   ├── invoiceRepository.js
│   │   ├── paymentRepository.js
│   │   ├── shipmentRepository.js
│   │   ├── financeRepository.js
│   │   ├── documentRepository.js
│   │   └── notificationRepository.js
│   ├── routes/
│   │   ├── index.js
│   │   └── v1/
│   │       ├── auth.js
│   │       ├── customers.js
│   │       ├── leads.js
│   │       ├── deals.js
│   │       ├── pipeline.js
│   │       ├── invoices.js
│   │       ├── payments.js
│   │       ├── shipments.js
│   │       ├── finance.js
│   │       ├── documents.js
│   │       ├── notifications.js
│   │       ├── analytics.js
│   │       ├── export.js
│   │       ├── import.js
│   │       └── search.js
│   ├── jobs/
│   │   ├── overdueReminderJob.js
│   │   ├── shipmentStatusJob.js
│   │   ├── followUpReminderJob.js
│   │   └── autoAssignSalesJob.js
│   └── utils/
│       ├── response.js
│       ├── file.js
│       ├── pagination.js
│       └── formatters.js
```

### Frontend

Gunakan incremental modularization tanpa mengubah visual UI:

```text
frontend/
├── src/
│   ├── App.js
│   ├── index.js
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── DataTable.jsx
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── GlobalSearch.jsx
│   │   │   └── StatCard.jsx
│   │   └── layout/
│   │       ├── CRMLayout.js
│   │       └── Header.jsx
│   ├── contexts/
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useDebounce.js
│   │   ├── useExport.js
│   │   └── usePagination.js
│   ├── pages/
│   │   ├── DashboardPage.js
│   │   ├── CustomersPage.js
│   │   ├── CustomerDetailPage.js
│   │   ├── LeadsPage.js
│   │   ├── DealsPage.js
│   │   ├── AnalyticsPage.js
│   │   ├── DocumentsPage.js
│   │   └── Blog/
│   ├── services/
│   │   ├── api.js
│   │   ├── customers.js
│   │   ├── leads.js
│   │   ├── deals.js
│   │   ├── exports.js
│   │   └── search.js
│   ├── store/
│   │   ├── authStore.js
│   │   ├── uiStore.js
│   │   └── notificationStore.js
│   └── utils/
```

Zustand cocok dipakai untuk state global ringan:

- auth session
- global search overlay
- notification badge
- filter state yang dipakai lintas halaman

## 3. Desain Database Tambahan

### Tabel baru

#### Sales pipeline

- `pipeline_stages`
- `leads`
- `deals`
- `deal_activities`

#### RBAC

- `roles`
- `permissions`
- `role_permissions`
- `user_permissions` untuk override granular

#### Document multi entity

- `document_relations`

#### Import/export observability

- `import_jobs`
- `import_job_rows`
- `export_jobs`

### Extension yang aman pada tabel existing

Tetap additive dan backward compatible:

- `users.role_id` nullable terlebih dahulu, enum `role` tetap dipertahankan sementara
- `knowledge_base.slug`, `excerpt`, `meta_title`, `meta_description`, `published_at`, `cover_image_url`
- index tambahan pada `activities`, `invoices`, `payments`, `shipments`, `documents`, `notifications`
- fulltext index pada data yang akan masuk global search

### Catatan koreksi terhadap draft awal

- jangan langsung hapus `users.role`; simpan sampai seluruh middleware, JWT payload, dan UI selesai pindah ke RBAC
- trigger `invoice overdue` tidak ideal sebagai satu-satunya mekanisme karena invoice bisa menjadi overdue tanpa event update; gunakan cron/job harian sebagai sumber kebenaran, trigger hanya sebagai akselerator opsional
- `documents` lebih aman diperluas dengan tabel relasi baru daripada menambah banyak foreign key baru untuk semua entity masa depan

## 4. Flow CRM yang Direkomendasikan

```text
Lead
-> qualified
-> Deal masuk pipeline
-> Deal won
-> convert ke Customer
-> buat Invoice
-> Payment masuk / diverifikasi
-> Shipment diproses
-> Document dan Finance transaction terhubung
-> Activity + Notification + Analytics tercatat
```

Flow detail:

1. `lead` dibuat dari website, referral, sales input, atau import.
2. Sales melakukan follow-up dan update status.
3. Lead yang valid dikonversi menjadi `deal`.
4. Deal bergerak antar `pipeline_stages` via kanban.
5. Deal won dapat membuat `customer` bila belum ada.
6. Sistem membuat `invoice`, lalu pembayaran masuk ke `payments`.
7. Shipment dan dokumen terkait dicatat dan ditampilkan di `Customer 360`.
8. Finance dan komisi membaca data referensi yang sama, bukan membuat silos baru.

## 5. Customer 360 View

Halaman wajib:

- summary cards: total invoice, revenue, outstanding, shipment, document
- unified timeline: invoice, payment, shipment, document, activity
- tab atau section:
  - profile
  - transaction history
  - shipment history
  - documents
  - recent activity

API yang direkomendasikan:

```http
GET /api/v1/customers/:id/overview
```

Response shape:

```json
{
  "customer": {},
  "summary": {
    "totalInvoices": 24,
    "paidInvoices": 18,
    "overdueInvoices": 2,
    "totalRevenue": 780000000,
    "outstandingAmount": 125000000,
    "shipmentCount": 14,
    "deliveredShipments": 10,
    "documentCount": 41
  },
  "recent": {
    "invoices": [],
    "payments": [],
    "shipments": [],
    "documents": []
  },
  "timeline": []
}
```

## 6. API Design

Semua endpoint baru gunakan versi:

- `GET /api/v1/customers`
- `GET /api/v1/customers/:id/overview`
- `GET /api/v1/invoices`
- `GET /api/v1/shipments`
- `GET /api/v1/finance/transactions`
- `GET /api/v1/search?q=...`
- `POST /api/v1/import/customers`
- `POST /api/v1/export/invoices`

Standard query contract:

- `page`
- `limit`
- `sort_by`
- `sort_dir`
- `search`
- filter domain specific seperti `status`, `date_from`, `date_to`, `customer_id`

Standard response:

```json
{
  "success": true,
  "message": "OK",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143
  }
}
```

## 7. Export / Import Strategy

### Export

Prioritas modul:

- customers
- invoices
- finance transactions

Format:

- CSV untuk interoperabilitas dan bulk
- XLSX untuk user bisnis
- PDF untuk snapshot presentasi atau lampiran operasional

Pattern backend:

- request membuat `export_job`
- service generate file async jika data besar
- hasil file disimpan ke storage dan dicatat di DB

### Import

Flow:

1. upload file
2. parser membaca header
3. sistem sarankan mapping kolom
4. preview baris valid dan invalid
5. user konfirmasi
6. simpan ke `import_jobs` dan `import_job_rows`
7. commit bertahap dengan error report

Prinsip:

- validasi per baris
- partial success lebih baik daripada total gagal
- simpan audit siapa import apa dan kapan

## 8. Smart Notification & Automation

Notification source:

- invoice overdue
- payment verified
- shipment status update
- deal stagnan terlalu lama
- follow-up lead jatuh tempo

Automation yang realistis:

- follow-up reminder harian untuk lead/deal idle
- auto assign sales berdasar city/province atau key account rules
- overdue invoice notification job per pagi

Jangan taruh seluruh business automation di trigger database. Lebih aman di job backend karena:

- lebih mudah diobservasi
- mudah di-retry
- bisa di-log dan di-debug
- tidak mengunci logic di level DB vendor specific

## 9. Global Search

Tahap 1:

- MySQL `LIKE` + `FULLTEXT` index untuk customers, invoices, documents, knowledge_base

Tahap 2 jika volume tinggi:

- search index table atau Elastic/OpenSearch

Search result harus menyertakan:

- `entity_type`
- `entity_id`
- `title`
- `subtitle`
- `url`
- `score`

## 10. SEO Knowledge Base

`knowledge_base` bisa menjadi public SEO page tanpa pindah stack sekarang juga.

Tahap realistis:

- slug unik
- meta title dan description
- article listing page
- article detail by slug
- sitemap XML dari data publish
- structured data artikel sederhana

Next.js SSR bersifat opsional. Untuk fase sekarang, CSR + pre-render ringan atau server-side meta injection sudah cukup bila halaman publik masih sedikit.

## 11. Strategi Migrasi

### Phase 1

- tambah tabel pipeline dan RBAC
- tambah index performa
- tambahkan endpoint `/api/v1`
- implement `Customer 360`

### Phase 2

- export/import jobs
- global search
- notification jobs
- SEO knowledge base public routes

### Phase 3

- granular permission enforcement
- kanban pipeline
- auto assignment dan reminder engine
- async worker / queue untuk proses berat

### Backward compatibility rules

- endpoint existing `/api/...` tetap hidup selama masa transisi
- middleware auth lama tetap jalan
- `users.role` enum belum dihapus
- frontend existing tetap bisa jalan tanpa wajib pindah semua halaman sekaligus

## 12. Strategy Scaling

Untuk volume menengah production:

- pisahkan API layer dari job layer
- aktifkan connection pool tuning MySQL
- tambah composite indexes pada query yang paling sering dipakai
- paginasi ketat pada semua listing
- cache short-lived untuk dashboard dan exchange rate
- simpan file ke object storage, bukan filesystem lokal, saat production
- gunakan log terstruktur dan request id

Jika transaksi makin besar:

- read replica untuk analytics
- queue untuk export/import/notification
- search engine terpisah
- partitioning atau archival untuk `activities`, `notifications`, dan log audit

## 13. Keputusan Akhir yang Direkomendasikan

- backend Anda tidak perlu diulang dari nol, cukup dipecah per modul mulai dari slice bernilai tertinggi
- schema existing sudah kuat; yang dibutuhkan adalah extension additive, index, dan orchestration layer
- UI tidak perlu redesign; cukup tambah halaman dan komponen reusable dengan language visual yang sama
- `Customer 360`, pipeline, import/export, RBAC, dan global search adalah urutan upgrade paling masuk akal untuk value bisnis tercepat
