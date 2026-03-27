// src/app/shared/config/estados-honorarios.config.ts

export const ESTADOS_HONORARIOS: string[] = [
  'apelado',
  'firme',
  'pendiente',
  'diferido'
];

export const ESTADO_HONORARIO_DIFERIDO = 'diferido';

export const ESTADOS_HONORARIOS_APELADO: string[] = [
  'prorrateo - se resuelve',
  'prorrateo - a resolver',
  'pendiente de elevacion',
  'solicita se eleve',
  'en sala',
  'resolucion sala - confirma',
  'resolucion sala - se elevan',
  'resolucion sala - se reducen'
];

export const ESTADOS_HONORARIOS_PENDIENTE: string[] = [
  'sentencia',
  'solicita se regulan'
];

export const ESTADOS_HONORARIOS_DIFERIDO: string[] = [
  'diferido'
];

export const ESTADOS_HONORARIOS_FIRME: string[] = [
  'espera que vuelva',
  'intimacion pendiente',
  'honorario se intima',
  'honorario cedula',
  'honorario solicita embargo',
  'honorario embargo',

  'da en pago parcial',
  'da en pago total',

  'giro - solicita',
  'giro - previo',
  'giro - consiente',
  'giro rechazado',
  'giro'
];