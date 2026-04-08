import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowUpRight,
  Calendar,
  Copy,
  CreditCard,
  FileText,
  Layers3,
  Package,
  Plus,
  Receipt,
  Search,
  Send,
  Sparkles,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { customersAPI, discountAPI, invoicesAPI, paymentsAPI, productsAPI } from '../services/api';
import { formatDate, formatRupiah, statusColor, statusLabel } from '../utils/format';

function InvoiceModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Invoice Workspace</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-slate-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-2xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Tutup
          </button>
        </div>
        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint, tone = 'blue' }) {
  const toneMap = {
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
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${toneMap[tone] || toneMap.blue} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function InvoiceComposer({ customers, products, discounts, onSubmit, onClose, saving }) {
  const [form, setForm] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount_percent: 0,
    tax_percent: 11,
    payment_method: 'transfer',
    notes: '',
    terms: 'Pembayaran jatuh tempo sesuai tanggal yang disepakati.',
    custom_tax_note: 'PPN 11% sesuai peraturan perpajakan yang berlaku.',
    status: 'draft',
    items: [{ product_id: '', description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_percent: 0 }],
  });

  const subtotal = useMemo(() => {
    return form.items.reduce((sum, item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.unit_price || 0);
      const discount = Number(item.discount_percent || 0);
      return sum + (quantity * price * (1 - discount / 100));
    }, 0);
  }, [form.items]);

  const discountAmount = subtotal * (Number(form.discount_percent || 0) / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (Number(form.tax_percent || 0) / 100);
  const grandTotal = taxableAmount + taxAmount;

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const updateItem = (index, key, value) => {
    setForm((current) => {
      const items = [...current.items];
      items[index] = { ...items[index], [key]: value };

      if (key === 'product_id' && value) {
        const product = products.find((item) => String(item.id) === String(value));
        if (product) {
          items[index].description = product.name || '';
          items[index].unit = product.unit || 'pcs';
          items[index].unit_price = product.price_sell || 0;
        }
      }

      return { ...current, items };
    });
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { product_id: '', description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_percent: 0 }],
    }));
  };

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const applyDiscountPreset = (discountId) => {
    const selected = discounts.find((item) => String(item.id) === String(discountId));
    if (selected?.discount_type === 'percent') updateField('discount_percent', selected.discount_value || 0);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      customer_id: Number(form.customer_id),
      discount_percent: Number(form.discount_percent || 0),
      tax_percent: Number(form.tax_percent || 0),
      items: form.items.map((item) => ({
        ...item,
        product_id: item.product_id ? Number(item.product_id) : null,
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.unit_price || 0),
        discount_percent: Number(item.discount_percent || 0),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-[1.75rem] bg-slate-50 p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="xl:col-span-2">
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Customer</label>
            <select
              required
              value={form.customer_id}
              onChange={(event) => updateField('customer_id', event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
            >
              <option value="">Pilih customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}{customer.company_name ? ` (${customer.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Issue Date</label>
            <input type="date" required value={form.issue_date} onChange={(event) => updateField('issue_date', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Due Date</label>
            <input type="date" value={form.due_date} onChange={(event) => updateField('due_date', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Status</label>
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300">
              <option value="draft">Draft</option>
              <option value="sent">Terkirim</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Metode Bayar</label>
            <select value={form.payment_method} onChange={(event) => updateField('payment_method', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300">
              {['transfer', 'cash', 'credit', 'midtrans', 'indomaret', 'alfamart', 'va_bni', 'va_bri', 'va_mandiri', 'va_bca'].map((method) => (
                <option key={method} value={method}>{method.replaceAll('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Discount Preset</label>
            <select defaultValue="" onChange={(event) => applyDiscountPreset(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300">
              <option value="">Pilih preset diskon</option>
              {discounts.map((discount) => (
                <option key={discount.id} value={discount.id}>
                  {discount.name} ({discount.discount_value}{discount.discount_type === 'percent' ? '%' : ''})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Diskon %</label>
            <input type="number" min="0" value={form.discount_percent} onChange={(event) => updateField('discount_percent', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
          </div>
          <div>
            <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">PPN %</label>
            <input type="number" min="0" value={form.tax_percent} onChange={(event) => updateField('tax_percent', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">Invoice Items</h3>
            <p className="mt-1 text-sm text-slate-500">Gunakan dropdown produk agar input lebih cepat dan konsisten</p>
          </div>
          <button type="button" onClick={addItem} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
            <Plus className="h-4 w-4" />
            Tambah Item
          </button>
        </div>

        <div className="space-y-4">
          {form.items.map((item, index) => (
            <div key={`${index}-${item.product_id || 'new'}`} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 xl:grid-cols-12">
                <div className="xl:col-span-4">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Produk</label>
                  <select value={item.product_id} onChange={(event) => updateItem(index, 'product_id', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300">
                    <option value="">Pilih produk</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatRupiah(product.price_sell || 0)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="xl:col-span-4">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Deskripsi</label>
                  <input required value={item.description} onChange={(event) => updateItem(index, 'description', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
                </div>
                <div className="xl:col-span-1">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Qty</label>
                  <input type="number" min="1" required value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
                </div>
                <div className="xl:col-span-1">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Unit</label>
                  <input value={item.unit} onChange={(event) => updateItem(index, 'unit', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
                </div>
                <div className="xl:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Harga</label>
                  <input type="number" min="0" required value={item.unit_price} onChange={(event) => updateItem(index, 'unit_price', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
                </div>
                <div className="xl:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Diskon Item %</label>
                  <input type="number" min="0" value={item.discount_percent} onChange={(event) => updateItem(index, 'discount_percent', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
                </div>
                <div className="xl:col-span-12 flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3">
                  <p className="text-sm text-slate-500">
                    Nilai baris: <span className="font-black text-slate-900">{formatRupiah(Number(item.quantity || 0) * Number(item.unit_price || 0) * (1 - Number(item.discount_percent || 0) / 100))}</span>
                  </p>
                  <button type="button" onClick={() => removeItem(index)} disabled={form.items.length === 1} className="rounded-2xl px-3 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
          <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Catatan Invoice</label>
          <textarea rows={4} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Catatan tambahan untuk customer atau internal note" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
          <label className="mb-2 mt-4 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Terms</label>
          <textarea rows={3} value={form.terms} onChange={(event) => updateField('terms', event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300" />
        </div>

        <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Live Totals</p>
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between text-sm text-slate-300"><span>Subtotal</span><span className="font-bold text-white">{formatRupiah(subtotal)}</span></div>
            <div className="flex items-center justify-between text-sm text-slate-300"><span>Discount</span><span className="font-bold text-white">{formatRupiah(discountAmount)}</span></div>
            <div className="flex items-center justify-between text-sm text-slate-300"><span>Tax</span><span className="font-bold text-white">{formatRupiah(taxAmount)}</span></div>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-300">Grand Total</span>
                <span className="text-2xl font-black tracking-tight text-white">{formatRupiah(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-white/15 px-4 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/5">
              Batal
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:scale-[1.01] disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan Invoice'}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}

export default function InvoiceWorkspacePage() {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showComposer, setShowComposer] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [invoiceRes, statsRes, customersRes, productsRes, discountsRes] = await Promise.all([
        invoicesAPI.getAll({ limit: 100 }),
        invoicesAPI.getStats(),
        customersAPI.getAll({ limit: 100 }),
        productsAPI.getAll({ limit: 100 }),
        discountAPI.getAll(),
      ]);

      const invoiceRows = invoiceRes.data.data?.invoices || [];
      setInvoices(invoiceRows);
      setStats(statsRes.data.data || {});
      setCustomers(customersRes.data.data?.customers || []);
      setProducts(productsRes.data.data || []);
      setDiscounts(discountsRes.data.data || []);
      if (!selectedId && invoiceRows[0]?.id) setSelectedId(invoiceRows[0].id);
    } catch {
      toast.error('Gagal memuat data invoice');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSelectedInvoice(null);
      setSelectedPayments([]);
      return;
    }

    let active = true;
    setDetailLoading(true);

    Promise.all([invoicesAPI.getById(selectedId), paymentsAPI.getAll({ invoice_id: selectedId, limit: 20 })])
      .then(([invoiceRes, paymentsRes]) => {
        if (!active) return;
        setSelectedInvoice(invoiceRes.data.data || null);
        setSelectedPayments(paymentsRes.data.data || []);
      })
      .catch(() => {
        if (active) toast.error('Gagal memuat detail invoice');
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedId]);

  const filteredInvoices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return invoices.filter((invoice) => {
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const matchesSearch = !needle || [invoice.invoice_number, invoice.customer_name, invoice.company_name, invoice.sales_name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
      return matchesStatus && matchesSearch;
    });
  }, [invoices, search, statusFilter]);

  useEffect(() => {
    if (!filteredInvoices.length) {
      if (selectedId) setSelectedId(null);
      return;
    }
    if (!filteredInvoices.some((invoice) => invoice.id === selectedId)) setSelectedId(filteredInvoices[0].id);
  }, [filteredInvoices, selectedId]);

  const today = new Date();
  const computed = useMemo(() => {
    const totalOutstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_due || 0), 0);
    const totalIssued = invoices.reduce((sum, invoice) => sum + Number(invoice.grand_total || 0), 0);
    const totalCollected = invoices.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0);
    const overdueCount = invoices.filter((invoice) => invoice.due_date && new Date(invoice.due_date) < today && !['paid', 'cancelled'].includes(invoice.status)).length;
    const paidCount = invoices.filter((invoice) => invoice.status === 'paid').length;
    const monthlyTrendMap = new Map();

    Array.from({ length: 6 }).forEach((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      monthlyTrendMap.set(`${date.getFullYear()}-${date.getMonth()}`, {
        month: date.toLocaleDateString('id-ID', { month: 'short' }),
        issued: 0,
        collected: 0,
      });
    });

    invoices.forEach((invoice) => {
      if (!invoice.issue_date) return;
      const issueDate = new Date(invoice.issue_date);
      const bucket = monthlyTrendMap.get(`${issueDate.getFullYear()}-${issueDate.getMonth()}`);
      if (!bucket) return;
      bucket.issued += Number(invoice.grand_total || 0);
      bucket.collected += Number(invoice.amount_paid || 0);
    });

    return {
      totalOutstanding,
      totalIssued,
      totalCollected,
      overdueCount,
      paidCount,
      collectionRatio: totalIssued > 0 ? Math.round((totalCollected / totalIssued) * 100) : 0,
      monthlyTrend: Array.from(monthlyTrendMap.values()),
    };
  }, [invoices, today]);

  const spotlightInvoice = filteredInvoices[0] || null;

  const saveInvoice = async (payload) => {
    setSaving(true);
    try {
      await invoicesAPI.create(payload);
      toast.success('Invoice berhasil dibuat');
      setShowComposer(false);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat invoice');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status) => {
    if (!selectedInvoice) return;
    try {
      await invoicesAPI.update(selectedInvoice.id, { status });
      toast.success('Status invoice diperbarui');
      await load();
      setSelectedId(selectedInvoice.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui status');
    }
  };

  const copyInvoiceNumber = async () => {
    if (!selectedInvoice?.invoice_number) return;
    try {
      await navigator.clipboard.writeText(selectedInvoice.invoice_number);
      toast.success('Nomor invoice disalin');
    } catch {
      toast.error('Gagal menyalin nomor invoice');
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.22),_transparent_35%),linear-gradient(135deg,#0f172a,#111827_45%,#1d4ed8)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-100/80">Invoice Platform</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Buat invoice dari customer dan katalog produk, pantau outstanding, lalu tindak lanjuti histori pembayaran</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200">
              Halaman ini dipakai untuk menyusun item invoice, menetapkan termin pembayaran, melihat saldo yang belum dibayar, dan mengecek pembayaran yang sudah masuk untuk setiap invoice.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setShowComposer(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02]">
                <Plus className="h-4 w-4" />
                Buat Invoice
              </button>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100">
                Collection rate: <span className="font-black">{computed.collectionRatio}%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Issued Value</p>
              <p className="mt-3 text-3xl font-black">{formatRupiah(computed.totalIssued)}</p>
              <p className="mt-2 text-sm text-slate-200">{stats.total?.cnt || invoices.length} invoice tercatat</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Outstanding</p>
              <p className="mt-3 text-3xl font-black">{formatRupiah(computed.totalOutstanding)}</p>
              <p className="mt-2 text-sm text-slate-200">{computed.overdueCount} invoice melewati jatuh tempo</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md md:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">6-Month Trend</p>
                  <p className="mt-2 text-sm text-slate-200">Nilai issued vs collected</p>
                </div>
                <Sparkles className="h-5 w-5 text-sky-200" />
              </div>
              <div className="mt-4 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={computed.monthlyTrend}>
                    <defs>
                      <linearGradient id="invoiceIssued" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="invoiceCollected" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#34d399" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                    <Tooltip formatter={(value) => formatRupiah(value)} />
                    <Area type="monotone" dataKey="issued" stroke="#38bdf8" fill="url(#invoiceIssued)" strokeWidth={3} />
                    <Area type="monotone" dataKey="collected" stroke="#34d399" fill="url(#invoiceCollected)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Receipt} label="Collected" value={formatRupiah(computed.totalCollected)} hint="Total pembayaran masuk" tone="emerald" />
        <MetricCard icon={Wallet} label="Outstanding" value={formatRupiah(computed.totalOutstanding)} hint="Belum terbayar" tone="amber" />
        <MetricCard icon={FileText} label="Paid Invoice" value={computed.paidCount} hint="Invoice lunas" tone="blue" />
        <MetricCard icon={CreditCard} label="Overdue" value={computed.overdueCount} hint="Butuh follow-up" tone="rose" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900">Invoice Stream</h2>
                <p className="mt-1 text-sm text-slate-500">Filter invoice berdasarkan customer, status tagihan, PIC sales, dan saldo outstanding</p>
              </div>
              <button onClick={() => setShowComposer(true)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
                <Plus className="h-4 w-4" />
                Invoice Baru
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor invoice, customer, sales..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-300" />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300">
                <option value="all">Semua Status</option>
                {['draft', 'sent', 'partial', 'paid', 'cancelled'].map((status) => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </select>
            </div>

            <div className="mt-6 space-y-3">
              {loading ? (
                <div className="flex h-40 items-center justify-center rounded-[1.5rem] bg-slate-50">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                  Tidak ada invoice yang cocok dengan filter saat ini.
                </div>
              ) : (
                filteredInvoices.map((invoice) => (
                  <button key={invoice.id} type="button" onClick={() => setSelectedId(invoice.id)} className={`w-full rounded-[1.5rem] border p-4 text-left transition ${selectedId === invoice.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">{invoice.invoice_number}</span>
                          <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor(invoice.status)}`}>{statusLabel(invoice.status)}</span>
                        </div>
                        <p className="mt-3 truncate text-base font-black tracking-tight text-slate-900">{invoice.customer_name || 'Customer belum dipilih'}</p>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Issue {formatDate(invoice.issue_date)}</span>
                          <span className="inline-flex items-center gap-1"><ArrowUpRight className="h-3.5 w-3.5" />Due {formatDate(invoice.due_date)}</span>
                          <span className="inline-flex items-center gap-1"><Layers3 className="h-3.5 w-3.5" />{invoice.sales_name || 'Tanpa sales'}</span>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                        <p className="text-lg font-black text-slate-900">{formatRupiah(invoice.grand_total || 0)}</p>
                        <p className="mt-1 text-xs text-slate-500">Due {formatRupiah(invoice.amount_due || 0)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {spotlightInvoice ? (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">Spotlight Invoice</p>
                  <h3 className="mt-2 text-xl font-black tracking-tight text-slate-900">{spotlightInvoice.invoice_number}</h3>
                  <p className="mt-1 text-sm text-slate-500">{spotlightInvoice.customer_name}</p>
                </div>
                <button type="button" onClick={() => setSelectedId(spotlightInvoice.id)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800">
                  Lihat Detail
                </button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Total</p><p className="mt-2 text-lg font-black text-slate-900">{formatRupiah(spotlightInvoice.grand_total || 0)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Paid</p><p className="mt-2 text-lg font-black text-emerald-600">{formatRupiah(spotlightInvoice.amount_paid || 0)}</p></div>
                <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Outstanding</p><p className="mt-2 text-lg font-black text-amber-600">{formatRupiah(spotlightInvoice.amount_due || 0)}</p></div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          {detailLoading ? (
            <div className="flex min-h-[480px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            </div>
          ) : selectedInvoice ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">{selectedInvoice.invoice_number}</span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor(selectedInvoice.status)}`}>{statusLabel(selectedInvoice.status)}</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{selectedInvoice.customer_name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedInvoice.company_name || 'Personal account'} | {selectedInvoice.sales_name || 'Tanpa sales PIC'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={copyInvoiceNumber} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                    <Copy className="h-4 w-4" />
                    Copy Number
                  </button>
                  {!['paid', 'partial', 'cancelled'].includes(selectedInvoice.status) ? (
                    <button type="button" onClick={() => updateStatus('sent')} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                      <Send className="h-4 w-4" />
                      Tandai Terkirim
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Grand Total</p><p className="mt-2 text-xl font-black text-slate-900">{formatRupiah(selectedInvoice.grand_total || 0)}</p></div>
                <div className="rounded-[1.5rem] bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Paid</p><p className="mt-2 text-xl font-black text-emerald-600">{formatRupiah(selectedInvoice.amount_paid || 0)}</p></div>
                <div className="rounded-[1.5rem] bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Outstanding</p><p className="mt-2 text-xl font-black text-amber-600">{formatRupiah(selectedInvoice.amount_due || 0)}</p></div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Invoice Meta</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3"><span>Issue Date</span><span className="font-bold text-slate-900">{formatDate(selectedInvoice.issue_date)}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Due Date</span><span className="font-bold text-slate-900">{formatDate(selectedInvoice.due_date)}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Payment Method</span><span className="font-bold uppercase text-slate-900">{selectedInvoice.payment_method || '-'}</span></div>
                    <div className="flex items-center justify-between gap-3"><span>Tax</span><span className="font-bold text-slate-900">{selectedInvoice.tax_percent || 0}%</span></div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Commercial Notes</h3>
                  <p className="mt-4 text-sm leading-relaxed text-slate-200">{selectedInvoice.notes || 'Belum ada catatan invoice.'}</p>
                  <div className="mt-5 rounded-2xl bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Terms</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200">{selectedInvoice.terms || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Invoice Items</h3>
                <div className="mt-4 space-y-3">
                  {(selectedInvoice.items || []).length === 0 ? (
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">Belum ada item di invoice ini.</div>
                  ) : (
                    selectedInvoice.items.map((item) => (
                      <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="min-w-0">
                            <p className="text-base font-black tracking-tight text-slate-900">{item.description || item.product_name}</p>
                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1"><Package className="h-3.5 w-3.5" />{item.product_name || 'Custom item'}</span>
                              <span>{item.quantity} {item.unit}</span>
                              <span>Disc {item.discount_percent || 0}%</span>
                            </div>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                            <p className="text-sm font-semibold text-slate-500">{formatRupiah(item.unit_price || 0)} / unit</p>
                            <p className="mt-1 text-lg font-black text-slate-900">{formatRupiah(item.total || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Payment Timeline</h3>
                <div className="mt-4 space-y-3">
                  {selectedPayments.length === 0 ? (
                    <div className="rounded-2xl bg-white p-4 text-sm text-slate-500">Belum ada pembayaran yang terkait dengan invoice ini.</div>
                  ) : (
                    selectedPayments.map((payment) => (
                      <div key={payment.id} className="rounded-2xl bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor(payment.status || 'pending')}`}>{statusLabel(payment.status || 'pending')}</span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">{payment.payment_method || 'transfer'}</span>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-900">{formatDate(payment.payment_date)}</p>
                            <p className="mt-1 text-xs text-slate-500">{payment.reference_number || 'Tanpa nomor referensi'}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-lg font-black text-emerald-600">{formatRupiah(payment.amount || 0)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[480px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Pilih invoice dari daftar kiri untuk melihat detail.
            </div>
          )}
        </div>
      </section>

      {showComposer ? (
        <InvoiceModal title="Buat Invoice Baru" onClose={() => setShowComposer(false)}>
          <InvoiceComposer customers={customers} products={products} discounts={discounts} onSubmit={saveInvoice} onClose={() => setShowComposer(false)} saving={saving} />
        </InvoiceModal>
      ) : null}
    </div>
  );
}
