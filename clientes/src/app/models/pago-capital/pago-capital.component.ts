// models/pago-capital.model.ts
export interface PagoCapitalModel {
  id?: number;
  expediente_id: number;
  monto: number;
  fecha_pago: string; // 'YYYY-MM-DD'
}
