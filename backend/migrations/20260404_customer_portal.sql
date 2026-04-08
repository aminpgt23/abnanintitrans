CREATE TABLE IF NOT EXISTS customer_accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_id INT NOT NULL,
  email VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_accounts_customer (customer_id),
  UNIQUE KEY uq_customer_accounts_email (email),
  CONSTRAINT fk_customer_accounts_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_customer_accounts_active ON customer_accounts (is_active);
