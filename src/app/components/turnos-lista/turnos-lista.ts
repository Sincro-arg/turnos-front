import { Component, ChangeDetectionStrategy, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FechaSeleccionadaService } from '../../services/fecha-seleccionada.service';
import { TurnoService, TurnoDto, TurnoInput, ServicioTurno } from '../../services/turno.service';

@Component({
  selector: 'app-turnos-lista',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './turnos-lista.html',
  styleUrl: './turnos-lista.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurnosLista {
  readonly fechaSvc = inject(FechaSeleccionadaService);
  private readonly turnoSvc = inject(TurnoService);

  readonly servicios: ServicioTurno[] = ['Corte', 'Color', 'Peinado'];

  readonly turnos = signal<TurnoDto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly mostrarForm = signal(false);
  readonly turnoEditando = signal<TurnoDto | null>(null);
  readonly guardando = signal(false);
  readonly errorForm = signal<string | null>(null);
  form: TurnoInput = this.formVacio();

  readonly turnoAConfirmar = signal<TurnoDto | null>(null);
  readonly cancelando = signal(false);

  constructor() {
    effect(() => {
      const fecha = this.fechaSvc.fecha();
      this.cargar(fecha);
    });
  }

  fechaLegible(): string {
    const fecha = this.fechaSvc.fecha();
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const d = new Date(anio, mes - 1, dia);
    const texto = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  private cargar(fecha: string): void {
    this.cargando.set(true);
    this.error.set(null);
    this.turnoSvc.listar(fecha).subscribe(res => {
      this.cargando.set(false);
      if (res.ok) {
        this.turnos.set(res.datos);
      } else {
        this.error.set(res.error);
      }
    });
  }

  reintentar(): void {
    this.cargar(this.fechaSvc.fecha());
  }

  private formVacio(): TurnoInput {
    return { cliente: '', telefono: '', servicio: 'Corte', fecha: this.fechaSvc.fecha(), hora: '' };
  }

  abrirNuevo(): void {
    this.turnoEditando.set(null);
    this.form = this.formVacio();
    this.errorForm.set(null);
    this.mostrarForm.set(true);
  }

  abrirEditar(turno: TurnoDto): void {
    this.turnoEditando.set(turno);
    this.form = {
      cliente: turno.cliente,
      telefono: turno.telefono,
      servicio: turno.servicio,
      fecha: turno.fecha,
      hora: turno.hora,
    };
    this.errorForm.set(null);
    this.mostrarForm.set(true);
  }

  cerrarForm(): void {
    if (this.guardando()) return;
    this.mostrarForm.set(false);
  }

  get formValido(): boolean {
    return !!this.form.cliente.trim() && !!this.form.telefono.trim() && !!this.form.fecha && !!this.form.hora;
  }

  guardar(): void {
    if (!this.formValido || this.guardando()) return;
    this.guardando.set(true);
    this.errorForm.set(null);

    const input: TurnoInput = {
      ...this.form,
      cliente: this.form.cliente.trim(),
      telefono: this.form.telefono.trim(),
    };
    const editando = this.turnoEditando();
    const req = editando ? this.turnoSvc.editar(editando.id, input) : this.turnoSvc.crear(input);

    req.subscribe(res => {
      this.guardando.set(false);
      if (res.ok) {
        this.mostrarForm.set(false);
        this.cargar(this.fechaSvc.fecha());
      } else {
        this.errorForm.set(res.error);
      }
    });
  }

  pedirCancelar(turno: TurnoDto): void {
    this.turnoAConfirmar.set(turno);
  }

  cerrarConfirmacion(): void {
    if (this.cancelando()) return;
    this.turnoAConfirmar.set(null);
  }

  confirmarCancelar(): void {
    const turno = this.turnoAConfirmar();
    if (!turno || this.cancelando()) return;
    this.cancelando.set(true);
    this.turnoSvc.cancelar(turno.id).subscribe(res => {
      this.cancelando.set(false);
      this.turnoAConfirmar.set(null);
      if (res.ok) {
        this.cargar(this.fechaSvc.fecha());
      } else {
        this.error.set(res.error);
      }
    });
  }
}
