import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Eye, EyeOff, Layers, ArrowRight, Shield, Zap, Globe,
  TrendingUp, Users, FileText, Lock, User
} from 'lucide-react';

const FEATURES = [
  { icon: TrendingUp, title: 'Analytics Real-time', desc: 'Pantau performa bisnis import/export secara langsung' },
  { icon: Users, title: 'CRM 360°', desc: 'Kelola seluruh relasi pelanggan dalam satu platform' },
  { icon: FileText, title: 'Invoice & Keuangan', desc: 'Otomatisasi invoice, pajak, dan laporan keuangan' },
  { icon: Globe, title: 'Multi-Valuta', desc: 'Dukungan USD, SGD, EUR, dan kurs real-time' },
];

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginValue.trim() || !password) return;
    setLoading(true);
    try {
      await login({ login: loginValue.trim(), password });
      toast.success('Selamat datang kembali!');
      navigate('/dashboard');
    } catch (err) {
      // Penanganan khusus untuk rate limiting (429)
      if (err.response?.status === 429) {
        toast.error('Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.');
      } else {
        toast.error(err.response?.data?.message || 'Login gagal. Periksa kredensial Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Left: Brand Panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 flex-1"
        style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)',
          minWidth: 0
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <img
              src="/LOGO-04.png"
              alt="Logo Abnan CRM"
              className="w-10 h-10 object-contain cursor-pointer"
              onClick={() => navigate('/dashboard')}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div>
            <div className="text-white font-bold text-sm">Abnan Inti Trans</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.08em' }}>
              ENTERPRISE SUITE
            </div>
          </div>
        </div>

        {/* Center content */}
        <div>
          <h1
            style={{
              fontSize: 38, fontWeight: 800, color: '#fff',
              lineHeight: 1.15, letterSpacing: '-0.04em', marginBottom: 16
            }}
          >
            Kelola bisnis<br />
            <span style={{ color: '#93b4fd' }}>import/export</span><br />
            lebih cerdas.
          </h1>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 380 }}>
            Platform CRM terintegrasi untuk manajemen pelanggan, invoice, keuangan, dan logistik ekspor impor.
          </p>

          {/* Features */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: 'rgba(58,113,246,0.3)' }}
                  >
                    <Icon style={{ width: 15, height: 15, color: '#93b4fd' }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>
                    {f.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                    {f.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>SSL Terenkripsi</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>•</span>
          <div className="flex items-center gap-2">
            <Zap style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Uptime 99.9%</span>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div
        className="flex flex-col items-center justify-center flex-1 p-6 lg:p-12"
        style={{ background: 'var(--bg-surface)', maxWidth: 480, width: '100%', margin: '0 auto' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <img
            src="/LOGO-04.png"
            alt="Logo Abnan CRM"
            className="w-10 h-10 object-contain cursor-pointer"
            onClick={() => navigate('/dashboard')}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Abnan Inti Trans</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>ENTERPRISE SUITE</div>
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h2
              style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 8 }}
            >
              Masuk ke akun Anda
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Gunakan ID karyawan atau email dan password Anda.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Field */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                ID Karyawan / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <User style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />
                </div>
                <input
                  className="input-base"
                  style={{ paddingLeft: 40 }}
                  type="text"
                  placeholder="Contoh: ABN001 atau nama@email.com"
                  value={loginValue}
                  onChange={e => setLoginValue(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Lock style={{ width: 15, height: 15, color: 'var(--text-muted)' }} />
                </div>
                <input
                  className="input-base"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password Anda"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full"
              style={{ marginTop: 8, justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 rounded-full border-2 border-white/30 border-t-white" />
                  Memproses...
                </>
              ) : (
                <>
                  Masuk ke Sistem
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </>
              )}
            </button>
          </form>

          {/* Security note */}
          <div
            className="flex items-center gap-2 mt-6 p-3 rounded-xl"
            style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-base)' }}
          >
            <Shield style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Koneksi terenkripsi SSL. Data Anda aman dan terlindungi.
            </span>
          </div>

          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 24 }}>
            Lupa password? Hubungi administrator sistem Anda.
          </p>
        </div>
      </div>
    </div>
  );
}