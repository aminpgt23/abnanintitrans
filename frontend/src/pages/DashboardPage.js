import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI, analyticsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatRupiah, formatDate } from '../utils/format';
import {
  TrendingUp, TrendingDown, Users, FileText, DollarSign, UserCheck,
  Award, Plus, ClipboardList, Target, ArrowRight, Wallet,
  Clock, Crown, Medal, Calendar, BarChart3, Activity,
  CreditCard, Receipt, Sparkles, Package, Truck, ArrowUpRight,
  ChevronRight, Star, Zap, Globe, RefreshCw
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// ── Reusable Components ───────────────────────────────────────

function Skeleton({ width = '100%', height = 20, rounded = 8 }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius: rounded }} />
  );
}

function KpiCard({ icon: Icon, label, value, sub, color = 'blue', to, trend, loading }) {
  const colorMap = {
    blue:   { accent: '#3a71f6', light: 'rgba(58,113,246,0.1)', text: '#3a71f6' },
    green:  { accent: '#10b981', light: 'rgba(16,185,129,0.1)', text: '#10b981' },
    amber:  { accent: '#f59e0b', light: 'rgba(245,158,11,0.1)',  text: '#f59e0b' },
    purple: { accent: '#8b5cf6', light: 'rgba(139,92,246,0.1)',  text: '#8b5cf6' },
    red:    { accent: '#ef4444', light: 'rgba(239,68,68,0.1)',   text: '#ef4444' },
    cyan:   { accent: '#06b6d4', light: 'rgba(6,182,212,0.1)',   text: '#06b6d4' },
  };
  const c = colorMap[color] || colorMap.blue;

  const inner = (
    <div className="stat-card card-interactive h-full" style={{ minHeight: 120 }}>
      <div className="stat-card-accent" style={{ background: c.accent }} />
      <div className="flex items-start justify-between mb-4" style={{ marginTop: 6 }}>
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: 40, height: 40, background: c.light }}
        >
          <Icon style={{ width: 18, height: 18, color: c.text }} />
        </div>
        {trend !== undefined && trend !== null && (
          <div
            className="flex items-center gap-1 rounded-full px-2 py-1"
            style={{
              background: trend >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              fontSize: 11, fontWeight: 700,
              color: trend >= 0 ? '#10b981' : '#ef4444'
            }}
          >
            {trend >= 0 ? <TrendingUp style={{ width: 11, height: 11 }} /> : <TrendingDown style={{ width: 11, height: 11 }} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      {loading ? (
        <>
          <Skeleton width="70%" height={24} />
          <Skeleton width="50%" height={14} rounded={4} style={{ marginTop: 8 }} />
        </>
      ) : (
        <div>
          <div className="font-bold" style={{ fontSize: 22, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {value}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
      )}
      {to && (
        <div className="flex items-center gap-1 mt-3 text-xs font-semibold" style={{ color: c.text }}>
          Lihat Detail <ArrowUpRight style={{ width: 12, height: 12 }} />
        </div>
      )}
    </div>
  );

  return to ? <Link to={to} style={{ display: 'block', textDecoration: 'none', height: '100%' }}>{inner}</Link> : inner;
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
      <div>
        <h2 className="font-bold" style={{ fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '10px 14px', minWidth: 140 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 700, color: p.color || 'var(--text-primary)' }}>
          {p.name === 'revenue' ? formatRupiah(p.value) : p.value.toLocaleString('id-ID')}
        </div>
      ))}
    </div>
  );
};

function QuickActionCard({ icon: Icon, label, sub, to, color = 'blue' }) {
  const colorMap = {
    blue:   { bg: 'rgba(58,113,246,0.08)',  text: '#3a71f6' },
    green:  { bg: 'rgba(16,185,129,0.08)',  text: '#10b981' },
    amber:  { bg: 'rgba(245,158,11,0.08)',   text: '#f59e0b' },
    purple: { bg: 'rgba(139,92,246,0.08)',   text: '#8b5cf6' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <Link
      to={to}
      className="card card-interactive"
      style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
    >
      <div className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ width: 40, height: 40, background: c.bg }}>
        <Icon style={{ width: 18, height: 18, color: c.text }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
      </div>
      <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }} />
    </Link>
  );
}

function RankCard({ rank, full_name, revenue, inv_count }) {
  const medals = [
    { icon: Crown, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { icon: Medal, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
    { icon: Medal, color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  ];
  const medal = medals[rank - 1] || { icon: Star, color: 'var(--text-muted)', bg: 'var(--bg-surface-2)' };
  const MedalIcon = medal.icon;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition-all"
      style={{ border: '1px solid var(--border-base)' }}
    >
      <div className="rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ width: 36, height: 36, background: medal.bg }}>
        <MedalIcon style={{ width: 16, height: 16, color: medal.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{full_name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{inv_count} invoice</div>
      </div>
      <div className="text-right">
        <div className="font-bold text-sm" style={{ color: '#3a71f6' }}>{formatRupiah(revenue)}</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>#{rank}</div>
      </div>
    </div>
  );
}

// ── Welcome Banner ────────────────────────────────────────────
function WelcomeBanner({ user, data }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat Pagi' : hour < 17 ? 'Selamat Siang' : 'Selamat Malam';
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div
      className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap"
      style={{
        background: 'linear-gradient(135deg, #1f4eeb 0%, #3a71f6 50%, #06b6d4 100%)',
        boxShadow: '0 4px 24px rgba(31,78,235,0.25)'
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600, marginBottom: 4 }}>
          {today}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>
          {greeting}, {user?.full_name?.split(' ')[0]}! 👋
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
          {user?.role === 'finance'
            ? 'Ada beberapa transaksi yang perlu ditinjau hari ini.'
            : user?.role === 'sales'
            ? 'Yuk kejar target! Semangat hari ini.'
            : 'Pantau semua performa bisnis dari sini.'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-xl px-4 py-2 text-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
            {new Date().getDate()}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
            {new Date().toLocaleDateString('id-ID', { month: 'short' }).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Commission Progress ───────────────────────────────────────
function CommissionWidget({ pending, target = 100000000 }) {
  const pct = Math.min(100, Math.round((pending / target) * 100));
  const color = pct >= 100 ? '#10b981' : pct >= 70 ? '#f59e0b' : '#3a71f6';

  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Target Komisi</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Minimum pencairan Rp 100 juta</div>
        </div>
        <div className="rounded-xl flex items-center justify-center"
          style={{ width: 36, height: 36, background: 'rgba(245,158,11,0.1)' }}>
          <Target style={{ width: 16, height: 16, color: '#f59e0b' }} />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-2">
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {formatRupiah(pending)}
          </span>
          <span className="font-bold text-sm" style={{ color }}>
            {pct}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Komisi Pending</span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Target: {formatRupiah(target)}</span>
        </div>
      </div>

      {pct >= 100 && (
        <div className="alert alert-success text-xs">
          <Sparkles style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>Selamat! Komisi Anda sudah memenuhi syarat pencairan.</span>
        </div>
      )}

      <Link to="/commissions" className="btn btn-primary btn-sm w-full mt-3" style={{ justifyContent: 'center' }}>
        {pct >= 100 ? 'Ajukan Pencairan' : 'Lihat Detail Komisi'}
        <ArrowRight style={{ width: 14, height: 14 }} />
      </Link>
    </div>
  );
}

// ── Finance Summary Widget ────────────────────────────────────
function FinanceSummaryWidget({ income, expense, pending }) {
  const net = (income || 0) - (expense || 0);
  return (
    <div className="card p-5 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Ringkasan Keuangan</div>
        <CreditCard style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.07)' }}>
          <div className="flex items-center gap-2">
            <TrendingUp style={{ width: 14, height: 14, color: '#10b981' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Pemasukan</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#10b981' }}>{formatRupiah(income)}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.07)' }}>
          <div className="flex items-center gap-2">
            <TrendingDown style={{ width: 14, height: 14, color: '#ef4444' }} />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Pengeluaran</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#ef4444' }}>{formatRupiah(expense)}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-surface-2)', borderTop: '2px solid var(--border-base)' }}>
          <div className="flex items-center gap-2">
            <Activity style={{ width: 14, height: 14, color: net >= 0 ? '#10b981' : '#ef4444' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Net</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, color: net >= 0 ? '#10b981' : '#ef4444' }}>
            {formatRupiah(net)}
          </span>
        </div>
        {pending > 0 && (
          <Link to="/payment-requests" className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', textDecoration: 'none' }}>
            <div className="flex items-center gap-2">
              <Clock style={{ width: 14, height: 14, color: '#f59e0b' }} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Menunggu Approval</span>
            </div>
            <span className="badge badge-yellow">{pending} permintaan</span>
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({});
  const [monthly, setMonthly] = useState([]);
  const [salesByRep, setSalesByRep] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashRes] = await Promise.all([dashboardAPI.get()]);
      setData(dashRes.data.data || {});

      if (['super_admin', 'general_manager', 'sales_manager'].includes(user?.role)) {
        const [mRes, sRes] = await Promise.all([
          analyticsAPI.salesMonthly().catch(() => ({ data: { data: [] } })),
          analyticsAPI.salesByRep().catch(() => ({ data: { data: [] } }))
        ]);
        setMonthly(Array.isArray(mRes.data.data) ? mRes.data.data : []);
        setSalesByRep(Array.isArray(sRes.data.data) ? sRes.data.data : []);
      }
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.role]);

  const role = user?.role;

  return (
    <div className="space-y-0 animate-page-enter">
      <WelcomeBanner user={user} data={data} />

      {/* Refresh bar */}
      <div className="flex items-center justify-end mb-4 gap-2">
        {lastUpdated && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Diperbarui {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="btn btn-ghost btn-sm flex items-center gap-1.5"
        >
          <RefreshCw style={{ width: 13, height: 13 }} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Super Admin / GM ─────────────────────────────────── */}
      {['super_admin', 'general_manager'].includes(role) && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in">
            <KpiCard loading={loading} icon={TrendingUp} label="Revenue Bulan Ini" value={formatRupiah(data.revenue_this_month || 0)} color="green" to="/finance" trend={12.5} />
            <KpiCard loading={loading} icon={Users} label="Total Pelanggan" value={(data.total_customers || 0).toLocaleString('id-ID')} color="blue" to="/customers" />
            <KpiCard loading={loading} icon={FileText} label="Invoice Lunas" value={data.invoices_this_month || 0} sub="bulan ini" color="purple" to="/invoices" />
            <KpiCard loading={loading} icon={UserCheck} label="Sales Aktif" value={data.active_sales || 0} color="amber" to="/users" />
          </div>

          {/* Charts */}
          {monthly.length > 0 && (
            <div className="chart-container mb-4 animate-fade-in stagger-2">
              <SectionHeader
                title="Revenue 12 Bulan Terakhir"
                subtitle="Tren pendapatan keseluruhan perusahaan"
                action={
                  <Link to="/analytics" className="btn btn-ghost btn-sm flex items-center gap-1.5">
                    Lihat Analitik <ArrowUpRight style={{ width: 13, height: 13 }} />
                  </Link>
                }
              />
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthly} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3a71f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3a71f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#3a71f6" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 3, fill: '#3a71f6', strokeWidth: 2, stroke: 'var(--bg-surface)' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {salesByRep.length > 0 && (
            <div className="grid lg:grid-cols-2 gap-4 mb-6 animate-fade-in stagger-3">
              {/* Bar chart */}
              <div className="chart-container">
                <SectionHeader title="Performa Sales" subtitle="Top performer berdasarkan revenue" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesByRep.slice(0, 6)} margin={{ top: 5, right: 5, bottom: 30, left: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" />
                    <XAxis dataKey="full_name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} angle={-30} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="#3a71f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Ranking list */}
              <div className="card p-5">
                <SectionHeader title="Ranking Sales" subtitle="Berdasarkan revenue bulan ini" />
                <div className="space-y-2">
                  {salesByRep.slice(0, 5).map((s, i) => (
                    <RankCard key={s.id || i} rank={i + 1} full_name={s.full_name} revenue={s.revenue} inv_count={s.inv_count} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick access */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in stagger-4">
            <QuickActionCard icon={Plus} label="Invoice Baru" sub="Buat invoice" to="/invoices" color="blue" />
            <QuickActionCard icon={Users} label="Tambah Customer" sub="Daftar pelanggan" to="/customers" color="green" />
            <QuickActionCard icon={BarChart3} label="Laporan Keuangan" sub="Finance overview" to="/finance" color="amber" />
            <QuickActionCard icon={Globe} label="Import / Export" sub="Manajemen ekspor" to="/import-export" color="purple" />
          </div>
        </>
      )}

      {/* ── Sales Manager ────────────────────────────────────── */}
      {role === 'sales_manager' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KpiCard loading={loading} icon={Users} label="Total Sales Aktif" value={data.summary?.sales_count || 0} color="blue" />
            <KpiCard loading={loading} icon={TrendingUp} label="Revenue Tim" value={formatRupiah(data.summary?.total_revenue || 0)} sub="bulan ini" color="green" />
            <KpiCard loading={loading} icon={FileText} label="Invoice Lunas" value={data.summary?.invoice_count || 0} sub="bulan ini" color="purple" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            {monthly.length > 0 && (
              <div className="chart-container">
                <SectionHeader title="Tren Revenue Tim" subtitle="12 bulan terakhir" />
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={monthly}>
                    <defs>
                      <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-base)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#teamGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="card p-5">
              <SectionHeader title="Ranking Performa" subtitle="Berdasarkan revenue bulan ini" />
              <div className="space-y-2">
                {(data.sales_performance || []).slice(0, 5).map((s, i) => (
                  <RankCard key={s.id || i} rank={i + 1} full_name={s.full_name} revenue={s.revenue} inv_count={s.inv_count} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Sales ────────────────────────────────────────────── */}
      {role === 'sales' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard loading={loading} icon={FileText} label="Invoice Lunas" value={data.invoices_this_month || 0} sub="bulan ini" color="green" to="/invoices" />
            <KpiCard loading={loading} icon={TrendingUp} label="Revenue Saya" value={formatRupiah(data.revenue_this_month || 0)} sub="bulan ini" color="blue" />
            <KpiCard loading={loading} icon={Wallet} label="Komisi Pending" value={formatRupiah(data.pending_commission || 0)} color="amber" to="/commissions" />
            <KpiCard loading={loading} icon={Users} label="Pelanggan Saya" value={data.total_customers || 0} color="purple" to="/customers" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <CommissionWidget pending={data.pending_commission || 0} />

            <div className="card p-5">
              <SectionHeader title="Aksi Cepat" subtitle="Shortcut untuk aksi utama" />
              <div className="space-y-2">
                <QuickActionCard icon={Plus} label="Buat Invoice Baru" sub="Draft invoice customer" to="/invoices" color="blue" />
                <QuickActionCard icon={Users} label="Tambah Customer" sub="Daftar pelanggan baru" to="/customers" color="green" />
                <QuickActionCard icon={ClipboardList} label="Ajukan Pelunasan" sub="Payment request" to="/payment-requests" color="amber" />
                <QuickActionCard icon={Wallet} label="Cek Komisi" sub="Sales incentive" to="/commissions" color="purple" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Finance ──────────────────────────────────────────── */}
      {role === 'finance' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KpiCard loading={loading} icon={TrendingUp} label="Pemasukan Bulan Ini" value={formatRupiah(data.income_this_month || 0)} color="green" to="/finance" trend={8.2} />
            <KpiCard loading={loading} icon={TrendingDown} label="Pengeluaran Bulan Ini" value={formatRupiah(data.expense_this_month || 0)} color="red" to="/finance" />
            <KpiCard loading={loading} icon={Clock} label="Pengajuan Pending" value={data.pending_approvals || 0} color="amber" to="/payment-requests" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <FinanceSummaryWidget
              income={data.income_this_month}
              expense={data.expense_this_month}
              pending={data.pending_approvals}
            />
            <div className="card p-5">
              <SectionHeader title="Aksi Cepat" subtitle="Shortcut aksi keuangan" />
              <div className="space-y-2">
                <QuickActionCard icon={ClipboardList} label="Approval Pelunasan" sub="Review permintaan" to="/payment-requests" color="blue" />
                <QuickActionCard icon={BarChart3} label="Transaksi" sub="Rekap keuangan" to="/finance" color="green" />
                <QuickActionCard icon={Receipt} label="Laporan Pajak" sub="PPN & PPh" to="/tax-reports" color="purple" />
                <QuickActionCard icon={CreditCard} label="Verifikasi Bayar" sub="Konfirmasi pembayaran" to="/payments" color="amber" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
