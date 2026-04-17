import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MotivoModel } from '../models/motivo/motivo.component';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class MotivosService {

  private url = `${environment.apiBase}/motivos`;

  constructor(private http: HttpClient) {}

  getMotivos(): Observable<MotivoModel[]> {
    return this.http.get<MotivoModel[]>(this.url);
  }

  addMotivo(motivo: MotivoModel): Observable<MotivoModel> {
    return this.http.post<MotivoModel>(this.url, motivo);
  }

  actualizarMotivo(id: number | string, motivo: MotivoModel): Observable<MotivoModel> {
    return this.http.put<MotivoModel>(`${this.url}/${id}`, motivo);
  }
}