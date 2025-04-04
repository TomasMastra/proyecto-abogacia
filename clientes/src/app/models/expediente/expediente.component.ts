import { ClienteModel } from '../cliente/cliente.component';
import { DemandadoModel } from '../demandado/demandado.component';
import { JuezModel } from '../juez/juez.component';

export interface ExpedienteModel {
  id: string,
  titulo: string | null,
  clientes: ClienteModel[], 
  fecha_creacion: string,
  descripcion: string,
  juzgado_id: number | null,
  demandado_id: number | null,
  numero: number,
  anio: number,
  demandadoModel: DemandadoModel,
  estado: string,
  sala_radicacion: string | null,
  honorario: string | null,
  fecha_inicio: string | null,
  fecha_sentencia: string | null,
  hora_sentencia: string | null,
  juez_id: string | null,
  juezModel: JuezModel | null,
  juicio: string | null,
  ultimo_movimiento: string | null,
  monto: number | null,
  apela: boolean | null
  }
  