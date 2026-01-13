import { MediacionModel } from '../mediacion/mediacion.component';
import { ClienteModel } from '../cliente/cliente.component';
import { ExpedienteModel } from '../expediente/expediente.component';


export interface EventoModel {
    id?: number;
    titulo: string | null;
    descripcion?: string | null;
    fecha_evento: string;
    hora_evento?: string | null;
    tipo_evento: string;
    ubicacion?: string | null;
    creado_en?: string;
    actualizado_en?: string;
    mediacion_id?: number | null;
    mediacion: MediacionModel | null;
    clientes: ClienteModel[]; 
    estado?: string | null;
    expediente_id: number | null,
    link_virtual: string | null,
    expediente: ExpedienteModel | null;
  }
  