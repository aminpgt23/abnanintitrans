import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CreditCard,
  Landmark,
  Plus,
  Receipt,
  Search,
  Tag,
  Wallet,
  FileText,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { financeAPI, invoicesAPI, paymentsAPI } from '../services/api';
import { formatDate, formatRupiah } from '../utils/format';

function FinanceModal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl">
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
    green: 'from-emerald-600 to-emerald-400',
    rose: 'from-rose-600 to-orange-400',
    amber: 'from-amber-500 to-yellow-400',
  };

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
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

function formatMonthLabel(date) {
  return new Date(date).toLocaleDateString('id-ID', { month: 'short' });
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [form, setForm] = useState({
    type: 'income',
    category: '',
    amount: '',
    tax_amount: 0,
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    reference_type: 'other',
    reference_id: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [transactionsRes, summaryRes, invoicesRes, paymentsRes] = await Promise.all([
        financeAPI.getTransactions({ limit: 100 }),
        financeAPI.getSummary(),
        invoicesAPI.getAll({ limit: 100 }),
        paymentsAPI.getAll({ limit: 100 }),
      ]);

      setTransactions(transactionsRes.data.data || []);
      setSummary(summaryRes.data.data || {});
      setInvoiceOptions(invoicesRes.data.data?.invoices || []);
      setPaymentOptions(paymentsRes.data.data || []);
    } catch {
      toast.error('Gagal memuat data keuangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const needle = search.trim().toLowerCase();
      const matchesSearch = !needle || [item.description, item.category, item.transaction_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
      return matchesType && matchesSearch;
    });
  }, [transactions, search, typeFilter]);

  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      return { key, month: formatMonthLabel(date), income: 0, expense: 0 };
    });

    for (const transaction of transactions) {
      const date = new Date(transaction.transaction_date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = months.find((entry) => entry.key === key);
      if (!month) continue;
      if (transaction.type === 'income') month.income += Number(transaction.amount || 0);
      else month.expense += Number(transaction.amount || 0);
    }

    return months;
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map();
    for (const transaction of filteredTransactions) {
      const key = transaction.category || 'uncategorized';
      const current = map.get(key) || 0;
      map.set(key, current + Number(transaction.amount || 0));
    }

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 5);
  }, [filteredTransactions]);

  const cashflowBalance = Number(summary.total_income || 0) - Number(summary.total_expense || 0);
  const filteredIncome = filteredTransactions.filter((item) => item.type === 'income').reduce((total, item) => total + Number(item.amount || 0), 0);
  const filteredExpense = filteredTransactions.filter((item) => item.type === 'expense').reduce((total, item) => total + Number(item.amount || 0), 0);

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      await financeAPI.createTransaction({
        ...form,
        reference_id: ['invoice', 'payment'].includes(form.reference_type) ? form.reference_id || null : null,
      });

      toast.success('Transaksi keuangan berhasil dicatat');
      setShowModal(false);
      setForm({
        type: 'income',
        category: '',
        amount: '',
        tax_amount: 0,
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        reference_type: 'other',
        reference_id: '',
      });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan transaksi');
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.3),_transparent_35%),linear-gradient(135deg,#0f172a,#1e293b_45%,#0f766e)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-100/80">Finance Control</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Catat arus kas, hubungkan transaksi ke invoice atau payment, dan pantau posisi pajak harian</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200">
              Gunakan halaman ini untuk mencatat pemasukan atau pengeluaran, mengecek transaksi yang belum direview, dan memastikan referensi finance tetap terhubung ke dokumen sumber.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4" />
                Catat Transaksi
              </button>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100">
                Saldo arus kas: <span className="font-black">{formatRupiah(cashflowBalance)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Net Cash Position</p>
              <p className="mt-3 text-3xl font-black">{formatRupiah(cashflowBalance)}</p>
              <div className="mt-4 flex items-center gap-3 text-sm text-slate-200">
                <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                Income {formatRupiah(summary.total_income || 0)}
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm text-slate-200">
                <ArrowDownRight className="h-4 w-4 text-rose-300" />
                Expense {formatRupiah(summary.total_expense || 0)}
              </div>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-md">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300">Tax Window</p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-xs text-slate-300">Collected</p>
                  <p className="mt-1 text-lg font-black">{formatRupiah(summary.tax_collected || 0)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <p className="text-xs text-slate-300">Paid</p>
                  <p className="mt-1 text-lg font-black">{formatRupiah(summary.tax_paid || 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Wallet} label="Total Income" value={formatRupiah(summary.total_income || 0)} hint="Pemasukan tersetujui" tone="green" />
        <MetricCard icon={Landmark} label="Total Expense" value={formatRupiah(summary.total_expense || 0)} hint="Pengeluaran tersetujui" tone="rose" />
        <MetricCard icon={Receipt} label="Tax Collected" value={formatRupiah(summary.tax_collected || 0)} hint="PPN / pajak masuk" tone="blue" />
        <MetricCard icon={CreditCard} label="Tax Paid" value={formatRupiah(summary.tax_paid || 0)} hint="Pembayaran pajak keluar" tone="amber" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Cashflow Trend</h2>
              <p className="mt-1 text-sm text-slate-500">Visual pemasukan dan pengeluaran 6 bulan terakhir</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Income</div>
              <div className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">Expense</div>
            </div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="financeIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="financeExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip formatter={(value) => formatRupiah(value)} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#financeIncome)" strokeWidth={3} />
                <Area type="monotone" dataKey="expense" stroke="#fb7185" fill="url(#financeExpense)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Filtered Mix</h2>
              <p className="mt-1 text-sm text-slate-500">Komposisi transaksi dari filter aktif</p>
            </div>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Filtered Income</p>
              <p className="mt-2 text-xl font-black text-slate-900">{formatRupiah(filteredIncome)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Filtered Expense</p>
              <p className="mt-2 text-xl font-black text-slate-900">{formatRupiah(filteredExpense)}</p>
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip formatter={(value) => formatRupiah(value)} />
                <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900">Transaction Ledger</h2>
              <p className="mt-1 text-sm text-slate-500">Telusuri transaksi berdasarkan kategori, nomor referensi, invoice, atau payment yang terkait</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-0 md:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari transaksi, kategori, nomor..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-300"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {loading ? (
              <div className="flex h-40 items-center justify-center rounded-[1.5rem] bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Tidak ada transaksi yang cocok dengan filter saat ini.
              </div>
            ) : (
              filteredTransactions.map((transaction) => (
                <article key={transaction.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-white">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${transaction.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {transaction.type}
                        </span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                          {transaction.category || 'general'}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          {transaction.reference_type || 'other'}
                        </span>
                      </div>
                      <p className="mt-3 text-base font-black tracking-tight text-slate-900">{transaction.description || transaction.transaction_number}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(transaction.transaction_date)}</span>
                        <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{transaction.transaction_number}</span>
                        {transaction.reference_id ? <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" />Ref #{transaction.reference_id}</span> : null}
                      </div>
                    </div>
                    <div className="rounded-[1.25rem] bg-white px-4 py-3 text-right shadow-sm">
                      <p className={`text-lg font-black ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatRupiah(transaction.amount || 0)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">Pajak {formatRupiah(transaction.tax_amount || 0)}</p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Reference Snapshot</h3>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">Invoice refs</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{invoiceOptions.length}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-bold text-slate-400">Payment refs</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{paymentOptions.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Quick Notes</h3>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                  Pakai `reference_type = invoice/payment` agar pencatatan finance tetap nyambung ke dokumen sumber.
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">
                  View ini sengaja dibuat vertikal dan modular supaya tidak memunculkan scroll kanan di body.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showModal ? (
        <FinanceModal title="Catat Transaksi Keuangan" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tipe</label>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                >
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Kategori</label>
                <input
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Operasional, tax, payment, dll"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Jumlah</label>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Pajak</label>
                <input
                  type="number"
                  value={form.tax_amount}
                  onChange={(event) => setForm((current) => ({ ...current, tax_amount: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tanggal</label>
                <input
                  type="date"
                  required
                  value={form.transaction_date}
                  onChange={(event) => setForm((current) => ({ ...current, transaction_date: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Referensi</label>
                <select
                  value={form.reference_type}
                  onChange={(event) => setForm((current) => ({ ...current, reference_type: event.target.value, reference_id: '' }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                >
                  <option value="other">Other</option>
                  <option value="invoice">Invoice</option>
                  <option value="payment">Payment</option>
                  <option value="commission">Commission</option>
                  <option value="operational">Operational</option>
                </select>
              </div>
              {form.reference_type === 'invoice' ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Pilih Invoice</label>
                  <select
                    value={form.reference_id}
                    onChange={(event) => setForm((current) => ({ ...current, reference_id: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  >
                    <option value="">Pilih invoice</option>
                    {invoiceOptions.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {invoice.customer_name} - {formatRupiah(invoice.amount_due || invoice.grand_total || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {form.reference_type === 'payment' ? (
                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Pilih Payment</label>
                  <select
                    value={form.reference_id}
                    onChange={(event) => setForm((current) => ({ ...current, reference_id: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  >
                    <option value="">Pilih payment</option>
                    {paymentOptions.map((payment) => (
                      <option key={payment.id} value={payment.id}>
                        {(payment.invoice_number || `INV #${payment.invoice_id}`)} - {payment.customer_name || '-'} - {formatRupiah(payment.amount || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Deskripsi</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  placeholder="Jelaskan konteks transaksi ini"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                Batal
              </button>
              <button type="submit" className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                Simpan Transaksi
              </button>
            </div>
          </form>
        </FinanceModal>
      ) : null}
    </div>
  );
}
