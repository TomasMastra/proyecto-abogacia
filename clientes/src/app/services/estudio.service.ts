import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface EstudioModel {
  id: number;
  nombre: string;
  estado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EstudioService {
  private apiUrl = `${environment.apiBase}/estudios`;

  constructor(private http: HttpClient) {}

  getEstudios(): Observable<EstudioModel[]> {
    return this.http.get<EstudioModel[]>(this.apiUrl);
  }

  crearEstudio(nombre: string): Observable<EstudioModel> {
    return this.http.post<EstudioModel>(this.apiUrl, { nombre });
  }
}