'use client';
import React from 'react';
import { StoreThemeId } from '@/context/StoreThemeContext';

interface SeasonalAmbianceProps {
  themeId: StoreThemeId;
  fullPage?: boolean;
}

export default function SeasonalAmbiance({ themeId, fullPage = false }: SeasonalAmbianceProps) {
  if (themeId === 'default') {
    return (
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Subtle cyber grid and soft glow */}
        <div
          className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}
        />
        {fullPage && (
          <>
            <div
              className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-15"
              style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
            />
            <div
              className="absolute bottom-1/4 right-10 w-[400px] h-[400px] rounded-full blur-[140px] opacity-15"
              style={{ background: 'radial-gradient(circle, #0284c7 0%, transparent 70%)' }}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Dynamic Keyframes for soft float, drift & twinkle */}
      <style jsx>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
        }
        @keyframes gentleSway {
          0%, 100% { transform: translateX(0px) rotate(-2deg); }
          50% { transform: translateX(8px) rotate(2deg); }
        }
        @keyframes slowSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes snowDrift {
          0% { transform: translateY(-15px) translateX(0px); opacity: 0; }
          20% { opacity: 0.9; }
          80% { opacity: 0.9; }
          100% { transform: translateY(120px) translateX(15px); opacity: 0; }
        }
        @keyframes snowDriftFull {
          0% { transform: translateY(-20px) translateX(0px); opacity: 0; }
          10% { opacity: 0.85; }
          90% { opacity: 0.85; }
          100% { transform: translateY(105vh) translateX(30px); opacity: 0; }
        }
        @keyframes twinkleGlow {
          0%, 100% { opacity: 0.2; transform: scale(0.9); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }
        .anim-float {
          animation: gentleFloat 4s ease-in-out infinite;
        }
        .anim-float-delayed {
          animation: gentleFloat 5s ease-in-out infinite 1.5s;
        }
        .anim-sway {
          animation: gentleSway 4.5s ease-in-out infinite;
        }
        .anim-snow-1 {
          animation: snowDrift 6s linear infinite;
        }
        .anim-snow-2 {
          animation: snowDrift 8s linear infinite 2s;
        }
        .anim-snow-3 {
          animation: snowDrift 7s linear infinite 4s;
        }
        .anim-snow-full-1 {
          animation: snowDriftFull 14s linear infinite;
        }
        .anim-snow-full-2 {
          animation: snowDriftFull 19s linear infinite 4s;
        }
        .anim-snow-full-3 {
          animation: snowDriftFull 16s linear infinite 8s;
        }
        .anim-snow-full-4 {
          animation: snowDriftFull 22s linear infinite 12s;
        }
        .anim-twinkle-1 {
          animation: twinkleGlow 3.5s ease-in-out infinite;
        }
        .anim-twinkle-2 {
          animation: twinkleGlow 4.5s ease-in-out infinite 1.5s;
        }
        .anim-twinkle-3 {
          animation: twinkleGlow 5s ease-in-out infinite 3s;
        }
      `}</style>

      {/* THEME: HALLOWEEN 🎃 */}
      {themeId === 'halloween' && (
        <>
          {/* Spooky ambient glow overlays */}
          <div
            className="absolute top-0 right-10 w-96 h-96 rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #ea580c 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-10 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, #9333ea 0%, transparent 70%)' }}
          />

          {/* Spider web top right */}
          <div className="absolute top-2 right-4 text-3xl opacity-60">🕸️</div>
          <div className="absolute top-2 left-4 text-2xl opacity-50">🕸️</div>

          {/* Floating animated festive emojis */}
          <div className="absolute top-4 left-1/4 anim-float text-3xl drop-shadow-[0_4px_8px_rgba(234,88,12,0.6)]">
            🦇
          </div>
          <div className="absolute top-8 right-1/4 anim-float-delayed text-3xl drop-shadow-[0_4px_8px_rgba(234,88,12,0.6)]">
            🦇
          </div>
          <div className="absolute bottom-4 right-1/3 anim-sway text-3xl drop-shadow-[0_4px_10px_rgba(234,88,12,0.8)]">
            🎃
          </div>
          <div className="absolute top-12 right-12 anim-float text-2xl drop-shadow-[0_4px_10px_rgba(255,255,255,0.7)]">
            👻
          </div>
          <div className="absolute bottom-6 left-12 anim-float-delayed text-2xl drop-shadow-[0_4px_8px_rgba(234,88,12,0.6)]">
            🍬
          </div>
        </>
      )}

      {/* THEME: NAVIDAD 🎄 */}
      {themeId === 'navidad' && (
        <>
          {/* Warm Christmas Glow */}
          <div
            className="absolute -top-10 right-1/4 w-[450px] h-[350px] rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-10 w-96 h-96 rounded-full blur-3xl opacity-25"
            style={{ background: 'radial-gradient(circle, #16a34a 0%, transparent 70%)' }}
          />

          {fullPage ? (
            <>
              {/* Full page falling snow across entire viewport */}
              <div className="absolute -top-10 left-[8%] anim-snow-full-1 text-2xl text-white/80">❄️</div>
              <div className="absolute -top-10 left-[22%] anim-snow-full-2 text-xl text-blue-100/75">❄️</div>
              <div className="absolute -top-10 left-[38%] anim-snow-full-3 text-2xl text-white/85">❄️</div>
              <div className="absolute -top-10 left-[54%] anim-snow-full-4 text-lg text-blue-100/70">❄️</div>
              <div className="absolute -top-10 left-[72%] anim-snow-full-1 text-2xl text-white/80">❄️</div>
              <div className="absolute -top-10 left-[88%] anim-snow-full-3 text-xl text-white/75">❄️</div>

              {/* Ambient festive glows across catalog */}
              <div
                className="absolute top-1/3 right-10 w-[500px] h-[500px] rounded-full blur-[140px] opacity-15"
                style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)' }}
              />
              <div
                className="absolute bottom-1/4 left-10 w-[450px] h-[450px] rounded-full blur-[140px] opacity-15"
                style={{ background: 'radial-gradient(circle, #16a34a 0%, transparent 70%)' }}
              />
            </>
          ) : (
            <>
              {/* Snowflakes drifting for banner */}
              <div className="absolute top-2 left-[10%] anim-snow-1 text-2xl text-blue-100 opacity-80">❄️</div>
              <div className="absolute top-1 left-[35%] anim-snow-2 text-xl text-blue-100 opacity-80">❄️</div>
              <div className="absolute top-3 left-[60%] anim-snow-3 text-2xl text-white opacity-85">❄️</div>
              <div className="absolute top-2 right-[15%] anim-snow-1 text-xl text-blue-100 opacity-80">❄️</div>

              {/* Festive Christmas icons with golden glow */}
              <div className="absolute top-5 right-8 anim-float text-3xl drop-shadow-[0_4px_10px_rgba(250,204,21,0.6)]">🎄</div>
              <div className="absolute bottom-4 right-1/4 anim-float-delayed text-2xl drop-shadow-[0_4px_10px_rgba(239,68,68,0.7)]">🎁</div>
              <div className="absolute top-8 left-8 anim-sway text-2xl drop-shadow-[0_4px_10px_rgba(250,204,21,0.8)]">⭐</div>
              <div className="absolute bottom-3 left-1/3 anim-float text-2xl drop-shadow-[0_4px_8px_rgba(239,68,68,0.7)]">🎅</div>
            </>
          )}
        </>
      )}

      {/* THEME: SAN VALENTIN 💖 */}
      {themeId === 'san_valentin' && (
        <>
          {/* Romantic Pink & Rose Glow */}
          <div
            className="absolute top-0 right-10 w-[450px] h-[350px] rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, #f43f5e 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-10 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, #db2777 0%, transparent 70%)' }}
          />

          {/* Floating Hearts */}
          <div className="absolute top-5 left-12 anim-float text-3xl drop-shadow-[0_4px_10px_rgba(244,63,94,0.7)]">
            💖
          </div>
          <div className="absolute top-8 right-16 anim-float-delayed text-3xl drop-shadow-[0_4px_10px_rgba(244,63,94,0.7)]">
            💕
          </div>
          <div className="absolute bottom-4 left-1/3 anim-sway text-2xl drop-shadow-[0_4px_8px_rgba(244,63,94,0.6)]">
            💘
          </div>
          <div className="absolute bottom-6 right-1/4 anim-float text-2xl drop-shadow-[0_4px_8px_rgba(255,255,255,0.7)]">
            ✨
          </div>
          <div className="absolute top-6 left-1/2 anim-float-delayed text-2xl drop-shadow-[0_4px_8px_rgba(244,63,94,0.7)]">
            🌹
          </div>
        </>
      )}

      {/* THEME: BLACK FRIDAY 🔥 */}
      {themeId === 'black_friday' && (
        <>
          {/* Intense Flame & Amber Glow */}
          <div
            className="absolute top-0 right-10 w-[450px] h-[350px] rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-10 w-80 h-80 rounded-full blur-3xl opacity-25"
            style={{ background: 'radial-gradient(circle, #ea580c 0%, transparent 70%)' }}
          />

          {/* Fire & Lightning Elements */}
          <div className="absolute top-4 left-10 anim-float text-3xl drop-shadow-[0_4px_10px_rgba(245,158,11,0.8)]">
            🔥
          </div>
          <div className="absolute top-8 right-14 anim-float-delayed text-3xl drop-shadow-[0_4px_10px_rgba(245,158,11,0.8)]">
            ⚡
          </div>
          <div className="absolute bottom-4 left-1/4 anim-sway text-2xl drop-shadow-[0_4px_10px_rgba(245,158,11,0.7)]">
            🛒
          </div>
          <div className="absolute bottom-6 right-1/3 anim-float text-2xl drop-shadow-[0_4px_8px_rgba(245,158,11,0.7)]">
            🏷️
          </div>
          <div className="absolute top-6 left-2/3 anim-float-delayed text-2xl drop-shadow-[0_4px_10px_rgba(245,158,11,0.8)]">
            💥
          </div>
        </>
      )}

      {/* THEME: FIESTAS PATRIAS 🇲🇽 */}
      {themeId === 'fiestas_patrias' && (
        <>
          {/* Tricolor Patriotic Glow */}
          <div
            className="absolute top-0 left-10 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, #059669 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-0 right-10 w-96 h-96 rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)' }}
          />

          {/* Flags and Festive Celebration */}
          <div className="absolute top-4 left-10 anim-float text-3xl drop-shadow-[0_4px_10px_rgba(5,150,105,0.7)]">
            🇲🇽
          </div>
          <div className="absolute top-8 right-14 anim-float-delayed text-3xl drop-shadow-[0_4px_10px_rgba(220,38,38,0.7)]">
            🇲🇽
          </div>
          <div className="absolute bottom-4 left-1/3 anim-sway text-2xl drop-shadow-[0_4px_8px_rgba(250,204,21,0.8)]">
            🎉
          </div>
          <div className="absolute bottom-5 right-1/4 anim-float text-2xl drop-shadow-[0_4px_8px_rgba(250,204,21,0.8)]">
            🎊
          </div>
          <div className="absolute top-6 left-1/2 anim-float-delayed text-2xl drop-shadow-[0_4px_8px_rgba(255,255,255,0.8)]">
            🎺
          </div>
        </>
      )}

      {/* THEME: CYBERPUNK NEON 🎮 */}
      {themeId === 'cyberpunk' && (
        <>
          <div
            className="absolute top-0 right-10 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, #c026d3 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-10 w-80 h-80 rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
          />
          <div className="absolute top-4 left-16 anim-float text-3xl drop-shadow-[0_4px_12px_rgba(192,38,211,0.8)]">
            🎮
          </div>
          <div className="absolute top-8 right-20 anim-float-delayed text-3xl drop-shadow-[0_4px_12px_rgba(250,204,21,0.8)]">
            ⚡
          </div>
          <div className="absolute bottom-4 left-1/3 anim-sway text-2xl drop-shadow-[0_4px_10px_rgba(6,182,212,0.8)]">
            🕹️
          </div>
          <div className="absolute bottom-6 right-1/4 anim-float text-2xl drop-shadow-[0_4px_12px_rgba(236,72,153,0.8)]">
            👾
          </div>
        </>
      )}

      {/* THEME: APPLE LUXURY GOLD ✨ */}
      {themeId === 'apple_gold' && (
        <>
          <div
            className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }}
          />
          <div className="absolute top-4 left-20 anim-float text-2xl drop-shadow-[0_4px_10px_rgba(217,119,6,0.7)]">
            ✨
          </div>
          <div className="absolute top-8 right-24 anim-float-delayed text-2xl drop-shadow-[0_4px_10px_rgba(251,191,36,0.8)]">
            👑
          </div>
          <div className="absolute bottom-5 left-1/3 anim-sway text-2xl drop-shadow-[0_4px_10px_rgba(255,255,255,0.7)]">
            💎
          </div>
          <div className="absolute bottom-4 right-1/3 anim-float text-2xl drop-shadow-[0_4px_10px_rgba(217,119,6,0.7)]">
            ✨
          </div>
        </>
      )}

      {/* THEME: ECO TECH ESMERALDA PRO 🌿 */}
      {themeId === 'emerald_pro' && (
        <>
          <div
            className="absolute top-0 right-10 w-96 h-96 rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
          />
          <div className="absolute top-4 left-14 anim-float text-3xl drop-shadow-[0_4px_10px_rgba(16,185,129,0.7)]">
            🌿
          </div>
          <div className="absolute top-8 right-20 anim-float-delayed text-2xl drop-shadow-[0_4px_10px_rgba(5,150,105,0.7)]">
            🔧
          </div>
          <div className="absolute bottom-4 left-1/3 anim-sway text-2xl drop-shadow-[0_4px_8px_rgba(52,211,153,0.8)]">
            🌱
          </div>
          <div className="absolute bottom-5 right-1/4 anim-float text-2xl drop-shadow-[0_4px_8px_rgba(16,185,129,0.8)]">
            ⚡
          </div>
        </>
      )}

      {/* THEME: DEEP SPACE GALAXY 🌌 */}
      {themeId === 'galaxy_purple' && (
        <>
          <div
            className="absolute top-0 left-10 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 right-10 w-80 h-80 rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
          />

          {fullPage ? (
            <>
              {/* Floating stars and cosmic particles across viewport */}
              <div className="absolute top-[12%] left-[15%] anim-twinkle-1 text-xl text-purple-200 drop-shadow-[0_0_8px_#c084fc]">✦</div>
              <div className="absolute top-[28%] right-[18%] anim-twinkle-2 text-sm text-indigo-200 drop-shadow-[0_0_6px_#818cf8]">★</div>
              <div className="absolute top-[45%] left-[8%] anim-twinkle-3 text-base text-fuchsia-200 drop-shadow-[0_0_8px_#e879f9]">✧</div>
              <div className="absolute top-[62%] right-[12%] anim-twinkle-1 text-lg text-purple-100 drop-shadow-[0_0_10px_#a855f7]">✦</div>
              <div className="absolute top-[78%] left-[22%] anim-twinkle-2 text-sm text-indigo-300 drop-shadow-[0_0_6px_#6366f1]">★</div>
              <div className="absolute top-[90%] right-[25%] anim-twinkle-3 text-base text-purple-200 drop-shadow-[0_0_8px_#c084fc]">✧</div>

              {/* Cosmic nebula ambient glows across catalog */}
              <div
                className="absolute top-1/3 right-1/4 w-[550px] h-[550px] rounded-full blur-[150px] opacity-20"
                style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
              />
              <div
                className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[150px] opacity-20"
                style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
              />
            </>
          ) : (
            <>
              <div className="absolute top-4 left-16 anim-float text-3xl drop-shadow-[0_4px_12px_rgba(99,102,241,0.8)]">🌌</div>
              <div className="absolute top-8 right-20 anim-float-delayed text-2xl drop-shadow-[0_4px_10px_rgba(255,255,255,0.9)]">⭐</div>
              <div className="absolute bottom-4 left-1/3 anim-sway text-3xl drop-shadow-[0_4px_12px_rgba(168,85,247,0.8)]">🚀</div>
              <div className="absolute bottom-6 right-1/4 anim-float text-2xl drop-shadow-[0_4px_10px_rgba(129,140,248,0.8)]">🪐</div>
            </>
          )}
        </>
      )}

      {/* THEME: SUNSET GLOW & FUEGO 🌅 */}
      {themeId === 'sunset_fire' && (
        <>
          <div
            className="absolute top-0 right-10 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{ background: 'radial-gradient(circle, #ea580c 0%, transparent 70%)' }}
          />
          <div className="absolute top-4 left-14 anim-float text-3xl drop-shadow-[0_4px_10px_rgba(234,88,12,0.8)]">
            🌅
          </div>
          <div className="absolute top-8 right-20 anim-float-delayed text-3xl drop-shadow-[0_4px_10px_rgba(249,115,22,0.8)]">
            🔥
          </div>
          <div className="absolute bottom-4 left-1/3 anim-sway text-2xl drop-shadow-[0_4px_8px_rgba(251,146,60,0.8)]">
            ⚡
          </div>
          <div className="absolute bottom-5 right-1/4 anim-float text-2xl drop-shadow-[0_4px_8px_rgba(234,88,12,0.8)]">
            ☀️
          </div>
        </>
      )}

      {/* THEME: ARCADE RETRO GAMING 👾 */}
      {themeId === 'arcade_retro' && (
        <>
          <div
            className="absolute top-0 right-10 w-96 h-96 rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #dc2626 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-10 w-80 h-80 rounded-full blur-3xl opacity-35"
            style={{ background: 'radial-gradient(circle, #0284c7 0%, transparent 70%)' }}
          />
          <div className="absolute top-4 left-14 anim-float text-3xl drop-shadow-[0_4px_10px_rgba(220,38,38,0.8)]">
            👾
          </div>
          <div className="absolute top-8 right-20 anim-float-delayed text-3xl drop-shadow-[0_4px_10px_rgba(2,132,199,0.8)]">
            🕹️
          </div>
          <div className="absolute bottom-4 left-1/3 anim-sway text-2xl drop-shadow-[0_4px_8px_rgba(245,158,11,0.8)]">
            🎮
          </div>
          <div className="absolute bottom-5 right-1/4 anim-float text-2xl drop-shadow-[0_4px_8px_rgba(220,38,38,0.8)]">
            🪙
          </div>
        </>
      )}
    </div>
  );
}
