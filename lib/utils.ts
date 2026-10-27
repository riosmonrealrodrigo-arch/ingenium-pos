export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Formateo de Moneda estándar en Pesos Mexicanos ($0.00 MXN)
export const formatCurrency = (amount: number, _currency = '$'): string => {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const formatted = num.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted} MXN`;
};

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

export const todayISO = (): string => new Date().toISOString().split('T')[0];

export const isSameDay = (iso: string, day: string): boolean => iso.startsWith(day);

export const generateTicket = (id: string): string => '#' + id.slice(-6).toUpperCase();

export const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const weekAgoISO = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
};

export const monthAgoISO = (): string => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
};

// Extrae accesorios guardados en el reporte de falla de la reparación
export const extractAccessories = (issueText?: string): { cleanIssue: string; accessories: string } => {
  if (!issueText) return { cleanIssue: '', accessories: '' };
  const match = issueText.match(/\[Accesorios:\s*([^\]]+)\]/i);
  if (match) {
    return {
      cleanIssue: issueText.replace(/\[Accesorios:\s*[^\]]+\]/i, '').trim(),
      accessories: match[1].trim(),
    };
  }
  return { cleanIssue: issueText, accessories: '' };
};

// Formatea el reporte de falla adjuntando los accesorios de forma estructurada
export const formatIssueWithAccessories = (cleanIssue: string, accessories?: string): string => {
  const trimmedIssue = cleanIssue.trim();
  const trimmedAcc = accessories ? accessories.trim() : '';
  if (!trimmedAcc) return trimmedIssue;
  return `${trimmedIssue}\n[Accesorios: ${trimmedAcc}]`;
};
