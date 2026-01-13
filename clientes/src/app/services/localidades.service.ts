import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LocalidadModel } from 'src/app/models/localidad/localidad.component';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class LocalidadesService {

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  //private apiUrl = 'http://localhost:3000/localidades';  
    private apiUrl = `${environment.apiBase}/localidades`;

  private localidadesSubject = new BehaviorSubject<LocalidadModel[]>([]); 
  localidades$ = this.localidadesSubject.asObservable();  

  constructor(private http: HttpClient) {}

  getLocalidades() {
    this.http.get<LocalidadModel[]>(this.apiUrl).subscribe(
      (localidad) => {
        this.localidadesSubject.next(localidad); 
      },
      (error) => {
        console.error('Error al obtener localidades:', error);
      }
    );
    return this.localidades$;  
  }

  getPartidos() {
    this.http.get<any[]>(`${this.apiUrl}/partidos`).subscribe(
      (partido) => {
        this.localidadesSubject.next(partido); 
      },
      (error) => {
        console.error('Error al obtener partidos:', error);
      }
    );
    return this.localidades$;  
  }

  // NO ESTA EN EL SERVER
  getClientePorId(id: string) {
    return this.http.get<LocalidadModel>(`${this.apiUrl}/${id}`);
  }

  addLocalidad(localidad: LocalidadModel): Observable<any> {
    const url = `${this.apiUrl}/agregar`;
    return this.http.post(`${this.apiUrl}/agregar`, localidad);
  }
      
  /*
  actualizarCliente(id: string, cliente: ClienteModel): Observable<ClienteModel> {
  const url = `${this.apiUrl}/modificar/${id}`;
    return this.http.put<ClienteModel>(url, cliente);
  }

  searchClientes(texto: string): Observable<ClienteModel[]> {
    const textoLower = texto.toLowerCase();
    const url = `${this.apiUrl}/buscar?texto=${textoLower}`;
  
    return this.http.get<ClienteModel[]>(url).pipe(
      tap(response => {
        console.log('Respuesta de la API:', response);  
      }),
      catchError(error => {
        console.error('Error al buscar clientes', error);
        return of([]);  
      })
    );
  }

*/

    actualizarLocalidad(id: string, localidad: LocalidadModel): Observable<LocalidadModel> {
    const url = `${this.apiUrl}/modificar/${id}`;
      return this.http.put<LocalidadModel>(url, localidad);
    }
  
}
