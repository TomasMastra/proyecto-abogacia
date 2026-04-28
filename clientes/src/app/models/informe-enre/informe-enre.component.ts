export interface InformeEnreModel {

  // 🔹 Identificación
  id?: number;

  // 🔹 Relación
  expediente_id?: number | null;
  cliente_id?: string | null;

  // 🔹 Cliente
  nombre?: string | null;
  apellido?: string | null;

  // 🔹 Expediente (si existe)
  numero?: number | null;
  anio?: number | null;

  // 🔹 Empresa
  empresa_id: number;

  // 🔹 Fecha base
  fecha_inicio: Date | string;

  // 🔹 Datos ENRE
  numero_cliente_edesur?: string | null;

  fecha_pedido_informe?: Date | string | null;
  fecha_respuesta_informe?: Date | string | null;

  tiene_cortes?: boolean | null;
  dias_cortes?: number | null;

  // 🔹 Observaciones
  observaciones_reclamo?: string | null;

  // 🔹 Estado
  estado_reclamo?: string;

  // 🔹 Auxiliares UI (opcional)
  estado_descripcion?: string;
}