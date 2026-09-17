import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TurnoService, TurnoDto, TurnoInput } from './turno.service';
import { environment } from '../../environments/environment';

describe('TurnoService', () => {
  let service: TurnoService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/turnos`;

  const turno: TurnoDto = {
    id: '1',
    cliente: 'Maria Lopez',
    telefono: '1122334455',
    servicio: 'Corte',
    fecha: '2026-09-17',
    hora: '09:00',
  };

  const input: TurnoInput = {
    cliente: 'Maria Lopez',
    telefono: '1122334455',
    servicio: 'Corte',
    fecha: '2026-09-17',
    hora: '09:00',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TurnoService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TurnoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listar', () => {
    it('devuelve la lista de turnos de la fecha pedida', () => {
      service.listar('2026-09-17').subscribe(res => {
        expect(res.ok).toBe(true);
        if (res.ok) expect(res.datos).toEqual([turno]);
      });

      const req = http.expectOne(r => r.url === baseUrl && r.params.get('fecha') === '2026-09-17');
      expect(req.request.method).toBe('GET');
      req.flush([turno]);
    });

    it('devuelve un error manejable si no puede conectar con el servidor', () => {
      service.listar().subscribe(res => {
        expect(res.ok).toBe(false);
        if (!res.ok) expect(res.error).toBe('No se pudo conectar con el servidor');
      });

      const req = http.expectOne(baseUrl);
      req.error(new ProgressEvent('error'));
    });
  });

  describe('crear', () => {
    it('crea un turno nuevo', () => {
      service.crear(input).subscribe(res => {
        expect(res.ok).toBe(true);
        if (res.ok) expect(res.datos).toEqual(turno);
      });

      const req = http.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(input);
      req.flush(turno, { status: 201, statusText: 'Created' });
    });

    it('devuelve el mensaje de error cuando el horario ya está ocupado', () => {
      service.crear(input).subscribe(res => {
        expect(res.ok).toBe(false);
        if (!res.ok) expect(res.error).toBe('Ya hay un turno a las 09:00');
      });

      const req = http.expectOne(baseUrl);
      req.flush({ error: 'Ya hay un turno a las 09:00' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('editar', () => {
    it('edita un turno existente', () => {
      service.editar('1', input).subscribe(res => {
        expect(res.ok).toBe(true);
        if (res.ok) expect(res.datos).toEqual(turno);
      });

      const req = http.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(turno);
    });

    it('devuelve el mensaje de error cuando el turno no existe', () => {
      service.editar('999', input).subscribe(res => {
        expect(res.ok).toBe(false);
        if (!res.ok) expect(res.error).toBe('Turno no encontrado');
      });

      const req = http.expectOne(`${baseUrl}/999`);
      req.flush({ error: 'Turno no encontrado' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('cancelar', () => {
    it('cancela un turno existente', () => {
      service.cancelar('1').subscribe(res => {
        expect(res.ok).toBe(true);
      });

      const req = http.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });

    it('devuelve el mensaje de error cuando el turno no existe', () => {
      service.cancelar('999').subscribe(res => {
        expect(res.ok).toBe(false);
        if (!res.ok) expect(res.error).toBe('Turno no encontrado');
      });

      const req = http.expectOne(`${baseUrl}/999`);
      req.flush({ error: 'Turno no encontrado' }, { status: 404, statusText: 'Not Found' });
    });
  });
});
