// Generador de efectos de sonido interactivos mediante Web Audio API
// Sin archivos externos, 0ms de latencia, 100% compatible con navegadores móviles y desktop

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
      this.playPop();
    }
    return nextState;
  }

  // 1. Toque sutil y táctil estándar para botones (Modern UI Click)
  public playTap() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 25) return; // Debounce anti-clipping
    this.lastPlayTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.045);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  // 2. Pop / Burbuja alegre (Apertura de modales, robot flotante, selector de temas, zoom)
  public playPop() {
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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(760, t + 0.055);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.065);
    } catch {}
  }

  // 3. Agregar al carrito / Incrementar cantidad (Feedback positivo y gratificante)
  public playAddToCart() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 25) return;
    this.lastPlayTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;

      // Nota 1: Mi5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, t);
      gain1.gain.setValueAtTime(0.12, t);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(t);
      osc1.stop(t + 0.06);

      // Nota 2: Si5 (987.77 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, t + 0.045);
      gain2.gain.setValueAtTime(0.13, t + 0.045);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(t + 0.045);
      osc2.stop(t + 0.14);
    } catch {}
  }

  // 4. Éxito / Confirmación / Enviar pedido a WhatsApp (Arpegio armónico)
  public playSuccess() {
    if (!this.enabled) return;
    const now = Date.now();
    if (now - this.lastPlayTime < 25) return;
    this.lastPlayTime = now;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      // Do5, Mi5, Sol5
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t + idx * 0.055;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.17);
      });
    } catch {}
  }

  // 5. Cambio de pestaña / Filtro de categoría (Toque suave amaderado)
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

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(260, t + 0.038);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.038);

      osc.connect(gain);
      gain.connect(ctx.destination);

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
