import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customersAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatRupiah, formatDate, starRating, truncate } from '../utils/format';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Search,
  Filter,
  User,
  Building2,
  Mail,
  Phone,
  Star,
  Tag,
  FileText,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  ArrowLeft,
  CheckCircle,
  UserCheck,
  Award,
  Briefcase,
  Globe,
  MapPin,
  CreditCard,
  TrendingUp,
  MoreVertical,
  Eye,
  Download,
  Copy,
  ExternalLink,
  MessageCircle,
  Settings,
  Shield,
  Clock,
  AlertCircle
} from 'lucide-react';

const CATEGORIES = ['regular', 'vip', 'wholesale', 'government', 'corporate'];

const catConfig = {
  regular: { 
    icon: User, 
    label: 'Regular', 
    bg: 'bg-gray-50', 
    border: 'border-gray-200', 
    text: 'text-gray-600',
    gradient: 'from-gray-400 to-gray-500'
  },
  vip: { 
    icon: Award, 
    label: 'VIP', 
    bg: 'bg-purple-50', 
    border: 'border-purple-200', 
    text: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600'
  },
  wholesale: { 
    icon: Briefcase, 
    label: 'Wholesale', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200', 
    text: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600'
  },
  government: { 
    icon: Shield, 
    label: 'Government', 
    bg: 'bg-red-50', 
    border: 'border-red-200', 
    text: 'text-red-600',
    gradient: 'from-red-500 to-red-600'
  },
  corporate: { 
    icon: Building2, 
    label: 'Corporate', 
    bg: 'bg-green-50', 
    border: 'border-green-200', 
    text: 'text-green-600',
    gradient: 'from-green-500 to-green-600'
  }
};

// iOS Style Modal
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-5 border-b border-gray-200/50">
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

function InviteLinkCard({ inviteInfo, onClose }) {
  const whatsappMessage = encodeURIComponent(
    `Halo ${inviteInfo.customer_name}, silakan buat password akun customer Anda melalui link berikut:\n${inviteInfo.setup_link}\n\nSetelah password selesai dibuat, Anda bisa login dari halaman utama seperti biasa.`
  );
  const whatsappPhone = String(inviteInfo.phone || '').replace(/\D/g, '');
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`
    : `https://wa.me/?text=${whatsappMessage}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteInfo.setup_link);
      toast.success('Link setup berhasil disalin');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-green-100 bg-green-50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-bold text-green-700">Akun customer berhasil disiapkan</p>
            <p className="mt-1 text-sm text-green-700/80">
              Customer <span className="font-semibold">{inviteInfo.customer_name}</span> tinggal membuat password dari link ini sebelum login.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-gray-50 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Email Customer</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">{inviteInfo.email}</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">WhatsApp</p>
        <p className="mt-2 text-sm font-semibold text-gray-900">{inviteInfo.phone || 'Tidak tersedia, akan buka WhatsApp tanpa nomor tujuan'}</p>
        <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Link Setup Password</p>
        <div className="mt-2 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 break-all">
          {inviteInfo.setup_link}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Copy className="h-4 w-4" />
          Copy Link
        </button>
        <a
          href={inviteInfo.setup_link}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Buka Link
        </a>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="w-full rounded-2xl bg-green-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 flex items-center justify-center gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Kirim via WhatsApp
      </a>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
      >
        Tutup
      </button>
    </div>
  );
}

// iOS Style Form
function CustomerForm({ initial = {}, salesList = [], onSave, onClose, loading }) {
  const [form, setForm] = useState({ 
    name: '', 
    company_name: '', 
    email: '', 
    phone: '', 
    whatsapp: '', 
    address: '', 
    city: '', 
    province: '', 
    country: 'Indonesia', 
    npwp: '', 
    category: 'regular', 
    assigned_sales_id: '', 
    notes: '', 
    ...initial 
  });
  
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Nama Lengkap <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              required
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              placeholder="Nama lengkap customer"
            />
          </div>
        </div>
        
        {/* Company */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Perusahaan
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={form.company_name}
              onChange={e => set('company_name', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              placeholder="Nama perusahaan"
            />
          </div>
        </div>
        
        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              placeholder="email@example.com"
            />
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            Jika email diisi, sistem akan otomatis membuat akun customer dan link setup password.
          </p>
        </div>
        
        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            No. HP
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              placeholder="08123456789"
            />
          </div>
        </div>
        
        {/* WhatsApp */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            WhatsApp
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={form.whatsapp}
              onChange={e => set('whatsapp', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              placeholder="08123456789"
            />
          </div>
        </div>
        
        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Kategori
          </label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Address */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Alamat
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              rows={2}
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
              placeholder="Alamat lengkap"
            />
          </div>
        </div>
        
        {/* City */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Kota
          </label>
          <input
            value={form.city}
            onChange={e => set('city', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
            placeholder="Kota"
          />
        </div>
        
        {/* Province */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Provinsi
          </label>
          <input
            value={form.province}
            onChange={e => set('province', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
            placeholder="Provinsi"
          />
        </div>
        
        {/* NPWP */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            NPWP
          </label>
          <input
            value={form.npwp}
            onChange={e => set('npwp', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
            placeholder="xx.xxx.xxx.x-xxx.xxx"
          />
        </div>
        
        {/* Country */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Negara
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={form.country}
              onChange={e => set('country', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
              placeholder="Negara"
            />
          </div>
        </div>
        
        {/* Sales PIC */}
        {salesList.length > 0 && (
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Sales PIC
            </label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={form.assigned_sales_id}
                onChange={e => set('assigned_sales_id', e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
              >
                <option value="">-- Pilih Sales --</option>
                {salesList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.employee_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
        
        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Catatan
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
            placeholder="Catatan tambahan tentang customer..."
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
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
  );
}

// iOS Style Customer Card (Mobile View)
function CustomerCard({ customer, onEdit, onDelete, onViewInvoices, onOpenDetail, hasRole }) {
  const category = catConfig[customer.category] || catConfig.regular;
  const CategoryIcon = category.icon;
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">
              {customer.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
            {customer.company_name && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" />
                {customer.company_name}
              </p>
            )}
            <p className="text-xs text-gray-400 font-mono mt-0.5">{customer.code}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${category.bg} ${category.text} border ${category.border} flex items-center gap-1`}>
          <CategoryIcon className="w-3 h-3" />
          <span>{category.label}</span>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        {customer.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3 text-gray-400" />
            <span>{customer.email}</span>
          </div>
        )}
        {customer.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{customer.phone}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500">Total Pembelian</p>
            <p className="text-sm font-semibold text-gray-900">{formatRupiah(customer.total_purchases || 0)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Rating</p>
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium">{customer.rating || 0}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onOpenDetail(customer.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-all duration-200"
        >
          <Eye className="w-4 h-4" />
          Detail
        </button>
        <button
          onClick={() => onViewInvoices(customer.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-gray-600 text-sm font-medium hover:bg-gray-100 transition-all duration-200"
        >
          <FileText className="w-4 h-4" />
          Invoice
        </button>
        <button
          onClick={() => onEdit(customer)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-all duration-200"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        {hasRole('super_admin', 'general_manager', 'sales_manager') && (
          <button
            onClick={() => onDelete(customer.id)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [salesList, setSalesList] = useState([]);
  const [inviteInfo, setInviteInfo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await customersAPI.getAll({ page, limit: 20, search: search || undefined, category: category || undefined });
      setCustomers(r.data.data.customers || []);
      setTotal(r.data.data.total || 0);
    } catch { 
      toast.error('Gagal memuat data'); 
    } finally { 
      setLoading(false); 
    }
  }, [page, search, category]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (hasRole('super_admin', 'general_manager', 'sales_manager')) {
      usersAPI.getAll({ role: 'sales', is_active: 1 }).then(r => setSalesList(r.data.data?.users || [])).catch(() => {});
    }
  }, [hasRole]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (modal === 'add') {
        const response = await customersAPI.create(form);
        const created = response.data.data;
        if (created?.customer_access?.setup_link) {
          setInviteInfo({
            customer_name: created.name,
            email: created.customer_access.account?.email || created.email,
            setup_link: created.customer_access.setup_link,
            phone: created.whatsapp || created.phone || '',
          });
          toast.success('Customer berhasil ditambahkan dan link setup password sudah dibuat');
        } else {
          toast.success('Customer berhasil ditambahkan!');
          if (!created?.email) {
            toast('Customer belum punya email, jadi link setup belum dibuat.', { icon: 'ℹ️' });
          }
        }
      } else {
        await customersAPI.update(modal.id, form);
        toast.success('Customer berhasil diperbarui!');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Gagal menyimpan');
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus customer ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try {
      await customersAPI.delete(id);
      toast.success('Customer berhasil dihapus');
      load();
    } catch { 
      toast.error('Gagal menghapus customer'); 
    }
  };

  const handleViewInvoices = (customerId) => {
    navigate(`/invoices?customer_id=${customerId}`);
  };

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pelanggan</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total pelanggan terdaftar</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Tambah Customer
        </button>
      </div>

      {/* Filters - iOS Style */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nama, perusahaan, email..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none"
          >
            <option value="">Semua Kategori</option>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-200/50">
              <tr>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Kontak</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Kategori</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Rating</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Total Pembelian</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Sales</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                      </div>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400">Tidak ada data customer</p>
                    </div>
                  </td>
                </tr>
              ) : customers.map(customer => {
                const category = catConfig[customer.category] || catConfig.regular;
                const CategoryIcon = category.icon;
                return (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-sm">
                            {customer.name[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{customer.name}</p>
                          {customer.company_name && (
                            <p className="text-xs text-gray-500">{customer.company_name}</p>
                          )}
                          <p className="text-xs text-gray-400 font-mono">{customer.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.email && (
                        <p className="text-gray-700 text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-gray-500 text-xs mt-1">{customer.phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${category.bg} ${category.text} border ${category.border}`}>
                        <CategoryIcon className="w-3 h-3" />
                        {category.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">{customer.rating || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{formatRupiah(customer.total_purchases || 0)}</p>
                      <p className="text-xs text-gray-500">{customer.total_transactions || 0} transaksi</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.sales_name || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
                          title="Customer 360"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleViewInvoices(customer.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                          title="Lihat Invoice"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setModal(customer)}
                          className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {hasRole('super_admin', 'general_manager', 'sales_manager') && (
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200/50 flex items-center justify-between bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-white transition-all duration-200 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-white transition-all duration-200 flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
            </div>
          </div>
        ) : customers.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Tidak ada data customer</p>
          </div>
        ) : (
          customers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={setModal}
              onDelete={handleDelete}
              onViewInvoices={handleViewInvoices}
              onOpenDetail={(customerId) => navigate(`/customers/${customerId}`)}
              hasRole={hasRole}
            />
          ))
        )}
        
        {/* Pagination Mobile */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-white transition-all duration-200"
            >
              ← Sebelumnya
            </button>
            <span className="text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-white transition-all duration-200"
            >
              Selanjutnya →
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <Modal title={modal === 'add' ? 'Tambah Customer Baru' : `Edit Customer: ${modal.name}`} onClose={() => setModal(null)}>
          <CustomerForm
            initial={modal === 'add' ? {} : modal}
            salesList={salesList}
            onSave={handleSave}
            onClose={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}

      {inviteInfo && (
        <Modal title="Link Setup Customer" onClose={() => setInviteInfo(null)}>
          <InviteLinkCard inviteInfo={inviteInfo} onClose={() => setInviteInfo(null)} />
        </Modal>
      )}
    </div>
  );
}
