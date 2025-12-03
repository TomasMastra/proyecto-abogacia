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
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ExpedientesService {
  //private apiUrl = 'http://192.168.1.36:3000/expedientes';
  private apiUrl = `${environment.apiBase}/expedientes`;

  //private expedientesSubject = new BehaviorSubject<ExpedienteModel[]>([]); // Emite un arreglo vacío inicialmente
  private expedientesSubject = new BehaviorSubject<ExpedienteModel[] | null>(null);
  clientes$ = this.expedientesSubject.asObservable();  // Expone el observable de clientes

  constructor(private http: HttpClient, private usuarioService: UsuarioService,
    private juzgadosService: JuzgadosService
  ) {}

  /*
getExpedientes() {
const usuario = this.usuarioService.usuarioLogeado;
  const params = { usuario_id: usuario!.id, rol: usuario!.rol };

  this.http.get<any[]>(this.apiUrl, { params }).subscribe({
    next: (expedientes) => {
      // 1) Inicializo campos y EMITO YA MISMO (spinner se apaga en el componente)
      (expedientes ?? []).forEach(e => {
        e.clientes = [];
        e.demandados = [];
      });
      this.expedientesSubject.next(expedientes ?? []);


     (expedientes ?? []).forEach(e => {
        this.getClientesPorExpediente(e.id).subscribe({
          next: (clientes) => { e.clientes = clientes ?? [];  },
          error: () => {  }
        })
        
          this.getJuzgadoPorId(e.juzgado_id).subscribe({
          next: (juzgado) => {
            e.juzgadoModel = juzgado ?? null;
            
          },
          error: () => {  } 
        });

        this.getDemandadosPorExpediente(e.id).subscribe({
          next: (demandados) => { e.demandados = demandados ?? [];  },
          error: () => { }
        });
      });
    },
    error: () => {
      this.expedientesSubject.next([]); // no bloquees la UI
    }
  });

  return this.clientes$; // lo que ya devolvías
}*/


getExpedientes() {
  const usuario = this.usuarioService.usuarioLogeado;
  const params = { usuario_id: usuario!.id, rol: usuario!.rol };

  this.http.get<any[]>(this.apiUrl, { params }).subscribe({
    next: (expedientes) => {
      (expedientes ?? []).forEach(e => {
        e.clientes = [];
        e.demandados = [];
      });
      this.expedientesSubject.next(expedientes ?? []);
    },
    error: () => {
      this.expedientesSubject.next([]);
    }
  });

  return this.clientes$; 
}


/** Método que genera la carátula según clientes y demandados */
private armarCaratula(expediente: any): string {
  const c = expediente?.clientes ?? [];
  const d = expediente?.demandados ?? [];
  if (!c.length && !d.length) return '—';

  const getNom = (p: any) =>
    `${p?.nombres ?? p?.nombre ?? ''} ${p?.apellidos ?? p?.apellido ?? ''}`.trim() || '(sin actora)';

  const c0 = c[0] ? getNom(c[0]) : '(sin actora)';
  const d0 = d[0]?.nombre ?? d[0]?.razon_social ?? '(sin demandado)';

  const izquierda = c.length === 0 ? c0 : c0 + (c.length > 1 ? ' y otros' : '');
  const derecha   = d0 + (d.length > 1 ? ' y otros' : '');
  return `${izquierda} contra ${derecha}`;
}

getHonorarios() {
  this.http.get<any[]>(`${this.apiUrl}/honorarios`).subscribe(
    (expedientes) => {
      if (!expedientes?.length) { this.expedientesSubject.next([]); return; }

      let restantes = expedientes.length;

      expedientes.forEach(expediente => {
        expediente.clientes = [];
        expediente.demandados = [];
        expediente.caratula = '';

        let hits = 0;
        const esperadas = expediente.demandado_id ? 2 : 1;

        const listo = () => {
          hits++;
          if (hits === esperadas) {
            restantes--;
            if (restantes === 0) this.expedientesSubject.next(expedientes);
          }
        };

        this.getClientesPorExpediente(expediente.id).subscribe({
          next: (clientes) => {
            expediente.clientes = clientes ?? [];
            //expediente.caratula = this.armarCaratula(expediente);
            listo();
          },
          error: () => { listo(); } // no bloquea
        });

        this.getJuzgadoPorId(expediente.juzgado_id).subscribe({
          next: (juzgado) => {
            expediente.juzgadoModel = juzgado ?? null;
            listo();
          },
          error: () => { listo(); } // no bloquea
        });

        if (expediente.demandado_id) {
          this.getDemandadoPorId(expediente.demandado_id).subscribe({
            next: (dem) => {
              expediente.demandadoModel = dem ?? null;
              expediente.demandados = dem ? [dem] : [];
              //expediente.caratula = this.armarCaratula(expediente);
              listo();
            },
            error: () => { listo(); }
          });
        }
      });
    },
    () => this.expedientesSubject.next([])
  );

  return this.clientes$; // (deja tu return como lo tenías)
}

      

  getClientesPorExpediente(id_expediente: string) {
    const url = `${this.apiUrl}/clientesPorExpediente/${id_expediente}`;
    return this.http.get<ClienteModel[]>(url);
  }

  getDemandadosPorExpediente(id_expediente: string) {
    const url = `${this.apiUrl}/demandadosPorExpediente/${id_expediente}`;
    return this.http.get<DemandadoModel[]>(url);
  }

/*  getDemandadoPorId(id: number): Observable<DemandadoModel> {
    if (id === undefined || id === null) {
      console.error('ID de demandado no definido');
    }

    //const url = `http://192.168.1.36:3000/demandados/${id}`;
    const url = `${environment.apiBase}/demandados/${id}`
    return this.http.get<DemandadoModel>(url);
  }*/

  getDemandadoPorId(id: number): Observable<DemandadoModel> {
  if (id === undefined || id === null) {
    console.error('ID de demandado no definido');
  }

  const url = `${environment.apiBase}/expedientes/demandados/${id}`;
  return this.http.get<DemandadoModel>(url);
}


    getJuzgadoPorId(id: number): Observable<DemandadoModel> {
    if (id === undefined || id === null) {
      console.error('ID de demandado no definido');
    }

    //const url = `http://192.168.1.36:3000/juzgados/${id}`;
    const url = `${environment.apiBase}/juzgados/${id}`

    return this.http.get<DemandadoModel>(url);
  }

  getExpedientePorId(id: number | string): Observable<ExpedienteModel> {
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
          //console.log(expediente.juzgadoModel);
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
    
    
    restaurarCobro(id: number) {
      return this.http.put(`${this.apiUrl}/restaurar-cobro/${id}`, {});
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



  getExpedientesCobrados() {
  const usuario = this.usuarioService.usuarioLogeado;
  const params = { usuario_id: usuario!.id, rol: usuario!.rol };

  this.http.get<any[]>(`${this.apiUrl}/cobrados`, { params }).subscribe(
    (expedientes) => {
      if (!expedientes?.length) { this.expedientesSubject.next([]); return; }

      let restantes = expedientes.length; // cuántos ítems faltan cerrar

      expedientes.forEach(expediente => {
        // inicializo
        expediente.clientes   = [];
        expediente.demandados = [];
        //expediente.caratula   = '';

        // vamos a esperar: clientes + demandados (+ demandadoModel si hay id)
        let hits = 0;
        const esperadas = (expediente.demandado_id ? 3 : 2);

        const listo = () => {
          hits++;
          if (hits === esperadas) {
            restantes--;
            if (restantes === 0) {
              // emito UNA vez con todo listo
              this.expedientesSubject.next(expedientes);
            }
          }
        };

        // Clientes
        this.getClientesPorExpediente(expediente.id).subscribe({
          next: (clientes) => {
            expediente.clientes = clientes ?? [];
            //expediente.caratula = this.armarCaratula(expediente);
            listo();
          },
          error: () => { listo(); }
        });

        // Demandados (lista)
        this.getDemandadosPorExpediente(expediente.id).subscribe({
          next: (demandados) => {
            expediente.demandados = demandados ?? [];
            //expediente.caratula = this.armarCaratula(expediente);
            listo();
          },
          error: () => { listo(); }
        });

        // Demandado único (si lo usás)
        if (expediente.demandado_id) {
          this.getDemandadoPorId(expediente.demandado_id).subscribe({
            next: (demandado) => {
              expediente.demandadoModel = demandado ?? null;
              // (opcional) no afecta carátula porque ya usás la lista de demandados
              listo();
            },
            error: () => { listo(); }
          });
        }
      });
    },
    (error) => {
      console.error('Error al obtener expedientes:', error);
      this.expedientesSubject.next([]);
    }
  );

  return this.clientes$; // dejé tu return igual
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

getExpedientesPorEstado(estado: string, texto?: string) {
  const paramsEstado: any = { estado };

  const http$ = (texto && texto.trim() !== '')
    ? this.http.get<any[]>(`${this.apiUrl}/buscar`, { params: { texto } })
    : this.http.get<any[]>(`${this.apiUrl}/estado`, { params: paramsEstado });

  http$.subscribe(
    (expedientes) => {
      // si vino de /buscar, acotamos al estado pedido acá
      const lista = (texto && texto.trim() !== '')
        ? (expedientes || []).filter(e => (e.estado || '').toLowerCase() === estado.toLowerCase())
        : (expedientes || []);

      if (!lista.length) { this.expedientesSubject.next([]); return; }

      let restantes = lista.length;

      lista.forEach(expediente => {
        expediente.clientes   = [];
        expediente.demandados = [];
        //expediente.caratula   = '';

        let hits = 0;
        const esperadas = (expediente.demandado_id ? 3 : 2);
        const listo = () => {
          if (++hits === esperadas) {
            if (--restantes === 0) this.expedientesSubject.next(lista);
          }
        };

        this.getClientesPorExpediente(expediente.id).subscribe({
          next: (clientes) => { expediente.clientes = clientes ?? [];  listo(); },
          error: () => { listo(); }
        });

          this.getJuzgadoPorId(expediente.juzgado_id).subscribe({
          next: (juzgado) => {
            expediente.juzgadoModel = juzgado ?? null;
            listo();
          },
          error: () => { listo(); }
        });

        this.getDemandadosPorExpediente(expediente.id).subscribe({
          next: (demandados) => { expediente.demandados = demandados ?? []; listo(); },
          error: () => { listo(); }
        });

        /*if (expediente.demandado_id) {
          this.getDemandadoPorId(expediente.demandado_id).subscribe({
            next: (demandado) => { expediente.demandadoModel = demandado ?? null; listo(); },
            error: () => { listo(); }
          });
        }*/
      });
    },
    (error) => {
      console.error('Error al obtener expedientes por estado:', error);
      this.expedientesSubject.next([]);
    }
  );

  return this.clientes$;
}


getCaratulaPorId(id: number) {
  return this.http.get<{numero?: any, anio?: any, juicio?: string, actor?: string, demandado?: string}>(`/expedientes/caratula/${id}`);
}


getPartes(expedienteId: number) {
  return this.http.get<{actoras:any[]; demandados:any[]}>(
    `${this.apiUrl}/partes/${expedienteId}`
  );
}

// expedientes.service.ts
getCobranzasMensuales(anio?: number) {
  const params = anio ? { params: { anio: anio.toString() } } : {};
  return this.http.get<any[]>(`${this.apiUrl}/cobranzas-mensuales`, params);
}

// (opcional para el click de un mes → detalle ya hecho antes)
getCobranzasDetallePorMes(anio: number, mes: number) {
  return this.http.get<any[]>(`${this.apiUrl}/cobranzas-detalle-por-mes`, {
    params: { anio: anio.toString(), mes: mes.toString() }
  });
}

}
