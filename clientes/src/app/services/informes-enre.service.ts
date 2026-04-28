import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InformeEnreModel } from '../models/informe-enre/informe-enre.component';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InformesEnreService {

  private apiUrl = `${environment.apiBase}/expedientes`;

  constructor(private http: HttpClient) {}

  // 🔹 crear informe manual
  crearInformeManual(data: InformeEnreModel) {
    return this.http.post(`${this.apiUrl}/informes-enre/manual`, data);
  }

  // 🔹 traer informes manuales
  getInformesManuales() {
    return this.http.get<InformeEnreModel[]>(`${this.apiUrl}/informes-enre/manual`);
  }

  actualizarInformeManual(id: number, data: InformeEnreModel) {
  return this.http.put(`${this.apiUrl}/informes-enre/manual/${id}`, data);
}
}