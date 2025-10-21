export interface Pago {
  id?: number;
  fecha: string;
  monto: number;
  tipo_pago: 'carta documento' | 'consulta' | 'otro';
}
