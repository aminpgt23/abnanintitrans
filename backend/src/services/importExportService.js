const XLSX = require('xlsx');
const ImportExportRepository = require('../repositories/importExportRepository');
const pool = require('../config/db');

const CUSTOMER_COLUMN_MAP = {
  name: 'name',
  customername: 'name',
  nama: 'name',
  company: 'company_name',
  companyname: 'company_name',
  perusahaan: 'company_name',
  email: 'email',
  phone: 'phone',
  nomorhp: 'phone',
  whatsapp: 'whatsapp',
  address: 'address',
  alamat: 'address',
  city: 'city',
  kota: 'city',
  province: 'province',
  provinsi: 'province',
  country: 'country',
  negara: 'country',
  postalcode: 'postal_code',
  kodepos: 'postal_code',
  npwp: 'npwp',
  category: 'category',
  kategori: 'category',
  notes: 'notes',
  catatan: 'notes',
};

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

class ImportExportService {
  static async exportModule(moduleName, format, requester, filters = {}) {
    const allowedModules = ['customers', 'invoices', 'finance'];
    const allowedFormats = ['csv', 'xlsx'];

    if (!allowedModules.includes(moduleName)) {
      const error = new Error('Module export tidak didukung');
      error.status = 400;
      throw error;
    }

    if (!allowedFormats.includes(format)) {
      const error = new Error('Format export belum didukung');
      error.status = 400;
      throw error;
    }

    const jobId = await ImportExportRepository.createExportJob({
      module_name: moduleName,
      format,
      filters,
      created_by: requester?.id || null,
    });

    try {
      const rows = await this.fetchExportRows(moduleName, requester, filters);
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, moduleName);

      const buffer = format === 'xlsx'
        ? XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
        : Buffer.from(XLSX.utils.sheet_to_csv(worksheet), 'utf8');

      await ImportExportRepository.completeExportJob(jobId, `${moduleName}.${format}`, rows.length);

      return {
        fileName: `${moduleName}-${new Date().toISOString().slice(0, 10)}.${format}`,
        mimeType: format === 'xlsx'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv; charset=utf-8',
        buffer,
      };
    } catch (error) {
      await ImportExportRepository.failExportJob(jobId);
      throw error;
    }
  }

  static async fetchExportRows(moduleName, requester, filters) {
    if (moduleName === 'customers') {
      const params = [];
      let sql = `
        SELECT
          c.code,
          c.name,
          c.company_name,
          c.email,
          c.phone,
          c.whatsapp,
          c.city,
          c.province,
          c.country,
          c.category,
          u.full_name AS sales_name,
          c.total_purchases,
          c.total_transactions,
          c.created_at
        FROM customers c
        LEFT JOIN users u ON u.id = c.assigned_sales_id
        WHERE 1 = 1
      `;
      if (requester?.role === 'sales') {
        sql += ' AND c.assigned_sales_id = ?';
        params.push(requester.id);
      }
      sql += ' ORDER BY c.created_at DESC';
      const [rows] = await pool.query(sql, params);
      return rows;
    }

    if (moduleName === 'invoices') {
      const params = [];
      let sql = `
        SELECT
          i.invoice_number,
          c.name AS customer_name,
          c.company_name,
          i.status,
          i.issue_date,
          i.due_date,
          i.grand_total,
          i.amount_paid,
          i.amount_due,
          i.payment_method,
          u.full_name AS sales_name
        FROM invoices i
        LEFT JOIN customers c ON c.id = i.customer_id
        LEFT JOIN users u ON u.id = i.sales_id
        WHERE 1 = 1
      `;
      if (requester?.role === 'sales') {
        sql += ' AND i.sales_id = ?';
        params.push(requester.id);
      }
      sql += ' ORDER BY i.created_at DESC';
      const [rows] = await pool.query(sql, params);
      return rows;
    }

    const [rows] = await pool.query(
      `SELECT
         transaction_number,
         type,
         category,
         amount,
         tax_amount,
         reference_type,
         reference_id,
         transaction_date,
         status,
         description
       FROM finance_transactions
       ORDER BY created_at DESC`
    );
    return rows;
  }

  static previewCustomerImport(file, requester) {
    if (!file?.buffer) {
      const error = new Error('File import wajib diunggah');
      error.status = 400;
      throw error;
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

    const previewRows = rawRows.map((rawRow, index) => {
      const mapped = {};
      for (const [key, value] of Object.entries(rawRow)) {
        const normalized = normalizeHeader(key);
        const targetField = CUSTOMER_COLUMN_MAP[normalized];
        if (targetField) mapped[targetField] = value;
      }

      const errors = [];
      if (!String(mapped.name || '').trim()) errors.push('Nama customer wajib diisi');
      if (mapped.email && !String(mapped.email).includes('@')) errors.push('Format email tidak valid');

      return {
        row_number: index + 2,
        raw_payload: rawRow,
        mapped_payload: mapped,
        status: errors.length ? 'invalid' : 'valid',
        error_message: errors.join('; ') || null,
      };
    });

    const validRows = previewRows.filter((row) => row.status === 'valid').length;
    const invalidRows = previewRows.length - validRows;

    return {
      module_name: 'customers',
      source_filename: file.originalname,
      total_rows: previewRows.length,
      valid_rows: validRows,
      invalid_rows: invalidRows,
      rows: previewRows,
      detected_columns: rawRows[0] ? Object.keys(rawRows[0]) : [],
      field_mapping: CUSTOMER_COLUMN_MAP,
      created_by: requester?.id || null,
    };
  }

  static async saveCustomerImportPreview(file, requester) {
    const preview = this.previewCustomerImport(file, requester);
    const importJobId = await ImportExportRepository.createImportJob(preview);
    await ImportExportRepository.insertImportJobRows(importJobId, preview.rows);
    return { import_job_id: importJobId, ...preview };
  }

  static async commitCustomerImport(importJobId) {
    const rows = await ImportExportRepository.getImportRows(importJobId);
    if (!rows.length) {
      const error = new Error('Preview import tidak ditemukan');
      error.status = 404;
      throw error;
    }

    let imported = 0;
    let invalid = 0;

    for (const row of rows) {
      if (row.status !== 'valid') {
        invalid += 1;
        continue;
      }

      const payload = JSON.parse(row.mapped_payload || '{}');
      await ImportExportRepository.createCustomerFromImport(payload);
      imported += 1;
    }

    await ImportExportRepository.completeImportJob(importJobId, imported, invalid, invalid > 0 ? 'partial' : 'completed');

    return {
      import_job_id: importJobId,
      imported_rows: imported,
      invalid_rows: invalid,
      status: invalid > 0 ? 'partial' : 'completed',
    };
  }
}

module.exports = ImportExportService;
