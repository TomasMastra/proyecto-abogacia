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
import { JuzgadosService } from 'src/app/services/juzgados.service';


@Injectable({
  providedIn: 'root'
})
export class ExpedientesService {
  private apiUrl = 'http://192.168.1.36:3000/expedientes';

  //private expedientesSubject = new BehaviorSubject<ExpedienteModel[]>([]); // Emite un arreglo vacío inicialmente
  private expedientesSubject = new BehaviorSubject<ExpedienteModel[] | null>(null);
  clientes$ = this.expedientesSubject.asObservable();  // Expone el observable de clientes

  constructor(private http: HttpClient, private usuarioService: UsuarioService,
    private juzgadosService: JuzgadosService
  ) {}

getExpedientes() {
  const usuario = this.usuarioService.usuarioLogeado;
    const params = {
    usuario_id: usuario!.id,
    rol: usuario!.rol
  };


  this.http.get<ExpedienteModel[]>(this.apiUrl, { params }).subscribe(
    (expedientes) => {

      expedientes.forEach((expediente) => {
          expediente.clientes = []; // 👈 prevenís error
          expediente.demandados = [];

        this.getClientesPorExpediente(expediente.id).subscribe((clientes) => {
          expediente.clientes = clientes;
        });

        this.getDemandadosPorExpediente(expediente.id).subscribe((demandados) => {
          expediente.demandados = demandados;
        });

     //  this.getDemandadoPorId(expediente.demandado_id!).subscribe((demandado) => {
    //      expediente.demandadoModel = demandado;
       // });
      });

      this.expedientesSubject.next(expedientes);
    },
    (error) => {
      console.error('Error al obtener expedientes:', error);
    }
  );

  return this.clientes$;
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
    return this.http.get<ClienteModel[]>(url);
  }

  getDemandadosPorExpediente(id_expediente: string) {
    const url = `${this.apiUrl}/demandadosPorExpediente/${id_expediente}`;
    return this.http.get<DemandadoModel[]>(url);
  }

  getDemandadoPorId(id: number): Observable<DemandadoModel> {
    if (id === undefined || id === null) {
      console.error('ID de demandado no definido');
    }

    const url = `http://192.168.1.36:3000/demandados/${id}`;
    
    return this.http.get<DemandadoModel>(url);
  }
  
  getExpedientePorId(id: number): Observable<ExpedienteModel> {
  return this.http.get<ExpedienteModel>(`${this.apiUrl}/obtener/${id}`).pipe(
    switchMap(expediente => {
      const clientes$ = this.getClientesPorExpediente(expediente.id);
      const demandados$ = this.getDemandadosPorExpediente(expediente.id);
      const juzgado$ = this.juzgadosService.getJuzgadoPorId(expediente.juzgado_id!);

      return forkJoin({ clientes: clientes$, demandados: demandados$, juzgado: juzgado$ }).pipe(
        map(({ clientes, demandados, juzgado }) => {
          expediente.clientes = clientes;
          expediente.demandados = demandados;
          expediente.juzgadoModel = juzgado;
          console.log(expediente.juzgadoModel);
          return expediente;
        })
      );
    }),
    catchError(err => {
      console.error('Error al obtener expediente por ID:', err);
      return of({} as ExpedienteModel);
    })
  );
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
    usuario_id: usuario!.id,
    rol: usuario!.rol
  };

  return this.http.get<ExpedienteModel[]>(`${this.apiUrl}/buscar`, { params }).pipe(
    switchMap(expedientes => {
      if (expedientes.length! === 0) {
        return of([]);
      }

      const requests = expedientes.map(expediente => {
        const clientes$ = this.getClientesPorExpediente(expediente.id);
        const demandados$ = this.getDemandadosPorExpediente(expediente.id);  // 🚨 Acá traemos varios, como en getExpedientes()

        return forkJoin([clientes$, demandados$]).pipe(
          map(([clientes, demandados]) => {
            expediente.clientes = clientes;
            expediente.demandados = demandados;  // 🚨 Acá asignamos el array
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


getClientePorNumeroYAnio(numero: string, anio: string, tipo: string) {
  const usuario = this.usuarioService.usuarioLogeado;

  const params = {
    numero,
    anio,
    tipo,
    usuario_id: usuario!.id,
    rol: usuario!.rol
  };

  return this.http.get<ExpedienteModel[]>(`${this.apiUrl}/buscarPorNumeroAnioTipo`, { params }).pipe(
    mergeMap(expedientes => {
      if (!expedientes.length) return of([]);

      return forkJoin(
        expedientes.map(expediente => {
          const demandadoRequest = expediente.demandado_id
            ? this.getDemandadoPorId(expediente.demandado_id)
            : of(null);

          return forkJoin({
            clientes: this.getClientesPorExpediente(expediente.id),
            demandado: demandadoRequest,
            demandados: this.getDemandadosPorExpediente(expediente.id)
          }).pipe(
            map(({ clientes, demandado, demandados }) => ({
              ...expediente,
              clientes,
              demandadoModel: demandado,
              demandados
            }))
          );
        })
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

            this.getDemandadosPorExpediente(expediente.id).subscribe((demandados) => {
            expediente.demandados = demandados;
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
    



  
getExpedientesCobrados() {
  const usuario = this.usuarioService.usuarioLogeado;

  const params = {
    usuario_id: usuario!.id,
    rol: usuario!.rol
  };

  this.http.get<ExpedienteModel[]>(`${this.apiUrl}/cobrados`, { params }).subscribe(
    (expedientes) => {
      expedientes.forEach((expediente) => {
        this.getClientesPorExpediente(expediente.id).subscribe((clientes) => {
          expediente.clientes = clientes;
        });

        this.getDemandadoPorId(expediente.demandado_id!).subscribe((demandado) => {
          expediente.demandadoModel = demandado;
        });

        this.getDemandadosPorExpediente(expediente.id).subscribe((demandados) => {
          expediente.demandados = demandados;
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

getExpedientesVencimiento(juicio: string): Observable<ExpedienteModel[]> {
  const url = `${this.apiUrl}/vencimiento?juicio=${juicio}`;

  return this.http.get<ExpedienteModel[]>(url).pipe(
    switchMap(expedientes => {
      if (expedientes.length === 0) return of([]);

      const requests = expedientes.map(expediente => {
        const clientes$ = this.getClientesPorExpediente(expediente.id);
        const demandados$ = this.getDemandadosPorExpediente(expediente.id);

        return forkJoin({ clientes: clientes$, demandados: demandados$ }).pipe(
          map(({ clientes, demandados }) => {
            expediente.clientes = clientes;
            expediente.demandados = demandados;
            return expediente;
          })
        );
      });

      return forkJoin(requests);
    }),
    catchError(err => {
      console.error('Error al obtener expedientes con vencimiento:', err);
      return of([]);
    })
  );
}

getFeriadosDesde(fecha: string) {
  return this.http.get<string[]>(`/api/feriados?fecha=${fecha}`);
}

obtenerTotalCobranzasPorMes(anio: number, mes: number) {
  return this.http.get<any>(`${this.apiUrl}/total-cobranzas-por-mes`, {
    params: {
      anio: anio.toString(),
      mes: mes.toString()
    }
  });
}



  obtenerCantidadExpedientesActivos() {
    console.log(`${this.apiUrl}/expedientes-activos`)
  return this.http.get<number>(`${this.apiUrl}/expedientes-activos`);
}

obtenerCantidadClientesRegistrados() {
  return this.http.get<number>(`${this.apiUrl}/clientes-registrados`);
}

obtenerCantidadSentenciasEmitidas() {
  return this.http.get<number>(`${this.apiUrl}/sentencias-emitidas`);
}

obtenerCantidadHonorariosPendientes() {
  return this.http.get<number>(`${this.apiUrl}/honorarios-pendientes`);
}


obtenerDemandadosPorMes(): Observable<{ [mes: string]: number }> {
  return this.http.get<{ [mes: string]: number }>(`${this.apiUrl}/expedientes/demandados-por-mes`);
}




}
