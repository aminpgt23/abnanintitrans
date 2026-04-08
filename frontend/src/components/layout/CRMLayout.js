import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import { notifAPI, exchangeAPI } from '../../services/api';
import { formatRupiah } from '../../utils/format';
import toast from 'react-hot-toast';
import {
  Home, Users, FileText, Package, CreditCard, ClipboardList,
  DollarSign, Truck, FolderOpen, BarChart3, Receipt, TrendingUp,
  BookOpen, Globe, LogOut, Bell, Menu, User,
  ChevronDown, Building2, Shield, GitBranch, Moon, Sun, Languages,
  PanelLeftClose, PanelLeftOpen, X, Settings, Zap, Search,
  Import, ArrowUpRight, Activity, ChevronRight, Layers, Key
} from 'lucide-react';

// ── Menu Configuration ────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard', icon: Home, label: 'Dashboard', roles: ['super_admin','general_manager','sales_manager','sales','finance'] },
      { path: '/analytics', icon: TrendingUp, label: 'Analitik', roles: ['super_admin','general_manager','sales_manager'] },
    ]
  },
  {
    label: 'CRM',
    items: [
      { path: '/customers', icon: Users, label: 'Customer', roles: ['super_admin','general_manager','sales_manager','sales'] },
      { path: '/pipeline', icon: GitBranch, label: 'Pipeline', roles: ['super_admin','general_manager','sales_manager','sales'] },
      { path: '/products', icon: Package, label: 'Produk', roles: ['super_admin','general_manager','sales_manager','sales'] },
    ]
  },
  {
    label: 'Transaksi',
    items: [
      { path: '/invoices', icon: FileText, label: 'Invoice', roles: ['super_admin','general_manager','sales_manager','sales','finance'] },
      { path: '/payments', icon: CreditCard, label: 'Pembayaran', roles: ['super_admin','general_manager','sales_manager','sales','finance'] },
      { path: '/payment-requests', icon: ClipboardList, label: 'Approval Pelunasan', roles: ['super_admin','general_manager','sales_manager','sales','finance'] },
      { path: '/commissions', icon: DollarSign, label: 'Sales Incentive', roles: ['super_admin','general_manager','sales_manager','sales','finance'] },
    ]
  },
  {
    label: 'Operasional',
    items: [
      { path: '/import-export', icon: Import, label: 'Import / Export', roles: ['super_admin','general_manager','sales_manager','finance'] },
      { path: '/shipments', icon: Truck, label: 'Pengiriman', roles: ['super_admin','general_manager','sales_manager','sales','finance'] },
      { path: '/documents', icon: FolderOpen, label: 'Dokumen', roles: ['super_admin','general_manager','sales_manager','sales','finance'] },
    ]
  },
  {
    label: 'Keuangan',
    items: [
      { path: '/finance', icon: BarChart3, label: 'Keuangan', roles: ['super_admin','general_manager','finance'] },
      { path: '/tax-reports', icon: Receipt, label: 'Laporan Pajak', roles: ['super_admin','general_manager','finance'] },
    ]
  },
  {
    label: 'Sistem',
    items: [
      { path: '/knowledge-base', icon: BookOpen, label: 'Content Center', roles: ['super_admin','general_manager','sales_manager','sales','finance'] },
      { path: '/users', icon: Settings, label: 'Kelola User', roles: ['super_admin'] },
    ]
  }
];

const ROLE_COLORS = {
  super_admin: { bg: 'bg-purple-500', text: 'text-purple-500', label: 'Super Admin' },
  general_manager: { bg: 'bg-blue-500', text: 'text-blue-500', label: 'General Manager' },
  sales_manager: { bg: 'bg-cyan-500', text: 'text-cyan-500', label: 'Sales Manager' },
  sales: { bg: 'bg-green-500', text: 'text-green-500', label: 'Sales' },
  finance: { bg: 'bg-amber-500', text: 'text-amber-500', label: 'Finance' },
};

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Sidebar Component (Fixed for Light/Dark Mode) ─────────────
function Sidebar({ user, collapsed, onCollapse, mobileOpen, onMobileClose, location, onLogout }) {
  const navigate = useNavigate();
  const role = user?.role;

  const filteredGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => item.roles.includes(role))
  })).filter(g => g.items.length > 0);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        style={{
          width: collapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)',
          transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
          zIndex: 30
        }}
        className={`
          sidebar flex flex-col h-screen flex-shrink-0
          fixed lg:static inset-y-0 left-0
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform lg:transition-[width] duration-300
        `}
      >
        {/* Logo Area */}
        <div className={`flex items-center border-b border-gray-200 dark:border-gray-800 flex-shrink-0 ${collapsed ? 'justify-center p-4' : 'gap-3 px-5 py-5'}`}>
          <img
            src="/LOGO-04.png"
            alt="Logo Abnan CRM"
            className="w-20 h-10 object-contain cursor-pointer"
            onClick={() => navigate('/dashboard')}
            onError={(e) => { e.target.style.display = 'none'; }}
          />

          {!collapsed && (
            <div className="min-w-0">
              <div className="font-bold text-sm tracking-tight leading-none text-gray-900 dark:text-white">Abnan Inti Trans</div>
              <div className="text-xs mt-0.5 text-gray-500 dark:text-gray-400 font-semibold tracking-wide">
                1.0.0
              </div>
            </div>
          )}
          <button
            onClick={onMobileClose}
            className="lg:hidden ml-auto p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {filteredGroups.map((group, gi) => (
            <div key={gi} className="mb-1">
              {!collapsed && (
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3 py-2">
                  {group.label}
                </div>
              )}
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                      ${collapsed ? 'justify-center' : ''}
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                    style={{ marginBottom: 2 }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: User Card */}
        {!collapsed ? (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
            <Link
              to="/profile"
              className="flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #3a71f6, #7c3aed)' }}>
                {getInitials(user?.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-gray-900 dark:text-white">{user?.full_name}</div>
                <div className="text-xs truncate mt-0.5 text-gray-500 dark:text-gray-400">
                  {ROLE_COLORS[role]?.label || role}
                </div>
              </div>
              <ArrowUpRight className="w-3 h-3 text-gray-400" />
            </Link>
          </div>
        ) : (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 flex justify-center">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #3a71f6, #7c3aed)' }}>
              {getInitials(user?.full_name)}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ── Profile Dropdown ──────────────────────────────────────────
function ProfileDropdown({ user, onLogout, onClose, rates }) {
  const navigate = useNavigate();
  const { theme, toggleTheme, locale, setLocale } = useUI();
  const role = user?.role;
  const roleInfo = ROLE_COLORS[role] || {};

  return (
    <div
      className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      {/* User Info Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #3a71f6, #7c3aed)' }}>
            {getInitials(user?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">{user?.full_name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || user?.employee_id}</div>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {roleInfo.label || role}
            </span>
          </div>
        </div>
      </div>

      {/* Exchange Rates */}
      {rates && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="text-xs font-semibold mb-2 text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Live Exchange Rates
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[['USD', rates.USD_IDR], ['SGD', rates.SGD_IDR], ['EUR', rates.EUR_IDR], ['MYR', rates.MYR_IDR]].filter(([,v]) => v).map(([cur, val]) => (
              <div key={cur} className="rounded-lg p-2 text-center bg-gray-50 dark:bg-gray-800">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400">{cur}/IDR</div>
                <div className="text-xs font-semibold mt-0.5 text-gray-900 dark:text-white">
                  {Number(val).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { navigate('/profile'); onClose(); }}>
          <User className="w-4 h-4" />
          <span>Edit Profil</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { navigate('/profile?tab=security'); onClose(); }}>
          <Key className="w-4 h-4" />
          <span>Keamanan & Password</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => { toggleTheme(); }}>
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}>
          <Languages className="w-4 h-4" />
          <span>{locale === 'id' ? 'Switch to English' : 'Ganti ke Indonesian'}</span>
        </div>
        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer" onClick={() => { onLogout(); onClose(); }}>
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </div>
      </div>
    </div>
  );
}

// ── Notification Panel ────────────────────────────────────────
function NotifPanel({ notifs, onClose, onMarkAll }) {
  return (
    <div
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <span className="font-semibold text-sm text-gray-900 dark:text-white">Notifikasi</span>
        <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline" onClick={onMarkAll}>Tandai Semua Dibaca</button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
            <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Tidak ada notifikasi
          </div>
        ) : notifs.map(n => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${n.is_read ? 'opacity-60' : ''}`}
          >
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-400' : 'bg-blue-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-gray-900 dark:text-white">{n.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-gray-100 dark:border-gray-800">
        <Link to="/notifications" className="block w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg" onClick={onClose}>
          Lihat Semua
        </Link>
      </div>
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────
export default function CRMLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme } = useUI();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('crm_sidebar_collapsed') === 'true'; } catch { return false; }
  });
  const [notifs, setNotifs] = useState([]);
  const [rates, setRates] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const unread = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    notifAPI.getAll().then(r => setNotifs(r.data.data || [])).catch(() => {});
    exchangeAPI.getRates().then(r => setRates(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    try { localStorage.setItem('crm_sidebar_collapsed', String(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    toast.success('Logout berhasil');
    navigate('/login');
  }, [logout, navigate]);

  const allItems = NAV_GROUPS.flatMap(g => g.items);
  const currentItem = allItems.find(item =>
    location.pathname === item.path || location.pathname.startsWith(item.path + '/')
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar
        user={user}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(v => !v)}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
        location={location}
        onLogout={handleLogout}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 lg:px-6 gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Menu className="w-5 h-5" />
            </button>
            <button onClick={() => setCollapsed(v => !v)} className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">CRM</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-semibold text-gray-900 dark:text-white truncate">{currentItem?.label || 'Dashboard'}</span>
            </div>
            <div className="sm:hidden font-semibold text-gray-900 dark:text-white">{currentItem?.label || 'Dashboard'}</div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => setSearchOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700">
              <Search className="w-4 h-4" />
              <span>Cari...</span>
              <kbd className="px-1.5 py-0.5 rounded text-xs bg-white dark:bg-gray-700 text-gray-500">⌘K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Search className="w-5 h-5" />
            </button>

            <div className="relative" ref={notifRef}>
              <button onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }} className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full">
                    <span className="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-60" />
                  </span>
                )}
              </button>
              {notifOpen && <NotifPanel notifs={notifs} onClose={() => setNotifOpen(false)} onMarkAll={() => setNotifs(notifs.map(n => ({ ...n, is_read: true })))} />}
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Live</span>
            </div>

            <div className="relative" ref={profileRef}>
              <button onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }} className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #3a71f6, #7c3aed)' }}>
                  {getInitials(user?.full_name)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-gray-900 dark:text-white">{user?.full_name?.split(' ')[0]}</div>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileOpen && <ProfileDropdown user={user} rates={rates} onLogout={handleLogout} onClose={() => setProfileOpen(false)} />}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-7xl animate-page-enter">
            {children}
          </div>
        </main>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSearchOpen(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-800">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                autoFocus
                className="flex-1 bg-transparent border-0 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                placeholder="Cari menu, customer, invoice..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              <button onClick={() => setSearchOpen(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(70vh-70px)]">
              {searchQ.trim() === '' ? (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Navigasi Cepat</div>
                  <div className="space-y-1">
                    {allItems.filter(i => i.roles.includes(user?.role)).slice(0, 8).map(item => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {allItems.filter(i => i.roles.includes(user?.role) && i.label.toLowerCase().includes(searchQ.toLowerCase())).map(item => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  {allItems.filter(i => i.roles.includes(user?.role) && i.label.toLowerCase().includes(searchQ.toLowerCase())).length === 0 && (
                    <div className="text-center py-6 text-gray-500">Tidak ada hasil untuk "{searchQ}"</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}