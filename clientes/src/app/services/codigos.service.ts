import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { CodigoModel } from 'src/app/models/codigo/codigo.component'; // <-- asegurate que apunte a un .model.ts

@Injectable({ providedIn: 'root' })
export class CodigosService {

  private apiUrl = 'http://192.168.1.36:3000/codigos';

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
  getCodigos(params?: { q?: string; tipo?: string; page?: number; pageSize?: number; }): Observable<CodigoModel[]> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.tipo) query.set('tipo', params.tipo);
    if (params?.page) query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const url = query.toString() ? `${this.apiUrl}?${query.toString()}` : this.apiUrl;

    return this.http.get<any>(url, this.httpOptions).pipe(
      map((res) => {
        // Si el backend devuelve {rows: [...]}, uso rows.
        // Si por algún motivo devuelve un array directo, lo uso tal cual.
        const rows = Array.isArray(res) ? res : (res?.rows ?? []);
        return rows as CodigoModel[];
      }),
      tap(rows => this.codigosSubject.next(rows)),
      catchError(this.handleError)
    );
  }

  /** POST: crear */
  addCodigo(codigo: CodigoModel): Observable<CodigoModel> {
    return this.http.post<CodigoModel>(this.apiUrl, codigo, this.httpOptions).pipe(
      tap(() => {
        // refresco liviano: vuelvo a pedir la lista
        this.getCodigos().subscribe();
      }),
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
