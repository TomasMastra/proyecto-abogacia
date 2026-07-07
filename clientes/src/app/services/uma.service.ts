import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
//import { UmaModel } from 'src/app/models/uma/uma.component';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { UmaModel } from '../models/uma/uma.component';


@Injectable({
  providedIn: 'root'
})
export class UmaService {

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  //private apiUrl = 'http://localhost:3000/localidades';  
    private url = `${environment.apiBase}/uma`;

  private umaSubject = new BehaviorSubject<any[]>([]); 
  uma$ = this.umaSubject.asObservable();  

  constructor(private http: HttpClient) {}

  getUMA() {
    this.http.get<any[]>(this.url).subscribe(
      (uma) => {
        this.umaSubject.next(uma); 
      },
      (error) => {
        console.error('Error al obtener uma:', error);
      }
    );
    return this.uma$;  
  }

    addUMA(uma: Partial<UmaModel>): Observable<UmaModel> {
    return this.http.post<UmaModel>(this.url, uma);
    }
  
    actualizarUMA(id: number | string, uma: Partial<UmaModel>): Observable<UmaModel> {
      return this.http.put<UmaModel>(`${this.url}/${id}`, uma);
    }
  
    eliminarUMA(id: number | string): Observable<void> {
      return this.http.delete<void>(`${this.url}/${id}`);
    }

}
