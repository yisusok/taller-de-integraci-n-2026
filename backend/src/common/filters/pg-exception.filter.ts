import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

interface PgDriverError {
  code?: string;
  detail?: string;
  message?: string;
}

@Catch(QueryFailedError)
export class PgExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PgExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const driverError = (exception.driverError ?? {}) as PgDriverError;
    const { status, message } = this.mapDriverError(driverError, request);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapDriverError(
    driverError: PgDriverError,
    request: Request,
  ): { status: HttpStatus; message: string } {
    switch (driverError.code) {
      case '23505':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Ya existe un registro con ese valor único.',
        };
      case '23503': {
        const detail = driverError.detail ?? '';
        if (
          detail.includes('is still referenced') ||
          detail.includes('todavía es referida')
        ) {
          return {
            status: HttpStatus.CONFLICT,
            message:
              'No se puede eliminar el registro porque está referenciado por otros datos.',
          };
        }
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Referencia inválida: el registro relacionado no existe.',
        };
      }
      case '23514':
        return {
          status: HttpStatus.BAD_REQUEST,
          message:
            'Los datos incumplen una restricción de integridad de la base de datos.',
        };
      case '22003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Uno de los valores numéricos supera el rango permitido.',
        };
      case '22P02':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Formato de dato inválido en la solicitud.',
        };
      case 'P0001':
        return {
          status: HttpStatus.FORBIDDEN,
          message:
            driverError.message ||
            'Operación prohibida por regla de integridad en base de datos.',
        };
      default:
        this.logger.error(
          `Error PostgreSQL no manejado en ${request.method} ${request.url} (code=${driverError.code ?? 'desconocido'}): ${driverError.message ?? 'sin detalle'}`,
        );
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Error interno de base de datos.',
        };
    }
  }
}
