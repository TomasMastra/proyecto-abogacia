import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { OficioModel } from '../models/oficio/oficio.component';
import { ExpedientesService } from './expedientes.service';
import { DemandadosService } from './demandado.service';


@Injectable({
  providedIn: 'root'
})
export class OficiosService {
  private apiUrl = 'http://192.168.1.36:3000/oficios';

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
    const body = {
      // Si en tu caso no querés cambiar el expediente, podés omitirlo
      expediente_id: data.expediente_id,
      demandado_id: data.demandado_id,
      parte: data.parte,
      estado: data.estado,
      fecha_diligenciado: data.fecha_diligenciado || null,
    };
    return this.http.put(`${this.apiUrl}/modificar/${id}`, body);
  }
}
