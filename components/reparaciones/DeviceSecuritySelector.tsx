'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  Grid3X3,
  Lock,
  Unlock,
  RotateCcw,
  Check,
  Eye,
  EyeOff,
  Smartphone
} from 'lucide-react';

interface DeviceSecuritySelectorProps {
  value: string;
  onChange: (value: string) => void;
}

type SecurityMode = 'pin' | 'pattern' | 'password' | 'none';

// Coordenadas fijas para la cuadrícula 3x3 en SVG (120x120 viewBox)
const GRID_POINTS: Record<number, { x: number; y: number }> = {
  1: { x: 25, y: 25 },
  2: { x: 65, y: 25 },
  3: { x: 105, y: 25 },
  4: { x: 25, y: 65 },
  5: { x: 65, y: 65 },
  6: { x: 105, y: 65 },
  7: { x: 25, y: 105 },
  8: { x: 65, y: 105 },
  9: { x: 105, y: 105 },
};

// Componente para visualizar el diagrama 3x3 en miniatura (para listas, tickets y comprobantes)
export function MiniPatternView({
  patternString,
  size = 56,
}: {
  patternString: string;
  size?: number;
}) {
  if (!patternString) return null;

  // Extraer números de la secuencia si es patrón
  const isPattern =
    patternString.toLowerCase().includes('patrón') ||
    patternString.toLowerCase().includes('patron') ||
    /[1-9](-[1-9]){2,}/.test(patternString);

  if (!isPattern) {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-gray-800">
        <Lock size={12} className="text-amber-600" />
        <span>{patternString}</span>
      </span>
    );
  }

  // Extraer secuencia numérica (ej: "1-2-5-8" o "1,2,5,8")
  const matches = patternString.match(/[1-9]/g);
  const sequence = matches ? matches.map(Number) : [];

  if (sequence.length === 0) {
    return <span className="text-xs font-mono">{patternString}</span>;
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div
        style={{ width: size, height: size }}
        className="bg-slate-900 rounded-xl p-1 shadow-xs border border-slate-700 shrink-0 relative flex items-center justify-center"
      >
        <svg viewBox="0 0 130 130" className="w-full h-full">
          {/* Líneas entre puntos */}
          {sequence.map((pt, idx) => {
            if (idx === 0) return null;
            const prev = GRID_POINTS[sequence[idx - 1]];
            const curr = GRID_POINTS[pt];
            if (!prev || !curr) return null;
            return (
              <line
                key={`line-${idx}`}
                x1={prev.x}
                y1={prev.y}
                x2={curr.x}
                y2={curr.y}
                stroke="#38bdf8"
                strokeWidth="7"
                strokeLinecap="round"
                opacity="0.9"
              />
            );
          })}

          {/* 9 Puntos de la matriz */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
            const pos = GRID_POINTS[num];
            const isUsed = sequence.includes(num);
            const stepIndex = sequence.indexOf(num);

            return (
              <g key={`pt-${num}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isUsed ? 12 : 7}
                  fill={isUsed ? '#0284c7' : '#475569'}
                  stroke={isUsed ? '#bae6fd' : '#1e293b'}
                  strokeWidth="2.5"
                />
                {isUsed && (
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {stepIndex + 1}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patrón 3x3:</p>
        <p className="text-xs font-mono font-bold text-sky-800 tracking-wider">
          {sequence.join(' ➔ ')}
        </p>
      </div>
    </div>
  );
}

export default function DeviceSecuritySelector({
  value,
  onChange,
}: DeviceSecuritySelectorProps) {
  const [mode, setMode] = useState<SecurityMode>('pin');
  const [pin, setPin] = useState('');
  const [patternSequence, setPatternSequence] = useState<number[]>([]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Inicializar estado según el valor recibido
  useEffect(() => {
    if (!value) {
      setMode('pin');
      setPin('');
      setPatternSequence([]);
      setPassword('');
      return;
    }

    const valLower = value.toLowerCase();

    if (valLower.includes('sin') || valLower.includes('ningun') || valLower.includes('libre')) {
      setMode('none');
    } else if (valLower.includes('patrón') || valLower.includes('patron')) {
      setMode('pattern');
      const nums = value.match(/[1-9]/g);
      if (nums) setPatternSequence(nums.map(Number));
    } else if (valLower.includes('pin:')) {
      setMode('pin');
      setPin(value.replace(/pin:\s*/i, '').trim());
    } else if (/^\d{3,8}$/.test(value.trim())) {
      setMode('pin');
      setPin(value.trim());
    } else {
      setMode('password');
      setPassword(value.replace(/clave:\s*/i, '').trim());
    }
  }, []);

  // Manejar cambio de punto en el patrón 3x3
  const handlePointClick = (num: number) => {
    if (patternSequence.includes(num)) {
      // Si ya está en la secuencia y es el último, deshacerlo
      if (patternSequence[patternSequence.length - 1] === num) {
        const next = patternSequence.slice(0, -1);
        setPatternSequence(next);
        notifyPattern(next);
      }
      return;
    }

    const next = [...patternSequence, num];
    setPatternSequence(next);
    notifyPattern(next);
  };

  const clearPattern = () => {
    setPatternSequence([]);
    notifyPattern([]);
  };

  const undoLastPoint = () => {
    if (patternSequence.length === 0) return;
    const next = patternSequence.slice(0, -1);
    setPatternSequence(next);
    notifyPattern(next);
  };

  const notifyPattern = (seq: number[]) => {
    if (seq.length === 0) {
      onChange('Patrón: (Sin trazar)');
    } else {
      onChange(`Patrón: ${seq.join('-')}`);
    }
  };

  const handleModeChange = (newMode: SecurityMode) => {
    setMode(newMode);
    if (newMode === 'none') {
      onChange('Sin código / Sin clave');
    } else if (newMode === 'pin') {
      onChange(pin ? `PIN: ${pin}` : '');
    } else if (newMode === 'pattern') {
      notifyPattern(patternSequence);
    } else if (newMode === 'password') {
      onChange(password ? `Clave: ${password}` : '');
    }
  };

  const handlePinChange = (newPin: string) => {
    const clean = newPin.replace(/\D/g, '');
    setPin(clean);
    onChange(clean ? `PIN: ${clean}` : '');
  };

  const handlePasswordChange = (newPass: string) => {
    setPassword(newPass);
    onChange(newPass ? `Clave: ${newPass}` : '');
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
      {/* Selector de Método de Desbloqueo */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lock size={14} className="text-[#2563eb]" />
            <span>Método de Bloqueo del Dispositivo:</span>
          </span>
          <span className="text-[11px] font-mono font-bold text-[#2563eb] truncate max-w-[200px]">
            {value || 'Sin configurar'}
          </span>
        </label>

        {/* Botones de Pestañas de Métodos */}
        <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs font-bold shadow-xs">
          <button
            type="button"
            onClick={() => handleModeChange('pin')}
            className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              mode === 'pin'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <KeyRound size={14} />
            <span className="text-[11px]">PIN</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('pattern')}
            className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              mode === 'pattern'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Grid3X3 size={14} />
            <span className="text-[11px]">Patrón 3x3</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('password')}
            className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              mode === 'password'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Lock size={14} />
            <span className="text-[11px]">Contraseña</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('none')}
            className={`py-2 px-1 rounded-lg transition flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
              mode === 'none'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Unlock size={14} />
            <span className="text-[11px]">Sin Código</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODO 1: PIN NUMÉRICO
         ========================================================================= */}
      {mode === 'pin' && (
        <div className="space-y-2.5 animate-fade-in bg-white p-3 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ej. 1234 o 150920"
              value={pin}
              onChange={e => handlePinChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono tracking-widest font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
            {pin && (
              <button
                type="button"
                onClick={() => handlePinChange('')}
                className="px-2.5 py-2 text-xs text-gray-400 hover:text-red-500 font-bold"
              >
                Borrar
              </button>
            )}
          </div>

          {/* Atajos de PIN rápidos comunes */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[10px] text-gray-400 font-bold mr-1">Comunes:</span>
            {['0000', '1234', '1111', '2580', '123456', '000000'].map(commonPin => (
              <button
                key={commonPin}
                type="button"
                onClick={() => handlePinChange(commonPin)}
                className="px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 font-mono text-[11px] rounded-lg transition font-semibold"
              >
                {commonPin}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODO 2: PATRÓN DE DESBLOQUEO 3x3 (INTERACTIVO)
         ========================================================================= */}
      {mode === 'pattern' && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Grid3X3 size={15} />
              <span>Toca los puntos en orden para trazar:</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={undoLastPoint}
                disabled={patternSequence.length === 0}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-[11px] font-semibold disabled:opacity-30 cursor-pointer"
                title="Deshacer último punto"
              >
                Deshacer
              </button>
              <button
                type="button"
                onClick={clearPattern}
                disabled={patternSequence.length === 0}
                className="px-2.5 py-1 bg-red-950/70 hover:bg-red-900 text-red-300 rounded-lg text-[11px] font-semibold disabled:opacity-30 cursor-pointer flex items-center gap-1"
                title="Reiniciar patrón"
              >
                <RotateCcw size={11} />
                <span>Limpiar</span>
              </button>
            </div>
          </div>

          {/* Cuadrícula interactiva 3x3 */}
          <div className="relative mx-auto w-[240px] h-[240px] bg-slate-950 rounded-2xl border border-slate-800 shadow-inner p-2 select-none">
            <svg viewBox="0 0 130 130" className="w-full h-full pointer-events-none">
              {/* Líneas entre puntos */}
              {patternSequence.map((pt, idx) => {
                if (idx === 0) return null;
                const prev = GRID_POINTS[patternSequence[idx - 1]];
                const curr = GRID_POINTS[pt];
                if (!prev || !curr) return null;
                return (
                  <line
                    key={`line-${idx}`}
                    x1={prev.x}
                    y1={prev.y}
                    x2={curr.x}
                    y2={curr.y}
                    stroke="#f59e0b"
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity="0.95"
                  />
                );
              })}
            </svg>

            {/* 9 Botones interactivos sobre los puntos */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                const isSelected = patternSequence.includes(num);
                const step = patternSequence.indexOf(num);

                return (
                  <div key={num} className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handlePointClick(num)}
                      className={`w-12 h-12 rounded-full transition-all transform active:scale-90 flex items-center justify-center font-mono font-bold text-sm shadow-md cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/30 scale-105'
                          : 'bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      {isSelected ? step + 1 : num}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumen del Patrón */}
          <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-gray-400">Secuencia trazada:</span>
            <span className="font-mono font-black text-amber-400 tracking-wider">
              {patternSequence.length > 0 ? patternSequence.join(' ➔ ') : '(Toca los números)'}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODO 3: CONTRASEÑA ALFANUMÉRICA
         ========================================================================= */}
      {mode === 'password' && (
        <div className="space-y-2 animate-fade-in bg-white p-3 rounded-xl border border-gray-200">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Ej. iPhone2024! o MiClave123"
              value={password}
              onChange={e => handlePasswordChange(e.target.value)}
              className="w-full pl-3 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODO 4: SIN CÓDIGO
         ========================================================================= */}
      {mode === 'none' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>El cliente entrega el equipo sin contraseña ni patrón de bloqueo.</span>
        </div>
      )}
    </div>
  );
}
