export interface Pago {
  id?: number;
  fecha: string;
  monto: number;
  tipo_pago: 'carta documento' | 'consulta' | 'otro' | 'capital' | 'honorario'| 'alzada' | 'ejecucion' | 'diferencia';
  expediente_id: number | string;
}
