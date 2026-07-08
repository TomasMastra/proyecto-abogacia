export interface ReintegroModel {
  id?: number;

  fecha_gasto: string;
  monto: number;
  descripcion: string;

  categoria?: string | null;
  estado?: 'pendiente' | 'pagado' | 'anulado';

  pagado_por_usuario_id?: number | null;
  debe_pagar_usuario_id?: number | null;

  cliente_id?: number | null;
  expediente_id?: number | null;

  beneficiario_nombre?: string | null;
  beneficiario_tipo?: string | null;

  metodo_pago?: string | null;
  comprobante_url?: string | null;
  observaciones?: string | null;

  fecha_pagado?: string | null;
  creado_por_usuario_id?: number | null;

  created_at?: string;
  updated_at?: string;

  pagado_por_nombre?: string;
  debe_pagar_nombre?: string;
  creado_por_nombre?: string;

  cliente_nombre?: string;
  cliente_apellido?: string;

  expediente_numero?: number;
  expediente_anio?: number;
  expediente_caratula?: string;
}