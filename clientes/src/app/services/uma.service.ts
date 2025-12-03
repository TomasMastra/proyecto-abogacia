import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
//import { UmaModel } from 'src/app/models/uma/uma.component';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';


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
    private apiUrl = `${environment.apiBase}/uma`;

  private umaSubject = new BehaviorSubject<any[]>([]); 
  uma$ = this.umaSubject.asObservable();  

  constructor(private http: HttpClient) {}

  getUMA() {
    this.http.get<any[]>(this.apiUrl).subscribe(
      (uma) => {
        this.umaSubject.next(uma); 
      },
      (error) => {
        console.error('Error al obtener uma:', error);
      }
    );
    return this.uma$;  
  }

}
