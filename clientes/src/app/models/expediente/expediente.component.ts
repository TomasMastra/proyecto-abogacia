import { ClienteModel } from '../cliente/cliente.component';
import { DemandadoModel } from '../demandado/demandado.component';
import { JuezModel } from '../juez/juez.component';
import { JuzgadoModel } from '../juzgado/juzgado.component';

export interface ExpedienteModel {
  id: string,
  titulo: string | null,
  clientes: ClienteModel[], 
  demandados: DemandadoModel[], 

  fecha_creacion: string,
  descripcion: string,
  juzgado_id: number | null,
  demandado_id: number | null,
  numero: number,
  anio: number,
  usuario_id: string,
  demandadoModel: DemandadoModel | null,
  estado: string,
  sala_radicacion: string | null,
  honorario: string | null,
  fecha_inicio: string | null,
  fecha_sentencia: string | null,
  hora_sentencia: string | null,
  juez_id: string | null,
  juezModel: JuezModel | null,
  juicio: string | null,
  ultimo_movimiento: string | null,
  monto: number | null,
  apela: boolean | null,
  juzgadoModel: JuzgadoModel | null
  procurador_id: number | null,
  sala: string | null,

    // 📌 Capital
    estadoCapitalSeleccionado: string | null,
    subEstadoCapitalSeleccionado: string | null,
    fechaCapitalSubestado: string | null,
    estadoLiquidacionCapitalSeleccionado: string | null,
    fechaLiquidacionCapital: string | null,
    montoLiquidacionCapital: number | null,
    capitalCobrado: boolean | null,

    // 📌 Honorarios
    estadoHonorariosSeleccionado: string | null,
    subEstadoHonorariosSeleccionado: string | null,
    fechaHonorariosSubestado: string | null,
    estadoLiquidacionHonorariosSeleccionado: string | null,
    fechaLiquidacionHonorarios: string | null,
    montoLiquidacionHonorarios: number | null,
    honorarioCobrado: boolean | null,
    cantidadUMA: Number | null,
    numeroCliente: string | null,
    minutosSinLuz: string | null,
    periodoCorte: string | null,
    porcentaje: number | null,
    fecha_cobro: string | null,
    fecha_cobro_capital: string | null,
    valorUMA: number | null,
    requiere_atencion: boolean,
    fecha_atencion: Date | null;

    estadoHonorariosAlzadaSeleccionado?: string | null;
    subEstadoHonorariosAlzadaSeleccionado?: string | null;
    fechaHonorariosAlzada?: string | null;
    umaSeleccionado_alzada?: number | null;
    cantidadUMA_alzada?: number | null;
    montoAcuerdo_alzada?: number | null;

    // Honorarios Ejecución
    estadoHonorariosEjecucionSeleccionado?: string | null;
    subEstadoHonorariosEjecucionSeleccionado?: string | null;
    fechaHonorariosEjecucion?: string | null;
    umaSeleccionado_ejecucion?: number | null;
    cantidadUMA_ejecucion?: number | null;
    montoHonorariosEjecucion?: number | null;

    // Honorarios Diferencia
    estadoHonorariosDiferenciaSeleccionado?: string | null;
    subEstadoHonorariosDiferenciaSeleccionado?: string | null;
    fechaHonorariosDiferencia?: string | null;
    montoHonorariosDiferencia?: number | null;

    // Cobro honorarios extra
    honorarioAlzadaCobrado: boolean;
    fechaCobroAlzada: string | null;

    honorarioEjecucionCobrado: boolean;
    fechaCobroEjecucion: string | null;

    honorarioDiferenciaCobrado: boolean;
    fechaCobroDiferencia: string | null;

    capitalPagoParcial: number | null;



  }
  