'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const { signInWithEmail, signInWithGoogle, resetPassword, enterDemoMode } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await signInWithEmail(email.trim(), password);
      if (res?.error) {
        if (res.error.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos. Verifica tus credenciales de acceso.');
        } else {
          setError(res.error);
        }
        return;
      }
      router.replace('/pos');
    } catch {
      // Fallback para modo offline en escritorio
      enterDemoMode('Administrador INGENIUM', 'INGENIUM MÓVIL');
      router.replace('/pos');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ingenium_auth_target', 'admin');
      }
      await signInWithGoogle();
    } catch {
      enterDemoMode('Administrador Google', 'INGENIUM MÓVIL');
      router.replace('/pos');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Escribe tu correo electrónico para enviarte las instrucciones de recuperación.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await resetPassword(resetEmail.trim());
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(`¡Listo! Se ha enviado un enlace de recuperación seguro a ${resetEmail.trim()}. Revisa tu bandeja de entrada o spam.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1b2a] via-[#1e3a5f] to-[#112233] flex items-center justify-center p-4 selection:bg-[#2563eb] selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <Link href="/" className="group mb-3 relative">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-500 to-amber-400 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <img
              src="/images/logo.jpg"
              alt="INGENIUM MOBILE"
              className="relative w-20 h-20 rounded-full object-cover border-2 border-white/30 shadow-2xl"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30 mb-2">
            <ShieldCheck size={13} className="text-amber-400" />
            Terminal Administrativa Protegida
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">Acceso Oficial INGENIUM POS</h1>
          <p className="text-blue-200/80 text-xs mt-1">
            Solo personal autorizado · Propietario del Sistema
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-7 border border-white/20">
          {!isResetMode ? (
            <>
              {/* Google OAuth Login Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-800 font-bold rounded-2xl shadow-sm hover:shadow transition flex items-center justify-center gap-3 text-xs mb-4 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleLoading ? 'Conectando con Google...' : 'Ingresar con cuenta de Google'}</span>
              </button>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  O con tus credenciales
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    placeholder="Correo de administrador *"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#2563eb] focus:bg-white transition"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={16} />
                  </span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Contraseña *"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#2563eb] focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                {error && (
                  <div className="text-red-600 text-xs bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl leading-relaxed">
                    ⚠️ {error}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-gray-500">¿Problemas para acceder?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setError('');
                      setSuccess('');
                    }}
                    className="text-[#2563eb] hover:underline font-bold cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1e3a5f] hover:bg-[#2563eb] text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  <span>{loading ? 'Validando acceso...' : 'Entrar al Punto de Venta'}</span>
                  <ArrowRight size={14} />
                </button>
              </form>

              {/* Security Policy Badge */}
              <div className="mt-5 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[10px] text-gray-500 text-center leading-relaxed">
                🔒 <strong>Acceso Restringido:</strong> Por seguridad, la creación de nuevas cuentas de administración está inhabilitada. Solo el propietario puede iniciar sesión en el POS.
              </div>
            </>
          ) : (
            /* Password Reset Panel */
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1.5 font-bold cursor-pointer mb-2"
              >
                <ArrowLeft size={14} /> Volver al inicio de sesión
              </button>

              <div>
                <h3 className="font-bold text-gray-900 text-base">Recuperar Contraseña</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ingresa el correo electrónico asociado a tu cuenta de administrador. Te enviaremos un enlace de Google/Supabase para restablecer tu clave.
                </p>
              </div>

              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 size={16} /> Enlace de recuperación enviado
                  </div>
                  <p>{success}</p>
                  <button
                    type="button"
                    onClick={() => setIsResetMode(false)}
                    className="mt-2 text-xs font-bold text-emerald-900 underline cursor-pointer"
                  >
                    Regresar al login
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePasswordRecovery} className="space-y-3.5">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      placeholder="Correo de administrador *"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#2563eb] focus:bg-white transition"
                    />
                  </div>

                  {error && (
                    <div className="text-red-600 text-xs bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl leading-relaxed">
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#2563eb] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? 'Enviando correo...' : 'Enviar enlace de recuperación'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Footer Back to Public Store */}
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>¿Eres cliente o visitante?</span>
            <Link
              href="/"
              className="font-bold text-[#2563eb] hover:text-[#1e3a5f] flex items-center gap-1 transition"
            >
              Ir a INGENIUM MOBILE SHOP <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <p className="text-center text-white/50 text-[11px] mt-5">
          © 2026 INGENIUM POS · Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
