import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { JurisprudenciaModel } from 'src/app/models/jurisprudencia/jurisprudencia.component';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class JurisprudenciasService {

  //private apiUrl = 'http://192.168.1.36:3000/jurisprudencias';
  private apiUrl = `${environment.apiBase}/jurisprudencias`;

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  private jurisprudenciasSubject = new BehaviorSubject<JurisprudenciaModel[]>([]);
  jurisprudencias$ = this.jurisprudenciasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // GET con soporte de búsqueda/paginación (si el backend lo implementa)
  getJurisprudencias(params?: { q?: string; tipo?: string; page?: number; pageSize?: number; }): Observable<JurisprudenciaModel[]> {
    const query = new URLSearchParams();
    if (params?.q)        query.set('q', params.q);
    if (params?.tipo)     query.set('tipo', params.tipo);
    if (params?.page)     query.set('page', String(params.page));
    if (params?.pageSize) query.set('pageSize', String(params.pageSize));

    const url = query.toString() ? `${this.apiUrl}?${query.toString()}` : this.apiUrl;

    return this.http.get<any>(url, this.httpOptions).pipe(
      map(res => {
        const rows = Array.isArray(res) ? res : (res?.rows ?? []);
        return rows as JurisprudenciaModel[];
      }),
      tap(rows => this.jurisprudenciasSubject.next(rows)),
      catchError(this.handleError)
    );
  }

  // POST: crear jurisprudencia
  addJurisprudencia(jurisprudencia: JurisprudenciaModel): Observable<JurisprudenciaModel> {
    return this.http.post<JurisprudenciaModel>(this.apiUrl, jurisprudencia, this.httpOptions).pipe(
      tap(() => {
        // refresco la lista
        this.getJurisprudencias().subscribe();
      }),
      catchError(this.handleError)
    );
  }

  // DELETE: eliminar jurisprudencia por id
  eliminarJurisprudencia(id: string) {
    return this.http.delete<{ detachedCount?: number }>(`${this.apiUrl}/${id}`);
  }

  // PUT: actualizar jurisprudencia por id
  actualizarJurisprudencia(id: number | string, cambios: Partial<JurisprudenciaModel>): Observable<JurisprudenciaModel> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<JurisprudenciaModel>(url, cambios, this.httpOptions).pipe(
      tap((updated) => {
        const curr = this.jurisprudenciasSubject.value;
        const idx = curr.findIndex(x => String((x as any).id) === String(id));
        if (idx >= 0) {
          const nuevo = [...curr];
          nuevo[idx] = { ...curr[idx], ...updated };
          this.jurisprudenciasSubject.next(nuevo);
        }
      }),
      catchError(this.handleError)
    );
  }

  // Manejo de errores
  private handleError(err: any) {
    console.error('JurisprudenciasService error:', err);
    return throwError(() => err);
  }
}
