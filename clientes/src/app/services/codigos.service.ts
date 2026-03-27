import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { CodigoModel } from 'src/app/models/codigo/codigo.component'; // <-- asegurate que apunte a un .model.ts
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CodigosService {

  //private apiUrl = 'http://192.168.1.36:3000/codigos';
  private apiUrl = `${environment.apiBase}/codigos`;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  private codigosSubject = new BehaviorSubject<CodigoModel[]>([]);
  codigos$ = this.codigosSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** GET con soporte de búsqueda/paginación del backend */

  getCodigos() {
    return this.http.get<CodigoModel[]>(this.apiUrl);
  }

  /** POST: crear */
  addCodigo(codigo: CodigoModel): Observable<CodigoModel> {
    return this.http.post<CodigoModel>(this.apiUrl, codigo, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  eliminarCodigo(id: string) {
  return this.http.delete<{detachedCount:number}>(`${this.apiUrl}/${id}`);
}

  /** PUT: actualizar por id */
  actualizarCodigo(id: number | string, cambios: Partial<CodigoModel>): Observable<CodigoModel> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<CodigoModel>(url, cambios, this.httpOptions).pipe(
      tap((updated) => {
        // actualizo el subject en memoria para reflejar el cambio sin re-fetch completo
        const curr = this.codigosSubject.value;
        const idx = curr.findIndex(x => String((x as any).id) === String(id));
        if (idx >= 0) {
          const nuevo = [...curr];
          nuevo[idx] = { ...curr[idx], ...updated };
          this.codigosSubject.next(nuevo);
        }
      }),
      catchError(this.handleError)
    );
  }

  /** Helper de errores */
  private handleError(err: any) {
    console.error('codigosService error:', err);
    return throwError(() => err);
  }
}
