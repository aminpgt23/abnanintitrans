CREATE TABLE IF NOT EXISTS customer_account_setups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_account_id INT NOT NULL,
  setup_token VARCHAR(120) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_account_setups_token (setup_token),
  KEY idx_customer_account_setups_account (customer_account_id),
  KEY idx_customer_account_setups_expires (expires_at),
  CONSTRAINT fk_customer_account_setups_account
    FOREIGN KEY (customer_account_id) REFERENCES customer_accounts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_customer_account_setups_creator
    FOREIGN KEY (created_by) REFERENCES users(id)
    ON DELETE SET NULL
);
