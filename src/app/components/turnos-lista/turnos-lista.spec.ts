import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TurnosLista } from './turnos-lista';
import { TurnoService, TurnoDto, ResultadoTurno } from '../../services/turno.service';
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

  interface MockOpciones {
    listar?: ResultadoTurno<TurnoDto[]>;
    crear?: ResultadoTurno<TurnoDto>;
    editar?: ResultadoTurno<TurnoDto>;
    cancelar?: ResultadoTurno<void>;
  }

  function crearMockSvc(opciones: MockOpciones = {}) {
    return {
      listar: jasmine.createSpy('listar').and.returnValue(of(opciones.listar ?? { ok: true, datos: [] })),
      crear: jasmine.createSpy('crear').and.returnValue(of(opciones.crear ?? { ok: true, datos: turno })),
      editar: jasmine.createSpy('editar').and.returnValue(of(opciones.editar ?? { ok: true, datos: turno })),
      cancelar: jasmine.createSpy('cancelar').and.returnValue(of(opciones.cancelar ?? { ok: true, datos: undefined })),
    } as unknown as TurnoService;
  }

  function crearComponente(mockSvc: TurnoService) {
    TestBed.configureTestingModule({
      providers: [
        { provide: TurnoService, useValue: mockSvc },
        FechaSeleccionadaService,
      ],
    });
    const fixture = TestBed.createComponent(TurnosLista);
    fixture.detectChanges();
    return fixture;
  }

  const formValido = { cliente: 'Juan Perez', telefono: '1122334455', servicio: 'Corte' as const, fecha: '2026-09-17', hora: '10:00' };

  it('muestra el estado vacío cuando no hay turnos', () => {
    const fixture = crearComponente(crearMockSvc({ listar: { ok: true, datos: [] } }));
    const componente = fixture.componentInstance;
    expect(componente.cargando()).toBe(false);
    expect(componente.error()).toBeNull();
    expect(componente.turnos()).toEqual([]);
  });

  it('carga los turnos de la fecha seleccionada', () => {
    const fixture = crearComponente(crearMockSvc({ listar: { ok: true, datos: [turno] } }));
    const componente = fixture.componentInstance;
    expect(componente.turnos()).toEqual([turno]);
  });

  it('muestra el mensaje de error si falla la conexión', () => {
    const fixture = crearComponente(crearMockSvc({ listar: { ok: false, error: 'No se pudo conectar con el servidor' } }));
    const componente = fixture.componentInstance;
    expect(componente.error()).toBe('No se pudo conectar con el servidor');
    expect(componente.turnos()).toEqual([]);
  });

  it('pide confirmación antes de cancelar un turno', () => {
    const fixture = crearComponente(crearMockSvc({ listar: { ok: true, datos: [turno] } }));
    const componente = fixture.componentInstance;
    expect(componente.turnoAConfirmar()).toBeNull();
    componente.pedirCancelar(turno);
    expect(componente.turnoAConfirmar()).toEqual(turno);
  });

  describe('guardar()', () => {
    it('crea un turno nuevo cuando no hay turno en edición (camino feliz)', () => {
      const mockSvc = crearMockSvc({ crear: { ok: true, datos: turno } });
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.abrirNuevo();
      componente.form = { ...formValido };
      componente.guardar();

      expect(mockSvc.crear).toHaveBeenCalledWith(formValido);
      expect(mockSvc.editar).not.toHaveBeenCalled();
      expect(componente.guardando()).toBe(false);
      expect(componente.errorForm()).toBeNull();
      expect(componente.toast()).toBe('Turno creado');
      expect(componente.cerrandoForm()).toBe(true);
    });

    it('muestra el error del servidor si falla la creación', () => {
      const mockSvc = crearMockSvc({ crear: { ok: false, error: 'Ya hay un turno a las 10:00' } });
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.abrirNuevo();
      componente.form = { ...formValido };
      componente.guardar();

      expect(componente.errorForm()).toBe('Ya hay un turno a las 10:00');
      expect(componente.guardando()).toBe(false);
      expect(componente.mostrarForm()).toBe(true);
      expect(componente.toast()).toBeNull();
    });

    it('edita el turno seleccionado cuando hay uno en edición (camino feliz)', () => {
      const editado: TurnoDto = { ...turno, cliente: 'Juan Perez' };
      const mockSvc = crearMockSvc({ editar: { ok: true, datos: editado } });
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.abrirEditar(turno);
      componente.form = { ...formValido };
      componente.guardar();

      expect(mockSvc.editar).toHaveBeenCalledWith(turno.id, formValido);
      expect(mockSvc.crear).not.toHaveBeenCalled();
      expect(componente.toast()).toBe('Turno actualizado');
      expect(componente.errorForm()).toBeNull();
    });

    it('muestra el error del servidor si falla la edición', () => {
      const mockSvc = crearMockSvc({ editar: { ok: false, error: 'Turno no encontrado' } });
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.abrirEditar(turno);
      componente.form = { ...formValido };
      componente.guardar();

      expect(componente.errorForm()).toBe('Turno no encontrado');
      expect(componente.mostrarForm()).toBe(true);
    });

    it('no llama al servicio si el formulario es inválido', () => {
      const mockSvc = crearMockSvc();
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.abrirNuevo();
      componente.form = { cliente: '', telefono: '', servicio: 'Corte', fecha: '', hora: '' };
      componente.guardar();

      expect(mockSvc.crear).not.toHaveBeenCalled();
      expect(componente.intentoEnviar()).toBe(true);
    });
  });

  describe('confirmarCancelar()', () => {
    it('cancela el turno confirmado (camino feliz)', () => {
      const mockSvc = crearMockSvc({ listar: { ok: true, datos: [turno] }, cancelar: { ok: true, datos: undefined } });
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.pedirCancelar(turno);
      componente.confirmarCancelar();

      expect(mockSvc.cancelar).toHaveBeenCalledWith(turno.id);
      expect(componente.turnoAConfirmar()).toBeNull();
      expect(componente.cancelando()).toBe(false);
      expect(componente.error()).toBeNull();
    });

    it('muestra el error si falla la cancelación', () => {
      const mockSvc = crearMockSvc({ cancelar: { ok: false, error: 'Turno no encontrado' } });
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.pedirCancelar(turno);
      componente.confirmarCancelar();

      expect(componente.error()).toBe('Turno no encontrado');
      expect(componente.turnoAConfirmar()).toBeNull();
      expect(componente.cancelando()).toBe(false);
    });

    it('no hace nada si no hay turno para confirmar', () => {
      const mockSvc = crearMockSvc();
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.confirmarCancelar();

      expect(mockSvc.cancelar).not.toHaveBeenCalled();
    });
  });

  describe('validaciones del formulario', () => {
    it('no muestra errores antes de intentar enviar', () => {
      const fixture = crearComponente(crearMockSvc());
      const componente = fixture.componentInstance;

      componente.form = { cliente: '', telefono: '', servicio: 'Corte', fecha: '', hora: '' };

      expect(componente.errorCliente).toBeNull();
      expect(componente.errorTelefono).toBeNull();
      expect(componente.errorFecha).toBeNull();
      expect(componente.errorHora).toBeNull();
    });

    it('muestra los errores de cada campo vacío tras intentar enviar', () => {
      const fixture = crearComponente(crearMockSvc());
      const componente = fixture.componentInstance;

      componente.form = { cliente: '', telefono: '', servicio: 'Corte', fecha: '', hora: '' };
      componente.guardar();

      expect(componente.errorCliente).toBe('Ingresá el nombre del cliente');
      expect(componente.errorTelefono).toBe('Ingresá un teléfono');
      expect(componente.errorFecha).toBe('Elegí una fecha');
      expect(componente.errorHora).toBe('Elegí un horario');
      expect(componente.formValido).toBe(false);
    });

    it('rechaza un teléfono con menos de 8 dígitos', () => {
      const fixture = crearComponente(crearMockSvc());
      const componente = fixture.componentInstance;

      componente.form = { ...formValido, telefono: '123456' };
      componente.guardar();

      expect(componente.errorTelefono).toBe('El teléfono debe tener al menos 8 dígitos');
      expect(componente.formValido).toBe(false);
    });

    it('no muestra errores y formValido es true cuando todos los campos son válidos', () => {
      const mockSvc = crearMockSvc();
      const fixture = crearComponente(mockSvc);
      const componente = fixture.componentInstance;

      componente.form = { cliente: '', telefono: '', servicio: 'Corte', fecha: '', hora: '' };
      componente.guardar();
      componente.form = { ...formValido };

      expect(componente.errorCliente).toBeNull();
      expect(componente.errorTelefono).toBeNull();
      expect(componente.errorFecha).toBeNull();
      expect(componente.errorHora).toBeNull();
      expect(componente.formValido).toBe(true);
    });
  });
});
