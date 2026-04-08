const pool = require('../config/db');

class Customer360Repository {
  static async findCustomerById(customerId) {
    const [rows] = await pool.query(
      `SELECT c.*, u.full_name AS sales_name, u.employee_id AS sales_employee_id
       FROM customers c
       LEFT JOIN users u ON u.id = c.assigned_sales_id
       WHERE c.id = ?`,
      [customerId]
    );
    return rows[0] || null;
  }

  static async getInvoiceSummary(customerId) {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total_invoices,
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_invoices,
         SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_invoices,
         COALESCE(SUM(grand_total), 0) AS total_invoice_value,
         COALESCE(SUM(amount_paid), 0) AS total_paid_amount,
         COALESCE(SUM(amount_due), 0) AS outstanding_amount,
         MAX(issue_date) AS last_invoice_date
       FROM invoices
       WHERE customer_id = ?`,
      [customerId]
    );
    return rows[0] || {};
  }

  static async getShipmentSummary(customerId) {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total_shipments,
         SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS delivered_shipments,
         SUM(CASE WHEN status IN ('pending', 'processing', 'shipped', 'in_transit', 'customs') THEN 1 ELSE 0 END) AS active_shipments,
         MAX(created_at) AS last_shipment_date
       FROM shipments
       WHERE customer_id = ?`,
      [customerId]
    );
    return rows[0] || {};
  }

  static async getDocumentSummary(customerId) {
    const [rows] = await pool.query(
      `SELECT
         COUNT(DISTINCT d.id) AS total_documents,
         MAX(d.created_at) AS last_document_date
       FROM documents d
       LEFT JOIN invoices i ON i.id = d.invoice_id
       LEFT JOIN shipments s ON s.id = d.shipment_id
       WHERE d.customer_id = ?
          OR i.customer_id = ?
          OR s.customer_id = ?`,
      [customerId, customerId, customerId]
    );
    return rows[0] || {};
  }

  static async getRecentInvoices(customerId, limit = 5) {
    const [rows] = await pool.query(
      `SELECT i.id, i.invoice_number, i.status, i.issue_date, i.due_date, i.grand_total, i.amount_paid, i.amount_due, i.created_at
       FROM invoices i
       WHERE i.customer_id = ?
       ORDER BY i.created_at DESC
       LIMIT ?`,
      [customerId, limit]
    );
    return rows;
  }

  static async getRecentPayments(customerId, limit = 5) {
    const [rows] = await pool.query(
      `SELECT p.id, p.invoice_id, p.amount, p.payment_date, p.payment_method, p.status, p.reference_number, p.created_at,
              i.invoice_number
       FROM payments p
       INNER JOIN invoices i ON i.id = p.invoice_id
       WHERE i.customer_id = ?
       ORDER BY p.payment_date DESC, p.created_at DESC
       LIMIT ?`,
      [customerId, limit]
    );
    return rows;
  }

  static async getRecentShipments(customerId, limit = 5) {
    const [rows] = await pool.query(
      `SELECT s.id, s.tracking_id, s.status, s.type, s.origin, s.destination, s.carrier,
              s.estimated_arrival, s.actual_arrival, s.created_at, i.invoice_number
       FROM shipments s
       LEFT JOIN invoices i ON i.id = s.invoice_id
       WHERE s.customer_id = ?
       ORDER BY s.created_at DESC
       LIMIT ?`,
      [customerId, limit]
    );
    return rows;
  }

  static async getRecentDocuments(customerId, limit = 5) {
    const [rows] = await pool.query(
      `SELECT DISTINCT
              d.id,
              d.document_number,
              d.type,
              d.title,
              d.status,
              d.issued_date,
              d.expiry_date,
              d.created_at
       FROM documents d
       LEFT JOIN invoices i ON i.id = d.invoice_id
       LEFT JOIN shipments s ON s.id = d.shipment_id
       WHERE d.customer_id = ?
          OR i.customer_id = ?
          OR s.customer_id = ?
       ORDER BY d.created_at DESC
       LIMIT ?`,
      [customerId, customerId, customerId, limit]
    );
    return rows;
  }

  static async getRecentActivities(customerId, limit = 10) {
    const [rows] = await pool.query(
      `SELECT a.id, a.action, a.entity_type, a.entity_id, a.description, a.created_at, u.full_name AS actor_name
       FROM activities a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE (a.entity_type = 'customer' AND a.entity_id = ?)
          OR (a.entity_type = 'invoice' AND a.entity_id IN (
                SELECT id FROM invoices WHERE customer_id = ?
             ))
          OR (a.entity_type = 'shipment' AND a.entity_id IN (
                SELECT id FROM shipments WHERE customer_id = ?
             ))
          OR (a.entity_type = 'document' AND a.entity_id IN (
                SELECT d.id
                FROM documents d
                LEFT JOIN invoices i ON i.id = d.invoice_id
                LEFT JOIN shipments s ON s.id = d.shipment_id
                WHERE d.customer_id = ?
                   OR i.customer_id = ?
                   OR s.customer_id = ?
             ))
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [customerId, customerId, customerId, customerId, customerId, customerId, limit]
    );
    return rows;
  }

  static async getPurchasedProducts(customerId, limit = 10) {
    const [rows] = await pool.query(
      `SELECT
         COALESCE(p.id, 0) AS product_id,
         COALESCE(p.name, ii.description) AS product_name,
         p.sku,
         p.brand,
         SUM(ii.quantity) AS total_quantity,
         SUM(ii.total) AS total_value,
         COUNT(DISTINCT ii.invoice_id) AS invoice_count,
         MAX(i.issue_date) AS last_purchase_date
       FROM invoice_items ii
       INNER JOIN invoices i ON i.id = ii.invoice_id
       LEFT JOIN products p ON p.id = ii.product_id
       WHERE i.customer_id = ?
       GROUP BY COALESCE(p.id, 0), COALESCE(p.name, ii.description), p.sku, p.brand
       ORDER BY total_value DESC, last_purchase_date DESC
       LIMIT ?`,
      [customerId, limit]
    );
    return rows;
  }
}

module.exports = Customer360Repository;
