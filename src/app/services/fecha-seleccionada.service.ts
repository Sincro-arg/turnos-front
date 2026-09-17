import { Injectable, signal } from '@angular/core';

function hoyIso(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/** Fecha que filtra la pantalla principal. El header la muestra y permite
 *  cambiarla; arranca en la fecha de hoy. */
@Injectable({ providedIn: 'root' })
export class FechaSeleccionadaService {
  private readonly _fecha = signal(hoyIso());
  readonly fecha = this._fecha.asReadonly();

  cambiar(fecha: string): void {
    this._fecha.set(fecha);
  }
}
