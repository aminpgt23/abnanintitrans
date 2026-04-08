import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  FolderOpen,
  Mail,
  MapPin,
  Phone,
  Truck,
  UserCheck,
  Wallet,
  Activity,
  Clock,
  Package,
} from 'lucide-react';
import { customersAPI, portalAccessAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatDateTime, formatRupiah, statusColor, statusLabel } from '../utils/format';

function SummaryCard({ icon: Icon, label, value, subtext, color = 'blue' }) {
  const palette = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`rounded-2xl border p-5 ${palette[color] || palette.blue}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {subtext ? <p className="mt-1 text-xs text-gray-500">{subtext}</p> : null}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, subtitle, children, action }) {
  return (
    <section className="rounded-3xl border border-gray-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalAccess, setPortalAccess] = useState(null);
  const [portalLoading, setPortalLoading] = useState(true);
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalForm, setPortalForm] = useState({ email: '', full_name: '', phone: '', password: '', is_active: true });

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setLoading(true);
      try {
        const response = await customersAPI.getOverview(id);
        if (active) setData(response.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Gagal memuat customer overview');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadOverview();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadPortalAccess = async () => {
      setPortalLoading(true);
      try {
        const response = await portalAccessAPI.getByCustomerId(id);
        const payload = response.data.data;
        if (!active) return;
        setPortalAccess(payload.account || null);
        setPortalForm({
          email: payload.account?.email || payload.customer?.email || '',
          full_name: payload.account?.full_name || payload.customer?.name || '',
          phone: payload.account?.phone || payload.customer?.phone || '',
          password: '',
          is_active: payload.account?.is_active ?? true,
        });
      } catch (error) {
        if (active) {
          setPortalAccess(null);
        }
      } finally {
        if (active) setPortalLoading(false);
      }
    };

    loadPortalAccess();

    return () => {
      active = false;
    };
  }, [id]);

  const handlePortalSubmit = async (event) => {
    event.preventDefault();
    setPortalSaving(true);
    try {
      const response = await portalAccessAPI.upsert(id, portalForm);
      setPortalAccess(response.data.data);
      setPortalForm((current) => ({ ...current, password: '', is_active: response.data.data?.is_active ?? current.is_active }));
      toast.success(portalAccess ? 'Akses customer diperbarui' : 'Akses customer berhasil dibuat');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan akses customer');
    } finally {
      setPortalSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!data?.customer) {
    return (
      <div className="space-y-4">
        <Link to="/customers" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
          <ArrowLeft className="h-4 w-4" />
          Kembali ke pelanggan
        </Link>
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-10 text-center">
          <p className="text-gray-500">Data customer tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const { customer, summary, recent, timeline } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <Link to="/customers" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke pelanggan
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-black text-white shadow-lg shadow-blue-500/20">
              {(customer.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{customer.name}</h1>
              <p className="mt-1 text-sm text-gray-500">{customer.company_name || 'Individual / personal account'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold">{customer.code}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">{customer.category}</span>
                <span className="rounded-full bg-green-50 px-3 py-1 font-semibold text-green-700">Rating {customer.rating || 0}/5</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Sales PIC</p>
          <p className="mt-2 text-sm font-semibold text-gray-900">{customer.sales_name || '-'}</p>
          <p className="mt-1 text-xs text-gray-500">{customer.sales_employee_id || 'Belum ditentukan'}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Wallet}
          label="Total Revenue"
          value={formatRupiah(summary.totalRevenue || 0)}
          subtext={`${summary.totalInvoices || 0} invoice`}
          color="green"
        />
        <SummaryCard
          icon={CreditCard}
          label="Outstanding"
          value={formatRupiah(summary.outstandingAmount || 0)}
          subtext={`${summary.overdueInvoices || 0} overdue invoice`}
          color="yellow"
        />
        <SummaryCard
          icon={Truck}
          label="Shipment"
          value={summary.shipmentCount || 0}
          subtext={`${summary.deliveredShipments || 0} delivered`}
          color="blue"
        />
        <SummaryCard
          icon={FolderOpen}
          label="Documents"
          value={summary.documentCount || 0}
          subtext={`Paid amount ${formatRupiah(summary.totalPaidAmount || 0)}`}
          color="purple"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Customer Profile" subtitle="Informasi utama customer dan relasi operasional">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <Mail className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Email</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{customer.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <Phone className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Phone / WhatsApp</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{customer.phone || '-'}</p>
                  <p className="mt-1 text-xs text-gray-500">{customer.whatsapp || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <Building2 className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Company</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{customer.company_name || '-'}</p>
                  <p className="mt-1 text-xs text-gray-500">NPWP: {customer.npwp || '-'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Address</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{customer.address || '-'}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {[customer.city, customer.province, customer.country].filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <UserCheck className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Customer Metrics</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{customer.total_transactions || 0} transaksi</p>
                  <p className="mt-1 text-xs text-gray-500">{formatRupiah(customer.total_purchases || 0)} historical purchases</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <Calendar className="mt-0.5 h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Latest Activity Markers</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">Invoice: {formatDate(summary.lastInvoiceDate)}</p>
                  <p className="mt-1 text-xs text-gray-500">Shipment: {formatDate(summary.lastShipmentDate)}</p>
                  <p className="mt-1 text-xs text-gray-500">Document: {formatDate(summary.lastDocumentDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Activity Timeline" subtitle="Gabungan invoice, payment, shipment, document, dan audit">
          <div className="space-y-3">
            {timeline?.length ? (
              timeline.map((item) => (
                <div key={`${item.type}-${item.id}`} className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-gray-500">
                          {item.type}
                        </span>
                        {item.status ? (
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                    </div>
                    <div className="text-right">
                      {item.amount ? <p className="text-sm font-bold text-gray-900">{formatRupiah(item.amount)}</p> : null}
                      <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.occurred_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                Belum ada aktivitas.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Customer Access"
        subtitle="Akun login customer untuk melihat landing page, lalu masuk ke dashboard sesuai data yang dia miliki"
      >
        {portalLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl bg-gray-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Customer Status</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span className="text-sm text-gray-500">Status akun</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${portalAccess?.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {portalAccess ? (portalAccess.is_active ? 'Aktif' : 'Nonaktif') : 'Belum dibuat'}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span className="text-sm text-gray-500">Login customer</span>
                  <span className="text-sm font-semibold text-gray-900">{portalAccess?.email || '-'}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <span className="text-sm text-gray-500">Last login</span>
                  <span className="text-sm font-semibold text-gray-900">{formatDateTime(portalAccess?.last_login)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handlePortalSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Email Login Customer</label>
                <input
                  type="email"
                  value={portalForm.email}
                  onChange={(event) => setPortalForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  placeholder="customer@company.com"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Nama Customer Login</label>
                <input
                  type="text"
                  value={portalForm.full_name}
                  onChange={(event) => setPortalForm((current) => ({ ...current, full_name: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  placeholder="PIC customer"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Phone</label>
                <input
                  type="text"
                  value={portalForm.phone}
                  onChange={(event) => setPortalForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  placeholder="0812..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                  {portalAccess ? 'Reset Password Baru' : 'Password Awal Customer'}
                </label>
                <input
                  type="text"
                  value={portalForm.password}
                  onChange={(event) => setPortalForm((current) => ({ ...current, password: event.target.value }))}
                  required={!portalAccess}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  placeholder={portalAccess ? 'Isi jika ingin mengganti password' : 'Masukkan password awal customer'}
                />
              </div>
              <label className="md:col-span-2 flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={portalForm.is_active}
                  onChange={(event) => setPortalForm((current) => ({ ...current, is_active: event.target.checked }))}
                />
                Customer bisa login ke dashboard
              </label>
              <div className="md:col-span-2 flex items-center justify-between gap-4">
                <p className="text-xs text-gray-500">
                  {user?.role === 'sales'
                    ? 'Anda hanya bisa mengatur akses customer yang menjadi tanggung jawab Anda.'
                    : 'Akun customer tidak membuka menu internal CRM.'}
                </p>
                <button
                  type="submit"
                  disabled={portalSaving}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {portalSaving ? 'Menyimpan...' : portalAccess ? 'Update Customer Access' : 'Buat Customer Access'}
                </button>
              </div>
            </form>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent Invoices"
          subtitle="Riwayat transaksi terbaru"
          action={<Link to={`/invoices?customer_id=${customer.id}`} className="text-sm font-semibold text-blue-600">Lihat semua</Link>}
        >
          <div className="space-y-3">
            {recent?.invoices?.length ? recent.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{invoice.invoice_number}</p>
                  <p className="mt-1 text-xs text-gray-500">Issue {formatDate(invoice.issue_date)} - Due {formatDate(invoice.due_date)}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(invoice.status)}`}>
                    {statusLabel(invoice.status)}
                  </span>
                  <p className="mt-2 text-sm font-bold text-gray-900">{formatRupiah(invoice.grand_total || 0)}</p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada invoice.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Recent Payments" subtitle="Pembayaran yang terkait ke customer ini">
          <div className="space-y-3">
            {recent?.payments?.length ? recent.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{payment.invoice_number}</p>
                  <p className="mt-1 text-xs text-gray-500">{payment.payment_method || '-'} - {payment.reference_number || 'Tanpa referensi'}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(payment.status)}`}>
                    {statusLabel(payment.status)}
                  </span>
                  <p className="mt-2 text-sm font-bold text-gray-900">{formatRupiah(payment.amount || 0)}</p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada payment.</p>}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Purchased Products" subtitle="Produk yang pernah dibeli customer ini">
          <div className="space-y-3">
            {recent?.products?.length ? recent.products.map((product, index) => (
              <div key={`${product.product_id}-${index}`} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <p className="truncate text-sm font-semibold text-gray-900">{product.product_name}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.sku || 'No SKU'}{product.brand ? ` - ${product.brand}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.invoice_count || 0} invoice - pembelian terakhir {formatDate(product.last_purchase_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatRupiah(product.total_value || 0)}</p>
                    <p className="mt-1 text-xs text-gray-500">Qty {Number(product.total_quantity || 0)}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada histori produk.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Shipment History" subtitle="Riwayat logistik per customer">
          <div className="space-y-3">
            {recent?.shipments?.length ? recent.shipments.map((shipment) => (
              <div key={shipment.id} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{shipment.tracking_id}</p>
                    <p className="mt-1 text-xs text-gray-500">{shipment.origin || '-'} to {shipment.destination || '-'}</p>
                    <p className="mt-1 text-xs text-gray-500">{shipment.carrier || '-'} - {shipment.invoice_number || 'No invoice'}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(shipment.status)}`}>
                    {statusLabel(shipment.status)}
                  </span>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada shipment.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Document History" subtitle="Dokumen legal dan operasional">
          <div className="space-y-3">
            {recent?.documents?.length ? recent.documents.map((document) => (
              <div key={document.id} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{document.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{document.document_number} - {document.type}</p>
                    <p className="mt-1 text-xs text-gray-500">Issued {formatDate(document.issued_date)}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(document.status)}`}>
                    {statusLabel(document.status)}
                  </span>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada dokumen.</p>}
          </div>
        </SectionCard>
      </div>

      <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 font-semibold">
            <Activity className="h-3.5 w-3.5" />
            Unified customer timeline
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 font-semibold">
            <Clock className="h-3.5 w-3.5" />
            Enterprise-ready overview
          </span>
        </div>
      </div>
    </div>
  );
}
