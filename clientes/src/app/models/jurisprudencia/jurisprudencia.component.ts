import { ExpedienteModel } from '../expediente/expediente.component';
import { JuzgadoModel } from '../juzgado/juzgado.component';
import { JuezModel } from '../juez/juez.component';
import { CodigoModel } from '../codigo/codigo.component';
import { DemandadoModel } from '../demandado/demandado.component';

export interface JurisprudenciaDemandadoModel {
  id: number;
  tipo: 'empresa' | 'cliente';
  nombre?: string | null;
}

export interface JurisprudenciaModel {
  id: string;

  // caso expediente propio
  expediente_id?: number | null;

  // propio / ajeno
  tipo_expediente?: 'propio' | 'ajeno';

  // caso expediente ajeno
  numero?: number | null;
  anio?: number | null;
  objeto?: string | null;

  // comunes
  fuero?: string | null;
  juzgado_id?: number | null;
  juez_id?: number | null;
  sentencia?: string | null;
  camara?: string | null;
  codigo_id?: number | null;

  // nuevos campos
  fecha_alzada?: string | null;
  resultado?: 'favorable' | 'desfavorable' | null;
  motivo?: string | null;

  estado?: string;
  caratula?: string;

  // compatibilidad vieja
  demandado_id?: number | null;

  // nuevo esquema
  demandados?: JurisprudenciaDemandadoModel[];

  // Models
  expedienteModel?: ExpedienteModel | null;
  demandadoModel?: DemandadoModel | null;
  juzgadoModel?: JuzgadoModel | null;
  juezModel?: JuezModel | null;
  codigoModel?: CodigoModel | null;
}