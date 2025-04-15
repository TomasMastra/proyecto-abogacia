import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin  } from 'rxjs';
import { EventoModel } from '../models/evento/evento.component';
import { map } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  private apiUrl = 'http://localhost:3000/eventos';  
  private eventosSubject = new BehaviorSubject<EventoModel[]>([]);
  eventos$ = this.eventosSubject.asObservable();

  constructor(private http: HttpClient) {}

  getEventos() {
    this.http.get<EventoModel[]>(this.apiUrl).subscribe(
      (eventos) => {
        this.eventosSubject.next(eventos);
      },
      (error) => {
        console.error('Error al obtener eventos:', error);
      }
    );
    return this.eventos$;
  }


/*
    getDemandadoPorId(id: number) {
      return this.http.get<DemandadoModel>(`${this.apiUrl}/${id}`);
    }


    actualizarDemandado(id: string, demandado: DemandadoModel): Observable<DemandadoModel> {
    const url = `${this.apiUrl}/modificar/${id}`;
      return this.http.put<DemandadoModel>(url, demandado);
    }
   

  
  addDemandado(demandado: DemandadoModel): Observable<any> {
    const url = `${this.apiUrl}/agregar`;
    console.log('URL de búsqueda:', url);
    console.log('Datos enviados:', demandado);
    return this.http.post(`${this.apiUrl}/agregar`, demandado);
  }*/

/*
  actualizarExpediente(id: string, expediente: ExpedienteModel): Observable<ExpedienteModel> {
    const url = `${this.apiUrl}/modificar/${id}`;   
      return this.http.put<ExpedienteModel>(url, expediente);
    }
*/


}
