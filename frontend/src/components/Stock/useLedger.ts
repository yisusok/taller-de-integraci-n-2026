import { useCallback, useEffect, useState } from 'react';
import { stockApi } from './api';
import type { StockMovement, TipoMovimiento } from './api';

interface LedgerOptions {
  limit: number;
  tipo?: TipoMovimiento;
  varianteId?: string;
}

interface LedgerSnapshot {
  key: string;
  movements: StockMovement[];
  error: string | null;
}

export function useLedger({ limit, tipo, varianteId }: LedgerOptions) {
  const [version, setVersion] = useState(0);
  const [snapshot, setSnapshot] = useState<LedgerSnapshot>({
    key: '',
    movements: [],
    error: null,
  });

  const key = `${limit}|${tipo ?? ''}|${varianteId ?? ''}|${version}`;

  useEffect(() => {
    let ignore = false;

    stockApi
      .listMovements({ limit, tipo, varianteId })
      .then((movements) => {
        if (!ignore) setSnapshot({ key, movements, error: null });
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setSnapshot({
            key,
            movements: [],
            error: error instanceof Error ? error.message : 'No se pudo cargar el historial.',
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [key, limit, tipo, varianteId]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return {
    movements: snapshot.movements,
    error: snapshot.error,
    loading: snapshot.key !== key,
    reload,
  };
}
