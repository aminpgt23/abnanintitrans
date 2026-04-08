import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  CreditCard,
  FileText,
  FolderOpen,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react';
import { customerPortalAPI } from '../services/api';
import { formatDate, formatDateTime, formatRupiah, statusColor, statusLabel } from '../utils/format';

function SummaryCard({ icon: Icon, title, value, subtitle, tone = 'blue' }) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50 text-blue-600',
    green: 'border-green-100 bg-green-50 text-green-600',
    yellow: 'border-yellow-100 bg-yellow-50 text-yellow-700',
    purple: 'border-purple-100 bg-purple-50 text-purple-600',
  };

  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.blue}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-70">{title}</p>
          <p className="mt-3 text-2xl font-black text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="rounded-[2rem] border border-gray-200/70 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-black tracking-tight text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function CustomerPortalPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPortal = async () => {
      setLoading(true);
      try {
        const response = await customerPortalAPI.getOverview();
        if (active) setData(response.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Gagal memuat dashboard customer');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPortal();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
      </div>
    );
  }

  if (!data?.customer) {
    return (
      <div className="rounded-[2rem] border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
        Data dashboard customer belum tersedia.
      </div>
    );
  }

  const { customer, summary, recent, timeline } = data;
  const openInvoices = (summary.totalInvoices || 0) - (summary.paidInvoices || 0);

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-8 text-white shadow-2xl shadow-blue-600/20">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-100">Customer Dashboard</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">{customer.company_name || customer.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Setelah login, customer langsung masuk ke dashboard ini untuk memantau invoice, pembayaran, pengiriman, dokumen, dan histori produk.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white/15 px-4 py-2 font-semibold">{customer.code}</span>
              <span className="rounded-full bg-white/15 px-4 py-2 font-semibold">{customer.category}</span>
              <span className="rounded-full bg-white/15 px-4 py-2 font-semibold">Rating {customer.rating || 0}/5</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">Kontak Utama</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-blue-100" />
                <div>
                    <p className="font-semibold">{customer.email || '-'}</p>
                    <p className="text-xs text-blue-100">Email perusahaan / akun customer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-blue-100" />
                <div>
                  <p className="font-semibold">{customer.phone || customer.whatsapp || '-'}</p>
                  <p className="text-xs text-blue-100">Kontak customer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-blue-100" />
                <div>
                  <p className="font-semibold">{[customer.city, customer.province, customer.country].filter(Boolean).join(', ') || '-'}</p>
                  <p className="text-xs text-blue-100">{customer.address || 'Alamat belum diisi'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={FileText}
          title="Invoice Aktif"
          value={openInvoices}
          subtitle={`${summary.totalInvoices || 0} total invoice`}
          tone="blue"
        />
        <SummaryCard
          icon={Wallet}
          title="Total Paid"
          value={formatRupiah(summary.totalPaidAmount || 0)}
          subtitle="Akumulasi pembayaran tervalidasi"
          tone="green"
        />
        <SummaryCard
          icon={CreditCard}
          title="Tagihan Berjalan"
          value={formatRupiah(summary.outstandingAmount || 0)}
          subtitle={`${summary.overdueInvoices || 0} invoice jatuh tempo`}
          tone="yellow"
        />
        <SummaryCard
          icon={Truck}
          title="Shipment Aktif"
          value={summary.activeShipments || 0}
          subtitle={`${summary.shipmentCount || 0} total shipment`}
          tone="purple"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Section title="Invoice Terbaru" subtitle="Status invoice dan nilai transaksi terbaru Anda">
          <div className="space-y-3">
            {recent?.invoices?.length ? recent.invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{invoice.invoice_number}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Terbit {formatDate(invoice.issue_date)} • Jatuh tempo {formatDate(invoice.due_date)}
                  </p>
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
        </Section>

        <Section title="Pembayaran Terbaru" subtitle="Riwayat pembayaran yang sudah dicatat">
          <div className="space-y-3">
            {recent?.payments?.length ? recent.payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-bold text-gray-900">{payment.invoice_number}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {payment.payment_method || '-'} • {payment.reference_number || 'Tanpa referensi'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(payment.status)}`}>
                    {statusLabel(payment.status)}
                  </span>
                  <p className="mt-2 text-sm font-bold text-gray-900">{formatRupiah(payment.amount || 0)}</p>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada pembayaran.</p>}
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Section title="Tracking Pengiriman" subtitle="Pantau status pengiriman yang masih berjalan atau sudah selesai">
          <div className="space-y-3">
            {recent?.shipments?.length ? recent.shipments.map((shipment) => (
              <div key={shipment.id} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{shipment.tracking_id}</p>
                    <p className="mt-1 text-xs text-gray-500">{shipment.origin || '-'} ke {shipment.destination || '-'}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {shipment.carrier || 'Carrier belum diisi'} • ETA {formatDate(shipment.estimated_arrival)}
                    </p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(shipment.status)}`}>
                    {statusLabel(shipment.status)}
                  </span>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada data pengiriman.</p>}
          </div>
        </Section>

        <Section title="Dokumen Terkait" subtitle="Dokumen invoice, pengiriman, dan lampiran operasional customer">
          <div className="space-y-3">
            {recent?.documents?.length ? recent.documents.map((document) => (
              <div key={document.id} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{document.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{document.document_number} • {document.type}</p>
                    <p className="mt-1 text-xs text-gray-500">Diterbitkan {formatDate(document.issued_date)}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(document.status)}`}>
                    {statusLabel(document.status)}
                  </span>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada dokumen.</p>}
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Section title="Produk yang Pernah Dibeli" subtitle="Ringkasan produk dan nilai pembelian Anda">
          <div className="space-y-3">
            {recent?.products?.length ? recent.products.map((product, index) => (
              <div key={`${product.product_id}-${index}`} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <p className="truncate text-sm font-bold text-gray-900">{product.product_name}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.sku || 'SKU belum ada'}{product.brand ? ` • ${product.brand}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.invoice_count || 0} invoice • pembelian terakhir {formatDate(product.last_purchase_date)}
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
        </Section>

        <Section title="Aktivitas Terbaru" subtitle="Update terbaru dari transaksi dan operasional Anda">
          <div className="space-y-3">
            {timeline?.length ? timeline.slice(0, 8).map((item) => (
              <div key={`${item.type}-${item.id}`} className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                        {item.type}
                      </span>
                      {item.status ? (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusColor(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{item.description}</p>
                  </div>
                  <div className="text-right">
                    {item.amount ? <p className="text-sm font-bold text-gray-900">{formatRupiah(item.amount)}</p> : null}
                    <p className="mt-1 text-xs text-gray-500">{formatDateTime(item.occurred_at)}</p>
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">Belum ada aktivitas terbaru.</p>}
          </div>
        </Section>
      </div>

      <Section title="Batasan Akses Customer" subtitle="Akun customer tidak membuka fitur internal CRM dan hanya menampilkan relasi customer Anda">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            'Hanya invoice, pembayaran, shipment, dokumen, dan produk milik customer ini yang tampil.',
            'Landing page tetap publik, lalu setelah login customer langsung diarahkan ke dashboard sesuai otoritasnya.',
            'Tidak ada self registration, jadi akses login customer tetap dikendalikan admin atau tim internal.',
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
