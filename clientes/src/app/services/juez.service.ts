import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { JuezModel } from 'src/app/models/juez/juez.component';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class JuezService {

    private httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
    };
  
    private apiUrl = 'http://localhost:3000/juez';  
    private juezSubject = new BehaviorSubject<JuezModel[]>([]); 
    juez$ = this.juezSubject.asObservable();  
  
    constructor(private http: HttpClient) {}
  
    getJuez() {
      this.http.get<JuezModel[]>(this.apiUrl).subscribe(
        (juez) => {
          this.juezSubject.next(juez); 
        },
        (error) => {
          console.error('Error al obtener jueces:', error);
        }
      );
      return this.juez$;  
    }

      addJuez(juez: JuezModel): Observable<any> {
        const url = `${this.apiUrl}/agregar`;
        return this.http.post(`${this.apiUrl}/agregar`, juez);
      }

        actualizarJuez(id: string, juez: JuezModel): Observable<JuezModel> {
        const url = `${this.apiUrl}/modificar/${id}`;
          return this.http.put<JuezModel>(url, juez);
        }

        getExpedientesPorJuez(juez_id: string) {
          return this.http.get<any[]>(`http://localhost:3000/expedientes/jueces?id=${juez_id}`);
        }
}
