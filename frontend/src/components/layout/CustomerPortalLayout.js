import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Globe, LogOut, ShieldCheck, Moon, SunMedium, Languages } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

export default function CustomerPortalLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, locale, setLocale, t } = useUI();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logout berhasil');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-gray-900 overflow-x-hidden">
      <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight">{t('ui.customerDashboard', 'Customer Dashboard')}</p>
              <p className="text-xs font-semibold text-gray-500">
                {user?.company_name || user?.customer_name || 'Akses customer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
              <span className="hidden md:inline">{theme === 'dark' ? t('ui.dark', 'Dark') : t('ui.light', 'Light')}</span>
            </button>
            <button
              onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              <Languages className="h-4 w-4" />
              <span className="hidden md:inline">{locale === 'id' ? t('ui.indonesian', 'Indonesian') : t('ui.english', 'English')}</span>
            </button>
            <div className="hidden rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 md:block">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">Akun Customer</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{user?.full_name || user?.customer_name}</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              <Globe className="h-4 w-4" />
              {t('nav.website', 'Website')}
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
            >
              <LogOut className="h-4 w-4" />
              {t('ui.signOut', 'Logout')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
          <ShieldCheck className="h-4 w-4" />
          {t('ui.customerScope', 'Akses Anda dibatasi hanya ke data customer Anda sendiri.')}
        </div>
        {children}
      </main>
    </div>
  );
}
