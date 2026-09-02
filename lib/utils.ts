export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const formatCurrency = (amount: number, currency = 'Q'): string =>
  `${currency} ${amount.toFixed(2)}`;

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });

export const todayISO = (): string => new Date().toISOString().split('T')[0];

export const isSameDay = (iso: string, day: string): boolean => iso.startsWith(day);

export const generateTicket = (id: string): string => '#' + id.slice(-6).toUpperCase();

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
