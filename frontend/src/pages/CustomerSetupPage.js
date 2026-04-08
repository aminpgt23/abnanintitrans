import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { customerSetupAPI } from '../services/api';

export default function CustomerSetupPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ password: '', confirm_password: '' });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const response = await customerSetupAPI.getSetupInfo(token);
        if (active) setInfo(response.data.data);
      } catch (error) {
        if (active) {
          toast.error(error.response?.data?.message || 'Link setup tidak valid');
          setInfo(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await customerSetupAPI.completeSetup(token, form);
      toast.success('Password berhasil dibuat. Silakan login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membuat password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-[480px] animate-slide-up">
        <div className="mb-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-blue-200/60 hover:text-white transition-all text-sm font-semibold group"
          >
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
              <ArrowLeft size={16} />
            </div>
            Kembali ke Login
          </Link>
        </div>

        <div className="bg-white/85 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white/20 p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-600/30">
                <span className="text-white font-black text-3xl tracking-tighter">A</span>
              </div>
              <div className="absolute -right-2 -bottom-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100">
                <ShieldCheck className="text-blue-600" size={16} />
              </div>
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Buat Password Customer</h1>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Selesaikan aktivasi akun customer Anda sebelum login
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            </div>
          ) : !info ? (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
              Link setup password tidak valid atau sudah kedaluwarsa.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-3xl bg-gray-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Customer</p>
                <p className="mt-2 text-base font-bold text-gray-900">{info.company_name || info.customer_name}</p>
                <p className="mt-1 text-sm text-gray-500">{info.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Password Baru</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-12 pr-12 py-4 bg-gray-100/50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none placeholder:text-gray-300"
                  />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm_password}
                    onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))}
                    required
                    minLength={8}
                    placeholder="Ulangi password"
                    className="w-full pl-12 pr-12 py-4 bg-gray-100/50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-600/5 transition-all outline-none placeholder:text-gray-300"
                  />
                  <button type="button" onClick={() => setShowConfirm((value) => !value)} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-blue-600 transition-colors">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white py-4 rounded-[1.25rem] font-black text-sm transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
              >
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Simpan Password & Lanjut Login'}
              </button>
            </form>
          )}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(30px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .animate-slide-up {
            animation: slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}} />
      </div>
    </div>
  );
}
