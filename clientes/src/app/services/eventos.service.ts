import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EventoModel } from '../models/evento/evento.component';
import { map } from 'rxjs/operators';
import { Observable, throwError, of, firstValueFrom, BehaviorSubject, forkJoin } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MediacionModel } from '../models/mediacion/mediacion.component';
import { MediacionesService } from 'src/app/services/mediaciones.service';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  //private apiUrl = 'http://192.168.1.36:3000/eventos';
  private apiUrl = `${environment.apiBase}/eventos`;

  private eventosSubject = new BehaviorSubject<EventoModel[]>([]);
  eventos$ = this.eventosSubject.asObservable();

  constructor(
    private http: HttpClient,
    private mediacionesService: MediacionesService,
    private expedientesService: ExpedientesService

  ) {}

getEventos() {
  this.http.get<EventoModel[]>(this.apiUrl).subscribe(
    async (eventos) => {
      const eventosConTodo = await Promise.all(
        eventos.map(async (evento) => {
          // Cargar mediación si tiene
          if (evento.tipo_evento && evento.mediacion_id) {
            try {
              const mediacion = await firstValueFrom(
                this.mediacionesService.getMediacionPorId(evento.mediacion_id)
              );
              (evento as any).mediacion = mediacion;
            } catch (error) {
              console.warn('No se pudo obtener mediación para evento con ID', evento.id);
            }
          }

          // Cargar expediente si tiene
         if (evento.expediente_id) {
  try {
    const expediente = await firstValueFrom(
      this.expedientesService.getExpedientePorId(evento.expediente_id)
    );
    console.log('Expediente cargado:', expediente);

    (evento as any).expediente = expediente;
  } catch (error) {
    console.warn('No se pudo obtener expediente para evento con ID', evento.id);
  }
}


          return evento;
        })
      );

      this.eventosSubject.next(eventosConTodo);
    },
    (error) => {
      console.error('Error al obtener eventos:', error);
    }
  );

  return this.eventos$;
}



addEvento(evento: EventoModel): Observable<any> {
  const url = `${this.apiUrl}/agregar`;
  //console.log('URL de búsqueda:', url);
  //console.log('Datos enviados:', cliente);
  return this.http.post(`${this.apiUrl}/agregar`, evento);
}

editarEvento(evento: EventoModel): Observable<any> {
  const url = `${this.apiUrl}/editar/${evento.id}`;
  return this.http.put(url, evento); // ✅ Clientes incluidos
}


eliminarEvento(id: number): Observable<any> {
  const url = `${this.apiUrl}/eliminar/${id}`;
  return this.http.put(url, { estado: 'eliminado' });
}

getCaratulaPorId(id: number) {
  return this.http.get<{numero?: any, anio?: any, juicio?: string, actor?: string, demandado?: string}>(`/expedientes/caratula/${id}`);
}



}
