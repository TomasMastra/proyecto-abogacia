import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { ExpedienteModel } from '../models/expediente/expediente.component';
import { ClienteExpedienteModel } from '../models/cliente-expediente/cliente-expediente.component';
import { Observable, throwError, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientesExpedientesService {
  //private apiUrl = 'http://192.168.1.36:3000/clientes-expedientes';
  private apiUrl = `${environment.apiBase}/clientes-expedientes`;

  //private apiUrl = 'http://localhost:3000/clientes-expedientes';  
  private expedientesSubject = new BehaviorSubject<ClienteExpedienteModel[]>([]); // Emite un arreglo vacío inicialmente
  clientes$ = this.expedientesSubject.asObservable();  // Expone el observable de clientes

  constructor(private http: HttpClient) {}

  addClienteExpediente(cliente: string, expediente: string): Observable<any> {
    const url = `${this.apiUrl}/agregar`;
    return this.http.post(url, { cliente, expediente });
  }
  
  
}
