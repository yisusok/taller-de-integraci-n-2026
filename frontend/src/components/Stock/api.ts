export type TipoMovimiento = 'INGRESO_PROVEEDOR' | 'VENTA' | 'EXTRACCION_MANUAL';

export const MOVEMENT_LABELS: Record<TipoMovimiento, string> = {
  INGRESO_PROVEEDOR: 'Ingreso de proveedor',
  VENTA: 'Venta',
  EXTRACCION_MANUAL: 'Extracción manual',
};

export interface StockSummary {
  variante_id: string;
  existencias_actuales: number;
  total_ingresos: number;
  total_ventas: number;
  total_extracciones_manuales: number;
}

export type NivelAlertaStock = 'agotado' | 'critico' | 'bajo';

export interface LowStockAlert {
  variante_id: string;
  producto_id?: string;
  producto_nombre?: string;
  producto_sku?: string;
  talle?: string;
  color?: string;
  sku_variante?: string;
  existencias_actuales: number;
  total_ingresos: number;
  total_salidas: number;
  umbral: number;
  nivel: NivelAlertaStock;
}

export interface LowStockAlertsResponse {
  umbral: number;
  total_alertas: number;
  alertas: LowStockAlert[];
}

export interface StockMovement {
  id: string;
  variante_id: string;
  tipo_movimiento: TipoMovimiento;
  cantidad: number;
  motivo: string;
  usuario_id: string | null;
  created_at: string;
}

export interface MovementQuery {
  limit?: number;
  offset?: number;
  tipo?: TipoMovimiento;
  varianteId?: string;
}

export interface ManualExtractionInput {
  variante_id: string;
  cantidad: number;
  motivo: string;
}

export const MOTIVO_MIN_LENGTH = 5;

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuidV4 = (value: string): boolean => UUID_V4.test(value.trim());

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const resolveBaseUrl = (): string => {
  const raw =
    (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
    'http://localhost:3000/api';
  const base = raw.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
};

const BASE_URL = resolveBaseUrl();

const fallbackMessage = (status: number): string => {
  if (status === 401) {
    return 'Tu sesión no es válida o expiró. Iniciá sesión nuevamente.';
  }
  if (status === 403) {
    return 'Tu cuenta no tiene permisos de administrador para esta operación.';
  }
  return `El servidor respondió con un error inesperado (HTTP ${status}).`;
};

const messageFromPayload = (payload: unknown): string | null => {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const raw = (payload as { message?: unknown }).message;
    if (Array.isArray(raw)) {
      return raw.join('. ');
    }
    if (typeof raw === 'string' && raw.trim().length > 0) {
      return raw;
    }
  }
  return null;
};

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token');

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verificá que el backend esté activo.');
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      response.status === 401 || response.status === 403
        ? fallbackMessage(response.status)
        : (messageFromPayload(payload) ?? fallbackMessage(response.status));
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

export const stockApi = {
  listMovements({ limit, offset, tipo, varianteId }: MovementQuery = {}) {
    const params = new URLSearchParams();
    if (limit !== undefined) params.set('limit', String(limit));
    if (offset !== undefined) params.set('offset', String(offset));
    if (tipo) params.set('tipo_movimiento', tipo);
    if (varianteId) params.set('variante_id', varianteId);
    const query = params.toString();
    return request<StockMovement[]>(`/stock/movimientos${query ? `?${query}` : ''}`);
  },

  getSummary(varianteId: string) {
    return request<StockSummary>(`/stock/variantes/${varianteId}`);
  },

  registerManualExtraction(input: ManualExtractionInput) {
    return request<StockMovement>('/stock/extracciones-manuales', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  registerSupplierEntry(input: { variante_id: string; cantidad: number; motivo: string }) {
    return request<StockMovement>('/stock/movimientos', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        tipo_movimiento: 'INGRESO_PROVEEDOR',
      }),
    });
  },

  getAlerts(umbral?: number) {
    const params = new URLSearchParams();
    if (umbral !== undefined) params.set('umbral', String(umbral));
    const query = params.toString();
    return request<LowStockAlertsResponse>(`/stock/alertas${query ? `?${query}` : ''}`);
  },
};
