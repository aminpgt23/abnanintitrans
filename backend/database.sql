-- ============================================================
-- PT ABNAN INTI TRANS - DATABASE SCHEMA
-- ============================================================
CREATE DATABASE IF NOT EXISTS abnan_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE abnan_crm;

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('super_admin','general_manager','sales_manager','sales','finance') NOT NULL DEFAULT 'sales',
  position VARCHAR(100),
  department VARCHAR(50),
  avatar_url TEXT,
  join_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  password_hash VARCHAR(255) NOT NULL,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE,
  name VARCHAR(150) NOT NULL,
  company_name VARCHAR(150),
  email VARCHAR(100),
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Indonesia',
  postal_code VARCHAR(10),
  npwp VARCHAR(30),
  rating INT DEFAULT 0,
  total_purchases DECIMAL(18,2) DEFAULT 0,
  total_transactions INT DEFAULT 0,
  category ENUM('regular','vip','wholesale','government','corporate') DEFAULT 'regular',
  assigned_sales_id INT,
  notes TEXT,
  is_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_sales_id) REFERENCES users(id) ON DELETE SET NULL
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  brand VARCHAR(100),
  category VARCHAR(100),
  description TEXT,
  unit VARCHAR(20) DEFAULT 'pcs',
  price_buy DECIMAL(18,2),
  price_sell DECIMAL(18,2),
  stock_qty INT DEFAULT 0,
  min_order INT DEFAULT 1,
  hs_code VARCHAR(20),
  country_of_origin VARCHAR(100),
  weight_kg DECIMAL(10,3),
  is_active BOOLEAN DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INT NOT NULL,
  sales_id INT,
  status ENUM('draft','sent','partial','paid','overdue','cancelled') DEFAULT 'draft',
  issue_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  subtotal DECIMAL(18,2) DEFAULT 0,
  discount_event_id INT,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(18,2) DEFAULT 0,
  tax_percent DECIMAL(5,2) DEFAULT 11,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  grand_total DECIMAL(18,2) DEFAULT 0,
  amount_paid DECIMAL(18,2) DEFAULT 0,
  amount_due DECIMAL(18,2) DEFAULT 0,
  payment_method ENUM('transfer','midtrans','indomaret','alfamart','va_bni','va_bri','va_mandiri','va_bca','cash','credit') DEFAULT 'transfer',
  midtrans_order_id VARCHAR(100),
  midtrans_snap_token TEXT,
  midtrans_payment_type VARCHAR(50),
  midtrans_status VARCHAR(50),
  notes TEXT,
  terms TEXT,
  custom_tax_note TEXT,
  beacukai_ref VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (sales_id) REFERENCES users(id) ON DELETE SET NULL
);

-- INVOICE ITEMS
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  product_id INT,
  description VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  unit VARCHAR(20) DEFAULT 'pcs',
  unit_price DECIMAL(18,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(18,2) NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  payment_date DATETIME NOT NULL,
  payment_method ENUM('transfer','midtrans','indomaret','alfamart','va_bni','va_bri','va_mandiri','va_bca','cash') DEFAULT 'transfer',
  reference_number VARCHAR(100),
  proof_image_url TEXT,
  status ENUM('pending','verified','rejected') DEFAULT 'pending',
  verified_by INT,
  verified_at DATETIME,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- COMMISSIONS
CREATE TABLE IF NOT EXISTS commissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sales_id INT NOT NULL,
  invoice_id INT NOT NULL,
  invoice_amount DECIMAL(18,2) NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 2.5,
  commission_amount DECIMAL(18,2) NOT NULL,
  status ENUM('pending','requested','approved_sm','approved','paid') DEFAULT 'pending',
  request_date DATETIME,
  sm_approval_date DATETIME,
  sm_approved_by INT,
  approval_date DATETIME,
  approved_by INT,
  paid_date DATETIME,
  paid_by INT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sales_id) REFERENCES users(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (sm_approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
);

-- DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_number VARCHAR(100) UNIQUE NOT NULL,
  type ENUM('invoice','packing_list','bl','customs_declaration','surat_jalan','po','contract','beacukai','npwp','other') NOT NULL,
  title VARCHAR(200) NOT NULL,
  customer_id INT,
  invoice_id INT,
  shipment_id INT,
  file_url TEXT,
  notes TEXT,
  issued_date DATE,
  expiry_date DATE,
  status ENUM('draft','issued','sent','cancelled') DEFAULT 'draft',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- SHIPMENTS
CREATE TABLE IF NOT EXISTS shipments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tracking_id VARCHAR(100) UNIQUE NOT NULL,
  customer_id INT,
  invoice_id INT,
  type ENUM('import','export') DEFAULT 'export',
  status ENUM('pending','processing','shipped','in_transit','customs','delivered','returned','cancelled') DEFAULT 'pending',
  origin VARCHAR(200),
  destination VARCHAR(200),
  carrier VARCHAR(100),
  estimated_arrival DATE,
  actual_arrival DATE,
  weight_kg DECIMAL(10,3),
  volume_cbm DECIMAL(10,3),
  container_number VARCHAR(50),
  bl_number VARCHAR(100),
  hs_code VARCHAR(20),
  customs_status ENUM('pending','cleared','held','rejected') DEFAULT 'pending',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- FINANCE TRANSACTIONS
CREATE TABLE IF NOT EXISTS finance_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_number VARCHAR(50) UNIQUE NOT NULL,
  type ENUM('income','expense') NOT NULL,
  category VARCHAR(100),
  amount DECIMAL(18,2) NOT NULL,
  tax_amount DECIMAL(18,2) DEFAULT 0,
  description TEXT,
  reference_type ENUM('invoice','payment','commission','operational','other') DEFAULT 'other',
  reference_id INT,
  payment_proof_url TEXT,
  transaction_date DATE NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at DATETIME,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- PAYMENT REQUESTS (Sales -> SM -> Finance)
CREATE TABLE IF NOT EXISTS payment_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  invoice_id INT NOT NULL,
  requested_by INT NOT NULL,
  amount DECIMAL(18,2) NOT NULL,
  status ENUM('pending_sm','approved_sm','rejected_sm','pending_finance','paid','rejected_finance') DEFAULT 'pending_sm',
  sm_review_by INT,
  sm_review_at DATETIME,
  sm_notes TEXT,
  finance_review_by INT,
  finance_review_at DATETIME,
  finance_notes TEXT,
  paid_at DATETIME,
  payment_proof_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (requested_by) REFERENCES users(id),
  FOREIGN KEY (sm_review_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (finance_review_by) REFERENCES users(id) ON DELETE SET NULL
);

-- DISCOUNT EVENTS
CREATE TABLE IF NOT EXISTS discount_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) UNIQUE,
  discount_type ENUM('percent','fixed') DEFAULT 'percent',
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(18,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  max_usage INT,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- TAX REPORTS
CREATE TABLE IF NOT EXISTS tax_reports (
  id INT PRIMARY KEY AUTO_INCREMENT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_name VARCHAR(50),
  total_income DECIMAL(18,2) DEFAULT 0,
  total_tax_collected DECIMAL(18,2) DEFAULT 0,
  total_expense DECIMAL(18,2) DEFAULT 0,
  total_tax_paid DECIMAL(18,2) DEFAULT 0,
  net_tax DECIMAL(18,2) DEFAULT 0,
  status ENUM('draft','submitted','approved') DEFAULT 'draft',
  submitted_by INT,
  submitted_at DATETIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ACTIVITIES
CREATE TABLE IF NOT EXISTS activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INT,
  description TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- KNOWLEDGE BASE
CREATE TABLE IF NOT EXISTS knowledge_base (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags VARCHAR(500),
  is_published BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- SEED DATA
-- password = Admin@2024 (bcrypt)
-- ============================================================
INSERT INTO users (employee_id, full_name, email, role, position, department, password_hash) VALUES
('ADM001', 'Super Admin', 'admin@abnanintitrans.com', 'super_admin', 'Super Administrator', 'IT', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('GM001', 'Budi Santoso', 'gm@abnanintitrans.com', 'general_manager', 'General Manager', 'Management', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('SM001', 'Saripin', 'sm@abnanintitrans.com', 'sales_manager', 'Sales Manager', 'Sales', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('SL001', 'Awinet', 'awinet@abnanintitrans.com', 'sales', 'Sales Executive', 'Sales', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('SL002', 'Fen', 'fen@abnanintitrans.com', 'sales', 'Sales Executive', 'Sales', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('SL003', 'Raju', 'raju@abnanintitrans.com', 'sales', 'Sales Executive', 'Sales', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('SL004', 'Tink Net', 'tinknet@abnanintitrans.com', 'sales', 'Sales Executive', 'Sales', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('FIN001', 'Dewi Rahayu', 'finance@abnanintitrans.com', 'finance', 'Finance Manager', 'Finance', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
-- NOTE: All passwords = "password" (bcrypt hash above). Change immediately after setup!

INSERT INTO knowledge_base (category, title, content, tags, created_by) VALUES
('Produk', 'Agroplush - Peralatan Pertanian', 'Agroplush menyediakan solusi peralatan pertanian berkualitas tinggi untuk kebutuhan agrikultur modern. PT Abnan Inti Trans adalah distributor resmi Agroplush di Indonesia.', 'agroplush,pertanian,alat', 1),
('Produk', 'Huawei - Peralatan Telekomunikasi', 'Huawei menyediakan perangkat networking dan telekomunikasi enterprise. Kami melayani pengadaan switch, router, dan perangkat jaringan Huawei.', 'huawei,networking,telecom', 1),
('Produk', 'Juniper Networks', 'Juniper Networks adalah solusi jaringan enterprise tier-1. PT Abnan Inti Trans melayani import dan distribusi perangkat Juniper.', 'juniper,networking', 1),
('Produk', 'ZTE - Perangkat Telekomunikasi', 'ZTE menyediakan solusi telekomunikasi komprehensif. Kami melayani pengadaan perangkat ZTE untuk infrastruktur jaringan.', 'zte,telecom', 1),
('Layanan', 'Export Import Process', 'PT Abnan Inti Trans berpengalaman 3 tahun dalam export-import. Kami menangani customs clearance, dokumentasi beacukai, dan negosiasi harga global.', 'export,import,customs', 1);
