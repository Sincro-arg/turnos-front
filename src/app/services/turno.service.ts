import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export type ServicioTurno = 'Corte' | 'Color' | 'Peinado';

export interface TurnoDto {
  id: string;
  cliente: string;
  telefono: string;
  servicio: ServicioTurno;
  fecha: string;
  hora: string;
}

export interface TurnoInput {
  cliente: string;
  telefono: string;
  servicio: ServicioTurno;
  fecha: string;
  hora: string;
}

/** Resultado manejable: nunca se propaga una excepción sin capturar,
 *  la pantalla decide qué mostrar leyendo "ok". */
export type ResultadoTurno<T> =
  | { ok: true; datos: T }
  | { ok: false; error: string };

const ERROR_CONEXION = 'No se pudo conectar con el servidor';
const ERROR_INESPERADO = 'Ocurrió un error inesperado';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/turnos`;

  listar(fecha?: string): Observable<ResultadoTurno<TurnoDto[]>> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<TurnoDto[]>(this.baseUrl, { params }).pipe(
      map(datos => ({ ok: true, datos }) as ResultadoTurno<TurnoDto[]>),
      catchError(err => this.manejarError<TurnoDto[]>(err)),
    );
  }

  crear(input: TurnoInput): Observable<ResultadoTurno<TurnoDto>> {
    return this.http.post<TurnoDto>(this.baseUrl, input).pipe(
      map(datos => ({ ok: true, datos }) as ResultadoTurno<TurnoDto>),
      catchError(err => this.manejarError<TurnoDto>(err)),
    );
  }

  editar(id: string, input: TurnoInput): Observable<ResultadoTurno<TurnoDto>> {
    return this.http.put<TurnoDto>(`${this.baseUrl}/${id}`, input).pipe(
      map(datos => ({ ok: true, datos }) as ResultadoTurno<TurnoDto>),
      catchError(err => this.manejarError<TurnoDto>(err)),
    );
  }

  cancelar(id: string): Observable<ResultadoTurno<void>> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      map(() => ({ ok: true, datos: undefined }) as ResultadoTurno<void>),
      catchError(err => this.manejarError<void>(err)),
    );
  }

  private manejarError<T>(err: HttpErrorResponse): Observable<ResultadoTurno<T>> {
    if (err.status === 0) {
      return of({ ok: false, error: ERROR_CONEXION });
    }
    const cuerpo = err.error;
    const mensaje = cuerpo && typeof cuerpo === 'object' && 'error' in cuerpo
      ? String((cuerpo as { error: unknown }).error)
      : ERROR_INESPERADO;
    return of({ ok: false, error: mensaje });
  }
}
