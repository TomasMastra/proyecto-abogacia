export interface DemandadoModel {
  id: string,
  nombre: string | null,
  apellido?: string | null;
  estado: string,
  localidad_id: number,
  direccion: string,
  esOficio: boolean
}
