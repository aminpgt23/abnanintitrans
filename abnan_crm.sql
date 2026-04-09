-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table abnan_crm.activities
CREATE TABLE IF NOT EXISTS `activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_activities_entity_created` (`entity_type`,`entity_id`,`created_at`),
  CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.activities: ~6 rows (approximately)
INSERT IGNORE INTO `activities` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `description`, `ip_address`, `created_at`) VALUES
	(1, 9, 'create', 'customer', 2, 'Membuat customer PT Maju Sejahtera', '127.0.0.1', '2026-04-04 15:24:24'),
	(2, 9, 'create', 'invoice', 3, 'Membuat invoice penjualan untuk customer', '127.0.0.1', '2026-04-04 15:24:24'),
	(3, 9, 'create', 'payment', 3, 'Mencatat pembayaran termin pertama', '127.0.0.1', '2026-04-04 15:24:24'),
	(4, 9, 'create', 'shipment', 2, 'Membuat pengiriman barang', '127.0.0.1', '2026-04-04 15:24:24'),
	(5, 9, 'create', 'document', 2, 'Upload dokumen invoice', '127.0.0.1', '2026-04-04 15:24:24'),
	(6, 9, 'create', 'document', 3, 'Upload packing list', '127.0.0.1', '2026-04-04 15:24:24');

-- Dumping structure for table abnan_crm.commissions
CREATE TABLE IF NOT EXISTS `commissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sales_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `invoice_amount` decimal(18,2) NOT NULL,
  `commission_rate` decimal(5,2) DEFAULT '2.50',
  `commission_amount` decimal(18,2) NOT NULL,
  `status` enum('pending','requested','approved_sm','approved','paid') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `request_date` datetime DEFAULT NULL,
  `sm_approval_date` datetime DEFAULT NULL,
  `sm_approved_by` int DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `sales_id` (`sales_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `sm_approved_by` (`sm_approved_by`),
  KEY `approved_by` (`approved_by`),
  KEY `paid_by` (`paid_by`),
  CONSTRAINT `commissions_ibfk_1` FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`),
  CONSTRAINT `commissions_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `commissions_ibfk_3` FOREIGN KEY (`sm_approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `commissions_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `commissions_ibfk_5` FOREIGN KEY (`paid_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.commissions: ~0 rows (approximately)

-- Dumping structure for table abnan_crm.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Indonesia',
  `postal_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `npwp` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int DEFAULT '0',
  `total_purchases` decimal(18,2) DEFAULT '0.00',
  `total_transactions` int DEFAULT '0',
  `category` enum('regular','vip','wholesale','government','corporate') COLLATE utf8mb4_unicode_ci DEFAULT 'regular',
  `assigned_sales_id` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_registered` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `assigned_sales_id` (`assigned_sales_id`),
  FULLTEXT KEY `ft_customers_search` (`name`,`company_name`,`email`,`code`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`assigned_sales_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.customers: ~1 rows (approximately)
INSERT IGNORE INTO `customers` (`id`, `code`, `name`, `company_name`, `email`, `phone`, `whatsapp`, `address`, `city`, `province`, `country`, `postal_code`, `npwp`, `rating`, `total_purchases`, `total_transactions`, `category`, `assigned_sales_id`, `notes`, `is_registered`, `created_at`, `updated_at`) VALUES
	(1, 'CUST-285351', 'test', 'test', 'test@gmail.com', 'test', 'test', 'jln total persada raya', 'tanggerang', 'Banten', 'Indonesia', NULL, 'test', 0, 0.00, 0, 'corporate', 4, 'test', 0, '2026-04-01 15:28:05', '2026-04-01 15:28:05'),
	(2, 'CUST-400684', 'PT Maju Sejahtera', 'PT Maju Sejahtera Abadi', 'info@majusejahtera.com', '021-5551234', '081298765432', 'Gedung Menara Sentral, Lantai 15, Jl. Jend. Sudirman Kav. 61', 'Jakarta Selatan', 'DKI Jakarta', 'Indonesia', '12190', '01.234.567.8-901.000', 1, 2652900.00, 1, 'corporate', 9, 'Customer potensial untuk proyek jaringan FTTH', 1, '2026-04-04 15:22:39', '2026-04-04 15:34:00'),
	(3, 'CUST-407651', 'syafiqul amin', 'pt jaya abadi', 'Mukhammadsyafiqulamin@gmail.com', '085943576826', NULL, 'jln total persada raya', 'tanggerang', 'Banten', 'Indonesia', NULL, NULL, 0, 0.00, 0, 'regular', 9, NULL, 1, '2026-04-04 17:23:27', '2026-04-04 17:24:15');

-- Dumping structure for table abnan_crm.customer_accounts
CREATE TABLE IF NOT EXISTS `customer_accounts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_accounts_customer` (`customer_id`),
  UNIQUE KEY `uq_customer_accounts_email` (`email`),
  KEY `idx_customer_accounts_active` (`is_active`),
  CONSTRAINT `fk_customer_accounts_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.customer_accounts: ~3 rows (approximately)
INSERT IGNORE INTO `customer_accounts` (`id`, `customer_id`, `email`, `password_hash`, `full_name`, `phone`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
	(1, 1, 'test@gmail.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test Customer', '081234567890', 1, '2026-04-07 20:23:03', '2026-04-04 17:02:16', '2026-04-07 13:23:03'),
	(2, 2, 'info@majusejahtera.com', '$2b$10$AI4stC35eiv1BIIBFFbVeeACjPKFV34FoVJs1T8FF62kvsiAgkyHe', 'PT Maju Sejahtera', '081200000002', 0, NULL, '2026-04-04 17:18:41', '2026-04-04 17:18:41'),
	(3, 3, 'mukhammadsyafiqulamin@gmail.com', '$2b$10$7u5n05Hm8CHZmmNcJpl3B.P6UeI7qWTbc4HalrKqx2kQzZLgL3KEy', 'syafiqul amin', '085943576826', 1, NULL, '2026-04-04 17:23:27', '2026-04-04 17:24:15');

-- Dumping structure for table abnan_crm.customer_account_setups
CREATE TABLE IF NOT EXISTS `customer_account_setups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_account_id` int NOT NULL,
  `setup_token` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_account_setups_token` (`setup_token`),
  KEY `idx_customer_account_setups_account` (`customer_account_id`),
  KEY `idx_customer_account_setups_expires` (`expires_at`),
  KEY `fk_customer_account_setups_creator` (`created_by`),
  CONSTRAINT `fk_customer_account_setups_account` FOREIGN KEY (`customer_account_id`) REFERENCES `customer_accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_customer_account_setups_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.customer_account_setups: ~2 rows (approximately)
INSERT IGNORE INTO `customer_account_setups` (`id`, `customer_account_id`, `setup_token`, `expires_at`, `used_at`, `created_by`, `created_at`) VALUES
	(1, 2, '34e6f94800c054c09fa847d6077910bd0ff78451d99f3941', '2026-04-08 00:18:41', NULL, 1, '2026-04-04 17:18:41'),
	(2, 3, '52d1c58a20bc54d260b9416d1e6b76df3a8a1510a2c5cf27', '2026-04-08 00:23:28', '2026-04-05 00:24:15', 1, '2026-04-04 17:23:27');

-- Dumping structure for table abnan_crm.deals
CREATE TABLE IF NOT EXISTS `deals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lead_id` int DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `pipeline_stage_id` int NOT NULL,
  `deal_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `probability` int DEFAULT NULL,
  `currency_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IDR',
  `expected_close_date` date DEFAULT NULL,
  `actual_close_date` date DEFAULT NULL,
  `lost_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_deals_lead` (`lead_id`),
  KEY `fk_deals_assigned_to` (`assigned_to`),
  KEY `fk_deals_created_by` (`created_by`),
  KEY `idx_deals_stage_assigned` (`pipeline_stage_id`,`assigned_to`),
  KEY `idx_deals_customer` (`customer_id`),
  KEY `idx_deals_expected_close` (`expected_close_date`),
  CONSTRAINT `fk_deals_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_deals_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_deals_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_deals_lead` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_deals_stage` FOREIGN KEY (`pipeline_stage_id`) REFERENCES `pipeline_stages` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.deals: ~1 rows (approximately)
INSERT IGNORE INTO `deals` (`id`, `lead_id`, `customer_id`, `pipeline_stage_id`, `deal_name`, `value`, `probability`, `currency_code`, `expected_close_date`, `actual_close_date`, `lost_reason`, `assigned_to`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, NULL, 2, 1, 'testing', 2000000.00, NULL, 'IDR', '2026-04-05', NULL, NULL, 9, 'test', 1, '2026-04-04 17:13:44', '2026-04-06 13:22:53');

-- Dumping structure for table abnan_crm.deal_activities
CREATE TABLE IF NOT EXISTS `deal_activities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deal_id` int NOT NULL,
  `activity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `schedule_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_deal_activities_created_by` (`created_by`),
  KEY `idx_deal_activities_deal_created` (`deal_id`,`created_at`),
  CONSTRAINT `fk_deal_activities_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_deal_activities_deal` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.deal_activities: ~7 rows (approximately)
INSERT IGNORE INTO `deal_activities` (`id`, `deal_id`, `activity_type`, `description`, `schedule_at`, `created_by`, `created_at`) VALUES
	(1, 1, 'stage_change', 'Stage deal dipindahkan ke ID 1', NULL, 1, '2026-04-04 17:13:48'),
	(2, 1, 'stage_change', 'Stage deal dipindahkan ke ID 2', NULL, 1, '2026-04-04 17:13:53'),
	(3, 1, 'stage_change', 'Stage deal dipindahkan ke ID 1', NULL, 1, '2026-04-04 17:13:55'),
	(4, 1, 'stage_change', 'Stage deal dipindahkan ke ID 2', NULL, 1, '2026-04-04 17:13:59'),
	(5, 1, 'stage_change', 'Stage deal dipindahkan ke ID 1', NULL, 1, '2026-04-04 17:14:00'),
	(6, 1, 'stage_change', 'Stage deal dipindahkan ke ID 1', NULL, 1, '2026-04-04 17:22:56'),
	(7, 1, 'stage_change', 'Stage deal dipindahkan ke ID 2', NULL, 1, '2026-04-04 18:25:13'),
	(8, 1, 'stage_change', 'Stage deal dipindahkan ke ID 1', NULL, 1, '2026-04-06 13:22:53');

-- Dumping structure for table abnan_crm.discount_events
CREATE TABLE IF NOT EXISTS `discount_events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_type` enum('percent','fixed') COLLATE utf8mb4_unicode_ci DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL,
  `min_purchase` decimal(18,2) DEFAULT '0.00',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `max_usage` int DEFAULT NULL,
  `used_count` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `discount_events_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.discount_events: ~0 rows (approximately)

-- Dumping structure for table abnan_crm.documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_number` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('invoice','packing_list','bl','customs_declaration','surat_jalan','po','contract','beacukai','npwp','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int DEFAULT NULL,
  `invoice_id` int DEFAULT NULL,
  `shipment_id` int DEFAULT NULL,
  `file_url` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `issued_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `status` enum('draft','issued','sent','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `document_number` (`document_number`),
  KEY `invoice_id` (`invoice_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_documents_customer_invoice` (`customer_id`,`invoice_id`,`created_at`),
  FULLTEXT KEY `ft_documents_search` (`document_number`,`title`,`notes`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.documents: ~3 rows (approximately)
INSERT IGNORE INTO `documents` (`id`, `document_number`, `type`, `title`, `customer_id`, `invoice_id`, `shipment_id`, `file_url`, `notes`, `issued_date`, `expiry_date`, `status`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'DOC-1775057861429', 'invoice', 'test', 1, 1, NULL, NULL, 'test', '2026-04-01', NULL, 'draft', 2, '2026-04-01 15:37:41', '2026-04-01 15:37:41'),
	(2, 'DOC-INV-3', 'invoice', 'Faktur Penjualan - Invoice ', 2, 3, NULL, 'https://storage.abnan.com/documents/invoice_', 'Softcopy invoice sudah dikirim via email', '2026-04-04', NULL, 'issued', 9, '2026-04-04 15:24:24', '2026-04-04 15:24:24'),
	(3, 'PL-3', 'packing_list', 'Packing List Pengiriman', 2, 3, 2, 'https://storage.abnan.com/documents/packinglist_', 'Berisi rincian barang yang dikirim', '2026-04-04', NULL, 'issued', 9, '2026-04-04 15:24:24', '2026-04-04 15:24:24'),
	(4, 'SJ-2', 'surat_jalan', 'Surat Jalan Pengiriman', 2, 3, 2, 'https://storage.abnan.com/documents/suratjalan_', 'Surat jalan untuk pengiriman via JNE Trucking', '2026-04-04', NULL, 'issued', 9, '2026-04-04 15:24:24', '2026-04-04 15:24:24');

-- Dumping structure for table abnan_crm.document_relations
CREATE TABLE IF NOT EXISTS `document_relations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` int NOT NULL,
  `relation_label` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'attachment',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_relations_entity` (`document_id`,`entity_type`,`entity_id`,`relation_label`),
  KEY `idx_document_relations_lookup` (`entity_type`,`entity_id`),
  CONSTRAINT `fk_document_relations_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.document_relations: ~6 rows (approximately)
INSERT IGNORE INTO `document_relations` (`id`, `document_id`, `entity_type`, `entity_id`, `relation_label`, `created_at`) VALUES
	(1, 1, 'customer', 1, 'primary', '2026-04-04 15:00:46'),
	(2, 1, 'invoice', 1, 'primary', '2026-04-04 15:00:46'),
	(3, 2, 'customer', 2, 'primary', '2026-04-04 15:24:24'),
	(4, 2, 'invoice', 3, 'primary', '2026-04-04 15:24:24'),
	(5, 3, 'shipment', 2, 'attachment', '2026-04-04 15:24:24'),
	(6, 3, 'invoice', 3, 'reference', '2026-04-04 15:24:24');

-- Dumping structure for table abnan_crm.export_jobs
CREATE TABLE IF NOT EXISTS `export_jobs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `module_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `format` enum('csv','xlsx','pdf') COLLATE utf8mb4_unicode_ci NOT NULL,
  `filters` json DEFAULT NULL,
  `storage_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('queued','processing','completed','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'queued',
  `total_rows` int NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_export_jobs_created_by` (`created_by`),
  CONSTRAINT `fk_export_jobs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.export_jobs: ~2 rows (approximately)
INSERT IGNORE INTO `export_jobs` (`id`, `module_name`, `format`, `filters`, `storage_path`, `status`, `total_rows`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'customers', 'csv', '{}', 'customers.csv', 'completed', 2, 1, '2026-04-04 16:19:15', '2026-04-04 16:19:15'),
	(2, 'customers', 'csv', '{"format": "csv"}', 'customers.csv', 'completed', 2, 8, '2026-04-04 16:25:29', '2026-04-04 16:25:29');

-- Dumping structure for table abnan_crm.finance_transactions
CREATE TABLE IF NOT EXISTS `finance_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaction_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('income','expense') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(18,2) NOT NULL,
  `tax_amount` decimal(18,2) DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_ci,
  `reference_type` enum('invoice','payment','commission','operational','other') COLLATE utf8mb4_unicode_ci DEFAULT 'other',
  `reference_id` int DEFAULT NULL,
  `payment_proof_url` text COLLATE utf8mb4_unicode_ci,
  `transaction_date` date NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_number` (`transaction_number`),
  KEY `approved_by` (`approved_by`),
  KEY `created_by` (`created_by`),
  KEY `idx_finance_reference` (`reference_type`,`reference_id`,`transaction_date`),
  CONSTRAINT `finance_transactions_ibfk_1` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `finance_transactions_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.finance_transactions: ~0 rows (approximately)
INSERT IGNORE INTO `finance_transactions` (`id`, `transaction_number`, `type`, `category`, `amount`, `tax_amount`, `description`, `reference_type`, `reference_id`, `payment_proof_url`, `transaction_date`, `status`, `approved_by`, `approved_at`, `created_by`, `created_at`) VALUES
	(1, 'TRX-1775057889747', 'income', 'test', 2000000.00, 5.00, 'test', 'other', NULL, NULL, '2026-04-01', 'pending', NULL, NULL, 2, '2026-04-01 15:38:09');

-- Dumping structure for table abnan_crm.import_jobs
CREATE TABLE IF NOT EXISTS `import_jobs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `module_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('uploaded','previewed','processing','completed','failed','partial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'uploaded',
  `total_rows` int NOT NULL DEFAULT '0',
  `valid_rows` int NOT NULL DEFAULT '0',
  `invalid_rows` int NOT NULL DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_import_jobs_created_by` (`created_by`),
  CONSTRAINT `fk_import_jobs_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.import_jobs: ~0 rows (approximately)

-- Dumping structure for table abnan_crm.import_job_rows
CREATE TABLE IF NOT EXISTS `import_job_rows` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `import_job_id` bigint NOT NULL,
  `row_number` int NOT NULL,
  `raw_payload` json DEFAULT NULL,
  `mapped_payload` json DEFAULT NULL,
  `status` enum('valid','invalid','imported','skipped') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'valid',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_import_job_rows_job_status` (`import_job_id`,`status`),
  CONSTRAINT `fk_import_job_rows_job` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.import_job_rows: ~0 rows (approximately)

-- Dumping structure for table abnan_crm.invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int NOT NULL,
  `sales_id` int DEFAULT NULL,
  `status` enum('draft','sent','partial','paid','overdue','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `issue_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `paid_date` date DEFAULT NULL,
  `subtotal` decimal(18,2) DEFAULT '0.00',
  `discount_event_id` int DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `discount_amount` decimal(18,2) DEFAULT '0.00',
  `tax_percent` decimal(5,2) DEFAULT '11.00',
  `tax_amount` decimal(18,2) DEFAULT '0.00',
  `grand_total` decimal(18,2) DEFAULT '0.00',
  `amount_paid` decimal(18,2) DEFAULT '0.00',
  `amount_due` decimal(18,2) DEFAULT '0.00',
  `payment_method` enum('transfer','midtrans','indomaret','alfamart','va_bni','va_bri','va_mandiri','va_bca','cash','credit') COLLATE utf8mb4_unicode_ci DEFAULT 'transfer',
  `midtrans_order_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midtrans_snap_token` text COLLATE utf8mb4_unicode_ci,
  `midtrans_payment_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `midtrans_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `terms` text COLLATE utf8mb4_unicode_ci,
  `custom_tax_note` text COLLATE utf8mb4_unicode_ci,
  `beacukai_ref` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `idx_invoices_customer_status_date` (`customer_id`,`status`,`issue_date`),
  KEY `idx_invoices_sales_status_date` (`sales_id`,`status`,`issue_date`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`sales_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.invoices: ~4 rows (approximately)
INSERT IGNORE INTO `invoices` (`id`, `invoice_number`, `customer_id`, `sales_id`, `status`, `issue_date`, `due_date`, `paid_date`, `subtotal`, `discount_event_id`, `discount_percent`, `discount_amount`, `tax_percent`, `tax_amount`, `grand_total`, `amount_paid`, `amount_due`, `payment_method`, `midtrans_order_id`, `midtrans_snap_token`, `midtrans_payment_type`, `midtrans_status`, `notes`, `terms`, `custom_tax_note`, `beacukai_ref`, `created_at`, `updated_at`) VALUES
	(1, 'INV-2026-681112', 1, NULL, 'partial', '2026-04-01', NULL, NULL, 190000.00, NULL, 5.00, 9500.00, 11.00, 19855.00, 200355.00, 200000.00, 355.00, 'transfer', NULL, NULL, NULL, NULL, 'tes', 'Pembayaran jatuh tempo sesuai tanggal yang disepakati.', 'PPN 11% sesuai peraturan perpajakan yang berlaku.', NULL, '2026-04-01 15:34:41', '2026-04-01 15:36:56'),
	(2, 'INV-2026-103553', 2, 9, 'partial', '2026-04-04', '2026-04-18', NULL, 13650000.00, NULL, 0.00, 0.00, 11.00, 1501500.00, 15151500.00, 10000000.00, 5151500.00, 'transfer', NULL, NULL, NULL, NULL, 'Pengadaan 2 unit switch Huawei S5700 + 1 unit firewall Juniper SRX300', 'Pembayaran termin: 10jt dimuka, sisanya setelah barang terkirim.', NULL, NULL, '2026-04-04 15:22:58', '2026-04-04 15:22:58'),
	(3, 'INV-2026-515488', 2, 9, 'partial', '2026-04-04', '2026-04-18', NULL, 13650000.00, NULL, 0.00, 0.00, 11.00, 1501500.00, 15151500.00, 10000000.00, 5151500.00, 'transfer', NULL, NULL, NULL, NULL, 'Pengadaan 2 unit switch Huawei S5700 + 1 unit firewall Juniper SRX300', 'Pembayaran termin: 10jt dimuka, sisanya setelah barang terkirim.', NULL, NULL, '2026-04-04 15:24:24', '2026-04-04 15:24:24'),
	(4, 'INV-2026-637808', 2, 9, 'paid', '2026-04-04', '2026-04-05', '2026-04-04', 2390000.00, NULL, 0.00, 0.00, 11.00, 262900.00, 2652900.00, 200000000.00, 0.00, 'midtrans', NULL, NULL, NULL, NULL, NULL, 'Pembayaran jatuh tempo sesuai tanggal yang disepakati.', 'PPN 11% sesuai peraturan perpajakan yang berlaku.', NULL, '2026-04-04 15:30:37', '2026-04-04 15:34:00');

-- Dumping structure for table abnan_crm.invoice_items
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pcs',
  `unit_price` decimal(18,2) NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `total` decimal(18,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.invoice_items: ~5 rows (approximately)
INSERT IGNORE INTO `invoice_items` (`id`, `invoice_id`, `product_id`, `description`, `quantity`, `unit`, `unit_price`, `discount_percent`, `total`) VALUES
	(1, 1, NULL, '111', 1.000, 'pcs', 200000.00, 5.00, 190000.00),
	(2, 2, 3, 'Switch Huawei S5700-24 Gigabit', 2.000, 'pcs', 3450000.00, 0.00, 6900000.00),
	(3, 2, 4, 'Firewall Juniper SRX300', 1.000, 'unit', 6750000.00, 0.00, 6750000.00),
	(4, 3, 3, 'Switch Huawei S5700-24 Gigabit', 2.000, 'pcs', 3450000.00, 0.00, 6900000.00),
	(5, 3, 4, 'Firewall Juniper SRX300', 1.000, 'unit', 6750000.00, 0.00, 6750000.00),
	(6, 4, 7, 'Access Point Huawei AP7060DN', 1.000, 'pcs', 2390000.00, 0.00, 2390000.00);

-- Dumping structure for table abnan_crm.knowledge_base
CREATE TABLE IF NOT EXISTS `knowledge_base` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `excerpt` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta_title` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `meta_description` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `cover_image_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tags` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '1',
  `published_at` datetime DEFAULT NULL,
  `view_count` int DEFAULT '0',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_knowledge_base_slug` (`slug`),
  KEY `created_by` (`created_by`),
  FULLTEXT KEY `ft_knowledge_base_search` (`title`,`content`,`tags`),
  CONSTRAINT `knowledge_base_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.knowledge_base: ~5 rows (approximately)
INSERT IGNORE INTO `knowledge_base` (`id`, `category`, `title`, `slug`, `content`, `excerpt`, `meta_title`, `meta_description`, `cover_image_url`, `tags`, `is_published`, `published_at`, `view_count`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'Produk', 'Agroplush - Peralatan Pertanian', 'agroplush-peralatan-pertanian', 'Agroplush menyediakan solusi peralatan pertanian berkualitas tinggi untuk kebutuhan agrikultur modern. PT Abnan Inti Trans adalah distributor resmi Agroplush di Indonesia.', '', '', '', '', 'agroplush,pertanian,alat', 1, '2026-04-01 22:04:34', 0, 1, '2026-04-01 15:04:34', '2026-04-04 15:13:32'),
	(2, 'Produk', 'Huawei - Peralatan Telekomunikasi', 'huawei-peralatan-telekomunikasi', 'Huawei menyediakan perangkat networking dan telekomunikasi enterprise. Kami melayani pengadaan switch, router, dan perangkat jaringan Huawei.', '', '', '', '', 'huawei,networking,telecom', 1, '2026-04-01 22:04:34', 0, 1, '2026-04-01 15:04:34', '2026-04-04 15:13:32'),
	(3, 'Produk', 'Juniper Networks', 'juniper-networks', 'Juniper Networks adalah solusi jaringan enterprise tier-1. PT Abnan Inti Trans melayani import dan distribusi perangkat Juniper.', '', '', '', '', 'juniper,networking', 1, '2026-04-01 22:04:34', 0, 1, '2026-04-01 15:04:34', '2026-04-04 15:13:32'),
	(4, 'Produk', 'ZTE - Perangkat Telekomunikasi', 'zte-perangkat-telekomunikasi', 'ZTE menyediakan solusi telekomunikasi komprehensif. Kami melayani pengadaan perangkat ZTE untuk infrastruktur jaringan.', '', '', '', '', 'zte,telecom', 1, '2026-04-01 22:04:34', 0, 1, '2026-04-01 15:04:34', '2026-04-04 15:13:32'),
	(5, 'Layanan', 'Export Import Process', 'export-import-process', 'PT Abnan Inti Trans berpengalaman 3 tahun dalam export-import. Kami menangani customs clearance, dokumentasi beacukai, dan negosiasi harga global.', '', '', '', '', 'export,import,customs', 1, '2026-04-01 22:04:34', 0, 1, '2026-04-01 15:04:34', '2026-04-04 15:13:32');

-- Dumping structure for table abnan_crm.leads
CREATE TABLE IF NOT EXISTS `leads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `region` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `assigned_to` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_leads_customer` (`customer_id`),
  KEY `fk_leads_assigned_to` (`assigned_to`),
  KEY `fk_leads_created_by` (`created_by`),
  KEY `idx_leads_status_assigned` (`status`,`assigned_to`),
  KEY `idx_leads_contact_email` (`contact_email`),
  KEY `idx_leads_region` (`region`),
  CONSTRAINT `fk_leads_assigned_to` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leads_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_leads_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.leads: ~0 rows (approximately)

-- Dumping structure for table abnan_crm.notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `is_read` tinyint(1) DEFAULT '0',
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read_created` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.notifications: ~2 rows (approximately)
INSERT IGNORE INTO `notifications` (`id`, `user_id`, `type`, `title`, `message`, `is_read`, `link`, `created_at`) VALUES
	(1, 8, 'payment', 'Pembayaran Invoice Masuk', 'Pembayaran Rp10.000.000 untuk invoice INV-2026-515488 sudah diverifikasi.', 0, '/invoices/view?id=3', '2026-04-04 15:24:24'),
	(2, 9, 'system', 'Data customer berhasil dibuat', 'Customer PT Maju Sejahtera telah ditambahkan ke sistem.', 0, '/customers/view?id=2', '2026-04-04 15:24:24');

-- Dumping structure for table abnan_crm.payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `payment_date` datetime NOT NULL,
  `payment_method` enum('transfer','midtrans','indomaret','alfamart','va_bni','va_bri','va_mandiri','va_bca','cash') COLLATE utf8mb4_unicode_ci DEFAULT 'transfer',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proof_image_url` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `verified_by` int DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `verified_by` (`verified_by`),
  KEY `created_by` (`created_by`),
  KEY `idx_payments_invoice_status_date` (`invoice_id`,`status`,`payment_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.payments: ~4 rows (approximately)
INSERT IGNORE INTO `payments` (`id`, `invoice_id`, `amount`, `payment_date`, `payment_method`, `reference_number`, `proof_image_url`, `status`, `verified_by`, `verified_at`, `notes`, `created_by`, `created_at`) VALUES
	(1, 1, 200000.00, '2026-04-01 15:36:00', 'transfer', 'INV-2026-681112', NULL, 'verified', 2, '2026-04-01 22:36:56', NULL, 2, '2026-04-01 15:36:52'),
	(2, 2, 10000000.00, '2026-04-04 22:22:58', 'transfer', 'REF-1775316178', NULL, 'verified', 8, '2026-04-04 22:22:58', 'Pembayaran termin pertama via transfer bank', 9, '2026-04-04 15:22:58'),
	(3, 3, 10000000.00, '2026-04-04 22:24:24', 'transfer', 'REF-1775316264', NULL, 'verified', 8, '2026-04-04 22:24:24', 'Pembayaran termin pertama via transfer bank', 9, '2026-04-04 15:24:24'),
	(4, 4, 200000000.00, '2026-04-04 15:31:00', 'transfer', '123', NULL, 'verified', 1, '2026-04-04 22:34:00', NULL, 9, '2026-04-04 15:32:43');

-- Dumping structure for table abnan_crm.payment_requests
CREATE TABLE IF NOT EXISTS `payment_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `requested_by` int NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `status` enum('pending_sm','approved_sm','rejected_sm','pending_finance','paid','rejected_finance') COLLATE utf8mb4_unicode_ci DEFAULT 'pending_sm',
  `sm_review_by` int DEFAULT NULL,
  `sm_review_at` datetime DEFAULT NULL,
  `sm_notes` text COLLATE utf8mb4_unicode_ci,
  `finance_review_by` int DEFAULT NULL,
  `finance_review_at` datetime DEFAULT NULL,
  `finance_notes` text COLLATE utf8mb4_unicode_ci,
  `paid_at` datetime DEFAULT NULL,
  `payment_proof_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `requested_by` (`requested_by`),
  KEY `sm_review_by` (`sm_review_by`),
  KEY `finance_review_by` (`finance_review_by`),
  CONSTRAINT `payment_requests_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  CONSTRAINT `payment_requests_ibfk_2` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`),
  CONSTRAINT `payment_requests_ibfk_3` FOREIGN KEY (`sm_review_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payment_requests_ibfk_4` FOREIGN KEY (`finance_review_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.payment_requests: ~0 rows (approximately)

-- Dumping structure for table abnan_crm.permissions
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.permissions: ~14 rows (approximately)
INSERT IGNORE INTO `permissions` (`id`, `name`, `resource`, `action`, `description`, `created_at`) VALUES
	(1, 'view_customers', 'customers', 'view', 'View customer data', '2026-04-04 15:00:46'),
	(2, 'create_customers', 'customers', 'create', 'Create customer', '2026-04-04 15:00:46'),
	(3, 'edit_customers', 'customers', 'edit', 'Edit customer', '2026-04-04 15:00:46'),
	(4, 'delete_customers', 'customers', 'delete', 'Delete customer', '2026-04-04 15:00:46'),
	(5, 'view_invoices', 'invoices', 'view', 'View invoice', '2026-04-04 15:00:46'),
	(6, 'create_invoices', 'invoices', 'create', 'Create invoice', '2026-04-04 15:00:46'),
	(7, 'edit_invoices', 'invoices', 'edit', 'Edit invoice', '2026-04-04 15:00:46'),
	(8, 'view_finance', 'finance', 'view', 'View finance', '2026-04-04 15:00:46'),
	(9, 'approve_payments', 'payments', 'approve', 'Approve payment', '2026-04-04 15:00:46'),
	(10, 'manage_shipments', 'shipments', 'manage', 'Manage shipment', '2026-04-04 15:00:46'),
	(11, 'manage_documents', 'documents', 'manage', 'Manage document', '2026-04-04 15:00:46'),
	(12, 'view_analytics', 'analytics', 'view', 'View analytics', '2026-04-04 15:00:46'),
	(13, 'manage_pipeline', 'pipeline', 'manage', 'Manage sales pipeline', '2026-04-04 15:00:46'),
	(14, 'manage_roles', 'rbac', 'manage', 'Manage roles and permissions', '2026-04-04 15:00:46');

-- Dumping structure for table abnan_crm.pipeline_stages
CREATE TABLE IF NOT EXISTS `pipeline_stages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_num` int NOT NULL,
  `probability` int NOT NULL DEFAULT '0',
  `is_closed` tinyint(1) NOT NULL DEFAULT '0',
  `is_won` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `uq_pipeline_stage_order` (`order_num`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.pipeline_stages: ~6 rows (approximately)
INSERT IGNORE INTO `pipeline_stages` (`id`, `name`, `code`, `order_num`, `probability`, `is_closed`, `is_won`, `is_active`, `created_at`, `updated_at`) VALUES
	(1, 'Prospecting', 'prospecting', 1, 10, 0, 0, 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(2, 'Qualification', 'qualification', 2, 25, 0, 0, 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(3, 'Proposal', 'proposal', 3, 50, 0, 0, 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(4, 'Negotiation', 'negotiation', 4, 75, 0, 0, 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(5, 'Closed Won', 'closed_won', 5, 100, 1, 1, 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(6, 'Closed Lost', 'closed_lost', 6, 0, 1, 0, 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46');

-- Dumping structure for table abnan_crm.products
CREATE TABLE IF NOT EXISTS `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pcs',
  `price_buy` decimal(18,2) DEFAULT NULL,
  `price_sell` decimal(18,2) DEFAULT NULL,
  `stock_qty` int DEFAULT '0',
  `min_order` int DEFAULT '1',
  `hs_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_of_origin` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `weight_kg` decimal(10,3) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `image_url` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.products: ~8 rows (approximately)
INSERT IGNORE INTO `products` (`id`, `sku`, `name`, `brand`, `category`, `description`, `unit`, `price_buy`, `price_sell`, `stock_qty`, `min_order`, `hs_code`, `country_of_origin`, `weight_kg`, `is_active`, `image_url`, `created_at`, `updated_at`) VALUES
	(1, 'TEST_001', 'testt3ts', 't3st', 'ttgst', 'test', 'pcs', 12000000.00, 14000000.00, 10, 2, 'test', 'test', 500.000, 1, NULL, '2026-04-01 15:31:51', '2026-04-01 15:31:51'),
	(2, 'AGRO-TRACTOR-01', 'Traktor Mini Agroplush 4WD', 'Agroplush', 'Peralatan Pertanian', 'Traktor mini 4WD untuk lahan sawit dan padi, kapasitas 20 HP, efisiensi bahan bakar', 'unit', 45000000.00, 52500000.00, 15, 1, '8701.90', 'China', 850.000, 1, NULL, '2026-04-04 15:18:26', '2026-04-04 15:18:26'),
	(3, 'HUAWEI-S5700-24', 'Switch Huawei S5700-24 Port Gigabit', 'Huawei', 'Networking', 'Managed switch 24 port Gigabit Ethernet, layer 3, support stacking', 'pcs', 2850000.00, 3450000.00, 50, 1, '8517.62', 'China', 3.500, 1, NULL, '2026-04-04 15:18:26', '2026-04-04 15:18:26'),
	(4, 'JUNIPER-SRX300', 'Firewall Juniper SRX300', 'Juniper Networks', 'Network Security', 'Next-gen firewall, throughput 1 Gbps, IPS, VPN', 'unit', 5200000.00, 6750000.00, 20, 1, '8517.62', 'USA', 1.800, 1, NULL, '2026-04-04 15:18:26', '2026-04-04 15:18:26'),
	(5, 'ZTE-MA5600', 'OLT ZTE MA5600 GPON', 'ZTE', 'Telekomunikasi', 'OLT 16 port GPON, support FTTH, redaman rendah', 'unit', 12750000.00, 15980000.00, 8, 1, '8517.62', 'China', 12.000, 1, NULL, '2026-04-04 15:18:26', '2026-04-04 15:18:26'),
	(6, 'DRONE-AGRO-X1', 'Drone Sprayer Agroplush X1', 'Agroplush', 'Peralatan Pertanian', 'Drone pertanian kapasitas 20 liter, auto spray, GPS, terbang 30 menit', 'set', 82500000.00, 98500000.00, 5, 1, '8806.21', 'China', 25.000, 1, NULL, '2026-04-04 15:18:26', '2026-04-04 15:18:26'),
	(7, 'HUAWEI-AP7060', 'Access Point Huawei AP7060DN', 'Huawei', 'Networking', 'AP WiFi 6, dual-band, support 100+ clients, POE', 'pcs', 1850000.00, 2390000.00, 100, 2, '8517.62', 'China', 0.650, 1, NULL, '2026-04-04 15:18:26', '2026-04-04 15:18:26'),
	(8, 'JUNIPER-MX204', 'Universal Routing Platform Juniper MX204', 'Juniper Networks', 'Networking', 'Router high-end 400 Gbps, 4 port QSFP28, MPLS ready', 'unit', 185000000.00, 225000000.00, 2, 1, '8517.62', 'USA', 15.400, 1, NULL, '2026-04-04 15:18:26', '2026-04-04 15:18:26');

-- Dumping structure for table abnan_crm.roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_system` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.roles: ~5 rows (approximately)
INSERT IGNORE INTO `roles` (`id`, `name`, `description`, `is_system`, `created_at`, `updated_at`) VALUES
	(1, 'super_admin', 'Full system access', 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(2, 'general_manager', 'Executive access across departments', 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(3, 'sales_manager', 'Sales management access', 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(4, 'sales', 'Sales operational access', 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46'),
	(5, 'finance', 'Finance and payment approval access', 1, '2026-04-04 15:00:46', '2026-04-04 15:00:46');

-- Dumping structure for table abnan_crm.role_permissions
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `fk_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.role_permissions: ~48 rows (approximately)
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`) VALUES
	(1, 1),
	(2, 1),
	(3, 1),
	(4, 1),
	(1, 2),
	(2, 2),
	(3, 2),
	(4, 2),
	(1, 3),
	(2, 3),
	(3, 3),
	(4, 3),
	(1, 4),
	(1, 5),
	(2, 5),
	(3, 5),
	(4, 5),
	(5, 5),
	(1, 6),
	(2, 6),
	(3, 6),
	(4, 6),
	(1, 7),
	(2, 7),
	(3, 7),
	(4, 7),
	(1, 8),
	(2, 8),
	(5, 8),
	(1, 9),
	(2, 9),
	(5, 9),
	(1, 10),
	(2, 10),
	(3, 10),
	(5, 10),
	(1, 11),
	(2, 11),
	(3, 11),
	(5, 11),
	(1, 12),
	(2, 12),
	(3, 12),
	(1, 13),
	(2, 13),
	(3, 13),
	(4, 13),
	(1, 14);

-- Dumping structure for table abnan_crm.shipments
CREATE TABLE IF NOT EXISTS `shipments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tracking_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` int DEFAULT NULL,
  `invoice_id` int DEFAULT NULL,
  `type` enum('import','export') COLLATE utf8mb4_unicode_ci DEFAULT 'export',
  `status` enum('pending','processing','shipped','in_transit','customs','delivered','returned','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `origin` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `carrier` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimated_arrival` date DEFAULT NULL,
  `actual_arrival` date DEFAULT NULL,
  `weight_kg` decimal(10,3) DEFAULT NULL,
  `volume_cbm` decimal(10,3) DEFAULT NULL,
  `container_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hs_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customs_status` enum('pending','cleared','held','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tracking_id` (`tracking_id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_shipments_customer_status` (`customer_id`,`status`,`created_at`),
  CONSTRAINT `shipments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `shipments_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `shipments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.shipments: ~2 rows (approximately)
INSERT IGNORE INTO `shipments` (`id`, `tracking_id`, `customer_id`, `invoice_id`, `type`, `status`, `origin`, `destination`, `carrier`, `estimated_arrival`, `actual_arrival`, `weight_kg`, `volume_cbm`, `container_number`, `bl_number`, `hs_code`, `customs_status`, `notes`, `created_by`, `created_at`, `updated_at`) VALUES
	(1, 'SHIP-1775057076887', NULL, NULL, 'export', 'pending', 'test', 'test', 'test', NULL, NULL, NULL, NULL, 'test', 'test', 'test', 'pending', 'test', 2, '2026-04-01 15:24:36', '2026-04-01 15:24:36'),
	(2, 'SHIP-1775316264', 2, 3, 'export', 'delivered', 'Gudang Jakarta Utara, Jl. Cakung Cilincing Raya No. 88', 'Jl. Jend. Sudirman Kav. 61, Jakarta Selatan', 'JNE Trucking', '2026-04-07', NULL, 25.500, 0.800, NULL, NULL, NULL, 'pending', 'Pengiriman via JNE Trucking, resi akan diinfokan', 9, '2026-04-04 15:24:24', '2026-04-04 15:33:16');

-- Dumping structure for table abnan_crm.tax_reports
CREATE TABLE IF NOT EXISTS `tax_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `period_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_income` decimal(18,2) DEFAULT '0.00',
  `total_tax_collected` decimal(18,2) DEFAULT '0.00',
  `total_expense` decimal(18,2) DEFAULT '0.00',
  `total_tax_paid` decimal(18,2) DEFAULT '0.00',
  `net_tax` decimal(18,2) DEFAULT '0.00',
  `status` enum('draft','submitted','approved') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `submitted_by` int DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `submitted_by` (`submitted_by`),
  CONSTRAINT `tax_reports_ibfk_1` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.tax_reports: ~1 rows (approximately)
INSERT IGNORE INTO `tax_reports` (`id`, `period_start`, `period_end`, `period_name`, `total_income`, `total_tax_collected`, `total_expense`, `total_tax_paid`, `net_tax`, `status`, `submitted_by`, `submitted_at`, `notes`, `created_at`) VALUES
	(1, '2026-04-01', '2026-04-01', 'test periode', 0.00, 0.00, 0.00, 0.00, 0.00, 'submitted', 2, '2026-04-01 22:38:43', NULL, '2026-04-01 15:38:37');

-- Dumping structure for table abnan_crm.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('super_admin','general_manager','sales_manager','sales','finance') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'sales',
  `role_id` int DEFAULT NULL,
  `position` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` text COLLATE utf8mb4_unicode_ci,
  `join_date` date DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `fk_users_role_id` (`role_id`),
  CONSTRAINT `fk_users_role_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.users: ~8 rows (approximately)
INSERT IGNORE INTO `users` (`id`, `employee_id`, `full_name`, `email`, `phone`, `role`, `role_id`, `position`, `department`, `avatar_url`, `join_date`, `is_active`, `password_hash`, `last_login`, `created_at`, `updated_at`) VALUES
	(1, 'ADM001', 'Super Admin', 'admin@abnanintitrans.com', NULL, 'super_admin', 1, 'Super Administrator', 'IT', NULL, NULL, 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-07 21:11:43', '2026-04-01 15:04:34', '2026-04-07 14:11:43'),
	(2, 'GM001', 'Budi Santoso', 'gm@abnanintitrans.com', NULL, 'general_manager', 2, 'General Manager', 'Management', NULL, NULL, 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-05 01:40:32', '2026-04-01 15:04:34', '2026-04-04 18:40:32'),
	(3, 'SM001', 'Saripin', 'sm@abnanintitrans.com', NULL, 'sales_manager', 3, 'Sales Manager', 'Sales', NULL, NULL, 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-01 23:42:05', '2026-04-01 15:04:34', '2026-04-04 14:48:35'),
	(4, 'SL001', 'Awinet', 'awinet@abnanintitrans.com', NULL, 'sales', 4, 'Sales Executive', 'Sales', NULL, NULL, 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-02 00:32:40', '2026-04-01 15:04:34', '2026-04-04 14:48:35'),
	(5, 'SL002', 'Fen', 'fen@abnanintitrans.com', NULL, 'sales', 4, 'Sales Executive', 'Sales', NULL, NULL, 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, '2026-04-01 15:04:34', '2026-04-04 14:48:35'),
	(6, 'SL003', 'Raju', 'raju@abnanintitrans.com', NULL, 'sales', 4, 'Sales Executive', 'Sales', NULL, NULL, 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, '2026-04-01 15:04:34', '2026-04-04 14:48:35'),
	(7, 'SL004', 'Tink Net', 'tinknet@abnanintitrans.com', NULL, 'sales', 4, 'Sales Executive', 'Sales', NULL, NULL, 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', NULL, '2026-04-01 15:04:34', '2026-04-04 14:48:35'),
	(8, 'FIN001', 'Dewi Rahayu', 'finance@abnanintitrans.com', NULL, 'finance', 5, 'Finance Manager', 'Finance', NULL, NULL, 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-04 23:24:53', '2026-04-01 15:04:34', '2026-04-04 16:24:53'),
	(9, 'SL005', 'Steven Wijaya', 'steven@abnanintitrans.com', '081234567890', 'sales', 4, 'Sales Executive', 'Sales', NULL, '2026-04-04', 1, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2026-04-04 23:06:00', '2026-04-04 15:18:26', '2026-04-04 16:06:00');

-- Dumping structure for table abnan_crm.user_permissions
CREATE TABLE IF NOT EXISTS `user_permissions` (
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  `is_allowed` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `fk_user_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_user_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_permissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table abnan_crm.user_permissions: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
