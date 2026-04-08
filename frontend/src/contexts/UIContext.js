import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext(null);

const translations = {
  id: {
    'nav.dashboard': 'Dashboard',
    'nav.customers': 'Customer 360',
    'nav.pipeline': 'Pipeline',
    'nav.invoices': 'Invoice',
    'nav.products': 'Produk',
    'nav.payments': 'Pembayaran',
    'nav.paymentRequests': 'Approval Pelunasan',
    'nav.commissions': 'Sales Incentive',
    'nav.shipments': 'Pengiriman',
    'nav.documents': 'Dokumen',
    'nav.finance': 'Keuangan',
    'nav.taxReports': 'Laporan Pajak',
    'nav.analytics': 'Analitik',
    'nav.importExport': 'Import / Export',
    'nav.knowledgeBase': 'Content Center',
    'nav.users': 'Kelola User',
    'nav.website': 'Website',
    'ui.systemOnline': 'System Online',
    'ui.signOut': 'Logout',
    'ui.theme': 'Tema',
    'ui.language': 'Bahasa',
    'ui.light': 'Terang',
    'ui.dark': 'Gelap',
    'ui.indonesian': 'Indonesia',
    'ui.english': 'English',
    'ui.customerDashboard': 'Dashboard Customer',
    'ui.customerScope': 'Akses Anda dibatasi hanya ke data customer Anda sendiri.',
  },
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.customers': 'Customer 360',
    'nav.pipeline': 'Pipeline',
    'nav.invoices': 'Invoices',
    'nav.products': 'Products',
    'nav.payments': 'Payments',
    'nav.paymentRequests': 'Settlement Approval',
    'nav.commissions': 'Sales Incentives',
    'nav.shipments': 'Shipments',
    'nav.documents': 'Documents',
    'nav.finance': 'Finance',
    'nav.taxReports': 'Tax Reports',
    'nav.analytics': 'Analytics',
    'nav.importExport': 'Import / Export',
    'nav.knowledgeBase': 'Content Center',
    'nav.users': 'User Management',
    'nav.website': 'Website',
    'ui.systemOnline': 'System Online',
    'ui.signOut': 'Sign Out',
    'ui.theme': 'Theme',
    'ui.language': 'Language',
    'ui.light': 'Light',
    'ui.dark': 'Dark',
    'ui.indonesian': 'Indonesian',
    'ui.english': 'English',
    'ui.customerDashboard': 'Customer Dashboard',
    'ui.customerScope': 'Your access is limited to your own customer data only.',
  },
};

export function UIProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('abnan_theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [locale, setLocale] = useState(() => {
    try {
      return localStorage.getItem('abnan_locale') || 'id';
    } catch {
      return 'id';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    try {
      localStorage.setItem('abnan_theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem('abnan_locale', locale);
    } catch {}
  }, [locale]);

  const value = useMemo(() => ({
    theme,
    locale,
    setTheme,
    setLocale,
    toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    t: (key, fallback = key) => translations[locale]?.[key] || fallback,
  }), [theme, locale]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUI = () => useContext(UIContext);
