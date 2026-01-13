import { ExpedienteModel } from '../expediente/expediente.component';
import { JuzgadoModel } from '../juzgado/juzgado.component';
import { JuezModel } from '../juez/juez.component';
import { CodigoModel } from '../codigo/codigo.component';
import { DemandadoModel } from '../demandado/demandado.component';


export interface JurisprudenciaModel {
  id: string;
  expediente_id: number;
  fuero: string;
  demandado_id: number;
  juzgado_id: number;
  sentencia: string | null;
  juez_id: number;
  camara: string | null;
  codigo_id: number;
  estado?: string

  // Models
   expedienteModel?: ExpedienteModel | null;
   demandadoModel?: DemandadoModel | null;
   juzgadoModel?: JuzgadoModel | null;
   juezModel?: JuezModel | null;
   codigoModel?: CodigoModel | null;
}
