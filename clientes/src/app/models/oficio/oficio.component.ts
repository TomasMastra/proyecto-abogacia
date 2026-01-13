import { DemandadoModel } from '../demandado/demandado.component';
import { ExpedienteModel } from '../expediente/expediente.component';


export interface OficioModel {
  id?: number;
  expediente_id: number;
  demandado_id: number;
  parte: 'actora' | 'demanda' | 'tercero';

  estado: 'diligenciado' | 'pendiente' | 'pedir reiteratorio' | 'diligenciar' | 'solicita reiteratorio' | 'eliminado';

  fecha_diligenciado?: string | null;

  expedienteModel?: ExpedienteModel;
  demandadoModel?: DemandadoModel | null;

  tipo?: 'oficio' | 'testimonial' | 'pericia';

  tipo_pericia?: string;

  supletoria?: string | null;

  testigo?: string; 
  fecha_testimonial?: string | null;

  observaciones?: string;
}
