import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { OficioModel } from '../models/oficio/oficio.component';
import { ExpedientesService } from './expedientes.service';
import { DemandadosService } from './demandado.service';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class OficiosService {
  //private apiUrl = 'http://192.168.1.36:3000/oficios';
    private apiUrl = `${environment.apiBase}/oficios`;

constructor(
  private http: HttpClient,
  private expedientesService: ExpedientesService,
  private demandadosService: DemandadosService
) {}

agregarOficio(oficio: OficioModel): Observable<any> {
  return this.http.post(`${this.apiUrl}/agregar`, oficio);
}

getOficios(): Observable<OficioModel[]> {
  return this.http.get<OficioModel[]>(`${this.apiUrl}`).pipe(
    switchMap(oficios => {
      const oficiosConModelos$ = oficios.map(oficio =>
        forkJoin({
          expedienteModel: this.expedientesService.getExpedientePorId(oficio.expediente_id),
          demandadoModel: this.demandadosService.getDemandadoPorId(oficio.demandado_id)
        }).pipe(
          map(({ expedienteModel, demandadoModel }) => ({
            ...oficio,
            expedienteModel,
            demandadoModel
          }))
        )
      );
      return forkJoin(oficiosConModelos$);
    })
  );
}




actualizarOficio(id: number, data: Partial<OficioModel>): Observable<any> {

  const body: any = {
    parte: data.parte,
    estado: data.estado,
    fecha_diligenciado: data.fecha_diligenciado || null,

    nombre_oficiada: data.nombre_oficiada,
    tipo_pericia: data.tipo_pericia,
    supletoria: data.supletoria,
    fecha_atencion: data.fecha_atencion || null,

    tipo: data.tipo
  };

  if (data.expediente_id != null) {
    body.expediente_id = data.expediente_id;
  }

  if (data.demandado_id != null) {
    body.demandado_id = data.demandado_id;
  }

  console.log("PAYLOAD REAL =>", body);

  return this.http.put(`${this.apiUrl}/modificar/${id}`, body);
}
}
