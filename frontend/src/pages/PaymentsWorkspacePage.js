import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Plus,
  Receipt,
  Search,
  ShieldCheck,
  Wallet,
  XCircle,
} from 'lucide-react';
import { invoicesAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { formatDate, formatDateTime, formatRupiah, statusColor, statusLabel } from '../utils/format';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h3 className="text-lg font-black tracking-tight text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
            Tutup
          </button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint, tone = 'blue' }) {
  const palette = {
    blue: 'from-blue-600 to-sky-500',
    emerald: 'from-emerald-600 to-teal-400',
    amber: 'from-amber-500 to-yellow-400',
    rose: 'from-rose-600 to-orange-400',
  };

  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-black tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{hint}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${palette[tone] || palette.blue} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function PaymentsWorkspacePage() {
  const { hasRole } = useAuth();
  const { locale } = useUI();
  const isEnglish = locale === 'en';
  const [payments, setPayments] = useState([]);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'transfer',
    reference_number: '',
    notes: '',
    payment_date: new Date().toISOString().slice(0, 16),
  });

  const load = async () => {
    setLoading(true);
    try {
      const [paymentsRes, invoicesRes] = await Promise.all([
        paymentsAPI.getAll({ limit: 100 }),
        invoicesAPI.getAll({ limit: 100 }),
      ]);
      const paymentRows = paymentsRes.data.data || [];
      setPayments(paymentRows);
      setInvoiceOptions(invoicesRes.data.data?.invoices || []);
      if (!selectedId && paymentRows[0]?.id) setSelectedId(paymentRows[0].id);
    } catch {
      toast.error(isEnglish ? 'Failed to load payments' : 'Gagal memuat pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredPayments = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesStatus = statusFilter === 'all' || String(payment.status || 'pending') === statusFilter;
      const matchesSearch = !needle || [payment.invoice_number, payment.customer_name, payment.reference_number, payment.payment_method]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [payments, search, statusFilter]);

  useEffect(() => {
    if (!filteredPayments.length) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!filteredPayments.some((payment) => payment.id === selectedId)) setSelectedId(filteredPayments[0].id);
  }, [filteredPayments, selectedId]);

  const selectedPayment = filteredPayments.find((payment) => payment.id === selectedId) || filteredPayments[0] || null;

  const summary = useMemo(() => {
    const verified = payments.filter((payment) => payment.status === 'verified');
    const pending = payments.filter((payment) => (payment.status || 'pending') === 'pending');
    return {
      captured: payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      verifiedAmount: verified.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
      pendingCount: pending.length,
      avgTicket: payments.length ? payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) / payments.length : 0,
    };
  }, [payments]);

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      await paymentsAPI.create(form);
      toast.success(isEnglish ? 'Payment recorded' : 'Pembayaran dicatat');
      setShowModal(false);
      setForm({ invoice_id: '', amount: '', payment_method: 'transfer', reference_number: '', notes: '', payment_date: new Date().toISOString().slice(0, 16) });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || (isEnglish ? 'Failed to save payment' : 'Gagal menyimpan pembayaran'));
    }
  };

  const handleVerify = async (id, status) => {
    try {
      await paymentsAPI.verify(id, { status });
      toast.success(isEnglish ? 'Payment status updated' : 'Status pembayaran diperbarui');
      load();
    } catch {
      toast.error(isEnglish ? 'Failed to update status' : 'Gagal memperbarui status');
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.24),_transparent_35%),linear-gradient(135deg,#0f172a,#1e293b_45%,#14532d)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-100/80">Payment Operations</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              {isEnglish ? 'Capture incoming funds, verify evidence, and reconcile invoices faster' : 'Catat dana masuk, verifikasi bukti, dan rekonsiliasi invoice dengan lebih cepat'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200">
              {isEnglish
                ? 'Use this page to record incoming payments, link them to invoices, verify proof of transfer, and close payment records that are ready for reconciliation.'
                : 'Gunakan halaman ini untuk mencatat pembayaran masuk, menghubungkannya ke invoice, memverifikasi bukti transfer, dan menutup record yang siap direkonsiliasi.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02]">
                <Plus className="h-4 w-4" />
                {isEnglish ? 'Record Payment' : 'Catat Pembayaran'}
              </button>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100">
                {isEnglish ? 'Pending reviews' : 'Pending review'}: <span className="font-black">{summary.pendingCount}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Captured Cash' : 'Captured Cash'}</p>
              <p className="mt-3 text-3xl font-black">{formatRupiah(summary.captured)}</p>
              <p className="mt-2 text-sm text-slate-200">{isEnglish ? 'All payment records' : 'Seluruh catatan pembayaran'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Verified Amount' : 'Verified Amount'}</p>
              <p className="mt-3 text-3xl font-black">{formatRupiah(summary.verifiedAmount)}</p>
              <p className="mt-2 text-sm text-slate-200">{isEnglish ? 'Ready for closeout' : 'Siap untuk closeout'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md md:col-span-2">
              <div className="grid gap-3 sm:grid-cols-3">
                <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Pending Queue' : 'Pending Queue'}</p><p className="mt-2 text-2xl font-black">{summary.pendingCount}</p></div>
                <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Average Ticket' : 'Average Ticket'}</p><p className="mt-2 text-2xl font-black">{formatRupiah(summary.avgTicket)}</p></div>
                <div><p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">{isEnglish ? 'Linked Invoices' : 'Linked Invoices'}</p><p className="mt-2 text-2xl font-black">{payments.filter((payment) => payment.invoice_id).length}</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Wallet} label={isEnglish ? 'Captured' : 'Captured'} value={formatRupiah(summary.captured)} hint={isEnglish ? 'Gross recorded payments' : 'Nilai bruto pembayaran tercatat'} tone="blue" />
        <MetricCard icon={ShieldCheck} label={isEnglish ? 'Verified' : 'Verified'} value={formatRupiah(summary.verifiedAmount)} hint={isEnglish ? 'Approved and matched' : 'Sudah disetujui dan matched'} tone="emerald" />
        <MetricCard icon={Receipt} label={isEnglish ? 'Pending' : 'Pending'} value={summary.pendingCount} hint={isEnglish ? 'Need finance review' : 'Menunggu review finance'} tone="amber" />
        <MetricCard icon={Landmark} label={isEnglish ? 'Avg Ticket' : 'Avg Ticket'} value={formatRupiah(summary.avgTicket)} hint={isEnglish ? 'Average payment size' : 'Rata-rata nilai pembayaran'} tone="rose" />
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">{isEnglish ? 'Reconciliation Control' : 'Reconciliation Control'}</h2>
            <p className="mt-1 text-sm text-slate-500">{isEnglish ? 'Filter the queue by reference completeness or review status' : 'Filter antrean berdasarkan kelengkapan referensi atau status review'}</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative md:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isEnglish ? 'Search invoice, customer, ref...' : 'Cari invoice, customer, ref...'} className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-300" />
            </div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300">
              <option value="all">{isEnglish ? 'All statuses' : 'Semua status'}</option>
              <option value="pending">{isEnglish ? 'Pending' : 'Pending'}</option>
              <option value="verified">{isEnglish ? 'Verified' : 'Verified'}</option>
              <option value="rejected">{isEnglish ? 'Rejected' : 'Rejected'}</option>
            </select>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">{isEnglish ? 'Payment Queue' : 'Payment Queue'}</h2>
              <p className="mt-1 text-sm text-slate-500">{isEnglish ? 'Prioritize records that need verification or missing references' : 'Prioritaskan record yang butuh verifikasi atau referensi belum lengkap'}</p>
            </div>
            <CreditCard className="h-5 w-5 text-slate-400" />
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="flex h-40 items-center justify-center rounded-[1.5rem] bg-slate-50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div>
            ) : filteredPayments.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                {isEnglish ? 'No payments match the current filter.' : 'Tidak ada pembayaran yang cocok dengan filter saat ini.'}
              </div>
            ) : (
              filteredPayments.map((payment) => (
                <button key={payment.id} type="button" onClick={() => setSelectedId(payment.id)} className={`w-full rounded-[1.5rem] border p-4 text-left transition ${selectedPayment?.id === payment.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor(payment.status || 'pending')}`}>{statusLabel(payment.status || 'pending')}</span>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">{payment.payment_method?.replaceAll('_', ' ') || 'transfer'}</span>
                      </div>
                      <p className="mt-3 text-base font-black tracking-tight text-slate-900">{payment.invoice_number || `INV #${payment.invoice_id}`}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span>{payment.customer_name || '-'}</span>
                        <span>{payment.reference_number || (isEnglish ? 'No reference' : 'Tanpa referensi')}</span>
                        <span>{formatDateTime(payment.payment_date)}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                      <p className="text-lg font-black text-emerald-600">{formatRupiah(payment.amount || 0)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          {selectedPayment ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor(selectedPayment.status || 'pending')}`}>{statusLabel(selectedPayment.status || 'pending')}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">{selectedPayment.payment_method?.replaceAll('_', ' ') || 'transfer'}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{selectedPayment.invoice_number || `INV #${selectedPayment.invoice_id}`}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedPayment.customer_name || '-'} | {formatDateTime(selectedPayment.payment_date)}</p>
                </div>
                {hasRole('finance', 'general_manager', 'super_admin') && (selectedPayment.status || 'pending') === 'pending' ? (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleVerify(selectedPayment.id, 'verified')} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      {isEnglish ? 'Verify' : 'Verifikasi'}
                    </button>
                    <button onClick={() => handleVerify(selectedPayment.id, 'rejected')} className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-rose-700">
                      <XCircle className="h-4 w-4" />
                      {isEnglish ? 'Reject' : 'Tolak'}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard icon={CircleDollarSign} label={isEnglish ? 'Amount' : 'Amount'} value={formatRupiah(selectedPayment.amount || 0)} hint={isEnglish ? 'Recorded payment value' : 'Nilai pembayaran tercatat'} tone="emerald" />
                <MetricCard icon={Calendar} label={isEnglish ? 'Payment Date' : 'Payment Date'} value={formatDate(selectedPayment.payment_date)} hint={isEnglish ? 'Effective transfer date' : 'Tanggal efektif pembayaran'} tone="blue" />
                <MetricCard icon={Receipt} label={isEnglish ? 'Reference' : 'Reference'} value={selectedPayment.reference_number || '-'} hint={isEnglish ? 'Bank slip / proof number' : 'Nomor bukti / slip'} tone="amber" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{isEnglish ? 'Invoice Link' : 'Invoice Link'}</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3"><span>{isEnglish ? 'Invoice' : 'Invoice'}</span><span className="font-bold text-slate-900">{selectedPayment.invoice_number || `INV #${selectedPayment.invoice_id}`}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>{isEnglish ? 'Customer' : 'Customer'}</span><span className="font-bold text-slate-900">{selectedPayment.customer_name || '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>{isEnglish ? 'Company' : 'Company'}</span><span className="font-bold text-slate-900">{selectedPayment.company_name || '-'}</span></div>
                  </div>
                </div>
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{isEnglish ? 'Audit Notes' : 'Audit Notes'}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-200">{selectedPayment.notes || (isEnglish ? 'No additional payment note.' : 'Belum ada catatan tambahan pembayaran.')}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              {isEnglish ? 'Select a payment record to review details.' : 'Pilih record pembayaran untuk melihat detail review.'}
            </div>
          )}
        </div>
      </section>

      {showModal ? (
        <Modal title={isEnglish ? 'Record Payment' : 'Catat Pembayaran'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Invoice</label>
              <select
                required
                value={form.invoice_id}
                onChange={(event) => {
                  const invoice = invoiceOptions.find((item) => String(item.id) === event.target.value);
                  setForm((current) => ({
                    ...current,
                    invoice_id: event.target.value,
                    amount: current.amount || String(invoice?.amount_due || invoice?.grand_total || ''),
                  }));
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold"
              >
                <option value="">{isEnglish ? 'Select invoice' : 'Pilih invoice'}</option>
                {invoiceOptions.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoice_number} - {invoice.customer_name} - {isEnglish ? 'Outstanding' : 'Sisa'} {formatRupiah(invoice.amount_due || 0)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">{isEnglish ? 'Amount' : 'Jumlah'}</label>
              <input type="number" required value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">{isEnglish ? 'Method' : 'Metode'}</label>
              <select value={form.payment_method} onChange={(event) => setForm((current) => ({ ...current, payment_method: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">
                {['transfer', 'midtrans', 'indomaret', 'alfamart', 'va_bni', 'va_bri', 'va_mandiri', 'va_bca', 'cash'].map((method) => (
                  <option key={method} value={method}>{method.replaceAll('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">{isEnglish ? 'Reference Number' : 'No. Referensi'}</label>
              <input value={form.reference_number} onChange={(event) => setForm((current) => ({ ...current, reference_number: event.target.value }))} placeholder={isEnglish ? 'Bank slip / payment proof' : 'No. bukti bayar'} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            </div>
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">{isEnglish ? 'Date & Time' : 'Tanggal & Jam'}</label>
              <input type="datetime-local" required value={form.payment_date} onChange={(event) => setForm((current) => ({ ...current, payment_date: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">{isEnglish ? 'Notes' : 'Catatan'}</label>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder={isEnglish ? 'What should finance know about this payment?' : 'Apa yang perlu diketahui finance tentang pembayaran ini?'} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold" />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600">{isEnglish ? 'Cancel' : 'Batal'}</button>
              <button type="submit" className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">{isEnglish ? 'Save Payment' : 'Simpan Pembayaran'}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
