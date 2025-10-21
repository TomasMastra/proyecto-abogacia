// src/app/services/pagos.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Pago } from '../models/pago/pago.component';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PagosService {
    private apiUrl = 'http://192.168.1.36:3000/pagos';

  private resource = `${this.apiUrl}`;

  constructor(private http: HttpClient) {}

  /** Obtener todos los pagos */
  obtenerPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.resource).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Cargar (crear) un pago
   * @param pago { fecha: 'YYYY-MM-DD', monto: number }
   */
  cargarPago(pago: Omit<Pago, 'id'>): Observable<{ message: string; pago: Pago }> {
    return this.http.post<{ message: string; pago: Pago }>(this.apiUrl, pago).pipe(
      catchError(this.handleError)
    );
  }

  /** Manejo básico de errores HTTP */
  private handleError(error: HttpErrorResponse) {
    let msg = 'Ocurrió un error. Intentá nuevamente.';
    if (error.error?.error) msg = error.error.error;
    else if (typeof error.error === 'string') msg = error.error;
    console.error('[PagosService] Error:', error);
    return throwError(() => new Error(msg));
  }

    /**
   * Eliminar un pago
   * @param id ID del pago
   */
  eliminarPago(id: number | string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }
}


