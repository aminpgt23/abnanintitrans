import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { invoicesAPI, customersAPI, productsAPI, discountAPI, paymentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatRupiah, formatDate, statusColor, statusLabel } from '../utils/format';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Building2,
  User,
  Calendar,
  DollarSign,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Send,
  Printer,
  Download,
  Copy,
  MoreVertical,
  TrendingUp,
  Wallet,
  Receipt,
  Tag,
  Percent,
  Info,
  ArrowLeft,
  Check,
  PlusCircle,
  MinusCircle
} from 'lucide-react';

// iOS Style Modal
function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`
        bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl 
        ${wide ? 'w-full max-w-5xl' : 'w-full max-w-lg'} 
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

// iOS Style Invoice Form
function InvoiceForm({ onSave, onClose, loading, userId }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
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
    items: [{ description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_percent: 0, product_id: '' }]
  });

  useEffect(() => {
    customersAPI.getAll({ limit: 100 }).then(r => setCustomers(r.data.data?.customers || [])).catch(() => {});
    productsAPI.getAll({ limit: 100 }).then(r => setProducts(r.data.data || [])).catch(() => {});
    discountAPI.getAll().then(r => setDiscounts(r.data.data || [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const setItem = (i, k, v) => {
    const items = [...form.items];
    items[i] = { ...items[i], [k]: v };
    if (k === 'product_id' && v) {
      const p = products.find(x => x.id == v);
      if (p) { 
        items[i].description = p.name; 
        items[i].unit_price = p.price_sell || 0; 
        items[i].unit = p.unit || 'pcs'; 
      }
    }
    setForm(f => ({ ...f, items }));
  };

  const addItem = () => setForm(f => ({ 
    ...f, 
    items: [...f.items, { description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_percent: 0, product_id: '' }] 
  }));
  
  const removeItem = (i) => setForm(f => ({ 
    ...f, 
    items: f.items.filter((_, idx) => idx !== i) 
  }));

  const subtotal = form.items.reduce((s, i) => s + (parseFloat(i.quantity || 0) * parseFloat(i.unit_price || 0) * (1 - (parseFloat(i.discount_percent || 0)) / 100)), 0);
  const discAmt = subtotal * (parseFloat(form.discount_percent || 0) / 100);
  const taxable = subtotal - discAmt;
  const taxAmt = taxable * (parseFloat(form.tax_percent || 11) / 100);
  const grand = taxable + taxAmt;

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-6">
      {/* Customer & Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Customer <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              required
              value={form.customer_id}
              onChange={e => set('customer_id', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
            >
              <option value="">-- Pilih Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company_name ? ` (${c.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Tanggal Invoice *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              required
              value={form.issue_date}
              onChange={e => set('issue_date', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Jatuh Tempo
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Status
          </label>
          <select
            value={form.status}
            onChange={e => set('status', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
          >
            <option value="draft">Draft</option>
            <option value="sent">Terkirim</option>
          </select>
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
            Metode Bayar
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={form.payment_method}
              onChange={e => set('payment_method', e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none bg-white"
            >
              {['transfer','midtrans','indomaret','alfamart','va_bni','va_bri','va_mandiri','va_bca','cash','credit'].map(m => (
                <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Item Produk/Jasa</label>
          <button
            type="button"
            onClick={addItem}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Item
          </button>
        </div>
        
        <div className="space-y-3 bg-gray-50/50 rounded-2xl p-4 border border-gray-200/50">
          {form.items.map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
              <div className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 sm:col-span-5">
                  <label className="text-xs text-gray-500 mb-1 block">Deskripsi</label>
                  <div className="flex gap-2">
                    <select
                      value={item.product_id}
                      onChange={e => setItem(i, 'product_id', e.target.value)}
                      className="flex-1 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
                    >
                      <option value="">Pilih Produk</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      value={item.description}
                      onChange={e => setItem(i, 'description', e.target.value)}
                      placeholder="Deskripsi"
                      className="flex-1 border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>
                
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={item.quantity}
                    onChange={e => setItem(i, 'quantity', e.target.value)}
                    className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Harga Satuan</label>
                  <input
                    type="number"
                    min="0"
                    value={item.unit_price}
                    onChange={e => setItem(i, 'unit_price', e.target.value)}
                    className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                
                <div className="col-span-3 sm:col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Diskon %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.discount_percent}
                    onChange={e => setItem(i, 'discount_percent', e.target.value)}
                    className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-1">
                  <label className="text-xs text-gray-500 mb-1 block">&nbsp;</label>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="w-full p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200/50">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-blue-500" />
          Ringkasan Invoice
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Diskon Keseluruhan (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="0"
                max="100"
                value={form.discount_percent}
                onChange={e => set('discount_percent', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm bg-white"
              />
            </div>
            {discounts.length > 0 && (
              <select
                onChange={e => { 
                  const d = discounts.find(x => x.id == e.target.value); 
                  if (d) set('discount_percent', d.discount_value); 
                }}
                className="mt-2 w-full border border-blue-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
              >
                <option value="">Atau pilih Event Diskon</option>
                {discounts.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.discount_value}%)</option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">PPN (%)</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                min="0"
                max="100"
                value={form.tax_percent}
                onChange={e => set('tax_percent', e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm bg-white"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-2 pt-3 border-t border-blue-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-900">{formatRupiah(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Diskon ({form.discount_percent}%)</span>
            <span className="text-red-600">-{formatRupiah(discAmt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">PPN ({form.tax_percent}%)</span>
            <span className="text-gray-900">{formatRupiah(taxAmt)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-blue-200">
            <span className="text-gray-900">Total</span>
            <span className="text-blue-600">{formatRupiah(grand)}</span>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Catatan Pajak</label>
          <input
            value={form.custom_tax_note}
            onChange={e => set('custom_tax_note', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Terms & Kondisi</label>
          <input
            value={form.terms}
            onChange={e => set('terms', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-2">Catatan</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm resize-none"
            placeholder="Catatan tambahan untuk invoice..."
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
              <span>Buat Invoice</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// iOS Style Invoice Detail
function InvoiceDetail({ invoice, onClose, onMidtrans }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-blue-500" />
            <p className="text-xl font-bold text-gray-900 font-mono">{invoice.invoice_number}</p>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(invoice.issue_date)}
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${statusColor(invoice.status)}`}>
          {statusLabel(invoice.status)}
        </div>
      </div>

      {/* Customer & Sales Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/80 rounded-2xl p-5 border border-gray-200/50">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Customer</p>
          <p className="font-semibold text-gray-900">{invoice.customer_name}</p>
          {invoice.company_name && (
            <p className="text-sm text-gray-600 mt-0.5">{invoice.company_name}</p>
          )}
          {invoice.cust_email && (
            <p className="text-xs text-gray-500 mt-1">{invoice.cust_email}</p>
          )}
          {invoice.cust_phone && (
            <p className="text-xs text-gray-500">{invoice.cust_phone}</p>
          )}
          {invoice.npwp && (
            <p className="text-xs text-gray-500 mt-1">NPWP: {invoice.npwp}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Sales PIC</p>
          <p className="font-semibold text-gray-900">{invoice.sales_name || '-'}</p>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Metode: {invoice.payment_method?.replace('_', ' ').toUpperCase()}
            </p>
            {invoice.due_date && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" />
                Jatuh Tempo: {formatDate(invoice.due_date)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div>
        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Item</p>
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Deskripsi</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Qty</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Harga</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.items || []).map((item, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-900">{item.description}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatRupiah(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatRupiah(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-5 border border-blue-200/50">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-gray-900">{formatRupiah(invoice.subtotal)}</span>
          </div>
          {invoice.discount_percent > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Diskon ({invoice.discount_percent}%)</span>
              <span className="text-red-600">-{formatRupiah(invoice.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">PPN ({invoice.tax_percent}%)</span>
            <span className="text-gray-900">{formatRupiah(invoice.tax_amount)}</span>
          </div>
          {invoice.custom_tax_note && (
            <p className="text-xs text-gray-400 italic flex items-center gap-1">
              <Info className="w-3 h-3" />
              {invoice.custom_tax_note}
            </p>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-blue-200">
            <span className="text-gray-900">Grand Total</span>
            <span className="text-blue-600">{formatRupiah(invoice.grand_total)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2">
            <span className="text-gray-600">Sudah Dibayar</span>
            <span className="text-green-600">{formatRupiah(invoice.amount_paid)}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span className="text-gray-700">Sisa Tagihan</span>
            <span className="text-red-600">{formatRupiah(invoice.amount_due)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/50">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Catatan</p>
          <p className="text-sm text-gray-600">{invoice.notes}</p>
        </div>
      )}
      {invoice.terms && (
        <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200/50">
          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Terms & Kondisi</p>
          <p className="text-xs text-gray-500">{invoice.terms}</p>
        </div>
      )}

      {/* Action Buttons */}
      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all duration-200 active:scale-95"
          >
            Tutup
          </button>
          {invoice.payment_method === 'midtrans' && (
            <button
              onClick={() => onMidtrans(invoice)}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Bayar via Midtrans
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// iOS Style Invoice Card (Mobile)
function InvoiceCard({ invoice, onViewDetail, onDelete, hasRole }) {
  const statusClass = statusColor(invoice.status);
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono font-semibold text-blue-600 text-sm">{invoice.invoice_number}</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{invoice.customer_name}</p>
          {invoice.company_name && (
            <p className="text-xs text-gray-500">{invoice.company_name}</p>
          )}
        </div>
        <span className={`px-2 py-1 rounded-xl text-xs font-medium ${statusClass}`}>
          {statusLabel(invoice.status)}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-sm mb-3">
        <div className="flex items-center gap-1 text-gray-500">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(invoice.issue_date)}</span>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-900">{formatRupiah(invoice.grand_total)}</p>
          {invoice.amount_due > 0 && (
            <p className="text-xs text-red-500">Sisa: {formatRupiah(invoice.amount_due)}</p>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={() => onViewDetail(invoice)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-sm font-medium hover:bg-blue-100 transition-all duration-200"
        >
          <Eye className="w-4 h-4" />
          Detail
        </button>
        {hasRole('super_admin', 'general_manager', 'sales_manager') && (
          <button
            onClick={() => onDelete(invoice.id)}
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

export default function InvoicesPage() {
  const { user, hasRole } = useAuth();
  const [searchParams] = useSearchParams();
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, search: search || undefined, status: status || undefined };
      const cid = searchParams.get('customer_id');
      if (cid) params.customer_id = cid;
      const r = await invoicesAPI.getAll(params);
      setInvoices(r.data.data?.invoices || []);
      setTotal(r.data.data?.total || 0);
    } catch { 
      toast.error('Gagal memuat invoice'); 
    } finally { 
      setLoading(false); 
    }
  }, [page, search, status, searchParams]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await invoicesAPI.create(form);
      toast.success('Invoice berhasil dibuat!');
      setModal(null); 
      load();
    } catch (e) { 
      toast.error(e.response?.data?.message || 'Gagal membuat invoice'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleMidtrans = async (inv) => {
    try {
      const r = await paymentsAPI.createMidtrans({ invoice_id: inv.id, amount: inv.amount_due });
      const d = r.data.data;
      toast.success(`Token Midtrans: ${d.token} (DUMMY MODE)`);
      window.open(d.redirect_url, '_blank');
    } catch { 
      toast.error('Gagal membuat token Midtrans'); 
    }
  };

  const handleViewDetail = async (inv) => {
    try {
      const r = await invoicesAPI.getById(inv.id);
      setModal(r.data.data);
    } catch { 
      toast.error('Gagal memuat detail'); 
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus invoice ini? Tindakan ini tidak dapat dibatalkan.')) return;
    try { 
      await invoicesAPI.delete(id); 
      toast.success('Invoice berhasil dihapus'); 
      load();
    } catch { 
      toast.error('Gagal menghapus invoice'); 
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Invoice</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total invoice</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-3 rounded-2xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 shadow-md"
        >
          <Plus className="w-4 h-4" />
          Buat Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari nomor invoice, customer..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm"
          />
        </div>
        <div className="relative sm:w-48">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm appearance-none"
          >
            <option value="">Semua Status</option>
            {['draft','sent','partial','paid','overdue','cancelled'].map(s => (
              <option key={s} value={s}>{statusLabel(s)}</option>
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
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Nomor Invoice</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Tanggal</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Total</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Metode Bayar</th>
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
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-400">Tidak ada invoice</p>
                    </div>
                  </td>
                </tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-mono font-semibold text-blue-600 text-sm">{inv.invoice_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{inv.customer_name}</p>
                    {inv.company_name && (
                      <p className="text-xs text-gray-500">{inv.company_name}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 text-sm">{formatDate(inv.issue_date)}</p>
                    {inv.due_date && (
                      <p className="text-xs text-red-400">Due: {formatDate(inv.due_date)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{formatRupiah(inv.grand_total)}</p>
                    {inv.amount_due > 0 && (
                      <p className="text-xs text-red-500">Sisa: {formatRupiah(inv.amount_due)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-xl text-xs font-medium ${statusColor(inv.status)}`}>
                      {statusLabel(inv.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {inv.payment_method?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleViewDetail(inv)}
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {hasRole('super_admin', 'general_manager', 'sales_manager') && (
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
        ) : invoices.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">Tidak ada invoice</p>
          </div>
        ) : (
          invoices.map(invoice => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onViewDetail={handleViewDetail}
              onDelete={handleDelete}
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

      {/* Modals */}
      {modal === 'new' && (
        <Modal title="Buat Invoice Baru" onClose={() => setModal(null)} wide>
          <InvoiceForm 
            onSave={handleCreate} 
            onClose={() => setModal(null)} 
            loading={saving} 
            userId={user?.id} 
          />
        </Modal>
      )}
      
      {modal && modal !== 'new' && (
        <Modal title="Detail Invoice" onClose={() => setModal(null)} wide>
          <InvoiceDetail 
            invoice={modal} 
            onClose={() => setModal(null)} 
            onMidtrans={handleMidtrans} 
          />
        </Modal>
      )}
    </div>
  );
}
