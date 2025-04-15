export interface EventoModel {
    id?: number; // Opcional porque lo genera la base de datos
    titulo: string;
    descripcion?: string; // Opcional
    fecha_evento: string; // Usamos string para compatibilidad con el datepicker
    hora_evento?: string; // Opcional
    tipo_evento: string;
    ubicacion?: string; // Opcional
    creado_en?: string; // Opcional, lo maneja la base de datos
    actualizado_en?: string; // Opcional, lo maneja la base de datos
  }
  