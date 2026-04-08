const pool = require('../config/db');

class ImportExportRepository {
  static async createExportJob(data) {
    const [result] = await pool.query(
      `INSERT INTO export_jobs (module_name, format, filters, status, total_rows, created_by)
       VALUES (?, ?, ?, 'processing', 0, ?)`,
      [data.module_name, data.format, JSON.stringify(data.filters || {}), data.created_by || null]
    );
    return result.insertId;
  }

  static async completeExportJob(jobId, storagePath, totalRows) {
    await pool.query(
      `UPDATE export_jobs
       SET status = 'completed', storage_path = ?, total_rows = ?, updated_at = NOW()
       WHERE id = ?`,
      [storagePath || null, totalRows || 0, jobId]
    );
  }

  static async failExportJob(jobId) {
    await pool.query(`UPDATE export_jobs SET status = 'failed', updated_at = NOW() WHERE id = ?`, [jobId]);
  }

  static async createImportJob(data) {
    const [result] = await pool.query(
      `INSERT INTO import_jobs (module_name, source_filename, status, total_rows, valid_rows, invalid_rows, created_by)
       VALUES (?, ?, 'previewed', ?, ?, ?, ?)`,
      [
        data.module_name,
        data.source_filename,
        data.total_rows || 0,
        data.valid_rows || 0,
        data.invalid_rows || 0,
        data.created_by || null,
      ]
    );
    return result.insertId;
  }

  static async insertImportJobRows(importJobId, rows) {
    for (const row of rows) {
      await pool.query(
        `INSERT INTO import_job_rows (import_job_id, row_number, raw_payload, mapped_payload, status, error_message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          importJobId,
          row.row_number,
          JSON.stringify(row.raw_payload || {}),
          JSON.stringify(row.mapped_payload || {}),
          row.status,
          row.error_message || null,
        ]
      );
    }
  }

  static async getImportRows(importJobId) {
    const [rows] = await pool.query(
      `SELECT * FROM import_job_rows WHERE import_job_id = ? ORDER BY row_number ASC`,
      [importJobId]
    );
    return rows;
  }

  static async completeImportJob(importJobId, validRows, invalidRows, status) {
    await pool.query(
      `UPDATE import_jobs
       SET status = ?, valid_rows = ?, invalid_rows = ?, updated_at = NOW()
       WHERE id = ?`,
      [status, validRows, invalidRows, importJobId]
    );
  }

  static async createCustomerFromImport(data) {
    const code = `CUST-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 100)}`;
    const [result] = await pool.query(
      `INSERT INTO customers
        (code, name, company_name, email, phone, whatsapp, address, city, province, country, postal_code, npwp, category, assigned_sales_id, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        data.name,
        data.company_name || null,
        data.email || null,
        data.phone || null,
        data.whatsapp || null,
        data.address || null,
        data.city || null,
        data.province || null,
        data.country || 'Indonesia',
        data.postal_code || null,
        data.npwp || null,
        data.category || 'regular',
        data.assigned_sales_id || null,
        data.notes || null,
      ]
    );
    return result.insertId;
  }
}

module.exports = ImportExportRepository;
