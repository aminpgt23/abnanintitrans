-- ============================================================
-- CRM ENTERPRISE UPGRADE (BACKWARD COMPATIBLE)
-- Date: 2026-04-02
-- Notes:
-- 1. Tidak menghapus tabel lama
-- 2. Tidak menghapus kolom role enum lama
-- 3. Fokus pada additive upgrade dan index performa
-- ============================================================

USE abnan_crm;

-- ============================================================
-- RBAC
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_id),
  CONSTRAINT fk_user_permissions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role_id INT NULL AFTER role;

SET @fk_users_role_exists := (
  SELECT COUNT(*)
  FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME = 'fk_users_role_id'
);

SET @sql_users_role_fk := IF(
  @fk_users_role_exists = 0,
  'ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt_users_role_fk FROM @sql_users_role_fk;
EXECUTE stmt_users_role_fk;
DEALLOCATE PREPARE stmt_users_role_fk;

INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Full system access'),
  ('general_manager', 'Executive access across departments'),
  ('sales_manager', 'Sales management access'),
  ('sales', 'Sales operational access'),
  ('finance', 'Finance and payment approval access')
ON DUPLICATE KEY UPDATE description = VALUES(description);

UPDATE users u
JOIN roles r ON r.name = u.role
SET u.role_id = r.id
WHERE u.role_id IS NULL;

INSERT INTO permissions (name, resource, action, description) VALUES
  ('view_customers', 'customers', 'view', 'View customer data'),
  ('create_customers', 'customers', 'create', 'Create customer'),
  ('edit_customers', 'customers', 'edit', 'Edit customer'),
  ('delete_customers', 'customers', 'delete', 'Delete customer'),
  ('view_invoices', 'invoices', 'view', 'View invoice'),
  ('create_invoices', 'invoices', 'create', 'Create invoice'),
  ('edit_invoices', 'invoices', 'edit', 'Edit invoice'),
  ('view_finance', 'finance', 'view', 'View finance'),
  ('approve_payments', 'payments', 'approve', 'Approve payment'),
  ('manage_shipments', 'shipments', 'manage', 'Manage shipment'),
  ('manage_documents', 'documents', 'manage', 'Manage document'),
  ('view_analytics', 'analytics', 'view', 'View analytics'),
  ('manage_pipeline', 'pipeline', 'manage', 'Manage sales pipeline'),
  ('manage_roles', 'rbac', 'manage', 'Manage roles and permissions')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'super_admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'general_manager'
  AND p.name IN (
    'view_customers',
    'create_customers',
    'edit_customers',
    'view_invoices',
    'create_invoices',
    'edit_invoices',
    'view_finance',
    'approve_payments',
    'manage_shipments',
    'manage_documents',
    'view_analytics',
    'manage_pipeline'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'sales_manager'
  AND p.name IN (
    'view_customers',
    'create_customers',
    'edit_customers',
    'view_invoices',
    'create_invoices',
    'edit_invoices',
    'manage_shipments',
    'manage_documents',
    'view_analytics',
    'manage_pipeline'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'sales'
  AND p.name IN (
    'view_customers',
    'create_customers',
    'edit_customers',
    'view_invoices',
    'create_invoices',
    'edit_invoices',
    'manage_pipeline'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.name = 'finance'
  AND p.name IN (
    'view_invoices',
    'view_finance',
    'approve_payments',
    'manage_documents',
    'manage_shipments'
  );

-- ============================================================
-- SALES PIPELINE
-- ============================================================

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  order_num INT NOT NULL,
  probability INT NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pipeline_stage_order (order_num)
);

CREATE TABLE IF NOT EXISTS leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  source VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  region VARCHAR(100),
  customer_id INT NULL,
  assigned_to INT NULL,
  notes TEXT,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leads_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_leads_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_leads_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_leads_status_assigned (status, assigned_to),
  KEY idx_leads_contact_email (contact_email),
  KEY idx_leads_region (region)
);

CREATE TABLE IF NOT EXISTS deals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  lead_id INT NULL,
  customer_id INT NULL,
  pipeline_stage_id INT NOT NULL,
  deal_name VARCHAR(255) NOT NULL,
  value DECIMAL(15,2) NOT NULL DEFAULT 0,
  probability INT NULL,
  currency_code VARCHAR(10) NOT NULL DEFAULT 'IDR',
  expected_close_date DATE,
  actual_close_date DATE,
  lost_reason VARCHAR(255),
  assigned_to INT NULL,
  notes TEXT,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_deals_lead
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  CONSTRAINT fk_deals_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  CONSTRAINT fk_deals_stage
    FOREIGN KEY (pipeline_stage_id) REFERENCES pipeline_stages(id),
  CONSTRAINT fk_deals_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_deals_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_deals_stage_assigned (pipeline_stage_id, assigned_to),
  KEY idx_deals_customer (customer_id),
  KEY idx_deals_expected_close (expected_close_date)
);

CREATE TABLE IF NOT EXISTS deal_activities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  deal_id INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  schedule_at DATETIME NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_deal_activities_deal
    FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
  CONSTRAINT fk_deal_activities_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_deal_activities_deal_created (deal_id, created_at)
);

INSERT INTO pipeline_stages (name, code, order_num, probability, is_closed, is_won) VALUES
  ('Prospecting', 'prospecting', 1, 10, FALSE, FALSE),
  ('Qualification', 'qualification', 2, 25, FALSE, FALSE),
  ('Proposal', 'proposal', 3, 50, FALSE, FALSE),
  ('Negotiation', 'negotiation', 4, 75, FALSE, FALSE),
  ('Closed Won', 'closed_won', 5, 100, TRUE, TRUE),
  ('Closed Lost', 'closed_lost', 6, 0, TRUE, FALSE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  probability = VALUES(probability),
  is_closed = VALUES(is_closed),
  is_won = VALUES(is_won),
  is_active = TRUE;

-- ============================================================
-- DOCUMENT RELATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS document_relations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  document_id INT NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  relation_label VARCHAR(50) DEFAULT 'attachment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_document_relations_document
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE KEY uq_document_relations_entity (document_id, entity_type, entity_id, relation_label),
  KEY idx_document_relations_lookup (entity_type, entity_id)
);

INSERT IGNORE INTO document_relations (document_id, entity_type, entity_id, relation_label)
SELECT id, 'customer', customer_id, 'primary'
FROM documents
WHERE customer_id IS NOT NULL;

INSERT IGNORE INTO document_relations (document_id, entity_type, entity_id, relation_label)
SELECT id, 'invoice', invoice_id, 'primary'
FROM documents
WHERE invoice_id IS NOT NULL;

INSERT IGNORE INTO document_relations (document_id, entity_type, entity_id, relation_label)
SELECT id, 'shipment', shipment_id, 'primary'
FROM documents
WHERE shipment_id IS NOT NULL;

-- ============================================================
-- IMPORT / EXPORT JOBS
-- ============================================================

CREATE TABLE IF NOT EXISTS import_jobs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_name VARCHAR(50) NOT NULL,
  source_filename VARCHAR(255) NOT NULL,
  storage_path VARCHAR(255) NULL,
  status ENUM('uploaded', 'previewed', 'processing', 'completed', 'failed', 'partial') NOT NULL DEFAULT 'uploaded',
  total_rows INT NOT NULL DEFAULT 0,
  valid_rows INT NOT NULL DEFAULT 0,
  invalid_rows INT NOT NULL DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_import_jobs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS import_job_rows (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  import_job_id BIGINT NOT NULL,
  row_number INT NOT NULL,
  raw_payload JSON NULL,
  mapped_payload JSON NULL,
  status ENUM('valid', 'invalid', 'imported', 'skipped') NOT NULL DEFAULT 'valid',
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_import_job_rows_job
    FOREIGN KEY (import_job_id) REFERENCES import_jobs(id) ON DELETE CASCADE,
  KEY idx_import_job_rows_job_status (import_job_id, status)
);

CREATE TABLE IF NOT EXISTS export_jobs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  module_name VARCHAR(50) NOT NULL,
  format ENUM('csv', 'xlsx', 'pdf') NOT NULL,
  filters JSON NULL,
  storage_path VARCHAR(255) NULL,
  status ENUM('queued', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'queued',
  total_rows INT NOT NULL DEFAULT 0,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_export_jobs_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- KNOWLEDGE BASE SEO
-- ============================================================

ALTER TABLE knowledge_base
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) NULL AFTER title,
  ADD COLUMN IF NOT EXISTS excerpt TEXT NULL AFTER content,
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) NULL AFTER excerpt,
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(255) NULL AFTER meta_title,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT NULL AFTER meta_description,
  ADD COLUMN IF NOT EXISTS published_at DATETIME NULL AFTER is_published;

CREATE UNIQUE INDEX IF NOT EXISTS uq_knowledge_base_slug ON knowledge_base (slug);

UPDATE knowledge_base
SET slug = LOWER(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(TRIM(title), ' ', '-'),
        '/', '-'
      ),
      '--', '-'
    ),
    '--', '-'
  )
)
WHERE slug IS NULL OR slug = '';

UPDATE knowledge_base
SET published_at = created_at
WHERE is_published = TRUE AND published_at IS NULL;

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_invoices_customer_status_date
  ON invoices (customer_id, status, issue_date);

CREATE INDEX IF NOT EXISTS idx_invoices_sales_status_date
  ON invoices (sales_id, status, issue_date);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_status_date
  ON payments (invoice_id, status, payment_date);

CREATE INDEX IF NOT EXISTS idx_shipments_customer_status
  ON shipments (customer_id, status, created_at);

CREATE INDEX IF NOT EXISTS idx_documents_customer_invoice
  ON documents (customer_id, invoice_id, created_at);

CREATE INDEX IF NOT EXISTS idx_activities_entity_created
  ON activities (entity_type, entity_id, created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications (user_id, is_read, created_at);

CREATE INDEX IF NOT EXISTS idx_finance_reference
  ON finance_transactions (reference_type, reference_id, transaction_date);

-- ============================================================
-- FULLTEXT SEARCH SUPPORT
-- ============================================================

ALTER TABLE customers
  ADD FULLTEXT INDEX ft_customers_search (name, company_name, email, code);

ALTER TABLE documents
  ADD FULLTEXT INDEX ft_documents_search (document_number, title, notes);

ALTER TABLE knowledge_base
  ADD FULLTEXT INDEX ft_knowledge_base_search (title, content, tags);

-- ============================================================
-- NOTE
-- Gunakan backend job untuk overdue invoice reminder.
-- Trigger tidak cukup karena invoice bisa menjadi overdue tanpa event update.
-- ============================================================
