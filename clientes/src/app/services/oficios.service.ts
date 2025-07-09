import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { OficioModel } from '../models/oficio/oficio.component';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OficiosService {
  private apiUrl = 'http://192.168.1.36:3000/oficios';

  constructor(private http: HttpClient) {}

  agregarOficio(oficio: OficioModel): Observable<any> {
    return this.http.post(`${this.apiUrl}/agregar`, oficio);
  }

  getOficios(): Observable<OficioModel[]> {
  return this.http.get<OficioModel[]>(`${this.apiUrl}`);
}

actualizarOficio(id: number, oficio: OficioModel): Observable<any> {
  return this.http.put(`${this.apiUrl}/modificar/${id}`, oficio);
}
}
