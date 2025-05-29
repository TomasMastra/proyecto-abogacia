import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UsuarioService } from 'src/app/services/usuario.service';


@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };
  private apiUrl = 'http://192.168.1.36:3000/clientes';
  //private apiUrl = 'http://localhost:3000/clientes';  
  private clientesSubject = new BehaviorSubject<ClienteModel[]>([]); // Emite un arreglo vacío inicialmente
  clientes$ = this.clientesSubject.asObservable();  // Expone el observable de clientes

  constructor(private http: HttpClient, private usuarioService: UsuarioService  // ✅ Agregá esto
) {}

  // Método para obtener los clientes desde el servidor y emitir los datos
getClientes() {
  const usuario = this.usuarioService.usuarioLogeado;
  const params = {
    usuario_id: usuario.id,
    rol: usuario.rol
  };

  this.http.get<ClienteModel[]>(this.apiUrl, { params }).subscribe(
    (clientes) => {
      this.clientesSubject.next(clientes);
    },
    (error) => {
      console.error('Error al obtener clientes:', error);
    }
  );

  return this.clientes$;
}


  // Método para obtener un cliente por su ID
  getClientePorId(id: string) {
    return this.http.get<ClienteModel>(`${this.apiUrl}/${id}`);
  }

  addCliente(cliente: ClienteModel): Observable<any> {
    const url = `${this.apiUrl}/agregar`;
    //console.log('URL de búsqueda:', url);
    //console.log('Datos enviados:', cliente);
        return this.http.post(`${this.apiUrl}/agregar`, cliente);
  }
      
  
  actualizarCliente(id: string, cliente: ClienteModel): Observable<ClienteModel> {
  const url = `${this.apiUrl}/modificar/${id}`;
    return this.http.put<ClienteModel>(url, cliente);
  }

searchClientes(texto: string): Observable<ClienteModel[]> {
  const textoLower = texto.toLowerCase();
  const usuario = this.usuarioService.usuarioLogeado;

  const params = {
    texto: textoLower,
    usuario_id: usuario.id,
    rol: usuario.rol
  };

  return this.http.get<ClienteModel[]>(`${this.apiUrl}/buscar`, { params }).pipe(
    tap(response => console.log('Respuesta de la API:', response)),
    catchError(error => {
      console.error('Error al buscar clientes', error);
      return of([]);
    })
  );
}


  getExpedientesPorCliente(clienteId: string) {
    const url = `http://192.168.1.36:3000/expedientes/clientes?id=${clienteId}`;
    console.log("URL de la petición:", url); // 🔹 Muestra la URL en la consola
    return this.http.get<any[]>(url);
  }
  
  ObtenerExpedientesPorCliente(clienteId: string) {
    const url = `http://192.168.1.36:3000/clientes/expedientesPorCliente?id=${clienteId}`;
    console.log("URL de la petición:", url); // 🔹 Muestra la URL en la consola
    return this.http.get<any[]>(url);
  }
  
}
