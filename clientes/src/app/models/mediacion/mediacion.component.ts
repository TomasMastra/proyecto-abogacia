export interface MediacionModel {
  id?: number;
  numero: string;
  abogado_id: number;
  cliente_id: number | null;
  demandado_id: number;
  fecha: string | null;
  mediadora?: string;
  finalizada: boolean;
}
