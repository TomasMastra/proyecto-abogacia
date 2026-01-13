import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin  } from 'rxjs';
import { DemandadoModel } from '../models/demandado/demandado.component';
import { map } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DemandadosService {
  //private apiUrl = 'http://localhost:3000/demandados';  
  //private apiUrl = 'http://192.168.1.36:3000/demandados';
  private apiUrl = `${environment.apiBase}/demandados`;

  private demandadosSubject = new BehaviorSubject<DemandadoModel[]>([]); // Emite un arreglo vacío inicialmente
  demandados$ = this.demandadosSubject.asObservable();  // Expone el observable de clientes

  constructor(private http: HttpClient) {}

  getDemandados() {
    this.http.get<DemandadoModel[]>(this.apiUrl).subscribe(
      (demandados) => {
        this.demandadosSubject.next(demandados); // Actualiza los datos emitidos por el BehaviorSubject
      },
      (error) => {
        console.error('Error al obtener demandados:', error);
      }
    );
    return this.demandados$;  // Devuelve el observable para que el componente se suscriba
  }

    getOficiados() {
    this.http.get<DemandadoModel[]>(`${this.apiUrl}/oficiados`,).subscribe(
      (demandados) => {
        this.demandadosSubject.next(demandados); // Actualiza los datos emitidos por el BehaviorSubject
      },
      (error) => {
        console.error('Error al obtener demandados:', error);
      }
    );
    return this.demandados$;  // Devuelve el observable para que el componente se suscriba
  }


getDemandadoPorId(id: number) {
  if (id === null || id === undefined || id <= 0) {
    console.error("ID de demandado inválido:", id);
    return of(null); // RxJS: devolvemos un observable vacío en vez de hacer la request
  }

  return this.http.get<DemandadoModel>(`${this.apiUrl}/${id}`).pipe(
    catchError(err => {
      console.error("Error al obtener el demandado con id", id, err);
      return of(null);
    })
  );
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
  }

/*
  actualizarExpediente(id: string, expediente: ExpedienteModel): Observable<ExpedienteModel> {
    const url = `${this.apiUrl}/modificar/${id}`;   
      return this.http.put<ExpedienteModel>(url, expediente);
    }
*/

  searchDemandados(texto: string): Observable<DemandadoModel[]> {
    const textoLower = texto.toLowerCase();
    const url = `${this.apiUrl}/buscar?texto=${textoLower}`;
  
    //console.log('URL de búsqueda:', url);
  
    return this.http.get<DemandadoModel[]>(url).pipe(
      tap(response => {
        console.log('Respuesta de la API:', response);  
      }),
      catchError(error => {
        console.error('Error al buscar demandados', error);
        return of([]);  
      })
    );
  }
}
