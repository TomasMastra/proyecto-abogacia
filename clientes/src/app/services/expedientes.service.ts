import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { mergeMap, map, switchMap } from 'rxjs/operators';

import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { ExpedienteModel } from '../models/expediente/expediente.component';
import { DemandadoModel } from '../models/demandado/demandado.component';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, forkJoin, Observable, throwError, of   } from 'rxjs';

import { catchError, tap } from 'rxjs/operators';

import { UsuarioService } from 'src/app/services/usuario.service';


@Injectable({
  providedIn: 'root'
})
export class ExpedientesService {
  //private apiUrl = 'http://localhost:3000/expedientes';  
  private apiUrl = 'http://192.168.1.36:3000/expedientes';

  private expedientesSubject = new BehaviorSubject<ExpedienteModel[]>([]); // Emite un arreglo vacío inicialmente
  clientes$ = this.expedientesSubject.asObservable();  // Expone el observable de clientes

  constructor(private http: HttpClient, private usuarioService: UsuarioService) {}

getExpedientes() {
  const usuario = this.usuarioService.usuarioLogeado;

  const params = {
    usuario_id: usuario.id,
    rol: usuario.rol
  };

  this.http.get<ExpedienteModel[]>(this.apiUrl, { params }).subscribe(
    (expedientes) => {
      expedientes.forEach((expediente) => {
        this.getClientesPorExpediente(expediente.id).subscribe((clientes) => {
          expediente.clientes = clientes;
        });

        this.getDemandadoPorId(expediente.demandado_id!).subscribe((demandado) => {
          expediente.demandadoModel = demandado;
        });
      });

      this.expedientesSubject.next(expedientes);
    },
    (error) => {
      console.error('Error al obtener expedientes:', error);
    }
  );

  return this.clientes$; // ¿Querías retornar this.expedientes$ acá? 🤔
}


      getHonorarios() {
        this.http.get<ExpedienteModel[]>(`${this.apiUrl}/honorarios`).subscribe(
          (expedientes) => {
            expedientes.forEach((expediente) => {
              this.getClientesPorExpediente(expediente.id).subscribe((clientes) => {
                expediente.clientes = clientes;

              });
      

              this.getDemandadoPorId(expediente.demandado_id!).subscribe((demandado) => {
                expediente.demandadoModel = demandado

              });
            });

            this.expedientesSubject.next(expedientes);
          },
          (error) => {
            console.error('Error al obtener expedientes:', error);
          }
        );
      
        return this.clientes$;
      }
      

  getClientesPorExpediente(id_expediente: string) {
    const url = `${this.apiUrl}/clientesPorExpediente/${id_expediente}`;
    //console.log('URL llamada:', url);  
    return this.http.get<ClienteModel[]>(url);
  }

  getDemandadoPorId(id: number): Observable<DemandadoModel> {
    if (id === undefined || id === null) {
      console.error('ID de demandado no definido');
    }

    const url = `http://192.168.1.36:3000/demandados/${id}`;
    
    return this.http.get<DemandadoModel>(url);
  }
  
  
    
  getClientePorId(id: string) {
    return this.http.get<ClienteModel>(`${this.apiUrl}/${id}`);
  }

  addExpediente(expediente: ExpedienteModel): Observable<any> {
    const url = `${this.apiUrl}/agregar`;
    console.log('URL de búsqueda:', url);
    console.log('Datos enviados:', expediente);
    return this.http.post(`${this.apiUrl}/agregar`, expediente);
  }


  actualizarExpediente(id: string, expediente: ExpedienteModel): Observable<ExpedienteModel> {
    const url = `${this.apiUrl}/modificar/${id}`;   
    console.log('ID a actualizar: ', id);
    console.log('honorario: ', expediente.honorario, ' fecha_inicio: ', expediente.fecha_inicio);

      return this.http.put<ExpedienteModel>(url, expediente);
    }

    deleteClienteExpedientePorId(id: string | number) {
      const url = `${this.apiUrl}/eliminar/${id}`;
      console.log('Ejecutando DELETE con URL:', url);
      return this.http.delete(url);
    }
    
    

      searchExpedientes(texto: string): Observable<ExpedienteModel[]> {
        const textoLower = texto.toLowerCase();
        const url = `${this.apiUrl}/buscar?texto=${textoLower}`;
      
        console.log('URL de búsqueda:', url);
      
        return this.http.get<ExpedienteModel[]>(url).pipe(
          tap(response => {
            console.log('Respuesta de la API:', response);  
          }),
          catchError(error => {
            console.error('Error al buscar expedientes', error);
            return of([]);  
          })
        );
      }

buscarExpedientes(texto: string) {
  const textoLower = texto.toLowerCase();
  const usuario = this.usuarioService.usuarioLogeado;

  const params = {
    texto: textoLower,
    usuario_id: usuario.id,
    rol: usuario.rol
  };

  return this.http.get<ExpedienteModel[]>(`${this.apiUrl}/buscar`, { params }).pipe(
    switchMap(expedientes => {
      if (expedientes.length === 0) {
        return of([]);
      }

      const requests = expedientes.map(expediente => {
        const clientes$ = this.getClientesPorExpediente(expediente.id);
        const demandado$ = this.getDemandadoPorId(expediente.demandado_id!);

        return forkJoin([clientes$, demandado$]).pipe(
          map(([clientes, demandado]) => {
            expediente.clientes = clientes;
            expediente.demandadoModel = demandado;
            return expediente;
          })
        );
      });

      return forkJoin(requests);
    })
  );
}


   
        
      
      agregarClientesAExpediente(expedienteId: number, clienteId: number): Observable<any> {
        console.log('id cliente: ', clienteId, ' expediente id: ', expedienteId);
      
        const url = `${this.apiUrl}/agregarExpedienteClientes`;
        const data = {
          cliente: clienteId,
          expediente: expedienteId
        };
        console.log('url exp-cli: ', url);

        return this.http.post(url, data).pipe(
          tap(response => {
            console.log('Respuesta de la API:', response);  // Verifica si la respuesta es exitosa
          }),
          catchError(error => {
            console.error('Error al agregar cliente al expediente:', error);
            return throwError(error);  // Asegúrate de capturar y propagar el error correctamente
          })
        );
      }
      
      getExpedientesPorDemandado(id: string) {
        const params = new HttpParams()
          .set("id", id)
          .set("estado", "en gestión");
      
        return this.http.get<ExpedienteModel[]>(`${this.apiUrl}/demandados`, { params });
      }
 /*     
      getClientePorNumeroYAnio(numero: string, anio: string) {
        return this.http.get<ClienteModel[]>(`${this.apiUrl}/buscarPorNumeroyAnio`, {
          params: { numero, anio }
        });
      }*/
getClientePorNumeroYAnio(numero: string, anio: string, tipo: string) {
  const usuario = this.usuarioService.usuarioLogeado;

  const params = {
    numero,
    anio,
    tipo,
    usuario_id: usuario.id,
    rol: usuario.rol
  };

  return this.http.get<ExpedienteModel[]>(`${this.apiUrl}/buscarPorNumeroAnioTipo`, { params }).pipe(
    mergeMap(expedientes => {
      if (!expedientes.length) return of([]);

      return forkJoin(
        expedientes.map(expediente =>
          forkJoin({
            clientes: this.getClientesPorExpediente(expediente.id),
            demandado: this.getDemandadoPorId(expediente.demandado_id!)
          }).pipe(
            map(({ clientes, demandado }) => ({
              ...expediente,
              clientes,
              demandadoModel: demandado
            }))
          )
        )
      );
    })
  );
}

        

        getExpedientesPorEstado(estado: string) {
          const params = { estado }; 
                  
          this.http.get<ExpedienteModel[]>(`${this.apiUrl}/estado`, { params }).subscribe(
            (expedientes) => {
              expedientes.forEach((expediente) => {
                this.getClientesPorExpediente(expediente.id).subscribe((clientes) => {
                  expediente.clientes = clientes;
                });
        
                this.getDemandadoPorId(expediente.demandado_id!).subscribe((demandado) => {
                  expediente.demandadoModel = demandado;
                });
              });
        
              this.expedientesSubject.next(expedientes);
            },
            (error) => {
              console.error('Error al obtener expedientes:', error);
            }
          );
        
          return this.clientes$;
        }
        

}
