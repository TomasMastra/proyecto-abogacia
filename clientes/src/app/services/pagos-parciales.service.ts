// services/pagos-capital.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagoCapitalModel } from '../models/pago-capital/pago-capital.component';


@Injectable({ providedIn: 'root' })
export class PagosCapitalService {
  private apiUrl = `${environment.apiBase}/pagos-capital`;

  constructor(private http: HttpClient) {}
  /** Inserta un pago parcial de capital */
  agregarPago(pago: PagoCapitalModel): Observable<any> {
    // payload mínimo: expediente_id, monto, fecha_pago
    return this.http.post(`${this.apiUrl}/agregar`, pago);
  }

  /** Trae todos los pagos parciales de capital de un expediente */
  getPagosPorExpediente(expedienteId: number): Observable<PagoCapitalModel[]> {
    return this.http.get<PagoCapitalModel[]>(`${this.apiUrl}/expediente/${expedienteId}`);
  }

  /** Elimina un pago por id (opcional, por si te equivocás) */
  eliminarPago(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
