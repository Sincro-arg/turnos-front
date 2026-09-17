import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FechaSeleccionadaService } from '../../services/fecha-seleccionada.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly fechaSvc = inject(FechaSeleccionadaService);

  onFechaChange(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    if (valor) {
      this.fechaSvc.cambiar(valor);
    }
  }
}
