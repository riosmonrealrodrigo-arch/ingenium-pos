export const CATEGORY_UUIDS = {
  repuestos: 'c1111111-1111-4111-8111-111111111111',
  accesorios: 'c2222222-2222-4222-8222-222222222222',
  servicios: 'c3333333-3333-4333-8333-333333333333',
} as const;

export const DEFAULT_DB_CATEGORIES = [
  {
    id: CATEGORY_UUIDS.repuestos,
    name: 'Repuestos & Pantallas',
  },
  {
    id: CATEGORY_UUIDS.accesorios,
    name: 'Cargadores & Accesorios',
  },
  {
    id: CATEGORY_UUIDS.servicios,
    name: 'Servicio de Reparación',
  },
];

export const normalizeCategoryId = (cat?: string | null): string | null => {
  if (!cat) return null;
  const s = String(cat).trim().toLowerCase();
  if (s === 'cat-1' || s === 'repuestos' || s === CATEGORY_UUIDS.repuestos) {
    return CATEGORY_UUIDS.repuestos;
  }
  if (s === 'cat-2' || s === 'accesorios' || s === CATEGORY_UUIDS.accesorios) {
    return CATEGORY_UUIDS.accesorios;
  }
  if (s === 'cat-3' || s === 'servicios' || s === CATEGORY_UUIDS.servicios) {
    return CATEGORY_UUIDS.servicios;
  }
  // Si ya es un UUID válido de 36 caracteres con guiones
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cat)) {
    return cat;
  }
  return null;
};

// La selección explícita del usuario (category_id) SIEMPRE tiene prioridad sobre el prefijo del código SKU
export const isRepuesto = (p: { category_id?: string | null; code?: string }): boolean => {
  const cat = normalizeCategoryId(p.category_id);
  if (cat) {
    return cat === CATEGORY_UUIDS.repuestos;
  }
  // Solo como fallback para productos legacy sin categoría en BD:
  const code = (p.code || '').toUpperCase();
  return (
    code.includes('DISP') ||
    code.includes('BAT') ||
    code.includes('FLEX') ||
    code.startsWith('REP-') ||
    code.startsWith('RE-')
  );
};

export const isAccesorio = (p: { category_id?: string | null; code?: string }): boolean => {
  const cat = normalizeCategoryId(p.category_id);
  if (cat) {
    return cat === CATEGORY_UUIDS.accesorios;
  }
  // Solo como fallback para productos legacy sin categoría en BD:
  const code = (p.code || '').toUpperCase();
  return (
    code.includes('CARG') ||
    code.includes('CAB') ||
    code.includes('MICA') ||
    code.startsWith('ACC-') ||
    code.startsWith('VID-') ||
    code.startsWith('AUD-') ||
    code.startsWith('POW-') ||
    code.startsWith('PL-') ||
    code.startsWith('CAR') ||
    code.startsWith('GAR') ||
    code.startsWith('AG-') ||
    code.startsWith('AK-') ||
    code.startsWith('DH-') ||
    code.startsWith('PV-')
  );
};

export const isServicio = (p: { category_id?: string | null; code?: string }): boolean => {
  const cat = normalizeCategoryId(p.category_id);
  if (cat) {
    return cat === CATEGORY_UUIDS.servicios;
  }
  // Solo como fallback para productos legacy sin categoría en BD:
  const code = (p.code || '').toUpperCase();
  return (
    code.includes('SRV') ||
    code.startsWith('MAN-') ||
    code.startsWith('MANT-')
  );
};
