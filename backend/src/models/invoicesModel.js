const pool = require('../config/db');

class InvoicesModel {
  static async getAll(filters = {}, pagination = {}) {
    let q = `SELECT i.*,c.name as customer_name,c.company_name,u.full_name as sales_name,u.employee_id as sales_emp_id FROM invoices i LEFT JOIN customers c ON i.customer_id=c.id LEFT JOIN users u ON i.sales_id=u.id WHERE 1=1`;
    const p = [];
    if (filters.status) { q += ' AND i.status=?'; p.push(filters.status); }
    if (filters.sales_id) { q += ' AND i.sales_id=?'; p.push(filters.sales_id); }
    if (filters.customer_id) { q += ' AND i.customer_id=?'; p.push(filters.customer_id); }
    if (filters.search) { q += ' AND (i.invoice_number LIKE ? OR c.name LIKE ?)'; p.push(`%${filters.search}%`, `%${filters.search}%`); }
    if (filters.date_from) { q += ' AND i.issue_date>=?'; p.push(filters.date_from); }
    if (filters.date_to) { q += ' AND i.issue_date<=?'; p.push(filters.date_to); }
    q += ' ORDER BY i.created_at DESC';
    const [[{total}]] = await pool.query(q.replace(/SELECT .+? FROM/,'SELECT COUNT(*) as total FROM').replace(/ORDER BY.+/,''), p);
    if (pagination.limit) { q += ' LIMIT ? OFFSET ?'; p.push(pagination.limit, pagination.offset||0); }
    const [rows] = await pool.query(q, p);
    return { invoices: rows, total };
  }

  static async getById(id) {
    const [[inv]] = await pool.query(`SELECT i.*,c.name as customer_name,c.company_name,c.email as cust_email,c.phone as cust_phone,c.address as cust_address,c.npwp,u.full_name as sales_name FROM invoices i LEFT JOIN customers c ON i.customer_id=c.id LEFT JOIN users u ON i.sales_id=u.id WHERE i.id=?`, [id]);
    if (!inv) return null;
    const [items] = await pool.query(`SELECT ii.*,p.name as product_name,p.sku FROM invoice_items ii LEFT JOIN products p ON ii.product_id=p.id WHERE ii.invoice_id=?`, [id]);
    inv.items = items;
    return inv;
  }

  static async create(data) {
    const num = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const items = data.items || [];
    const subtotal = items.reduce((s, i) => s + (i.quantity * i.unit_price * (1 - (i.discount_percent||0)/100)), 0);
    const discAmt = subtotal * ((data.discount_percent||0)/100);
    const taxable = subtotal - discAmt;
    const taxAmt = taxable * ((data.tax_percent||11)/100);
    const grand = taxable + taxAmt;

    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      const [res] = await conn.query(
        `INSERT INTO invoices (invoice_number,customer_id,sales_id,status,issue_date,due_date,subtotal,discount_percent,discount_amount,tax_percent,tax_amount,grand_total,amount_due,payment_method,notes,terms,custom_tax_note) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [num,data.customer_id,data.sales_id||null,data.status||'draft',data.issue_date,data.due_date||null,subtotal,data.discount_percent||0,discAmt,data.tax_percent||11,taxAmt,grand,grand,data.payment_method||'transfer',data.notes||null,data.terms||null,data.custom_tax_note||null]
      );
      const invId = res.insertId;
      for (const item of items) {
        const tot = item.quantity * item.unit_price * (1 - (item.discount_percent||0)/100);
        await conn.query(`INSERT INTO invoice_items (invoice_id,product_id,description,quantity,unit,unit_price,discount_percent,total) VALUES (?,?,?,?,?,?,?,?)`,
          [invId, item.product_id||null, item.description, item.quantity, item.unit||'pcs', item.unit_price, item.discount_percent||0, tot]);
      }
      await conn.commit();
      return this.getById(invId);
    } catch(e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  }

  static async update(id, data) {
    const fields = [], p = [];
    ['status','due_date','paid_date','payment_method','notes','terms','discount_percent','tax_percent','midtrans_order_id','midtrans_snap_token','midtrans_payment_type','midtrans_status','amount_paid','amount_due','custom_tax_note','beacukai_ref'].forEach(f => {
      if (data[f] !== undefined) { fields.push(`${f}=?`); p.push(data[f]); }
    });
    if (!fields.length) return null;
    p.push(id);
    await pool.query(`UPDATE invoices SET ${fields.join(',')},updated_at=NOW() WHERE id=?`, p);
    return this.getById(id);
  }

  static async delete(id) {
    await pool.query('DELETE FROM invoices WHERE id=?', [id]);
    return true;
  }

  static async getStats(filters = {}) {
    let where = '1=1'; const p = [];
    if (filters.sales_id) { where += ' AND sales_id=?'; p.push(filters.sales_id); }
    if (filters.date_from) { where += ' AND issue_date>=?'; p.push(filters.date_from); }
    if (filters.date_to) { where += ' AND issue_date<=?'; p.push(filters.date_to); }
    const [rows] = await pool.query(`SELECT status,COUNT(*) as cnt,COALESCE(SUM(grand_total),0) as amt FROM invoices WHERE ${where} GROUP BY status`, p);
    const stats = { total: { cnt: 0, amt: 0 } };
    rows.forEach(r => {
      stats[r.status] = { cnt: r.cnt, amt: parseFloat(r.amt) };
      stats.total.cnt += r.cnt; stats.total.amt += parseFloat(r.amt);
    });
    return stats;
  }
}

module.exports = InvoicesModel;
