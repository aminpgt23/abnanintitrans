import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Calendar,
  Globe,
  MapPin,
  Package,
  Plus,
  Search,
  ShipWheel,
  Truck,
  Warehouse,
} from 'lucide-react';
import { customersAPI, invoicesAPI, shipmentsAPI } from '../services/api';
import { formatDate, statusColor, statusLabel } from '../utils/format';

const STATUS_FLOW = ['pending', 'processing', 'shipped', 'in_transit', 'customs', 'delivered'];
const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'in_transit', 'customs', 'delivered', 'returned', 'cancelled'];

function ShipmentModal({ title, onClose, children }) {
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

function StatusNode({ label, active, done }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-black ${done ? 'border-emerald-200 bg-emerald-500 text-white' : active ? 'border-blue-200 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
        {done ? 'OK' : ''}
      </div>
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold ${active || done ? 'text-slate-900' : 'text-slate-400'}`}>{statusLabel(label)}</p>
      </div>
    </div>
  );
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    type: 'export',
    status: 'pending',
    origin: '',
    destination: '',
    carrier: '',
    estimated_arrival: '',
    container_number: '',
    bl_number: '',
    hs_code: '',
    notes: '',
    customer_id: '',
    invoice_id: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [shipmentsRes, customersRes, invoicesRes] = await Promise.all([
        shipmentsAPI.getAll({ limit: 100 }),
        customersAPI.getAll({ limit: 100 }),
        invoicesAPI.getAll({ limit: 100 }),
      ]);

      const shipmentsData = shipmentsRes.data.data || [];
      setShipments(shipmentsData);
      setCustomers(customersRes.data.data?.customers || []);
      setInvoices(invoicesRes.data.data?.invoices || []);
      if (!selectedId && shipmentsData[0]?.id) setSelectedId(shipmentsData[0].id);
    } catch {
      toast.error('Gagal memuat data shipment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredShipments = useMemo(() => {
    return shipments.filter((shipment) => {
      const needle = search.trim().toLowerCase();
      const matchesSearch = !needle || [
        shipment.tracking_id,
        shipment.customer_name,
        shipment.invoice_number,
        shipment.origin,
        shipment.destination,
        shipment.carrier,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));

      const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [shipments, search, statusFilter]);

  const selectedShipment = filteredShipments.find((shipment) => shipment.id === selectedId) || filteredShipments[0] || null;

  useEffect(() => {
    if (selectedShipment && selectedShipment.id !== selectedId) {
      setSelectedId(selectedShipment.id);
    }
  }, [selectedShipment, selectedId]);

  const stats = useMemo(() => ({
    total: shipments.length,
    active: shipments.filter((item) => ['processing', 'shipped', 'in_transit', 'customs'].includes(item.status)).length,
    delivered: shipments.filter((item) => item.status === 'delivered').length,
    customs: shipments.filter((item) => item.status === 'customs').length,
  }), [shipments]);

  const updateStatus = async (id, status) => {
    try {
      await shipmentsAPI.update(id, { status });
      toast.success('Status shipment diperbarui');
      load();
    } catch {
      toast.error('Gagal memperbarui status shipment');
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      await shipmentsAPI.create(form);
      toast.success('Shipment baru berhasil dibuat');
      setShowModal(false);
      setForm({
        type: 'export',
        status: 'pending',
        origin: '',
        destination: '',
        carrier: '',
        estimated_arrival: '',
        container_number: '',
        bl_number: '',
        hs_code: '',
        notes: '',
        customer_id: '',
        invoice_id: '',
      });
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat shipment');
    }
  };

  const currentFlowIndex = selectedShipment ? STATUS_FLOW.indexOf(selectedShipment.status) : -1;

  return (
    <div className="space-y-6 overflow-x-hidden">
      <section className="overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.22),_transparent_35%),linear-gradient(135deg,#0f172a,#1d4ed8_45%,#0f766e)] p-6 text-white shadow-2xl shadow-slate-900/20 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-100/80">Warehouse & Shipping</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Buat shipment dari customer atau invoice, pantau carrier, ETA, customs, dan status penerimaan</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-200">
              Gunakan halaman ini untuk memonitor pengiriman aktif, mengecek shipment yang tertahan di bea cukai, dan memastikan setiap invoice memiliki status logistik yang jelas.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:scale-[1.02]">
                <Plus className="h-4 w-4" />
                Buat Shipment
              </button>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100">
                Shipment aktif: <span className="font-black">{stats.active}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {[
              { label: 'Total Shipment', value: stats.total, icon: Package },
              { label: 'Active Route', value: stats.active, icon: Truck },
              { label: 'Customs Hold', value: stats.customs, icon: Globe },
              { label: 'Delivered', value: stats.delivered, icon: Warehouse },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-[1.75rem] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-100">{item.label}</p>
                      <p className="mt-3 text-3xl font-black">{item.value}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">Shipment Queue</h2>
              <p className="mt-1 text-sm text-slate-500">List pengiriman dengan filter cepat dan layout vertikal</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari tracking, customer, invoice..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-300"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
              >
                <option value="all">Semua Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{statusLabel(status)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {loading ? (
              <div className="flex h-40 items-center justify-center rounded-[1.5rem] bg-slate-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              </div>
            ) : filteredShipments.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Tidak ada shipment yang cocok dengan filter saat ini.
              </div>
            ) : (
              filteredShipments.map((shipment) => (
                <button
                  key={shipment.id}
                  type="button"
                  onClick={() => setSelectedId(shipment.id)}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${selectedShipment?.id === shipment.id ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-blue-700">
                          {shipment.tracking_id}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor(shipment.status)}`}>
                          {statusLabel(shipment.status)}
                        </span>
                      </div>
                      <p className="mt-3 text-base font-black tracking-tight text-slate-900">{shipment.customer_name || 'Customer belum ditautkan'}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{shipment.origin || '-'} ke {shipment.destination || '-'}</span>
                        <span className="inline-flex items-center gap-1"><ShipWheel className="h-3.5 w-3.5" />{shipment.carrier || '-'}</span>
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />ETA {formatDate(shipment.estimated_arrival)}</span>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
                      {shipment.invoice_number || 'Tanpa invoice'}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          {selectedShipment ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">
                      {selectedShipment.type}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusColor(selectedShipment.status)}`}>
                      {statusLabel(selectedShipment.status)}
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{selectedShipment.tracking_id}</h2>
                  <p className="mt-1 text-sm text-slate-500">{selectedShipment.customer_name || 'Customer belum dipilih'} | {selectedShipment.invoice_number || 'Tanpa invoice'}</p>
                </div>
                <select
                  value={selectedShipment.status}
                  onChange={(event) => updateStatus(selectedShipment.id, event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{statusLabel(status)}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Rute</p>
                    <p className="mt-2 text-base font-black text-slate-900">{selectedShipment.origin || '-'} <ArrowRight className="inline h-4 w-4" /> {selectedShipment.destination || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Carrier</p>
                    <p className="mt-2 text-base font-black text-slate-900">{selectedShipment.carrier || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Container / B.L</p>
                    <p className="mt-2 text-base font-black text-slate-900">{selectedShipment.container_number || '-'} / {selectedShipment.bl_number || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">ETA</p>
                    <p className="mt-2 text-base font-black text-slate-900">{formatDate(selectedShipment.estimated_arrival)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Tracking Flow</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {STATUS_FLOW.map((status, index) => (
                    <StatusNode
                      key={status}
                      label={status}
                      active={selectedShipment.status === status}
                      done={currentFlowIndex >= index}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Operational Notes</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{selectedShipment.notes || 'Belum ada catatan operasional untuk shipment ini.'}</p>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              Pilih shipment dari daftar kiri untuk melihat tracking detail.
            </div>
          )}
        </div>
      </section>

      {showModal ? (
        <ShipmentModal title="Buat Shipment Baru" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Tipe</label>
                <select
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                >
                  <option value="export">Export</option>
                  <option value="import">Import</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Customer</label>
                <select
                  value={form.customer_id}
                  onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                >
                  <option value="">Pilih customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}{customer.company_name ? ` (${customer.company_name})` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Invoice</label>
                <select
                  value={form.invoice_id}
                  onChange={(event) => {
                    const invoice = invoices.find((item) => String(item.id) === event.target.value);
                    setForm((current) => ({
                      ...current,
                      invoice_id: event.target.value,
                      customer_id: current.customer_id || String(invoice?.customer_id || ''),
                    }));
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                >
                  <option value="">Pilih invoice</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} - {invoice.customer_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">ETA</label>
                <input
                  type="date"
                  value={form.estimated_arrival}
                  onChange={(event) => setForm((current) => ({ ...current, estimated_arrival: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                />
              </div>
              {[
                ['origin', 'Asal'],
                ['destination', 'Tujuan'],
                ['carrier', 'Carrier'],
                ['container_number', 'No. Container'],
                ['bl_number', 'No. B/L'],
                ['hs_code', 'HS Code'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</label>
                  <input
                    value={form[key]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">Catatan</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none transition focus:border-blue-300"
                  placeholder="Catatan operasional, kebutuhan gudang, atau kendala pengiriman"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
                Batal
              </button>
              <button type="submit" className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700">
                Simpan Shipment
              </button>
            </div>
          </form>
        </ShipmentModal>
      ) : null}
    </div>
  );
}
