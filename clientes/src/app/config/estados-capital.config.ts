// src/app/shared/config/estados-capital.config.ts

export const ESTADOS_CAPITAL: string[] = [
  'apelado',
  'firme',
  'pendiente'
];

export const ESTADOS_CAPITAL_APELADO: string[] = [
  'concede en relacion',
  'pendiente de elevacion',
  'solicita se eleve',
  'en sala',
  'resolucion sala'
];

export const ESTADOS_CAPITAL_PENDIENTE: string[] = [
  'sentencia'
];

export const ESTADOS_CAPITAL_FIRME: string[] = [
  'esperar a que baje de sala',
  'liquidacion pendiente',
  'liquidacion practicada',
  'liquidacion traslado - cedula',
  'liquidacion impugnada',
  'liquidacion contesta impugnacion',
  'liquidacion se resuelve impugnacion',
  'liquidacion - se apruebe',
  'liquidacion aprobada - se intime',
  'liquidacion aprobada - cedula',

  'embargo solicita',
  'embargo deox',
  'embargo deox librado',
  'embargo ejecutado',
  'embargo citese de venta',

  'da en pago total',
  'da en pago parcial',

  'cbu pendiente',

  'giro - solicita',
  'giro - previo',
  'giro - consentido',
  'giro rechazado',
  'giro'
];

export const SUBESTADOS_CAPITAL_CON_MONTO: string[] = [
  'liquidacion practicada',
  'liquidacion impugnada',
  'liquidacion contesta impugnacion',
  'liquidacion se resuelve impugnacion',
  'liquidacion - se apruebe',
  'liquidacion aprobada - se intime',
  'liquidacion aprobada - cedula',
  'da en pago total',
  'da en pago parcial',
  'giro'
];