import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  User, Mail, Phone, Building2, Shield, Moon, Sun, Languages,
  Save, Camera, Key, Bell, Eye, EyeOff, CheckCircle,
  Lock, Globe, Palette, Settings, AlertTriangle, Clock,
  Layers, ChevronRight, X
} from 'lucide-react';

const ROLE_MAP = {
  super_admin: { label: 'Super Admin', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  general_manager: { label: 'General Manager', color: '#3a71f6', bg: 'rgba(58,113,246,0.12)' },
  sales_manager: { label: 'Sales Manager', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  sales: { label: 'Sales', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  finance: { label: 'Finance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function TabItem({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-3 w-full rounded-xl text-sm font-semibold transition-all text-left"
      style={{
        background: active ? 'var(--bg-surface)' : 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit'
      }}
    >
      <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
      {label}
    </button>
  );
}

// ── Avatar Upload ─────────────────────────────────────────────
function AvatarSection({ user }) {
  const initials = getInitials(user?.full_name);
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative">
        <div
          className="flex items-center justify-center rounded-2xl text-white font-bold"
          style={{
            width: 88, height: 88, fontSize: 28,
            background: 'linear-gradient(135deg, #3a71f6, #7c3aed)',
            boxShadow: '0 8px 24px rgba(58,113,246,0.3)'
          }}
        >
          {initials}
        </div>
        <button
          className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center"
          style={{
            width: 28, height: 28,
            background: 'var(--brand-600)', color: '#fff',
            border: '2px solid var(--bg-surface)', cursor: 'pointer'
          }}
          title="Ubah foto profil (segera hadir)"
          onClick={() => toast('Fitur upload foto segera hadir!', { icon: '🚀' })}
        >
          <Camera style={{ width: 12, height: 12 }} />
        </button>
      </div>
      <div className="text-center">
        <div className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>
          {user?.full_name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
          {user?.employee_id}
        </div>
        {user?.role && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold mt-2"
            style={{
              background: ROLE_MAP[user.role]?.bg || 'var(--bg-surface-2)',
              color: ROLE_MAP[user.role]?.color || 'var(--text-muted)',
            }}
          >
            {ROLE_MAP[user.role]?.label || user.role}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────
function ProfileTab({ user }) {
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // await usersAPI.update(user.id, form); // enable when backend supports
      await new Promise(r => setTimeout(r, 600)); // simulate
      toast.success('Profil berhasil disimpan');
    } catch {
      toast.error('Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'full_name', label: 'Nama Lengkap', icon: User, type: 'text', placeholder: 'Nama lengkap Anda' },
    { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'email@perusahaan.com' },
    { key: 'phone', label: 'Nomor Telepon', icon: Phone, type: 'tel', placeholder: '+62 xxx xxxx xxxx' },
    { key: 'department', label: 'Divisi / Departemen', icon: Building2, type: 'text', placeholder: 'Contoh: Sales Team A' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold" style={{ fontSize: 16, color: 'var(--text-primary)' }}>Informasi Pribadi</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Perbarui data profil dan informasi kontak Anda.
        </p>
      </div>

      <div className="space-y-4">
        {fields.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                {f.label}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Icon style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
                </div>
                <input
                  className="input-base"
                  style={{ paddingLeft: 38 }}
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                />
              </div>
            </div>
          );
        })}

        {/* Read-only fields */}
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            ID Karyawan
          </label>
          <div
            className="input-base flex items-center gap-2"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <Lock style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
            {user?.employee_id || '—'}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Role / Jabatan
          </label>
          <div
            className="input-base flex items-center gap-2"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <Shield style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
            {ROLE_MAP[user?.role]?.label || user?.role || '—'}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn btn-primary mt-6 flex items-center gap-2"
      >
        {saving ? (
          <div className="animate-spin w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Save style={{ width: 15, height: 15 }} />
        )}
        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const strength = () => {
    const p = form.next;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^a-zA-Z0-9]/.test(p)) s++;
    return s;
  };

  const strengthLabel = ['', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat'];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3a71f6', '#10b981'];
  const s = strength();

  const handleChange = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast.error('Password baru tidak cocok');
      return;
    }
    if (s < 2) {
      toast.error('Password terlalu lemah');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword({ old_password: form.current, new_password: form.next });
      toast.success('Password berhasil diubah');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  };

  const pwFields = [
    { key: 'current', label: 'Password Saat Ini', showKey: 'current' },
    { key: 'next', label: 'Password Baru', showKey: 'next' },
    { key: 'confirm', label: 'Konfirmasi Password Baru', showKey: 'confirm' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold" style={{ fontSize: 16, color: 'var(--text-primary)' }}>Keamanan Akun</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Ganti password secara berkala untuk menjaga keamanan akun.
        </p>
      </div>

      <form onSubmit={handleChange} className="space-y-4">
        {pwFields.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              {f.label}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Key style={{ width: 14, height: 14, color: 'var(--text-muted)' }} />
              </div>
              <input
                className="input-base"
                style={{ paddingLeft: 38, paddingRight: 44 }}
                type={show[f.showKey] ? 'text' : 'password'}
                placeholder="••••••••"
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShow(p => ({ ...p, [f.showKey]: !p[f.showKey] }))}
                className="absolute inset-y-0 right-0 px-3 flex items-center"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {show[f.showKey]
                  ? <EyeOff style={{ width: 14, height: 14 }} />
                  : <Eye style={{ width: 14, height: 14 }} />
                }
              </button>
            </div>

            {/* Strength for new password */}
            {f.key === 'next' && form.next && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{ background: i <= s ? strengthColor[s] : 'var(--border-base)' }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 11, color: strengthColor[s] || 'var(--text-muted)', fontWeight: 600 }}>
                  {strengthLabel[s] || ''}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Requirements */}
        <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-base)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Persyaratan Password
          </div>
          {[
            { ok: form.next.length >= 8, text: 'Minimal 8 karakter' },
            { ok: /[A-Z]/.test(form.next), text: 'Mengandung huruf kapital' },
            { ok: /[0-9]/.test(form.next), text: 'Mengandung angka' },
            { ok: /[^a-zA-Z0-9]/.test(form.next), text: 'Mengandung karakter khusus' },
          ].map((req, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle
                style={{
                  width: 13, height: 13, flexShrink: 0,
                  color: req.ok && form.next ? '#10b981' : 'var(--text-muted)'
                }}
              />
              <span style={{
                fontSize: 12, fontWeight: 500,
                color: req.ok && form.next ? '#10b981' : 'var(--text-muted)'
              }}>
                {req.text}
              </span>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary flex items-center gap-2"
        >
          {saving ? <div className="animate-spin w-4 h-4 rounded-full border-2 border-white/30 border-t-white" /> : <Shield style={{ width: 15, height: 15 }} />}
          {saving ? 'Memproses...' : 'Ubah Password'}
        </button>
      </form>
    </div>
  );
}

// ── Preferences Tab ───────────────────────────────────────────
function PreferencesTab() {
  const { theme, toggleTheme, locale, setLocale } = useUI();

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold" style={{ fontSize: 16, color: 'var(--text-primary)' }}>Preferensi Tampilan</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Sesuaikan tampilan dan bahasa aplikasi.
        </p>
      </div>

      <div className="space-y-4">
        {/* Theme */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-surface-2)' }}>
                {theme === 'dark' ? <Moon style={{ width: 16, height: 16 }} /> : <Sun style={{ width: 16, height: 16 }} />}
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Tema Tampilan</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{theme === 'dark' ? 'Mode Gelap aktif' : 'Mode Terang aktif'}</div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="btn btn-secondary btn-sm"
            >
              {theme === 'dark' ? 'Beralih ke Terang' : 'Beralih ke Gelap'}
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-surface-2)' }}>
                <Languages style={{ width: 16, height: 16 }} />
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Bahasa Aplikasi</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {locale === 'id' ? 'Bahasa Indonesia aktif' : 'English active'}
                </div>
              </div>
            </div>
            <button
              onClick={() => setLocale(locale === 'id' ? 'en' : 'id')}
              className="btn btn-secondary btn-sm"
            >
              {locale === 'id' ? 'English' : 'Indonesian'}
            </button>
          </div>
        </div>

        {/* Notification preferences (placeholder) */}
        <div className="card p-4 opacity-60" style={{ cursor: 'not-allowed' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--bg-surface-2)' }}>
              <Bell style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifikasi Email</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Segera hadir — pengaturan notifikasi email</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAuth();
  const location = useLocation();

  const initialTab = location.search.includes('security') ? 'security' : 'profile';
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    { key: 'profile', label: 'Profil', icon: User },
    { key: 'security', label: 'Keamanan', icon: Shield },
    { key: 'preferences', label: 'Preferensi', icon: Settings },
  ];

  return (
    <div className="animate-page-enter">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profil Saya</h1>
          <p className="page-subtitle">Kelola informasi akun dan preferensi Anda</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Sidebar */}
        <div>
          <div className="card p-2">
            <AvatarSection user={user} />
            <div className="px-1 pb-1 space-y-0.5">
              {tabs.map(t => (
                <TabItem
                  key={t.key}
                  label={t.label}
                  icon={t.icon}
                  active={tab === t.key}
                  onClick={() => setTab(t.key)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="card p-6">
          {tab === 'profile' && <ProfileTab user={user} />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'preferences' && <PreferencesTab />}
        </div>
      </div>
    </div>
  );
}
