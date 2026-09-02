'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Store, User, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, signUp } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ businessName: '', name: '', email: '', password: '' });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    let res: { error?: string };
    if (mode === 'login') {
      res = await signInWithEmail(form.email, form.password);
    } else {
      if (!form.businessName || !form.name) { setError('Completa todos los campos'); setLoading(false); return; }
      res = await signUp(form.email, form.password, form.name, form.businessName);
    }
    setLoading(false);
    if (res.error) setError(res.error);
    else router.replace('/dashboard');
  };

  const handleGoogle = async () => {
    setError('');
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2563eb] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-[#f59e0b] rounded-2xl flex items-center justify-center text-[#1e3a5f] font-black text-4xl shadow-2xl mb-4">I</div>
          <h1 className="text-3xl font-black text-white tracking-wide">INGENIUM POS</h1>
          <p className="text-white/60 text-sm mt-1">Vende inteligente, cobra rápido</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
                  ${mode === m ? 'bg-white shadow text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'}`}>
                {m === 'login' ? 'Iniciar sesión' : 'Registrar negocio'}
              </button>
            ))}
          </div>

          {/* Google button */}
          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition mb-4">
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-semibold text-gray-700">Continuar con Google</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">o con correo</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <Field icon={<Store size={16} />} placeholder="Nombre del negocio" value={form.businessName} onChange={set('businessName')} required />
                <Field icon={<User size={16} />} placeholder="Tu nombre completo" value={form.name} onChange={set('name')} required />
              </>
            )}
            <Field icon={<Mail size={16} />} type="email" placeholder="Correo electrónico" value={form.email} onChange={set('email')} required />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Lock size={16} /></span>
              <input type={showPass ? 'text' : 'password'} placeholder="Contraseña" value={form.password}
                onChange={set('password')} required
                className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <p className="text-red-500 text-xs bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#2563eb] text-white font-bold rounded-xl hover:bg-[#1d4ed8] transition disabled:opacity-60 text-sm mt-2">
              {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear negocio y entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">© 2024 Ingenium POS · INGENIUMMOBILE</p>
      </div>
    </div>
  );
}

function Field({ icon, ...props }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      <input {...props} className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
    </div>
  );
}
