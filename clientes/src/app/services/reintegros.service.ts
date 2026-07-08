import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReintegrosService {

  private apiUrl = `${environment.apiBase}/reintegros`;

  constructor(private http: HttpClient) { }

  obtenerReintegros(estado?: string, usuario_id?: number): Observable<any[]> {

    let params = new HttpParams();

    if (estado) {
      params = params.set('estado', estado);
    }

    if (usuario_id != null) {
      params = params.set('usuario_id', usuario_id.toString());
    }

    return this.http.get<any[]>(this.apiUrl, { params });
  }

  obtenerReintegro(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  crearReintegro(reintegro: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, reintegro);
  }

  actualizarReintegro(id: number, reintegro: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, reintegro);
  }

  marcarPagado(id: number, fecha_pagado?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/pagar`, {
      fecha_pagado
    });
  }

  eliminarReintegro(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

}