import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TurnosLista } from './turnos-lista';
import { TurnoService, TurnoDto } from '../../services/turno.service';
import { FechaSeleccionadaService } from '../../services/fecha-seleccionada.service';

describe('TurnosLista', () => {
  const turno: TurnoDto = {
    id: '1',
    cliente: 'Maria Lopez',
    telefono: '1122334455',
    servicio: 'Corte',
    fecha: '2026-09-17',
    hora: '09:00',
  };

  function crearComponente(listarResultado: ReturnType<TurnoService['listar']>) {
    const turnoSvcMock = { listar: () => listarResultado } as unknown as TurnoService;
    TestBed.configureTestingModule({
      providers: [
        { provide: TurnoService, useValue: turnoSvcMock },
        FechaSeleccionadaService,
      ],
    });
    const fixture = TestBed.createComponent(TurnosLista);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra el estado vacío cuando no hay turnos', () => {
    const fixture = crearComponente(of({ ok: true, datos: [] }));
    const componente = fixture.componentInstance;
    expect(componente.cargando()).toBe(false);
    expect(componente.error()).toBeNull();
    expect(componente.turnos()).toEqual([]);
  });

  it('carga los turnos de la fecha seleccionada', () => {
    const fixture = crearComponente(of({ ok: true, datos: [turno] }));
    const componente = fixture.componentInstance;
    expect(componente.turnos()).toEqual([turno]);
  });

  it('muestra el mensaje de error si falla la conexión', () => {
    const fixture = crearComponente(of({ ok: false, error: 'No se pudo conectar con el servidor' }));
    const componente = fixture.componentInstance;
    expect(componente.error()).toBe('No se pudo conectar con el servidor');
    expect(componente.turnos()).toEqual([]);
  });

  it('pide confirmación antes de cancelar un turno', () => {
    const fixture = crearComponente(of({ ok: true, datos: [turno] }));
    const componente = fixture.componentInstance;
    expect(componente.turnoAConfirmar()).toBeNull();
    componente.pedirCancelar(turno);
    expect(componente.turnoAConfirmar()).toEqual(turno);
  });
});
