export interface OficioModel {
  id?: number;
  expediente_id: number;
  demandado_id: number;
  parte: 'actora' | 'demanda' | 'tercero';
  estado: 'diligenciado' | 'pendiente' | 'pedir reiteratorio' | 'diligenciar' | 'solicita reiteratorio' | 'eliminado';
  fecha_diligenciado?: string | null;

  // Referencias opcionales para mostrar más info si querés expandir en el futuro
  expedienteModel?: any;
  demandadoModel?: any;
}
