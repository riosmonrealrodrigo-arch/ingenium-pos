// Generador de efectos de sonido estilo Arcade / Videojuego Retro mediante Web Audio API
// 100% sintetizado matemáticamente por código (sin archivos externos, 0 problemas legales/copyright)
// Sin muestras con derechos de autor: ondas cuadradas, triangulares y filtros lowpass originales.

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  private lastPlayTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ingenium_sound_enabled');
      this.enabled = saved !== 'false';
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ingenium_sound_enabled', val ? 'true' : 'false');
    }
  }

  public toggle(): boolean {
    const nextState = !this.enabled;
    this.setEnabled(nextState);
    if (nextState) {
      this.playTap();
    }
    return nextState;
  }

  // 1. Efecto Arcade "Select / Blip" (Estilo menú de videojuego clásico)
  // Dos notas rápidas y nítidas de 8-bit (520 Hz -> 880 Hz)
  public playTap() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 25) return;
    this.lastPlayTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Filtro para dar calidez retro sin estridencias
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, t);

      // Micro-nota 1: 520 Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(520, t);
      gain1.gain.setValueAtTime(0.065, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      osc1.connect(gain1);
      gain1.connect(filter);
      osc1.start(t);
      osc1.stop(t + 0.03);

      // Micro-nota 2: 880 Hz (salto característico de arcade)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(880, t + 0.022);
      gain2.gain.setValueAtTime(0.08, t + 0.022);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
      osc2.connect(gain2);
      gain2.connect(filter);
      osc2.start(t + 0.022);
      osc2.stop(t + 0.07);

      filter.connect(ctx.destination);
    } catch {}
  }

  // 2. Efecto Arcade "Coin / Gema" (Al agregar al carrito o sumar piezas)
  // El clásico sonido de moneda/recompensa de 8-bit (Si5 988 Hz -> Mi6 1319 Hz)
  public playAddToCart() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 30) return;
    this.lastPlayTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, t);

      // Nota 1 (B5 - 987.77 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(987.77, t);
      gain1.gain.setValueAtTime(0.08, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc1.connect(gain1);
      gain1.connect(filter);
      osc1.start(t);
      osc1.stop(t + 0.05);

      // Nota 2 brillante con campaneo retro (E6 - 1318.51 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(1318.51, t + 0.042);
      gain2.gain.setValueAtTime(0.10, t + 0.042);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc2.connect(gain2);
      gain2.connect(filter);
      osc2.start(t + 0.042);
      osc2.stop(t + 0.23);

      filter.connect(ctx.destination);
    } catch {}
  }

  // 3. Efecto "Power-Up / Salto Burbuja" (Modales, robot flotante, fotos)
  // Rampa ascendente clásica de videojuego de plataformas (320 Hz -> 960 Hz)
  public playPop() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 30) return;
    this.lastPlayTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2800, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(960, t + 0.075);

      gain.gain.setValueAtTime(0.11, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.085);
    } catch {}
  }

  // 4. Efecto "Stage Clear / Victoria" (Enviar pedido por WhatsApp / Checkout)
  // Fanfarria triunfal de 4 notas de 16-bit: Do5 -> Mi5 -> Sol5 -> Do6
  public playSuccess() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 30) return;
    this.lastPlayTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const notes = [
        { freq: 523.25, dur: 0.055, gain: 0.08 }, // Do5
        { freq: 659.25, dur: 0.055, gain: 0.08 }, // Mi5
        { freq: 783.99, dur: 0.065, gain: 0.09 }, // Sol5
        { freq: 1046.5, dur: 0.24,  gain: 0.12 }, // Do6 (sostenido brillante)
      ];

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, t);
      filter.connect(ctx.destination);

      let currentOffset = 0;
      notes.forEach((n) => {
        const startTime = t + currentOffset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(n.freq, startTime);

        gain.gain.setValueAtTime(n.gain, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + n.dur);

        osc.connect(gain);
        gain.connect(filter);

        osc.start(startTime);
        osc.stop(startTime + n.dur + 0.01);

        currentOffset += 0.055;
      });
    } catch {}
  }

  // 5. Efecto "Cursor / Switch" (Filtros de categoría y pestañas)
  // Micro-blip nítido y rápido (680 Hz -> 480 Hz)
  public playTab() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 25) return;
    this.lastPlayTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, t);
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.035);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.045);
    } catch {}
  }
}

export const soundManager = new SoundEffectsManager();

/**
 * Determina si el elemento interactivo presionado corresponde al botón de POS
 * que debe excluirse del sonido (por ejemplo: pestaña "Chat POS" o acceso secreto POS en la tienda web).
 */
export function isPosButton(element: HTMLElement | null): boolean {
  if (!element) return false;

  const target = (element.closest(
    'button, a, [role="button"], input[type="button"], input[type="submit"]'
  ) || element) as HTMLElement;

  if (!target) return false;

  // 1. Atributo explícito o clase de exclusión
  if (target.dataset.noSound === 'true' || target.classList.contains('no-sound')) {
    return true;
  }
  if (target.closest('[data-no-sound="true"]') || target.closest('.no-sound')) {
    return true;
  }

  // 2. Detección por texto contenido
  const text = (target.innerText || target.textContent || '').trim().toLowerCase();
  if (
    text === 'chat pos' ||
    text === 'pos' ||
    text.includes('chat pos') ||
    text === 'entrar al pos' ||
    text === 'punto de venta'
  ) {
    return true;
  }

  // 3. Detección por atributos (href, aria-label, title)
  const href = (target.getAttribute('href') || '').toLowerCase();
  const ariaLabel = (target.getAttribute('aria-label') || '').toLowerCase();
  const title = (target.getAttribute('title') || '').toLowerCase();

  if (
    href === '/pos' ||
    href.startsWith('/pos') ||
    href === '/admin' ||
    href.startsWith('/admin') ||
    href === '/login' ||
    href === '/acceso'
  ) {
    return true;
  }

  if (ariaLabel === 'acceso' || ariaLabel.includes('pos')) {
    return true;
  }

  if (title.includes('pos') || title.includes('chat pos')) {
    return true;
  }

  return false;
}
