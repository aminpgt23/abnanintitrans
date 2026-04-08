// ============================================================
// FINANCE PAGE - iOS Style
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import { financeAPI, commissionsAPI, paymentsAPI, taxAPI, analyticsAPI, usersAPI, productsAPI, documentsAPI, shipmentsAPI, kbAPI, invoicesAPI, customersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatRupiah, formatDate, formatDateTime, statusColor, statusLabel, roleLabel } from '../utils/format';
import toast from 'react-hot-toast';
import {
  TrendingUp, TrendingDown, Building2, DollarSign, Plus, Search, Filter,
  Eye, Edit, Trash2, ChevronLeft, ChevronRight, X, Save, Calendar,
  CreditCard, Wallet, BarChart3, PieChart, LineChart as LineChartIcon , Users, Package,
  FileText, Truck, Receipt, BookOpen, Settings, Shield, Award, Clock,
  CheckCircle, XCircle, Send, Download, Printer, Copy, AlertCircle,
  Info, ArrowLeft, ArrowRight, PlusCircle, MinusCircle, Star, Tag,
  MapPin, Globe, Phone, Mail, User, UserCheck, Briefcase 
} from 'lucide-react';

import {
  ResponsiveContainer,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip, LineChart 
} from 'recharts';

// iOS Style Modal
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`
        bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl 
        ${wide ? 'w-full max-w-2xl' : 'w-full max-w-md'} 
        max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300
      `}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200/50 sticky top-0 bg-white/95 backdrop-blur-xl z-10">
          <h3 className="font-bold text-xl text-gray-900 tracking-tight">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// iOS Style Stat Card
function StatCard({ icon: Icon, label, value, color = 'blue', trend }) {
  const colors = {
    blue: { bg: 'bg-blue-50/80', text: 'text-blue-600', icon: 'text-blue-500', gradient: 'from-blue-500 to-blue-600' },
    green: { bg: 'bg-green-50/80', text: 'text-green-600', icon: 'text-green-500', gradient: 'from-green-500 to-green-600' },
    red: { bg: 'bg-red-50/80', text: 'text-red-600', icon: 'text-red-500', gradient: 'from-red-500 to-red-600' },
    yellow: { bg: 'bg-yellow-50/80', text: 'text-yellow-600', icon: 'text-yellow-500', gradient: 'from-yellow-500 to-yellow-600' },
    purple: { bg: 'bg-purple-50/80', text: 'text-purple-600', icon: 'text-purple-500', gradient: 'from-purple-500 to-purple-600' }
  };
  
  const colorStyle = colors[color];
  
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200/50 p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${colorStyle.bg}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${colorStyle.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm ${colorStyle.text}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'} bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1 tracking-tight">{value}</p>
      <p className="text-sm font-medium text-gray-600">{label}</p>
    </div>
  );
}

export function FinancePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({});
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [form, setForm] = useState({ 
    type: 'income', category: '', amount: '', tax_amount: 0, 
    description: '', transaction_date: new Date().toISOString().split('T')[0], 
    reference_type: 'other',
    reference_id: '' 
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      financeAPI.getTransactions({ limit: 50 }),
      financeAPI.getSummary(),
      invoicesAPI.getAll({ limit: 100 }),
      paymentsAPI.getAll({ limit: 100 })
    ]).then(([t, s, invoicesRes, paymentsRes]) => {
      setTransactions(t.data.data || []);
      setSummary(s.data.data || {});
      setInvoiceOptions(invoicesRes.data.data?.invoices || []);
      setPaymentOptions(paymentsRes.data.data || []);
    }).catch(() => toast.error('Gagal memuat data')).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        reference_id: ['invoice', 'payment'].includes(form.reference_type) ? form.reference_id || null : null,
      };
      await financeAPI.createTransaction(payload);
      toast.success('Transaksi dicatat');
      setModal(false);
      setForm({ 
        type: 'income', category: '', amount: '', tax_amount: 0,
        description: '', transaction_date: new Date().toISOString().split('T')[0],
        reference_type: 'other', reference_id: ''
      });
      financeAPI.getTransactions({ limit: 50 }).then(r => setTransactions(r.data.data || []));
      financeAPI.getSummary().then(r => setSummary(r.data.data || {}));
    } catch { toast.error('Gagal menyimpan'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Keuangan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola pemasukan dan pengeluaran</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Catat Transaksi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Pemasukan" value={formatRupiah(summary.total_income || 0)} color="green" trend={12.5} />
        <StatCard icon={TrendingDown} label="Pengeluaran" value={formatRupiah(summary.total_expense || 0)} color="red" trend={-3.2} />
        <StatCard icon={Receipt} label="Pajak Dikumpulkan" value={formatRupiah(summary.tax_collected || 0)} color="blue" />
        <StatCard icon={Send} label="Pajak Dibayar" value={formatRupiah(summary.tax_paid || 0)} color="yellow" />
      </div>

      {/* Transactions Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200/50">
          <h3 className="font-semibold text-gray-900">Riwayat Transaksi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Tanggal</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Deskripsi</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600">Tipe</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600">Jumlah</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600">Pajak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(t => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-gray-500 text-xs">{formatDate(t.transaction_date)}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{t.description || t.category || '-'}</p>
                    <p className="text-xs text-gray-400 font-mono">{t.transaction_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {t.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500 text-sm">{formatRupiah(t.tax_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {modal && (
        <Modal title="Catat Transaksi" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tipe</label>
                <div className="relative">
                  {form.type === 'income' ? <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /> : <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                  >
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Kategori</label>
                <input
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="mis. Operasional"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Jumlah (Rp) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pajak (Rp)</label>
                <input
                  type="number"
                  value={form.tax_amount}
                  onChange={e => setForm(f => ({ ...f, tax_amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tanggal *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={form.transaction_date}
                    onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Referensi</label>
                <select
                  value={form.reference_type}
                  onChange={e => setForm(f => ({ ...f, reference_type: e.target.value, reference_id: '' }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  {['invoice', 'payment', 'commission', 'operational', 'other'].map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              {form.reference_type === 'invoice' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pilih Invoice</label>
                  <select
                    value={form.reference_id}
                    onChange={e => {
                      const selected = invoiceOptions.find(inv => String(inv.id) === e.target.value);
                      setForm(f => ({
                        ...f,
                        reference_id: e.target.value,
                        category: f.category || 'invoice',
                        description: f.description || (selected ? `Transaksi terkait invoice ${selected.invoice_number}` : '')
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                  >
                    <option value="">Pilih invoice</option>
                    {invoiceOptions.map(inv => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} - {inv.customer_name} - {formatRupiah(inv.amount_due || inv.grand_total || 0)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {form.reference_type === 'payment' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Pilih Payment</label>
                  <select
                    value={form.reference_id}
                    onChange={e => {
                      const selected = paymentOptions.find(pay => String(pay.id) === e.target.value);
                      setForm(f => ({
                        ...f,
                        reference_id: e.target.value,
                        category: f.category || 'payment',
                        description: f.description || (selected ? `Transaksi terkait payment ${selected.invoice_number || `INV #${selected.invoice_id}`}` : '')
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                  >
                    <option value="">Pilih payment</option>
                    {paymentOptions.map(pay => (
                      <option key={pay.id} value={pay.id}>
                        {(pay.invoice_number || `INV #${pay.invoice_id}`)} - {formatRupiah(pay.amount || 0)} - {pay.customer_name || '-'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Deskripsi</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
                  placeholder="Deskripsi transaksi..."
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95">Batal</button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// COMMISSIONS PAGE - iOS Style
// ============================================================
export function CommissionsPage() {
  const { user, hasRole } = useAuth();
  const [commissions, setCommissions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    commissionsAPI.getAll({ limit: 50 }).then(r => setCommissions(r.data.data || [])).catch(() => toast.error('Gagal memuat')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRequest = async () => {
    if (!selected.length) return toast.error('Pilih komisi yang akan diajukan');
    try { 
      await commissionsAPI.request({ commission_ids: selected }); 
      toast.success('Komisi diajukan!'); 
      setSelected([]); 
      load(); 
    } catch { toast.error('Gagal mengajukan'); }
  };

  const handleAction = async (action, id) => {
    try {
      if (action === 'approve-sm') await commissionsAPI.approveSM(id);
      else if (action === 'approve') await commissionsAPI.approve(id);
      else if (action === 'pay') await commissionsAPI.pay(id);
      toast.success('Status diperbarui'); 
      load();
    } catch { toast.error('Gagal'); }
  };

  const total = commissions.reduce((s, c) => s + parseFloat(c.commission_amount || 0), 0);
  const paid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + parseFloat(c.commission_amount || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Komisi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total: {formatRupiah(total)} | Dibayar: {formatRupiah(paid)} | Pending: {formatRupiah(total - paid)}
          </p>
        </div>
        {user?.role === 'sales' && selected.length > 0 && (
          <button
            onClick={handleRequest}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
          >
            <Send className="w-4 h-4" />
            Ajukan Komisi ({selected.length})
          </button>
        )}
      </div>

      {/* Info Card */}
      {user?.role === 'sales' && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white shadow-lg shadow-blue-500/20">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">💡 Informasi Komisi</p>
              <p className="text-blue-100 text-xs">Untuk mencairkan komisi: centang komisi yang ingin diajukan, lalu klik "Ajukan Komisi". Minimum pencairan: Rp 100.000.000</p>
            </div>
          </div>
        </div>
      )}

      {/* Commissions Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                {user?.role === 'sales' && <th className="px-6 py-4 w-8"></th>}
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Invoice</th>
                {hasRole('super_admin','general_manager','sales_manager','finance') && (
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Sales</th>
                )}
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Komisi</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Rate</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commissions.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  {user?.role === 'sales' && (
                    <td className="px-6 py-4">
                      {['pending','requested'].includes(c.status) && (
                        <input
                          type="checkbox"
                          checked={selected.includes(c.id)}
                          onChange={e => setSelected(s => e.target.checked ? [...s, c.id] : s.filter(x => x !== c.id))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-blue-600 font-semibold">{c.invoice_number}</p>
                    <p className="text-xs text-gray-400">{formatRupiah(c.invoice_amount)}</p>
                  </td>
                  {hasRole('super_admin','general_manager','sales_manager','finance') && (
                    <td className="px-6 py-4 font-medium text-gray-900">{c.sales_name}</td>
                  )}
                  <td className="px-6 py-4">
                    <p className="font-bold text-green-600">{formatRupiah(c.commission_amount)}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{c.commission_rate}%</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${statusColor(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.status === 'requested' && hasRole('sales_manager','general_manager','super_admin') && (
                      <button
                        onClick={() => handleAction('approve-sm', c.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-200 transition-all duration-200"
                      >
                        Setujui SM
                      </button>
                    )}
                    {c.status === 'approved_sm' && hasRole('finance','general_manager','super_admin') && (
                      <button
                        onClick={() => handleAction('approve', c.id)}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-xl hover:bg-green-200 transition-all duration-200"
                      >
                        Setujui Finance
                      </button>
                    )}
                    {c.status === 'approved' && hasRole('finance','general_manager','super_admin') && (
                      <button
                        onClick={() => handleAction('pay', c.id)}
                        className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-xl hover:bg-purple-200 transition-all duration-200"
                      >
                        Bayar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAYMENT REQUESTS PAGE - iOS Style
// ============================================================
export function PaymentRequestsPage() {
  const { user, hasRole } = useAuth();
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState(null);
  const [notes, setNotes] = useState('');

  const load = () => financeAPI.getPaymentRequests({ limit: 50 }).then(r => setRequests(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const reviewSM = async (id, approved) => {
    try { 
      await financeAPI.reviewSM(id, { approved, notes }); 
      toast.success(approved ? 'Pengajuan disetujui' : 'Pengajuan ditolak'); 
      setModal(null); 
      load(); 
    } catch { toast.error('Gagal'); }
  };
  
  const reviewFinance = async (id, approved) => {
    try { 
      await financeAPI.reviewFinance(id, { approved, notes }); 
      toast.success(approved ? 'Pengajuan disetujui' : 'Pengajuan ditolak'); 
      setModal(null); 
      load(); 
    } catch { toast.error('Gagal'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengajuan Pembayaran Lunas</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pengajuan pelunasan dari sales</p>
      </div>

      {/* Info Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 p-5 text-white shadow-lg shadow-yellow-500/20">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Info className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">📋 Alur Pengajuan</p>
            <p className="text-yellow-100 text-xs">Sales ajukan → Sales Manager review → Finance konfirmasi → Komisi otomatis dihitung</p>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Invoice</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Diajukan Oleh</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Jumlah</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-blue-600 font-semibold">{r.invoice_number}</p>
                    <p className="text-xs text-gray-400">Total: {formatRupiah(r.grand_total)}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{r.customer_name}</td>
                  <td className="px-6 py-4 text-gray-500">{r.requested_by_name}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-green-600">{formatRupiah(r.amount)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${statusColor(r.status)}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {r.status === 'pending_sm' && hasRole('sales_manager','general_manager','super_admin') && (
                      <button
                        onClick={() => setModal({ id: r.id, type: 'sm' })}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-200 transition-all duration-200"
                      >
                        Review SM
                      </button>
                    )}
                    {r.status === 'approved_sm' && hasRole('finance','general_manager','super_admin') && (
                      <button
                        onClick={() => setModal({ id: r.id, type: 'finance' })}
                        className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-xl hover:bg-green-200 transition-all duration-200"
                      >
                        Review Finance
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {modal && (
        <Modal title={modal.type === 'sm' ? 'Review Sales Manager' : 'Review Finance'} onClose={() => setModal(null)}>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Catatan (opsional)</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
                placeholder="Tambahkan catatan..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { modal.type === 'sm' ? reviewSM(modal.id, false) : reviewFinance(modal.id, false); }}
                className="flex-1 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl text-sm font-medium hover:bg-red-100 transition-all duration-200 active:scale-95"
              >
                Tolak
              </button>
              <button
                onClick={() => { modal.type === 'sm' ? reviewSM(modal.id, true) : reviewFinance(modal.id, true); }}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Setujui
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-200/50 p-3">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-900">{formatRupiah(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

// ============================================================
// ANALYTICS PAGE - iOS Style
// ============================================================
export function AnalyticsPage() {
  const [monthly, setMonthly] = useState([]);
  const [salesRep, setSalesRep] = useState([]);

  useEffect(() => {
    analyticsAPI.salesMonthly().then(r => setMonthly(r.data.data || [])).catch(() => {});
    analyticsAPI.salesByRep().then(r => setSalesRep(r.data.data || [])).catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analitik Penjualan</h1>
        <p className="text-sm text-gray-500 mt-1">Visualisasi data penjualan dan performa sales</p>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900 tracking-tight">Revenue Bulanan</h3>
            <p className="text-xs text-gray-500 mt-1">Tren pendapatan 12 bulan terakhir</p>
          </div>
          <LineChartIcon className="w-5 h-5 text-gray-400" />
        </div>
        {monthly && monthly.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Tidak ada data
          </div>
        )}
      </div>

      {/* Sales Performance */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900 tracking-tight">Revenue per Sales Representative</h3>
            <p className="text-xs text-gray-500 mt-1">Top performer berdasarkan revenue</p>
          </div>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>
        {salesRep && salesRep.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesRep}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="full_name" tick={{ fontSize: 11, fill: '#6b7280' }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Tidak ada data
          </div>
        )}

        {/* Data Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 rounded-xl">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Sales</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Invoice</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Revenue</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Avg Deal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {salesRep.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.full_name}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{s.inv_count}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{formatRupiah(s.revenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{formatRupiah(s.avg_deal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// USERS PAGE (super admin only) - iOS Style
// ============================================================
export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    employee_id: '', full_name: '', email: '', phone: '', 
    role: 'sales', position: '', department: '', join_date: '', password: '' 
  });

  const load = () => usersAPI.getAll({ limit: 100 }).then(r => setUsers(r.data.data?.users || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') await usersAPI.create(form);
      else await usersAPI.update(modal.id, form);
      toast.success('Berhasil disimpan'); 
      setModal(null); 
      load();
    } catch (e) { 
      toast.error(e.response?.data?.message || 'Gagal'); 
    } finally { 
      setSaving(false); 
    }
  };

  const openEdit = (u) => { setForm({ ...u, password: '' }); setModal(u); };
  const openAdd = () => { 
    setForm({ employee_id: '', full_name: '', email: '', phone: '', role: 'sales', position: '', department: '', join_date: '', password: '' }); 
    setModal('add'); 
  };

  const roleStats = [
    { role: 'super_admin', label: 'Super Admin', icon: Shield },
    { role: 'general_manager', label: 'General Manager', icon: Building2 },
    { role: 'sales_manager', label: 'Sales Manager', icon: UserCheck },
    { role: 'sales', label: 'Sales', icon: Users },
    { role: 'finance', label: 'Finance', icon: Wallet }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kelola Karyawan</h1>
          <p className="text-sm text-gray-500 mt-1">{users.length} total karyawan terdaftar</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Tambah Karyawan
        </button>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {roleStats.map(({ role, label, icon: Icon }) => (
          <div key={role} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 text-center hover:shadow-md transition-all duration-200">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Icon className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{users.filter(u => u.role === role).length}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">ID Karyawan</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Nama</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden md:table-cell">Role</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden lg:table-cell">Email</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden md:table-cell">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-blue-600 font-semibold text-sm">{u.employee_id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{u.full_name}</p>
                    {u.position && <p className="text-xs text-gray-500">{u.position}</p>}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-blue-100 text-blue-700">
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-500">{u.email || '-'}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Tambah Karyawan' : 'Edit Karyawan'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">ID Karyawan *</label>
                <input
                  required
                  value={form.employee_id}
                  onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Nama Lengkap *</label>
                <input
                  required
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">No. HP</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Role *</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  {['super_admin', 'general_manager', 'sales_manager', 'sales', 'finance'].map(r => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Jabatan</label>
                <input
                  value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Departemen</label>
                <input
                  value={form.department}
                  onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tanggal Bergabung</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.join_date || ''}
                    onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  Password {modal === 'add' ? '*' : '(kosongkan jika tidak diubah)'}
                </label>
                <input
                  type="password"
                  required={modal === 'add'}
                  value={form.password || ''}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95">Batal</button>
              <button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// PRODUCTS PAGE - iOS Style
// ============================================================
export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ 
    sku: '', name: '', brand: '', category: '', description: '', unit: 'pcs', 
    price_buy: '', price_sell: '', stock_qty: 0, min_order: 1, hs_code: '', 
    country_of_origin: '', weight_kg: '' 
  });
  const [search, setSearch] = useState('');

  const load = (s = '') => productsAPI.getAll({ search: s || undefined, limit: 100 }).then(r => setProducts(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'add') await productsAPI.create(form);
      else await productsAPI.update(modal.id, form);
      toast.success('Produk disimpan'); 
      setModal(null); 
      load(search);
    } catch { toast.error('Gagal'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Katalog Produk</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} total produk</p>
        </div>
        <button
          onClick={() => { 
            setForm({ sku: '', name: '', brand: '', category: '', description: '', unit: 'pcs', price_buy: '', price_sell: '', stock_qty: 0, min_order: 1, hs_code: '', country_of_origin: '', weight_kg: '' }); 
            setModal('add'); 
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value); }}
          placeholder="Cari produk, brand, SKU..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
        />
      </div>

      {/* Products Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-5 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
            <div className="flex justify-between items-start mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">{p.name[0].toUpperCase()}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setForm({ ...p }); setModal(p); }}
                className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <p className="font-semibold text-gray-900 text-base">{p.name}</p>
            <p className="text-xs text-gray-500 mt-1">{p.brand || 'No brand'} · {p.sku}</p>
            {p.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-blue-100 text-blue-700 mt-2">
                <Tag className="w-3 h-3" />
                {p.category}
              </span>
            )}
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Harga Jual</span>
                <span className="font-bold text-blue-600">{formatRupiah(p.price_sell)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Stok</span>
                <span className="font-medium text-gray-700">{p.stock_qty} {p.unit}</span>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Belum ada produk</p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Tambah Produk' : 'Edit Produk'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['sku', 'SKU *', true], ['name', 'Nama Produk *', true], ['brand', 'Brand', false],
                ['category', 'Kategori', false], ['unit', 'Satuan', false], ['stock_qty', 'Stok', false],
                ['price_buy', 'Harga Beli', false], ['price_sell', 'Harga Jual', false], ['hs_code', 'HS Code', false],
                ['country_of_origin', 'Asal Negara', false], ['weight_kg', 'Berat (kg)', false], ['min_order', 'Min Order', false]
              ].map(([k, l, req]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">{l}</label>
                  <input
                    required={req}
                    value={form[k] || ''}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Deskripsi</label>
                <textarea
                  rows={2}
                  value={form.description || ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
                  placeholder="Deskripsi produk..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(null)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95">Batal</button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// DOCUMENTS PAGE - iOS Style
// ============================================================
export function DocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ type: 'invoice', title: '', customer_id: '', invoice_id: '', notes: '', issued_date: '' });

  const load = () => documentsAPI.getAll({ limit: 50 }).then(r => setDocs(r.data.data || [])).catch(() => {});
  useEffect(() => {
    load();
    customersAPI.getAll({ limit: 100 }).then(r => setCustomers(r.data.data?.customers || [])).catch(() => {});
    invoicesAPI.getAll({ limit: 100 }).then(r => setInvoices(r.data.data?.invoices || [])).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try { 
      await documentsAPI.create(form); 
      toast.success('Dokumen dibuat'); 
      setModal(false); 
      setForm({ type: 'invoice', title: '', customer_id: '', invoice_id: '', notes: '', issued_date: '' });
      load(); 
    } catch { toast.error('Gagal'); }
  };

  const DOC_TYPES = ['invoice', 'packing_list', 'bl', 'customs_declaration', 'surat_jalan', 'po', 'contract', 'beacukai', 'npwp', 'other'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dokumen</h1>
          <p className="text-sm text-gray-500 mt-1">{docs.length} total dokumen</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Buat Dokumen
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Nomor</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Judul</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Tipe</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden md:table-cell">Customer</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden lg:table-cell">Tanggal</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-blue-600 font-semibold">{d.document_number}</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{d.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-indigo-100 text-indigo-700">
                      {d.type?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-500">{d.customer_name || '-'}</td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-xs">{formatDate(d.issued_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${statusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Document Modal */}
      {modal && (
        <Modal title="Buat Dokumen" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tipe *</label>
                <select
                  required
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  {DOC_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tanggal</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.issued_date}
                    onChange={e => setForm(f => ({ ...f, issued_date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Judul *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  placeholder="Judul dokumen..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Customer</label>
                <select
                  value={form.customer_id}
                  onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  <option value="">Pilih customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` (${c.company_name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Invoice</label>
                <select
                  value={form.invoice_id}
                  onChange={e => {
                    const selected = invoices.find(inv => String(inv.id) === e.target.value);
                    setForm(f => ({
                      ...f,
                      invoice_id: e.target.value,
                      customer_id: f.customer_id || String(selected?.customer_id || ''),
                      title: f.title || (selected ? `Dokumen ${selected.invoice_number}` : f.title),
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  <option value="">Pilih invoice</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_number} - {inv.customer_name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Catatan</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
                  placeholder="Catatan tambahan..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95">Batal</button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Buat
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// SHIPMENTS PAGE - iOS Style
// ============================================================
export function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ 
    type: 'export', status: 'pending', origin: '', destination: '', carrier: '', 
    estimated_arrival: '', container_number: '', bl_number: '', hs_code: '', 
    notes: '', customer_id: '', invoice_id: '' 
  });

  const load = () => shipmentsAPI.getAll({ limit: 50 }).then(r => setShipments(r.data.data || [])).catch(() => {});
  useEffect(() => {
    load();
    customersAPI.getAll({ limit: 100 }).then(r => setCustomers(r.data.data?.customers || [])).catch(() => {});
    invoicesAPI.getAll({ limit: 100 }).then(r => setInvoices(r.data.data?.invoices || [])).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try { 
      await shipmentsAPI.create(form); 
      toast.success('Shipment dibuat'); 
      setModal(false); 
      setForm({
        type: 'export', status: 'pending', origin: '', destination: '', carrier: '',
        estimated_arrival: '', container_number: '', bl_number: '', hs_code: '',
        notes: '', customer_id: '', invoice_id: ''
      });
      load(); 
    } catch { toast.error('Gagal'); }
  };

  const updateStatus = async (id, status) => {
    try { 
      await shipmentsAPI.update(id, { status }); 
      toast.success('Status diperbarui'); 
      load(); 
    } catch { toast.error('Gagal'); }
  };

  const statusOptions = ['pending', 'processing', 'shipped', 'in_transit', 'customs', 'delivered', 'returned', 'cancelled'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengiriman</h1>
          <p className="text-sm text-gray-500 mt-1">{shipments.length} total pengiriman</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Buat Shipment
        </button>
      </div>

      {/* Shipments Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Tracking ID</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden md:table-cell">Customer</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Tipe</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Rute</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shipments.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-blue-600 font-semibold">{s.tracking_id}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell font-medium text-gray-900">{s.customer_name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${s.type === 'export' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {s.type === 'export' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {s.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <span>{s.origin || '?'}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{s.destination || '?'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${statusColor(s.status)}`}>
                      {statusLabel(s.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={s.status}
                      onChange={e => updateStatus(s.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                      {statusOptions.map(st => (
                        <option key={st} value={st}>{statusLabel(st)}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {modal && (
        <Modal title="Buat Shipment" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tipe</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  <option value="export">Export</option>
                  <option value="import">Import</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Customer</label>
                <select
                  value={form.customer_id}
                  onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  <option value="">Pilih customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` (${c.company_name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Invoice</label>
                <select
                  value={form.invoice_id}
                  onChange={e => {
                    const selected = invoices.find(inv => String(inv.id) === e.target.value);
                    setForm(f => ({
                      ...f,
                      invoice_id: e.target.value,
                      customer_id: f.customer_id || String(selected?.customer_id || ''),
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  <option value="">Pilih invoice</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoice_number} - {inv.customer_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">ETA</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={form.estimated_arrival}
                    onChange={e => setForm(f => ({ ...f, estimated_arrival: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              {[['origin', 'Asal'], ['destination', 'Tujuan'], ['carrier', 'Carrier/Ekspedisi'], 
                ['container_number', 'No. Container'], ['bl_number', 'No. B/L'], ['hs_code', 'HS Code']].map(([k, l]) => (
                <div key={k}>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">{l}</label>
                  <input
                    value={form[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Catatan</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
                  placeholder="Catatan pengiriman..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95">Batal</button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Buat
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// TAX REPORTS PAGE - iOS Style
// ============================================================
export function TaxReportsPage() {
  const [reports, setReports] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ period_start: '', period_end: '', period_name: '' });
  const [loading, setLoading] = useState(false);

  const load = () => taxAPI.getAll().then(r => setReports(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { 
      await taxAPI.calculate(form); 
      toast.success('Laporan dihitung!'); 
      load(); 
      setModal(false); 
    } catch { toast.error('Gagal menghitung'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (id) => {
    try { 
      await taxAPI.submit(id); 
      toast.success('Laporan disubmit'); 
      load(); 
    } catch { toast.error('Gagal'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Pajak</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola laporan pajak bulanan</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Hitung Pajak
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Periode</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Total Pemasukan</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">PPN Dikumpulkan</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Net Pajak</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{r.period_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(r.period_start)} — {formatDate(r.period_end)}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{formatRupiah(r.total_income)}</td>
                  <td className="px-6 py-4 text-right font-medium text-blue-600">{formatRupiah(r.total_tax_collected)}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">{formatRupiah(r.net_tax)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {r.status === 'draft' && (
                      <button
                        onClick={() => handleSubmit(r.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-xl hover:bg-blue-200 transition-all duration-200"
                      >
                        Submit ke Pajak
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Calculate Modal */}
      {modal && (
        <Modal title="Hitung Laporan Pajak" onClose={() => setModal(false)}>
          <form onSubmit={handleCalculate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Periode Mulai *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={form.period_start}
                    onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Periode Akhir *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={form.period_end}
                    onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Nama Periode</label>
                <input
                  value={form.period_name}
                  onChange={e => setForm(f => ({ ...f, period_name: e.target.value }))}
                  placeholder="mis. Q1 2024, Januari 2024"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95">Batal</button>
              <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Menghitung...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Hitung</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// KNOWLEDGE BASE PAGE - iOS Style
// ============================================================
export function KnowledgeBasePage() {
  const { hasRole } = useAuth();
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ category: '', title: '', content: '', tags: '' });
  const [selected, setSelected] = useState(null);

  const load = (s = '') => kbAPI.getAll({ search: s || undefined }).then(r => setArticles(r.data.data || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try { 
      await kbAPI.create(form); 
      toast.success('Artikel ditambahkan'); 
      setModal(false); 
      load(search); 
    } catch { toast.error('Gagal'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">Panduan dan dokumentasi</p>
        </div>
        {hasRole('super_admin', 'general_manager') && (
          <button
            onClick={() => { setForm({ category: '', title: '', content: '', tags: '' }); setModal(true); }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
          >
            <Plus className="w-4 h-4" />
            Tambah Artikel
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); load(e.target.value); }}
          placeholder="Cari artikel, produk, panduan..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
        />
      </div>

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map(a => (
          <div
            key={a.id}
            onClick={() => setSelected(a)}
            className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-5 cursor-pointer hover:shadow-lg hover:border-blue-200 hover:scale-[1.02] transition-all duration-300"
          >
            {a.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-blue-100 text-blue-700">
                <Tag className="w-3 h-3" />
                {a.category}
              </span>
            )}
            <h3 className="font-bold text-gray-900 mt-3 mb-2 text-lg">{a.title}</h3>
            <p className="text-gray-500 text-sm line-clamp-3">{a.content?.substring(0, 120)}...</p>
            {a.tags && (
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {a.tags}
              </p>
            )}
          </div>
        ))}
        {articles.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Tidak ada artikel</p>
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selected && (
        <Modal title={selected.title} onClose={() => setSelected(null)} wide>
          <div className="space-y-4">
            {selected.category && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-medium bg-blue-100 text-blue-700">
                {selected.category}
              </span>
            )}
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.content}</p>
            {selected.tags && (
              <p className="text-xs text-gray-400 border-t pt-3 flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tags: {selected.tags}
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* Add Article Modal */}
      {modal && (
        <Modal title="Tambah Artikel" onClose={() => setModal(false)} wide>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Kategori</label>
                <input
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="mis. Produk, Layanan"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tags</label>
                <input
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="tag1, tag2"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Judul *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  placeholder="Judul artikel..."
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Konten *</label>
                <textarea
                  required
                  rows={8}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
                  placeholder="Isi artikel..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95">Batal</button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
// PAYMENTS PAGE - iOS Style
// ============================================================
export function PaymentsPage() {
  const { hasRole } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ 
    invoice_id: '', amount: '', payment_method: 'transfer', 
    reference_number: '', notes: '', payment_date: new Date().toISOString().slice(0, 16) 
  });

  const load = () => paymentsAPI.getAll({ limit: 50 }).then(r => setPayments(r.data.data || [])).catch(() => {});
  useEffect(() => {
    load();
    invoicesAPI.getAll({ limit: 100 }).then(r => setInvoiceOptions(r.data.data?.invoices || [])).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try { 
      await paymentsAPI.create(form); 
      toast.success('Pembayaran dicatat'); 
      setModal(false); 
      setForm({
        invoice_id: '', amount: '', payment_method: 'transfer',
        reference_number: '', notes: '', payment_date: new Date().toISOString().slice(0, 16)
      });
      load(); 
    } catch { toast.error('Gagal'); }
  };

  const handleVerify = async (id, status) => {
    try { 
      await paymentsAPI.verify(id, { status }); 
      toast.success('Status diperbarui'); 
      load(); 
    } catch { toast.error('Gagal'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pembayaran</h1>
          <p className="text-sm text-gray-500 mt-1">{payments.length} total pembayaran</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Catat Pembayaran
        </button>
      </div>

      {/* Payments Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Invoice</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Jumlah</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden md:table-cell">Metode</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden lg:table-cell">Referensi</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600 hidden md:table-cell">Tanggal</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                {hasRole('finance','general_manager','super_admin') && (
                  <th className="text-left px-6 py-4 font-semibold text-gray-600">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-blue-600 font-semibold">{p.invoice_number || `INV #${p.invoice_id}`}</p>
                    <p className="text-xs text-gray-500">{p.customer_name || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-green-600">{formatRupiah(p.amount)}</p>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-500 text-xs">{p.payment_method?.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell text-gray-400 text-xs">{p.reference_number || '-'}</td>
                  <td className="px-6 py-4 hidden md:table-cell text-gray-400 text-xs">{formatDateTime(p.payment_date)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium ${statusColor(p.status)}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  {hasRole('finance','general_manager','super_admin') && (
                    <td className="px-6 py-4">
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVerify(p.id, 'verified')}
                            className="p-1.5 rounded-xl bg-green-100 text-green-600 hover:bg-green-200 transition-all duration-200"
                            title="Verifikasi"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleVerify(p.id, 'rejected')}
                            className="p-1.5 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-200"
                            title="Tolak"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Payment Modal */}
      {modal && (
        <Modal title="Catat Pembayaran" onClose={() => setModal(false)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Invoice *</label>
                <select
                  required
                  value={form.invoice_id}
                  onChange={e => {
                    const selected = invoiceOptions.find(inv => String(inv.id) === e.target.value);
                    setForm(f => ({
                      ...f,
                      invoice_id: e.target.value,
                      amount: f.amount || String(selected?.amount_due || selected?.grand_total || ''),
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  <option value="">Pilih invoice</option>
                  {invoiceOptions.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} - {inv.customer_name} - Sisa {formatRupiah(inv.amount_due || 0)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Jumlah (Rp) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Metode</label>
                <select
                  value={form.payment_method}
                  onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
                >
                  {['transfer', 'midtrans', 'indomaret', 'alfamart', 'va_bni', 'va_bri', 'va_mandiri', 'va_bca', 'cash'].map(m => (
                    <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">No. Referensi</label>
                <input
                  value={form.reference_number}
                  onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))}
                  placeholder="No. bukti bayar"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Tanggal & Jam *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="datetime-local"
                    required
                    value={form.payment_date}
                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Catatan</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
                  placeholder="Catatan pembayaran..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95">Batal</button>
              <button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
