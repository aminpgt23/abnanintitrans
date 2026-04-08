const pool = require('../config/db');

class CustomersModel {
  static async getAll(filters = {}, pagination = {}) {
    let q = `SELECT c.*,u.full_name as sales_name,u.employee_id as sales_emp_id FROM customers c LEFT JOIN users u ON c.assigned_sales_id=u.id WHERE 1=1`;
    const p = [];
    if (filters.search) { q += ' AND (c.name LIKE ? OR c.company_name LIKE ? OR c.email LIKE ? OR c.code LIKE ?)'; p.push(...Array(4).fill(`%${filters.search}%`)); }
    if (filters.category) { q += ' AND c.category=?'; p.push(filters.category); }
    if (filters.assigned_sales_id) { q += ' AND c.assigned_sales_id=?'; p.push(filters.assigned_sales_id); }
    q += ` ORDER BY c.created_at DESC`;
    const [[{total}]] = await pool.query(q.replace(/SELECT .+? FROM/,'SELECT COUNT(*) as total FROM').replace(/ORDER BY.+/,''), p);
    if (pagination.limit) { q += ' LIMIT ? OFFSET ?'; p.push(pagination.limit, pagination.offset||0); }
    const [rows] = await pool.query(q, p);
    return { customers: rows, total };
  }

  static async getById(id) {
    const [r] = await pool.query(`SELECT c.*,u.full_name as sales_name FROM customers c LEFT JOIN users u ON c.assigned_sales_id=u.id WHERE c.id=?`, [id]);
    return r[0];
  }

  static async create(data) {
    const code = `CUST-${Date.now().toString().slice(-6)}`;
    const [res] = await pool.query(
      `INSERT INTO customers (code,name,company_name,email,phone,whatsapp,address,city,province,country,postal_code,npwp,category,assigned_sales_id,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [code,data.name,data.company_name||null,data.email||null,data.phone||null,data.whatsapp||null,data.address||null,data.city||null,data.province||null,data.country||'Indonesia',data.postal_code||null,data.npwp||null,data.category||'regular',data.assigned_sales_id||null,data.notes||null]
    );
    return this.getById(res.insertId);
  }

  static async update(id, data) {
    const fields = [], p = [];
    ['name','company_name','email','phone','whatsapp','address','city','province','country','postal_code','npwp','category','assigned_sales_id','notes','rating'].forEach(f => {
      if (data[f] !== undefined) { fields.push(`${f}=?`); p.push(data[f]); }
    });
    if (!fields.length) return null;
    p.push(id);
    await pool.query(`UPDATE customers SET ${fields.join(',')},updated_at=NOW() WHERE id=?`, p);
    return this.getById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM customers WHERE id=?', [id]);
    return true;
  }

  static async recalcRating(customerId) {
    const [[row]] = await pool.query(`SELECT SUM(grand_total) as total,COUNT(*) as cnt FROM invoices WHERE customer_id=? AND status='paid'`, [customerId]);
    const total = row.total || 0, cnt = row.cnt || 0;
    let rating = 0;
    if (cnt >= 20 || total >= 500000000) rating = 5;
    else if (cnt >= 10 || total >= 200000000) rating = 4;
    else if (cnt >= 5 || total >= 50000000) rating = 3;
    else if (cnt >= 2 || total >= 10000000) rating = 2;
    else if (cnt >= 1) rating = 1;
    await pool.query(`UPDATE customers SET rating=?,total_purchases=?,total_transactions=? WHERE id=?`, [rating, total, cnt, customerId]);
    return rating;
  }
}

module.exports = CustomersModel;
