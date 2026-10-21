'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Store, User, Mail, Lock, Zap, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { signInWithEmail, signUp, enterDemoMode } = useAuth();
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
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await signInWithEmail(form.email, form.password);
        if (res.error) {
          if (res.error.includes('fetch') || res.error.includes('network') || res.error.includes('paused')) {
            // Acceso fallback transparente
            enterDemoMode(form.email.split('@')[0]);
            router.replace('/dashboard');
            return;
          }
          if (res.error.includes('Invalid login credentials')) {
            setError('Usuario/Correo o contraseña incorrectos.');
          } else {
            setError(res.error);
          }
          return;
        }
        router.replace('/dashboard');
      } else {
        if (!form.businessName.trim()) { setError('Escribe el nombre de tu negocio'); return; }
        if (!form.name.trim()) { setError('Escribe tu nombre completo'); return; }
        if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
        
        const res = await signUp(form.email, form.password, form.name, form.businessName);
        if (res.error) {
          if (res.error.includes('already registered')) {
            setError('Este correo ya está registrado. Usa "Iniciar sesión".');
          } else {
            setError(res.error);
          }
          return;
        }
        router.replace('/dashboard');
      }
    } catch {
      enterDemoMode(form.name || 'Admin POS', form.businessName || 'INGENIUM MÓVIL');
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccess = () => {
    // Acceso inmediato directo para operar el POS ("abrir y empezar")
    enterDemoMode('Administrador POS', 'INGENIUM MÓVIL');
    router.replace('/pos');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#162a45] to-[#2563eb] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-20 h-20 bg-[#f59e0b] rounded-2xl flex items-center justify-center text-[#1e3a5f] font-black text-4xl shadow-2xl mb-4 border-2 border-white/20">
            I
          </div>
          <h1 className="text-3xl font-black text-white tracking-wide">INGENIUM POS</h1>
          <p className="text-blue-100/80 text-sm mt-1 font-medium">Sistema de Punto de Venta & Gestión Comercial</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-7 border border-white/20">
          
          {/* Botón de Acceso Inmediato Directo (Abrir y empezar) */}
          <button
            onClick={handleQuickAccess}
            type="button"
            className="w-full mb-5 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
          >
            <Zap size={18} className="fill-current text-yellow-200" />
            Acceso Inmediato al POS (Abrir y empezar)
          </button>

          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-5">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                  ${mode === m ? 'bg-white shadow text-[#1e3a5f]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {m === 'login' ? 'Iniciar sesión directa' : 'Registrar nuevo negocio'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <Field
                  icon={<Store size={16} />}
                  placeholder="Nombre de la empresa / taller"
                  value={form.businessName}
                  onChange={set('businessName')}
                  required
                />
                <Field
                  icon={<User size={16} />}
                  placeholder="Nombre del encargado o cajero"
                  value={form.name}
                  onChange={set('name')}
                  required
                />
              </>
            )}

            <Field
              icon={<Mail size={16} />}
              type="text"
              placeholder="Correo o usuario de acceso"
              value={form.email}
              onChange={set('email')}
              required
            />

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Contraseña del sistema"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                className="w-full pl-9 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="text-red-600 text-xs bg-red-50 border border-red-200 px-4 py-3 rounded-xl leading-relaxed">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#2563eb] text-white font-bold rounded-xl hover:bg-[#1d4ed8] transition disabled:opacity-60 text-sm mt-3 flex items-center justify-center gap-2 shadow"
            >
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Ingresando al sistema...' : mode === 'login' ? 'Entrar al POS' : 'Crear negocio e ingresar'}
            </button>
          </form>

          {/* Enlace directo a la Tienda Pública */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>¿Eres cliente o visitante?</span>
            <Link
              href="/tienda"
              className="font-bold text-[#2563eb] hover:text-[#1e3a5f] flex items-center gap-1 transition"
            >
              Ir al Catálogo Público <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-5">© 2026 INGENIUM POS · INGENIUMMOBILE</p>
      </div>
    </div>
  );
}

function Field({ icon, ...props }: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
      <input
        {...props}
        className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
      />
    </div>
  );
}
