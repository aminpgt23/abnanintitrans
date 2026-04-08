const pool = require('../config/db');

class SearchRepository {
  static async searchCustomers(term, requester, limit) {
    const params = [`%${term}%`, `%${term}%`, `%${term}%`, `%${term}%`];
    let sql = `
      SELECT
        c.id,
        'customer' AS entity_type,
        c.name AS title,
        COALESCE(c.company_name, c.email, c.phone, c.code) AS subtitle,
        c.category AS status,
        CONCAT('/customers/', c.id) AS url,
        c.updated_at AS occurred_at
      FROM customers c
      WHERE (c.name LIKE ? OR c.company_name LIKE ? OR c.email LIKE ? OR c.code LIKE ?)
    `;

    if (requester?.role === 'sales') {
      sql += ' AND c.assigned_sales_id = ?';
      params.push(requester.id);
    }

    sql += ' ORDER BY c.updated_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async searchInvoices(term, requester, limit) {
    const params = [`%${term}%`, `%${term}%`];
    let sql = `
      SELECT
        i.id,
        'invoice' AS entity_type,
        i.invoice_number AS title,
        CONCAT(COALESCE(c.name, 'No customer'), ' - ', FORMAT(i.grand_total, 0)) AS subtitle,
        i.status AS status,
        CONCAT('/invoices?highlight=', i.id) AS url,
        i.updated_at AS occurred_at
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id
      WHERE (i.invoice_number LIKE ? OR c.name LIKE ?)
    `;

    if (requester?.role === 'sales') {
      sql += ' AND i.sales_id = ?';
      params.push(requester.id);
    }

    sql += ' ORDER BY i.updated_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async searchShipments(term, requester, limit) {
    const params = [`%${term}%`, `%${term}%`, `%${term}%`];
    let sql = `
      SELECT
        s.id,
        'shipment' AS entity_type,
        s.tracking_id AS title,
        CONCAT(COALESCE(c.name, 'No customer'), ' - ', COALESCE(s.destination, '-')) AS subtitle,
        s.status AS status,
        CONCAT('/shipments?highlight=', s.id) AS url,
        s.updated_at AS occurred_at
      FROM shipments s
      LEFT JOIN customers c ON c.id = s.customer_id
      LEFT JOIN invoices i ON i.id = s.invoice_id
      WHERE (s.tracking_id LIKE ? OR c.name LIKE ? OR COALESCE(s.destination, '') LIKE ?)
    `;

    if (requester?.role === 'sales') {
      sql += ' AND (c.assigned_sales_id = ? OR i.sales_id = ?)';
      params.push(requester.id, requester.id);
    }

    sql += ' ORDER BY s.updated_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async searchDocuments(term, requester, limit) {
    const params = [`%${term}%`, `%${term}%`, `%${term}%`];
    let sql = `
      SELECT
        d.id,
        'document' AS entity_type,
        d.title AS title,
        CONCAT(d.document_number, ' - ', d.type) AS subtitle,
        d.status AS status,
        CONCAT('/documents?highlight=', d.id) AS url,
        d.updated_at AS occurred_at
      FROM documents d
      LEFT JOIN customers c ON c.id = d.customer_id
      LEFT JOIN invoices i ON i.id = d.invoice_id
      WHERE (d.title LIKE ? OR d.document_number LIKE ? OR COALESCE(c.name, '') LIKE ?)
    `;

    if (requester?.role === 'sales') {
      sql += ' AND (c.assigned_sales_id = ? OR i.sales_id = ?)';
      params.push(requester.id, requester.id);
    }

    sql += ' ORDER BY d.updated_at DESC LIMIT ?';
    params.push(limit);

    const [rows] = await pool.query(sql, params);
    return rows;
  }
}

module.exports = SearchRepository;
