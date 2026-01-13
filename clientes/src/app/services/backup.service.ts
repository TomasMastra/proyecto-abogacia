import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BackupService {

  private apiUrl = `${environment.apiBase}`;

  constructor(private http: HttpClient) {}

  descargarBackup() {
    const url = `${this.apiUrl}/backup`;

    return this.http.get(url, {
      responseType: 'blob' // 📌 Importante: descarga binaria (ZIP)
    });
  }
}
