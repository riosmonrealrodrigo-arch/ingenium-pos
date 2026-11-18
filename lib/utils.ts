import { RepairEvidence, ProductSpec, ProductReview } from '@/types';

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

// Extrae el diagnóstico limpio y la bitácora de evidencias fotográficas guardadas
export const extractDiagnosisAndEvidence = (
  diagText?: string
): { cleanDiagnosis: string; evidence: RepairEvidence[] } => {
  if (!diagText) return { cleanDiagnosis: '', evidence: [] };

  const match = diagText.match(/\[Evidencias:\s*([\s\S]*?)\]\s*$/i);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const clean = diagText.replace(/\[Evidencias:\s*[\s\S]*?\]\s*$/i, '').trim();
      return {
        cleanDiagnosis: clean,
        evidence: Array.isArray(parsed) ? parsed : [],
      };
    } catch {
      // Si falla el parseo JSON, continuar sin romper
    }
  }

  return { cleanDiagnosis: diagText, evidence: [] };
};

// Formatea el diagnóstico técnico adjuntando la lista de evidencias en JSON estructurado
export const formatDiagnosisWithEvidence = (
  cleanDiagnosis: string,
  evidence: RepairEvidence[]
): string => {
  const trimmedDiag = (cleanDiagnosis || '').trim();
  if (!evidence || evidence.length === 0) return trimmedDiag;
  const json = JSON.stringify(evidence);
  return trimmedDiag ? `${trimmedDiag}\n[Evidencias: ${json}]` : `[Evidencias: ${json}]`;
};

// Comprime una imagen tomada por cámara o subida de archivo para optimizar peso (HTML5 Canvas)
export const compressImage = (
  file: File,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.72
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window no disponible'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = ev => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(img.src);
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Usar image/jpeg para máxima compatibilidad
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
  });
};

// Extrae descripción limpia, galería adicional de imágenes, ficha técnica (especificaciones) y opiniones de un producto/servicio
export const extractProductMetadata = (
  description?: string | null,
  primaryImage?: string | null
): { cleanDescription: string; gallery: string[]; specs: ProductSpec[]; reviews: ProductReview[] } => {
  const raw = description || '';
  const primary = (primaryImage || '').trim();
  let cleanDescription = raw;
  let extraImages: string[] = [];
  let specs: ProductSpec[] = [];
  let reviews: ProductReview[] = [];

  const match = raw.match(/\[MetaProducto:\s*([\s\S]*?)\]\s*$/i);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      cleanDescription = raw.replace(/\[MetaProducto:\s*[\s\S]*?\]\s*$/i, '').trim();
      if (Array.isArray(parsed?.gallery)) {
        extraImages = parsed.gallery.filter((x: unknown): x is string => typeof x === 'string' && x.trim().length > 0);
      }
      if (Array.isArray(parsed?.specs)) {
        specs = parsed.specs
          .filter((s: any) => s && typeof s.label === 'string' && typeof s.value === 'string')
          .map((s: any) => ({ label: s.label.trim(), value: s.value.trim() }))
          .filter((s: ProductSpec) => s.label.length > 0 && s.value.length > 0);
      }
      if (Array.isArray(parsed?.reviews)) {
        reviews = parsed.reviews.filter((r: any) => r && typeof r.id === 'string' && typeof r.rating === 'number');
      }
    } catch {
      // Si falla el parseo JSON, conservar texto sin romper
    }
  }

  // Combinar imagen principal + galería adicional sin duplicados
  const gallery: string[] = [];
  if (primary) gallery.push(primary);
  for (const img of extraImages) {
    const trimmed = img.trim();
    if (trimmed && !gallery.includes(trimmed)) {
      gallery.push(trimmed);
    }
  }

  return { cleanDescription, gallery, specs, reviews };
};

// Serializa descripción interna junto con galería adicional, características estructuradas y opiniones de clientes
export const formatDescriptionWithMetadata = (
  cleanDescription: string,
  gallery: string[],
  specs: ProductSpec[],
  reviews?: ProductReview[]
): string => {
  const trimmedDesc = (cleanDescription || '').trim();
  const validGallery = (gallery || []).map(g => g.trim()).filter(Boolean);
  // Guardar desde la segunda imagen en adelante en metadata (la primera va en image_url)
  const extraGallery = validGallery.slice(1);
  const validSpecs = (specs || [])
    .map(s => ({ label: s.label.trim(), value: s.value.trim() }))
    .filter(s => s.label.length > 0 && s.value.length > 0);
  const validReviews = (reviews || []).filter(r => r && typeof r.id === 'string');

  if (extraGallery.length === 0 && validSpecs.length === 0 && validReviews.length === 0) {
    return trimmedDesc;
  }

  const payload: { gallery?: string[]; specs?: ProductSpec[]; reviews?: ProductReview[] } = {};
  if (extraGallery.length > 0) payload.gallery = extraGallery;
  if (validSpecs.length > 0) payload.specs = validSpecs;
  if (validReviews.length > 0) payload.reviews = validReviews;

  const metaTag = `[MetaProducto: ${JSON.stringify(payload)}]`;
  return trimmedDesc ? `${trimmedDesc}\n${metaTag}` : metaTag;
};
