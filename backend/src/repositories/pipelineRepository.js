const pool = require('../config/db');

class PipelineRepository {
  static async getStages() {
    const [rows] = await pool.query(
      `SELECT id, name, code, order_num, probability, is_closed, is_won, is_active
       FROM pipeline_stages
       WHERE is_active = TRUE
       ORDER BY order_num ASC`
    );
    return rows;
  }

  static async getLeads(filters = {}) {
    let sql = `
      SELECT l.*, u.full_name AS assigned_to_name, c.name AS customer_name
      FROM leads l
      LEFT JOIN users u ON u.id = l.assigned_to
      LEFT JOIN customers c ON c.id = l.customer_id
      WHERE 1 = 1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (l.company_name LIKE ? OR l.contact_name LIKE ? OR l.contact_email LIKE ? OR l.contact_phone LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.assigned_to) {
      sql += ` AND l.assigned_to = ?`;
      params.push(filters.assigned_to);
    }
    if (filters.status) {
      sql += ` AND l.status = ?`;
      params.push(filters.status);
    }

    sql += ` ORDER BY l.created_at DESC`;
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async createLead(data) {
    const [result] = await pool.query(
      `INSERT INTO leads
        (company_name, contact_name, contact_email, contact_phone, source, status, region, customer_id, assigned_to, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.company_name,
        data.contact_name || null,
        data.contact_email || null,
        data.contact_phone || null,
        data.source || 'manual',
        data.status || 'new',
        data.region || null,
        data.customer_id || null,
        data.assigned_to || null,
        data.notes || null,
        data.created_by || null,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM leads WHERE id = ?`, [result.insertId]);
    return rows[0];
  }

  static async getDeals(filters = {}) {
    let sql = `
      SELECT
        d.*,
        ps.name AS stage_name,
        ps.code AS stage_code,
        ps.order_num,
        ps.probability AS stage_probability,
        u.full_name AS assigned_to_name,
        l.company_name AS lead_company_name,
        c.name AS customer_name
      FROM deals d
      INNER JOIN pipeline_stages ps ON ps.id = d.pipeline_stage_id
      LEFT JOIN users u ON u.id = d.assigned_to
      LEFT JOIN leads l ON l.id = d.lead_id
      LEFT JOIN customers c ON c.id = d.customer_id
      WHERE 1 = 1
    `;
    const params = [];

    if (filters.search) {
      sql += ` AND (d.deal_name LIKE ? OR l.company_name LIKE ? OR c.name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.assigned_to) {
      sql += ` AND d.assigned_to = ?`;
      params.push(filters.assigned_to);
    }
    if (filters.pipeline_stage_id) {
      sql += ` AND d.pipeline_stage_id = ?`;
      params.push(filters.pipeline_stage_id);
    }

    sql += ` ORDER BY ps.order_num ASC, d.updated_at DESC`;
    const [rows] = await pool.query(sql, params);
    return rows;
  }

  static async createDeal(data) {
    const [result] = await pool.query(
      `INSERT INTO deals
        (lead_id, customer_id, pipeline_stage_id, deal_name, value, probability, currency_code, expected_close_date, actual_close_date, lost_reason, assigned_to, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.lead_id || null,
        data.customer_id || null,
        data.pipeline_stage_id,
        data.deal_name,
        data.value || 0,
        data.probability || null,
        data.currency_code || 'IDR',
        data.expected_close_date || null,
        data.actual_close_date || null,
        data.lost_reason || null,
        data.assigned_to || null,
        data.notes || null,
        data.created_by || null,
      ]
    );

    const [rows] = await pool.query(`SELECT * FROM deals WHERE id = ?`, [result.insertId]);
    return rows[0];
  }

  static async updateDealStage(dealId, stageId) {
    await pool.query(
      `UPDATE deals
       SET pipeline_stage_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [stageId, dealId]
    );
    const [rows] = await pool.query(`SELECT * FROM deals WHERE id = ?`, [dealId]);
    return rows[0] || null;
  }

  static async findLeadById(leadId) {
    const [rows] = await pool.query(`SELECT * FROM leads WHERE id = ?`, [leadId]);
    return rows[0] || null;
  }

  static async updateLeadStatus(leadId, status) {
    await pool.query(`UPDATE leads SET status = ?, updated_at = NOW() WHERE id = ?`, [status, leadId]);
  }

  static async getFirstOpenStage() {
    const [rows] = await pool.query(
      `SELECT * FROM pipeline_stages
       WHERE is_active = TRUE AND is_closed = FALSE
       ORDER BY order_num ASC
       LIMIT 1`
    );
    return rows[0] || null;
  }

  static async addDealActivity(data) {
    await pool.query(
      `INSERT INTO deal_activities (deal_id, activity_type, description, schedule_at, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.deal_id,
        data.activity_type || 'note',
        data.description || null,
        data.schedule_at || null,
        data.created_by || null,
      ]
    );
  }
}

module.exports = PipelineRepository;
