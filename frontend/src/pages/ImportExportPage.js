import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileSpreadsheet, Import, UploadCloud } from 'lucide-react';
import { importExportAPI } from '../services/api';

function downloadBlob(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
}

export default function ImportExportPage() {
  const [format, setFormat] = useState('csv');
  const [uploadFile, setUploadFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loadingExport, setLoadingExport] = useState('');
  const [loadingImport, setLoadingImport] = useState(false);

  const previewSummary = useMemo(() => ({
    total: preview?.total_rows || 0,
    valid: preview?.valid_rows || 0,
    invalid: preview?.invalid_rows || 0,
  }), [preview]);

  const handleExport = async (moduleName) => {
    setLoadingExport(moduleName);
    try {
      const response = await importExportAPI.exportModule(moduleName, { format });
      const contentDisposition = response.headers['content-disposition'] || '';
      const matchedFileName = contentDisposition.match(/filename="(.+)"/);
      const fileName = matchedFileName?.[1] || `${moduleName}.${format}`;
      downloadBlob(response.data, fileName);
      toast.success(`Export ${moduleName} berhasil`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Gagal export ${moduleName}`);
    } finally {
      setLoadingExport('');
    }
  };

  const handlePreviewImport = async () => {
    if (!uploadFile) return toast.error('Pilih file CSV/XLSX terlebih dahulu');

    setLoadingImport(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      const response = await importExportAPI.previewCustomerImport(formData);
      setPreview(response.data.data);
      toast.success('Preview import berhasil dibuat');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat preview import');
    } finally {
      setLoadingImport(false);
    }
  };

  const handleCommitImport = async () => {
    if (!preview?.import_job_id) return;

    setLoadingImport(true);
    try {
      const response = await importExportAPI.commitCustomerImport({ import_job_id: preview.import_job_id });
      toast.success(`Import selesai: ${response.data.data.imported_rows} baris masuk`);
      setPreview(null);
      setUploadFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menjalankan import');
    } finally {
      setLoadingImport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Import / Export</h1>
        <p className="mt-1 text-sm text-gray-500">Ekspor customer, invoice, finance. Import customer dengan preview validasi terlebih dahulu.</p>
      </div>

      <section className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Export Data</h2>
            <p className="text-sm text-gray-500">Pilih modul dan format file yang dibutuhkan user/admin.</p>
          </div>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm">
            <option value="csv">CSV</option>
            <option value="xlsx">Excel (XLSX)</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {['customers', 'invoices', 'finance'].map((moduleName) => (
            <button
              key={moduleName}
              onClick={() => handleExport(moduleName)}
              disabled={loadingExport === moduleName}
              className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5 text-left transition hover:bg-gray-100 disabled:opacity-60"
            >
              <Download className="mb-3 h-5 w-5 text-blue-500" />
              <p className="text-sm font-bold text-gray-900 capitalize">{moduleName}</p>
              <p className="mt-1 text-xs text-gray-500">{loadingExport === moduleName ? 'Sedang menyiapkan file...' : `Export ke ${format.toUpperCase()}`}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900">Import Customer</h2>
          <p className="text-sm text-gray-500">Upload file CSV/XLSX customer, preview hasil mapping, lalu commit jika sudah benar.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <UploadCloud className="h-4 w-4 text-blue-500" />
            <span>{uploadFile ? uploadFile.name : 'Pilih file CSV/XLSX customer'}</span>
            <input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
          <button onClick={handlePreviewImport} disabled={loadingImport || !uploadFile} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            Preview Import
          </button>
          <button onClick={handleCommitImport} disabled={loadingImport || !preview?.import_job_id} className="rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            Commit Import
          </button>
        </div>

        {preview && (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Total Row</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{previewSummary.total}</p>
              </div>
              <div className="rounded-2xl border border-green-200 bg-green-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-500">Valid</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{previewSummary.valid}</p>
              </div>
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">Invalid</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{previewSummary.invalid}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Preview Baris Import</p>
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Row</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Perusahaan</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(preview.rows || []).map((row) => (
                      <tr key={row.row_number} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-gray-500">{row.row_number}</td>
                        <td className="px-4 py-3 text-gray-900">{row.mapped_payload?.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{row.mapped_payload?.company_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{row.mapped_payload?.email || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'valid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-red-500">{row.error_message || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
