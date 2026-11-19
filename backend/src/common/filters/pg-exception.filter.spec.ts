import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { PgExceptionFilter } from './pg-exception.filter';

describe('PgExceptionFilter', () => {
  let filter: PgExceptionFilter;

  const mockHost = (url = '/api/productos') => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url, method: 'POST' }),
      }),
    } as unknown as ArgumentsHost;
    return { host, status, json };
  };

  const makeError = (driverError: {
    code?: string;
    detail?: string;
    message?: string;
  }): QueryFailedError => {
    const err = new QueryFailedError('SQL', [], new Error(driverError.message));
    Object.assign(err, { driverError });
    return err;
  };

  beforeEach(() => {
    filter = new PgExceptionFilter();
  });

  it('mapea 23505 a 409 Conflict', () => {
    const { host, status, json } = mockHost();
    filter.catch(makeError({ code: '23505' }), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409 }),
    );
  });

  it('mapea 23503 referenciado a 409 Conflict y FK faltante a 400 Bad Request', () => {
    const { host: h1, status: s1 } = mockHost();
    filter.catch(
      makeError({
        code: '23503',
        detail:
          'Key (id)=(...) is still referenced from table "stock_movements".',
      }),
      h1,
    );
    expect(s1).toHaveBeenCalledWith(HttpStatus.CONFLICT);

    const { host: h2, status: s2 } = mockHost();
    filter.catch(
      makeError({
        code: '23503',
        detail:
          'Key (categoria_id)=(...) is not present in table "categorias".',
      }),
      h2,
    );
    expect(s2).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('mapea 23514, 22003 y 22P02 a 400 Bad Request', () => {
    for (const code of ['23514', '22003', '22P02']) {
      const { host, status } = mockHost();
      filter.catch(makeError({ code }), host);
      expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    }
  });

  it('mapea P0001 a 403 Forbidden preservando el mensaje del trigger', () => {
    const { host, status, json } = mockHost();
    filter.catch(
      makeError({ code: 'P0001', message: 'Libro mayor inmutable' }),
      host,
    );
    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Libro mayor inmutable' }),
    );
  });

  it('mapea códigos desconocidos a 500 sin exponer SQL crudo', () => {
    const { host, status, json } = mockHost();
    filter.catch(makeError({ code: 'XX000', message: 'internal SQL' }), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Error interno de base de datos.',
      }),
    );
  });
});
