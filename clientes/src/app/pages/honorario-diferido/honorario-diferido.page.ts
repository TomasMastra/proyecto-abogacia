import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subscription, Observable, forkJoin, Subject, of } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';

import { IonList, IonItemSliding, IonLabel, IonItem, IonInput } from "@ionic/angular/standalone";

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';
// pagosCapitalService
import { Pago } from 'src/app/models/pago/pago.component';
import { PagosService } from 'src/app/services/pagos.service';

import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { UsuarioService } from 'src/app/services/usuario.service';

import Swal from 'sweetalert2'

import {
  ESTADOS_CAPITAL_APELADO,
  ESTADOS_CAPITAL_PENDIENTE,
  ESTADOS_CAPITAL_FIRME
} from 'src/app/config/estados-capital.config';

import {
  ESTADOS_HONORARIOS_APELADO,
  ESTADOS_HONORARIOS_PENDIENTE,
  ESTADOS_HONORARIOS_DIFERIDO,
  ESTADOS_HONORARIOS_FIRME
} from 'src/app/config/estados-honorario.config';

@Component({
  selector: 'app-honorario-diferido',
  templateUrl: './honorario-diferido.page.html',
  styleUrls: ['./honorario-diferido.page.scss'],
  standalone: true,
    imports: [IonInput, IonItem, IonLabel, IonItemSliding, IonList, CommonModule, FormsModule,
      MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
      MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatMenuModule, MatProgressSpinnerModule,
      MatSelectModule,
      MatOptionModule,
      MatPaginatorModule,
    ]
})
export class HonorarioDiferidoPage implements OnInit, OnDestroy {

  cargando: boolean = false;
  honorariosDiferidos: any[] = [];
  honorariosOriginales: any[] = [];
  sentenciaCache: any[] = [];
  cobradoCache: any[] = [];

  hayHonorarios: boolean = true;
  private destroy$ = new Subject<void>();
  busqueda: string = '';

  ordenCampo: string = '';
  ordenAscendente: boolean = true;

  estado: string = 'sentencia'; // o 'cobrado'
  listaUsuarios: UsuarioModel[] = [];
  valorUMA: number = 70709;

  usuariosCargados = false;
  expedientesCargados = false;

  // Paginador
  pageSize: number = 500;
  pageIndex: number = 0;
  honorariosPaginados: any[] = [];


  //usuariosCargados = false;
  //expedientesCargados = false;
  cargaId: number = 0;


  private cargaToken = 0;
  estadoHonorarioSeleccionado: any;
  procuradorSeleccionado: string = '';
  /*
estadosHonorarios: string[] = [
  'espera que vuelva',
  'honorario se intima',
  'honorario cedula',
  'honorario solicita embargo',
  'honorario embargo',
  'da en pago parcial',
  'da en pago total',
  'giro - solicita',
  'giro - previo',
  'giro - consiente',
  'giro',
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
  'embarga deox',
  'embargo deox librado',
  'embargo ejecutado',
  'embargo citese de venta',
  'giro - consentido', // este es diferente de 'giro - consiente'
  'solicita se regulan'
];*/

  subEstadosCapitalApelado = ESTADOS_CAPITAL_APELADO;
  subEstadosCapitalPendiente = ESTADOS_CAPITAL_PENDIENTE;
  subEstadosCapitalFirme = ESTADOS_CAPITAL_FIRME;

  subEstadosHonorariosApelado = ESTADOS_HONORARIOS_APELADO;
  subEstadosHonorariosPendiente = ESTADOS_HONORARIOS_PENDIENTE;
  subEstadosHonorariosDiferido = ESTADOS_HONORARIOS_DIFERIDO;
  subEstadosHonorariosFirme = ESTADOS_HONORARIOS_FIRME;

estadosHonorarios: string[] = Array.from(new Set([
  ...ESTADOS_CAPITAL_APELADO,
  ...ESTADOS_CAPITAL_PENDIENTE,
  ...ESTADOS_CAPITAL_FIRME,
  ...ESTADOS_HONORARIOS_APELADO,
  ...ESTADOS_HONORARIOS_PENDIENTE,
  ...ESTADOS_HONORARIOS_DIFERIDO,
  ...ESTADOS_HONORARIOS_FIRME
])).sort((a, b) => a.localeCompare(b));

  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private pagosService: PagosService,

    private router: Router
  ) {}

ngOnInit() {
  this.usuariosCargados = false;
  this.expedientesCargados = false;
  this.setLoading();

  this.cargarUsuarios();
  this.cargarPorEstado('Sentencia');
}
  ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}

  cargarHonorariosDiferidos() {
    this.cargando = true;
    this.expedienteService.getHonorarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (honorarios) => {
          this.honorariosDiferidos = honorarios!;
          this.hayHonorarios = this.honorariosDiferidos.length > 0;

          // ✅ Solo agregar el juzgado a cada expediente
          this.honorariosDiferidos.forEach(expediente => {
            this.juzgadoService.getJuzgadoPorId(expediente.juzgado_id).subscribe(juzgado => {
              expediente.juzgadoModel = juzgado;

            });
          });
  
          this.cargando = false;
        },
        (error) => {
          console.error('Error al obtener expedientes:', error);
          this.cargando = false;
        }
      );
    }
    cargarPorEstado(estado: string) {
  this.cargando = true;

  this.expedienteService.getExpedientesPorEstado(estado)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (honorarios) => {
        this.honorariosOriginales = (honorarios || []).filter((item: any) => {
          const esMediacion = (item.tipo_registro ?? '').toString().toLowerCase() === 'mediacion';
          if (!esMediacion) return true;

          return !!(
            item.montoLiquidacionCapital != null ||
            item.montoLiquidacionHonorarios != null ||
            item.montoAcuerdo_alzada != null ||
            item.montoHonorariosEjecucion != null ||
            item.montoHonorariosDiferencia != null
          );
        });

        this.hayHonorarios = this.honorariosOriginales.length > 0;
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al obtener honorarios:', err);
        this.honorariosOriginales = [];
        this.honorariosDiferidos = [];
        this.hayHonorarios = false;
        this.cargando = false;
      }
    });
}

setLoading() {
  this.cargando = !(this.usuariosCargados && this.expedientesCargados);
}

  goTo(path: string) {
    this.cargando = false;      // <— agrega esto
    this.router.navigate([path], { replaceUrl: true });
  }


cargarUsuarios() {
  this.usuariosCargados = false;
  this.setLoading();

  this.usuarioService.getUsuarios()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (usuarios) => {
        this.listaUsuarios = usuarios || [];
        this.usuariosCargados = true;
        this.setLoading();

        // si ya había expedientes cargados, recalcula la vista
        if (this.expedientesCargados) {
          this.filtrar();
        }
      },
      error: (error) => {
        console.error('Error al obtener usuarios:', error);
        this.listaUsuarios = [];
        this.usuariosCargados = true;
        this.setLoading();
      }
    });
}

cambiarEstado(selectedValue: 'sentencia' | 'cobrado') {
  this.estado = selectedValue;
  this.cargaId++;

  if (selectedValue === 'cobrado') {
    this.expedientesCargados = false;
    this.setLoading();

    this.expedienteService.getExpedientesCobrados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expedientes) => {
          this.honorariosOriginales = expedientes || [];
          this.hayHonorarios = this.honorariosOriginales.length > 0;
          this.expedientesCargados = true;
          this.setLoading();

          this.filtrar();
        },
        error: (error) => {
          console.error('Error al obtener cobrados:', error);
          this.honorariosOriginales = [];
          this.honorariosDiferidos = [];
          this.hayHonorarios = false;
          this.expedientesCargados = true;
          this.setLoading();
        }
      });

    return;
  }

  if (selectedValue === 'sentencia') {
    this.cargarPorEstado('Sentencia');
  }
}

/*
get honorariosDiferidosOrdenados() {
  return [...this.honorariosDiferidos].sort((a, b) => {
    const campo = this.ordenCampo;

    const valorA = this.obtenerValorOrden(a, campo);
    const valorB = this.obtenerValorOrden(b, campo);

    if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
    if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
    return 0;
  });
   return [];
}*/

ordenarPor(campo: string) {
  if (this.ordenCampo === campo) {
    this.ordenAscendente = !this.ordenAscendente;
  } else {
    this.ordenCampo = campo;
    this.ordenAscendente = true;
  }

  this.aplicarFiltros();
}


trackByExpediente(index: number, item: any): number {
  return item.id;
}

obtenerValorOrden(item: any, campo: string): any {
  switch (campo) {
    case 'numero':
      return `${item.numero}/${item.anio}`;

case 'caratula':
  return (item.caratula || '').toLowerCase();


    case 'estadoCapital':
      return item.subEstadoCapitalSeleccionado || '';

    case 'fechaCapital':
      return item.fechaCapitalSubestado || '';

    case 'giro': {
      const prioridad = (estado: string | null | undefined, fecha: string | null | undefined) =>
        estado?.toLowerCase() === 'giro' && !fecha ? '0' : '1' + (estado?.toLowerCase() || '');

      const prioridades = [
        prioridad(item.subEstadoHonorariosSeleccionado, item.fecha_cobro),
        prioridad(item.subEstadoCapitalSeleccionado, item.fecha_cobro_capital),
        prioridad(item.subEstadoAlzadaSeleccionado, item.fechaCobroAlzada),
        prioridad(item.subEstadoEjecucionSeleccionado, item.fechaCobroEjecucion),
        prioridad(item.subEstadoDiferenciaSeleccionado, item.fechaCobroDiferencia),
      ];

      // Tomamos el menor (si hay alguno con '0...', se prioriza)
      return prioridades.sort()[0];
    }

    case 'fechaHonorarios':
      return item.fechaHonorariosSubestado || '';

    default:
      return '';
  }
}
/*
async cobrar(
  tipo: 'capital' | 'honorario' | 'alzada' | 'ejecucion' | 'diferencia',
  expediente: ExpedienteModel
) {
  const tipoTexto = tipo.charAt(0).toUpperCase() + tipo.slice(1);

  const result = await Swal.fire({
    title: `¿Seguro que querés cobrar ${tipoTexto}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, cobrar',
    cancelButtonText: 'Cancelar',
  });
  if (!result.isConfirmed) return;

  const dateResult = await Swal.fire({
    title: 'Seleccioná la fecha de cobro',
    input: 'date',
    inputLabel: 'Fecha de cobro',
    inputValue: new Date().toISOString().split('T')[0],
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar'
  });
  if (!dateResult.isConfirmed || !dateResult.value) return;

  const fechaSeleccionada = dateResult.value;

  // ================== CAPITAL ==================
  if (tipo === 'capital') {
    const totalCapital = expediente.montoLiquidacionCapital ?? 0;
    const yaPagado = Number(expediente.capitalPagoParcial) || 0;

    const yaEsParcial = !!(expediente as any)?.esPagoParcial || yaPagado > 0;

    let esParcial = true;
    if (!yaEsParcial) {
      const modalidadResult = await Swal.fire({
        title: 'Tipo de cobro (capital)',
        input: 'radio',
        inputOptions: {
          total: 'Pago TOTAL (se liquida el rubro)',
          parcial: 'Pago PARCIAL (se suma al acumulado)'
        },
        inputValue: 'total',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar'
      });
      if (!modalidadResult.isConfirmed || !modalidadResult.value) return;
      esParcial = modalidadResult.value === 'parcial';
    }

    const sugeridoParcial = totalCapital > 0 ? Math.max(totalCapital - yaPagado, 0) : '';

    const montoResult = await Swal.fire({
      title: '¿Cuánto te pagaron del capital?',
      input: 'number',
      inputLabel: 'Monto abonado',
      inputPlaceholder: 'Ingresá el monto',
      toast: true,
      inputAttributes: { min: '0', step: '0.01' },
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      inputValue: esParcial
        ? (sugeridoParcial === '' ? '' : String(sugeridoParcial))
        : (expediente.capitalPagoParcial ||
           this.calcularCobroFinal(expediente.montoLiquidacionCapital, expediente.porcentaje!, +expediente.usuario_id, expediente.procurador_id) || '')
    });
    if (!montoResult.isConfirmed || !montoResult.value) return;

    const montoAbonado = parseFloat(montoResult.value);
    if (!Number.isFinite(montoAbonado) || montoAbonado < 0) {
      await Swal.fire({
        icon: 'error',
        title: 'Monto inválido',
        text: 'Ingresá un número válido mayor o igual a 0.',
        confirmButtonText: 'Aceptar'
      });
      return;
    }

    if (esParcial) {
      expediente.capitalPagoParcial = yaPagado + montoAbonado;

      if (esParcial) {
  this.pagosService.getTotalPagosCapital(expediente.id).subscribe(resp => {

    const totalReal = Number(resp.total || 0);

    expediente.capitalPagoParcial = totalReal + montoAbonado;

    // acá seguís con tu flujo:
    // guardar pago + actualizar expediente

  });


      if (totalCapital > 0) {
        expediente.capitalCobrado = (expediente.capitalPagoParcial ?? 0) >= totalCapital;
      }

      (expediente as any).esPagoParcial = true;

      if (!expediente.capitalCobrado) {
        const stop = await Swal.fire({
          title: '¿Detenemos aquí los pagos parciales?',
          text: 'Si confirmás, el capital quedará marcado como COBRADO.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, ya está todo',
          cancelButtonText: 'Seguir cobrando después'
        });
        if (stop.isConfirmed) {
          expediente.capitalCobrado = true;
        }
      }
    } else {
      if (yaEsParcial) {
        await Swal.fire({
          icon: 'info',
          title: 'Ya hay pagos parciales',
          text: 'Una vez iniciado el pago por partes, solo podés seguir abonando como PARCIAL.',
          confirmButtonText: 'Aceptar'
        });
        return;
      }

      expediente.capitalPagoParcial = montoAbonado;
      expediente.capitalCobrado = true;
      (expediente as any).esPagoParcial = false;
    }

    expediente.fecha_cobro_capital = fechaSeleccionada;

    // ✅ CAMBIO ÚNICO: antes iba a pagos_capital, ahora va a pagos
    if ((expediente as any).esPagoParcial === true) {
      const pago: Pago = {
        expediente_id: Number(expediente.id),
        monto: montoAbonado,
        fecha: fechaSeleccionada,
        tipo_pago: 'capital'
      };

      this.pagosService.cargarPago(pago).subscribe({
        next: () => this.finalizarCobro(expediente, tipo, tipoTexto),
        error: (err) => {
          console.error('Error al insertar pago parcial:', err);
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Error al registrar el pago parcial.",
            showConfirmButton: false,
            timer: 3000
          });
        }
      });

      return;
    }

    // Capital TOTAL: flujo normal (queda igual que tu código)
    this.finalizarCobro(expediente, tipo, tipoTexto);
    return;
  }

  // ================== OTROS RUBROS ==================
  expediente.recalcular_caratula = false;
  switch (tipo) {
    case 'honorario':
      expediente.honorarioCobrado = true;
      expediente.fecha_cobro = fechaSeleccionada;
      break;
    case 'alzada':
      expediente.honorarioAlzadaCobrado = true;
      expediente.fechaCobroAlzada = fechaSeleccionada;
      break;
    case 'ejecucion':
      expediente.honorarioEjecucionCobrado = true;
      expediente.fechaCobroEjecucion = fechaSeleccionada;
      break;
    case 'diferencia':
      expediente.honorarioDiferenciaCobrado = true;
      expediente.fechaCobroDiferencia = fechaSeleccionada;
      break;
  }

  this.finalizarCobro(expediente, tipo, tipoTexto);
}*/

async cobrar(
  tipo: 'capital' | 'honorario' | 'alzada' | 'ejecucion' | 'diferencia',
  expediente: ExpedienteModel
) {
  const tipoTexto = tipo.charAt(0).toUpperCase() + tipo.slice(1);

  const result = await Swal.fire({
    title: `¿Seguro que querés cobrar ${tipoTexto}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, cobrar',
    cancelButtonText: 'Cancelar',
  });
  if (!result.isConfirmed) return;

  const dateResult = await Swal.fire({
    title: 'Seleccioná la fecha de cobro',
    input: 'date',
    inputLabel: 'Fecha de cobro',
    inputValue: new Date().toISOString().split('T')[0],
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar'
  });
  if (!dateResult.isConfirmed || !dateResult.value) return;

  const fechaSeleccionada = dateResult.value;

  // ================== CAPITAL ==================
 if (tipo === 'capital') {
  const totalCapital = expediente.montoLiquidacionCapital ?? 0;
  const yaPagado = Number(expediente.capitalPagoParcial) || 0;

  const yaEsParcial = !!(expediente as any)?.esPagoParcial || yaPagado > 0;

  let esParcial = true;

  if (!yaEsParcial) {
    const modalidadResult = await Swal.fire({
      title: 'Tipo de cobro (capital)',
      input: 'radio',
      inputOptions: {
        total: 'Pago TOTAL (se liquida el rubro)',
        parcial: 'Pago PARCIAL (se suma al acumulado)'
      },
      inputValue: 'total',
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar'
    });

    if (!modalidadResult.isConfirmed || !modalidadResult.value) return;
    esParcial = modalidadResult.value === 'parcial';
  }

  const sugeridoParcial = totalCapital > 0
    ? Math.max(totalCapital - yaPagado, 0)
    : '';

  const montoResult = await Swal.fire({
    title: '¿Cuánto te pagaron del capital?',
    input: 'number',
    inputLabel: 'Monto abonado',
    inputAttributes: { min: '0', step: '0.01' },
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValue: esParcial
      ? (sugeridoParcial === '' ? '' : String(sugeridoParcial))
      : (expediente.capitalPagoParcial ||
         this.calcularCobroFinal(
           expediente.montoLiquidacionCapital,
           expediente.porcentaje!,
           +expediente.usuario_id,
           expediente.procurador_id
         ) || '')
  });

  if (!montoResult.isConfirmed || !montoResult.value) return;

  const montoAbonado = parseFloat(montoResult.value);

  if (!Number.isFinite(montoAbonado) || montoAbonado < 0) {
    await Swal.fire({
      icon: 'error',
      title: 'Monto inválido',
      text: 'Ingresá un número válido mayor o igual a 0.'
    });
    return;
  }

  // ================= PARCIAL =================
  if (esParcial) {

    const pago: Pago = {
      expediente_id: Number(expediente.id),
      monto: montoAbonado,
      fecha: fechaSeleccionada,
      tipo_pago: 'capital'
    };

    this.pagosService.cargarPago(pago).subscribe({
      next: () => {

        this.pagosService.getTotalPagosCapital(expediente.id).subscribe({
          next: async (resp) => {

            const totalReal = Number(resp.total || 0);

            expediente.capitalPagoParcial = totalReal;
            (expediente as any).esPagoParcial = true;
            expediente.fecha_cobro_capital = fechaSeleccionada;

            if (totalCapital > 0) {
              expediente.capitalCobrado = totalReal >= totalCapital;
            }

            if (!expediente.capitalCobrado) {
              const stop = await Swal.fire({
                title: '¿Detenemos aquí los pagos parciales?',
                text: 'Si confirmás, el capital quedará marcado como COBRADO.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, ya está todo',
                cancelButtonText: 'Seguir cobrando después'
              });

              if (stop.isConfirmed) {
                expediente.capitalCobrado = true;
              }
            }

            this.finalizarCobro(expediente, tipo, tipoTexto);
          },

          error: (err) => {
            console.error('Error al obtener total real:', err);
            Swal.fire('Error', 'No se pudo recalcular el total.', 'error');
          }
        });
      },

      error: (err) => {
        console.error('Error al insertar pago:', err);
        Swal.fire('Error', 'Error al registrar el pago.', 'error');
      }

      
    });

    return;
  }

  // ================= TOTAL =================
  if (yaEsParcial) {
    await Swal.fire({
      icon: 'info',
      title: 'Ya hay pagos parciales',
      text: 'Una vez iniciado el pago por partes, solo podés seguir abonando como PARCIAL.'
    });
    return;
  }

  expediente.capitalPagoParcial = montoAbonado;
  expediente.capitalCobrado = true;
  (expediente as any).esPagoParcial = false;
  expediente.fecha_cobro_capital = fechaSeleccionada;

  this.finalizarCobro(expediente, tipo, tipoTexto);
  return;
}

    // ================== OTROS RUBROS ==================
  expediente.recalcular_caratula = false;

  switch (tipo) {
    case 'honorario':
      expediente.honorarioCobrado = true;
      expediente.fecha_cobro = fechaSeleccionada;
      break;

    case 'alzada':
      expediente.honorarioAlzadaCobrado = true;
      expediente.fechaCobroAlzada = fechaSeleccionada;
      break;

    case 'ejecucion':
      expediente.honorarioEjecucionCobrado = true;
      expediente.fechaCobroEjecucion = fechaSeleccionada;
      break;

    case 'diferencia':
      expediente.honorarioDiferenciaCobrado = true;
      expediente.fechaCobroDiferencia = fechaSeleccionada;
      break;
  }

  this.finalizarCobro(expediente, tipo, tipoTexto);
}




getCapitalParcial(item: ExpedienteModel) {
  const pagado = Number(item.capitalPagoParcial ?? 0);
  const total  = Number(item.montoLiquidacionCapital ?? 0);
  const completo = total > 0 ? pagado >= total : !!item.capitalCobrado;
  return { pagado, total, completo };
}
/*
finalizarCobro(expediente: ExpedienteModel, tipo: string, tipoTexto: string) {
  const montoCapital = expediente.montoLiquidacionCapital ?? 0;
  const capitalPagado = expediente.capitalPagoParcial ?? 0;
  expediente.recalcular_caratula = false;

  const capitalListo = expediente.capitalCobrado;
  const honorarioListo = expediente.honorarioCobrado;
  const alzadaListo = expediente.honorarioAlzadaCobrado || expediente.montoAcuerdo_alzada == null;
  const ejecucionListo = expediente.honorarioEjecucionCobrado || expediente.montoHonorariosEjecucion == null;
  const diferenciaListo = expediente.honorarioDiferenciaCobrado || expediente.montoHonorariosDiferencia == null;

  const todosCobrados = capitalListo && honorarioListo && alzadaListo && ejecucionListo && diferenciaListo;
  if (todosCobrados) expediente.estado = 'Cobrado';

  this.expedienteService.actualizarExpediente(expediente.id, expediente).subscribe({
    next: () => {
      this.cargarPorEstado('sentencia');

      let tituloToast = '';
      if (todosCobrados) {
        tituloToast = "Todos los rubros cobrados. Estado actualizado a COBRADO.";
      } else if (tipo === 'capital' && montoCapital > 0 && capitalPagado < montoCapital && !expediente.capitalCobrado) {
        tituloToast = `${tipoTexto}: pago parcial registrado.`;
      } else {
        tituloToast = `${tipoTexto} cobrado correctamente.`;
      }

      this.honorariosDiferidos = todosCobrados
        ? this.honorariosDiferidos.filter(e => e.id !== expediente.id)
        : this.honorariosDiferidos;

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: tituloToast,
        showConfirmButton: false,
        timer: 3000
      });
    },
    error: (err) => {
      console.error('Error al actualizar el expediente:', err);
      if (tipo === 'capital') {
        expediente.capitalCobrado = false;
        expediente.fecha_cobro_capital = null;
      }
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Error al cobrar. Intentalo nuevamente.",
        showConfirmButton: false,
        timer: 3000
      });
    }
  });
}*/



finalizarCobro(expediente: ExpedienteModel, tipo: string, tipoTexto: string) {
  this.expedienteService.getExpedientePorId(expediente.id).subscribe({
    next: (expCompleto) => {
      const actualizado: ExpedienteModel = {
        ...expCompleto,
        ...expediente,
        recalcular_caratula: false
      };

      const montoCapital = actualizado.montoLiquidacionCapital ?? 0;
      const capitalPagado = actualizado.capitalPagoParcial ?? 0;

      const capitalListo = actualizado.capitalCobrado;
      const honorarioListo = actualizado.honorarioCobrado;
      const alzadaListo = actualizado.honorarioAlzadaCobrado || actualizado.montoAcuerdo_alzada == null;
      const ejecucionListo = actualizado.honorarioEjecucionCobrado || actualizado.montoHonorariosEjecucion == null;
      const diferenciaListo = actualizado.honorarioDiferenciaCobrado || actualizado.montoHonorariosDiferencia == null;

      const todosCobrados = capitalListo && honorarioListo && alzadaListo && ejecucionListo && diferenciaListo;
      if (todosCobrados) actualizado.estado = 'Cobrado';

      this.expedienteService.actualizarExpediente(actualizado.id, actualizado).subscribe({
        next: () => {
          this.cargarPorEstado('sentencia');

          let tituloToast = '';
          if (todosCobrados) {
            tituloToast = 'Todos los rubros cobrados. Estado actualizado a COBRADO.';
          } else if (tipo === 'capital' && montoCapital > 0 && capitalPagado < montoCapital && !actualizado.capitalCobrado) {
            tituloToast = `${tipoTexto}: pago parcial registrado.`;
          } else {
            tituloToast = `${tipoTexto} cobrado correctamente.`;
          }

          this.honorariosDiferidos = todosCobrados
            ? this.honorariosDiferidos.filter(e => e.id !== actualizado.id)
            : this.honorariosDiferidos;

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: tituloToast,
            showConfirmButton: false,
            timer: 3000
          });
        },
        error: (err) => {
          console.error('Error al actualizar el expediente:', err);
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Error al cobrar. Intentalo nuevamente.',
            showConfirmButton: false,
            timer: 3000
          });
        }
      });
    },
    error: (err) => {
      console.error('Error al obtener expediente completo:', err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'No se pudo obtener el expediente completo.',
        showConfirmButton: false,
        timer: 3000
      });
    }
  });
}

// Muestra el renglón si el expediente corresponde al estado seleccionado
/*esVisible(item: any): boolean {


  if (this.estado === 'sentencia') {
    return (
      !item.capitalCobrado ||
      !item.honorarioCobrado ||
      (!item.honorarioAlzadaCobrado && item.estadoHonorariosAlzadaSeleccionado) ||
      (!item.honorarioEjecucionCobrado && item.estadoHonorariosEjecucionSeleccionado) ||
      (!item.honorarioDiferenciaCobrado && item.estadoHonorariosDiferenciaSeleccionado)
    );
  } else if (this.estado === 'cobrado') {
    return (
      item.capitalCobrado ||
      item.esPagoParcial == 1 ||
      item.honorarioCobrado ||
      item.honorarioAlzadaCobrado ||
      item.honorarioEjecucionCobrado ||
      item.honorarioDiferenciaCobrado ||
      item.estado == 'Archivo'
    );
  }

  return true;
}*/

esVisible(item: any): boolean {
  if (this.estado === 'sentencia') {
    return (!item.capitalCobrado || !item.honorarioCobrado ||
      (!item.honorarioAlzadaCobrado && item.estadoHonorariosAlzadaSeleccionado) ||
      (!item.honorarioEjecucionCobrado && item.estadoHonorariosEjecucionSeleccionado) ||
      (!item.honorarioDiferenciaCobrado && item.estadoHonorariosDiferenciaSeleccionado));
  } else if (this.estado === 'cobrado') {
    const hayParcial = (Number(item.capitalPagoParcial) || 0) > 0;
    const parcialFlag = item.esPagoParcial == 1 || item.esPagoParcial === true;
    return (item.capitalCobrado || parcialFlag || hayParcial || item.honorarioCobrado ||
            item.honorarioAlzadaCobrado || item.honorarioEjecucionCobrado ||
            item.honorarioDiferenciaCobrado || item.estado == 'Archivo');
  }
  return true;
}

mostrarCapital(item: any): boolean {
  return (this.estado === 'cobrado' && (item.capitalCobrado || item.esPagoParcial == 1)) || 
         (!item.capitalCobrado && this.estado === 'sentencia') ;
}


mostrarHonorario(item: any): boolean {
  return (!item.honorarioCobrado && this.estado === 'sentencia') ||
         (this.estado === 'cobrado' && item.honorarioCobrado);
}

mostrarAlzada(item: any): boolean {
  return (!item.honorarioAlzadaCobrado && this.estado === 'sentencia' && item.estadoHonorariosAlzadaSeleccionado) ||
         (this.estado === 'cobrado' && item.honorarioAlzadaCobrado && item.estadoHonorariosAlzadaSeleccionado);
}

mostrarEjecucion(item: any): boolean {
 return (!item.honorarioEjecucionCobrado && this.estado === 'sentencia' && item.estadoHonorariosEjecucionSeleccionado) ||
         (this.estado === 'cobrado' && item.honorarioEjecucionCobrado && item.estadoHonorariosEjecucionSeleccionado);
}

mostrarDiferencia(item: any): boolean {
  return (!item.honorarioDiferenciaCobrado && this.estado === 'sentencia' && item.estadoHonorariosDiferenciaSeleccionado) ||
         (this.estado === 'cobrado' && item.honorarioDiferenciaCobrado && item.estadoHonorariosDiferenciaSeleccionado);
         
}

calcularCobro(monto: number | null, porcentaje: number | null): number {
  if (monto != null && porcentaje != null) {
    //return (monto * (100 - porcentaje)) / 100;
    return (monto *  porcentaje) / 100;

  }
  return 0;
}

/*
calcularCobroFinal(monto: number | null, porcentaje: number, usuario_id: number): number {
  
  if (monto != null && porcentaje != null) {
    const usuario = this.listaUsuarios.find(u => u.id === usuario_id);
    if (usuario && usuario.porcentaje != null) {
      const montoConPorcentajeGeneral = (monto * porcentaje) / 100;
      //const montoConPorcentajeGeneral =  (monto * (100 - porcentaje)) / 100;

      //return (montoConPorcentajeGeneral * (100 - usuario.porcentaje)) / 100;
      return (montoConPorcentajeGeneral * (100 - usuario.porcentaje)) / 100;


    }
  }
  
  return 0;
}*/

calcularCobroFinal(
  monto: number | null,
  porcentaje: number | null,
  usuario_id: number | null,
  procurador_id: number | null
): number {

  if (
    monto == null ||
    porcentaje == null ||
    usuario_id == null ||
    procurador_id == null
  ) {
    return 0;
  }

  const ADMIN_ID = 7;

  // 1) Primero se divide con el cliente
  const montoConPorcentajeGeneral = (monto * porcentaje) / 100;

  // 2) Si ambos son tu papá, cobra el 100% de lo que quedó
  if (usuario_id === ADMIN_ID && procurador_id === ADMIN_ID) {
    return montoConPorcentajeGeneral;
  }

  // 3) Si ambos son el mismo otro abogado, tu papá cobra el complemento de ese abogado
  if (usuario_id === procurador_id) {
    const usuario = this.listaUsuarios.find(u => u.id === usuario_id);
    if (!usuario) return 0;

    const porcentajeOtro = Number(usuario.porcentaje ?? 0);
    return (montoConPorcentajeGeneral * (100 - porcentajeOtro)) / 100;
  }

  // 4) Si uno es tu papá y el otro no, buscar al otro abogado
  const otroId = usuario_id === ADMIN_ID ? procurador_id : usuario_id;
  const otroUsuario = this.listaUsuarios.find(u => u.id === otroId);

  if (!otroUsuario) {
    return 0;
  }

  const porcentajeOtro = Number(otroUsuario.porcentaje ?? 0);

  // 5) Tu papá cobra el complemento del otro
  return (montoConPorcentajeGeneral * (100 - porcentajeOtro)) / 100;
}

calcularParteAbogado(
  montoYaDelEstudio: number | null,
  usuario_id: number | null,
  procurador_id: number | null
): number {
  if (montoYaDelEstudio == null || usuario_id == null || procurador_id == null) return 0;

  const ADMIN_ID = 7;

  if (usuario_id === ADMIN_ID && procurador_id === ADMIN_ID) {
    return montoYaDelEstudio;
  }

  if (usuario_id === procurador_id) {
    const usuario = this.listaUsuarios.find(u => u.id === usuario_id);
    const porcentajeOtro = Number(usuario?.porcentaje ?? 0);
    return (montoYaDelEstudio * (100 - porcentajeOtro)) / 100;
  }

  const otroId = usuario_id === ADMIN_ID ? procurador_id : usuario_id;
  const otroUsuario = this.listaUsuarios.find(u => u.id === otroId);
  const porcentajeOtro = Number(otroUsuario?.porcentaje ?? 0);

  return (montoYaDelEstudio * (100 - porcentajeOtro)) / 100;
}

calcularCobroFinalHonorario(
  monto: number | null,
  usuario_id: number | null,
  procurador_id: number | null
): number {
  if (monto == null || usuario_id == null || procurador_id == null) {
    return 0;
  }

  const ADMIN_ID = 7;

  // Si ambos son tu papá, cobra el 100%
  if (usuario_id === ADMIN_ID && procurador_id === ADMIN_ID) {
    return monto;
  }

  // Si ambos son el mismo otro abogado, tu papá cobra el complemento de ese abogado
  if (usuario_id === procurador_id) {
    const usuario = this.listaUsuarios.find(u => u.id === usuario_id);
    if (!usuario) return 0;

    const porcentaje = Number(usuario.porcentajeHonorarios ?? 0);
    return (monto * (100 - porcentaje)) / 100;
  }

  // Si uno es tu papá y el otro no, buscar al otro abogado
  const otroId = usuario_id === ADMIN_ID ? procurador_id : usuario_id;
  const otroUsuario = this.listaUsuarios.find(u => u.id === otroId);

  if (!otroUsuario) {
    return 0;
  }

  const porcentajeOtro = Number(otroUsuario.porcentajeHonorarios ?? 0);

  // Tu papá cobra el complemento del otro
  return (monto * (100 - porcentajeOtro)) / 100;
}

getCantidadColumnas(item: any): number {
  let columnas = 2;

  //if (this.mostrarCapital(item)) columnas++;
  //if (this.mostrarHonorario(item)) columnas++;
  if (item.estadoHonorariosAlzadaSeleccionado) columnas++;
  if (item.estadoHonorariosEjecucionSeleccionado) columnas++;
  if (item.estadoHonorariosDiferenciaSeleccionado) columnas++;

  if(item.numero == 1){
    console.log(columnas);
  }
  return columnas;
}

existeCapital(item: any): boolean {
  return item.capitalCobrado || this.mostrarCapital(item);
}

filtrar() {
  this.aplicarFiltros();
}

aplicarFiltros() {
  const texto = (this.busqueda || '').toLowerCase().trim();

  this.honorariosDiferidos = this.honorariosOriginales.filter((expediente: any) => {

    const estadoBuscado = this.estadoHonorarioSeleccionado?.toLowerCase();

    const procuradorOk = this.procuradorSeleccionado
      ? expediente.procurador_id === +this.procuradorSeleccionado
      : true;

    const coincideEstado = (estado: string | null | undefined, fechaCobro: string | null | undefined) =>
      estado?.toLowerCase() === estadoBuscado && (!fechaCobro || `${fechaCobro}`.trim() === '');

    const estadoCoincide = this.estadoHonorarioSeleccionado
      ? (
          coincideEstado(expediente.subEstadoHonorariosSeleccionado, expediente.fecha_cobro) ||
          coincideEstado(expediente.subEstadoCapitalSeleccionado, expediente.fecha_cobro_capital) ||
          coincideEstado(expediente.subEstadoHonorariosAlzadaSeleccionado, expediente.fechaCobroAlzada) ||
          coincideEstado(expediente.subEstadoHonorariosEjecucionSeleccionado, expediente.fechaCobroEjecucion) ||
          coincideEstado(expediente.subEstadoHonorariosDiferenciaSeleccionado, expediente.fechaCobroDiferencia)
        )
      : true;

    const numeroOk = expediente.numero?.toString().includes(texto);
    const anioOk = expediente.anio?.toString().includes(texto);

    const matchParte = (p: any) => {
      if (!p) return false;
      const n = p?.nombre?.toLowerCase() || '';
      const a = p?.apellido?.toLowerCase() || '';
      const rs = (p?.razonSocial ?? p?.razon_social ?? '').toLowerCase();
      const nf = (p?.nombreFantasia ?? p?.nombre_fantasia ?? '').toLowerCase();
      const den = (p?.denominacion ?? '').toLowerCase();

      return (
        n.includes(texto) ||
        a.includes(texto) ||
        rs.includes(texto) ||
        nf.includes(texto) ||
        den.includes(texto) ||
        `${n} ${a}`.trim().includes(texto)
      );
    };

    const actoraOk =
      (expediente.clientes?.some(matchParte) ?? false) ||
      ((expediente as any).actoras?.some(matchParte) ?? false) ||
      ((expediente as any).actorasEmpresas?.some(matchParte) ?? false) ||
      matchParte((expediente as any).actora) ||
      matchParte((expediente as any).actoraEmpresa) ||
      ['actoraNombre','actora_razon_social','actoraRazonSocial','actora_empresa','caratula','carátula']
        .some(k => (expediente as any)[k]?.toLowerCase?.().includes(texto));

    const demandadoOk =
      (expediente.demandados?.some(matchParte) ?? false) ||
      ((expediente as any).demandadosClientes?.some(matchParte) ?? false) ||
      matchParte((expediente as any).demandado) ||
      ['demandadoNombre','demandado_razon_social','demandadoRazonSocial']
        .some(k => (expediente as any)[k]?.toLowerCase?.().includes(texto));

    const caratulaOk = expediente.caratula?.toLowerCase?.().includes(texto);

    const busquedaOk = texto === '' || numeroOk || anioOk || actoraOk || demandadoOk || caratulaOk;

    return estadoCoincide && busquedaOk && procuradorOk && this.esVisible(expediente);
  });
  this.pageIndex = 0;
  this.actualizarPagina();
}

/*
filtrar() {
  const texto = (this.busqueda || '').toLowerCase().trim();

  this.honorariosDiferidos = this.honorariosOriginales.filter((expediente: any) => {
    const estadoBuscado = this.estadoHonorarioSeleccionado?.toLowerCase();
    const procuradorOk  = this.procuradorSeleccionado ? expediente.procurador_id === +this.procuradorSeleccionado : true;

    const coincideEstado = (estado: string | null | undefined, fechaCobro: string | null | undefined) => {
      return estado?.toLowerCase() === estadoBuscado && (!fechaCobro || `${fechaCobro}`.trim() === '');
    };

    const estadoCoincide = this.estadoHonorarioSeleccionado
      ? (
          coincideEstado(expediente.subEstadoHonorariosSeleccionado, expediente.fecha_cobro) ||
          coincideEstado(expediente.subEstadoCapitalSeleccionado, expediente.fecha_cobro_capital) ||
          coincideEstado((expediente as any).subEstadoAlzadaSeleccionado, (expediente as any).fechaCobroAlzada) ||
          coincideEstado((expediente as any).subEstadoEjecucionSeleccionado, (expediente as any).fechaCobroEjecucion) ||
          coincideEstado((expediente as any).subEstadoDiferenciaSeleccionado, (expediente as any).fechaCobroDiferencia)
        )
      : true;

    const numeroOk = expediente.numero?.toString().includes(texto);
    const anioOk   = expediente.anio?.toString().includes(texto);
    const tipoRegistro = (expediente.tipo_registro ?? '').toString().toLowerCase();


    const matchParte = (p: any) => {
      if (!p) return false;
      const n   = p?.nombre?.toLowerCase() || '';
      const a   = p?.apellido?.toLowerCase() || '';
      const rs  = (p?.razonSocial ?? p?.razon_social ?? '').toLowerCase();
      const nf  = (p?.nombreFantasia ?? p?.nombre_fantasia ?? '').toLowerCase();
      const den = (p?.denominacion ?? '').toLowerCase();
      return (
        n.includes(texto) ||
        a.includes(texto) ||
        rs.includes(texto) ||
        nf.includes(texto) ||
        den.includes(texto) ||
        `${n} ${a}`.trim().includes(texto)
      );
    };

    const actoraOk =
      (expediente.clientes?.some(matchParte) ?? false) ||
      ((expediente as any).actoras?.some(matchParte) ?? false) ||
      ((expediente as any).actorasEmpresas?.some(matchParte) ?? false) ||
      matchParte((expediente as any).actora) ||
      matchParte((expediente as any).actoraEmpresa) ||
      ['actoraNombre','actora_razon_social','actoraRazonSocial','actora_empresa','caratula','carátula']
        .some(k => (expediente as any)[k]?.toLowerCase?.().includes(texto));

    const demandadoOk =
      (expediente.demandados?.some(matchParte) ?? false) ||
      ((expediente as any).demandadosClientes?.some(matchParte) ?? false) ||
      matchParte((expediente as any).demandado) ||
      ['demandadoNombre','demandado_razon_social','demandadoRazonSocial']
        .some(k => (expediente as any)[k]?.toLowerCase?.().includes(texto));

    const caratulaOk = expediente.caratula?.toLowerCase?.().includes(texto);

    const busquedaOk = texto === '' || numeroOk || anioOk || actoraOk || demandadoOk || caratulaOk;

    return estadoCoincide && busquedaOk && procuradorOk;
  });
}*/

tieneEstadoGiroPorTipo(item: any, tipo: string): boolean {
  const revisar = (estado?: string) => (estado ?? '').toLowerCase() === 'giro';

  if (this.estado !== 'sentencia') return false;

  switch (tipo) {
    case 'capital':
      return (
        !item.capitalCobrado &&
        (revisar(item.subEstadoCapitalSeleccionado) ||
         revisar(item.estadoLiquidacionCapitalSeleccionado))
      );

    case 'honorarios':
      return (
        !item.honorarioCobrado &&
        (revisar(item.subEstadoHonorariosSeleccionado) ||
         revisar(item.estadoLiquidacionHonorariosSeleccionado))
      );

    case 'alzada':
      return (
        !item.honorarioAlzadaCobrado &&
        revisar(item.subEstadoHonorariosAlzadaSeleccionado)
      );

    case 'ejecucion':
      return (
        !item.honorarioEjecucionCobrado &&
        revisar(item.subEstadoHonorariosEjecucionSeleccionado)
      );

    case 'diferencia':
      return (
        !item.honorarioDiferenciaCobrado &&
        revisar(item.subEstadoHonorariosDiferenciaSeleccionado)
      );

    default:
      return false;
  }
}



/*
restaurarCobro(item: any) {
  Swal.fire({
    icon: 'warning',
    title: '¿Restaurar cobro?',
    html: 'Esto dejará todos los cobros en <b>no cobrado</b> y limpiará fechas/montos de cobro (no toca los estados).',
    showCancelButton: true,
    confirmButtonText: 'Sí, restaurar',
    cancelButtonText: 'Cancelar'
  }).then(res => {
    if (!res.isConfirmed) return;

    // 🔒 CLAVE: preparar el cuerpo ANTES de enviar (para que el backend reciba los flags en 0)
    const body = { ...item };

    // Flags (uso 0 porque en tu UI comparás == 1 en algunos lados)
    body.honorarioCobrado           = 0;
    body.capitalCobrado             = 0;
    body.honorarioAlzadaCobrado     = 0;
    body.honorarioEjecucionCobrado  = 0;
    body.honorarioDiferenciaCobrado = 0;

    // Fechas de cobro
    body.fecha_cobro          = null;
    body.fecha_cobro_capital  = null;
    body.fechaCobroAlzada     = null;
    body.fechaCobroEjecucion  = null;
    body.fechaCobroDiferencia = null;

    // Mantené o no el parcial según tu criterio:
    // Si querés resetearlo completamente:
    body.capitalPagoParcial = null;      // o 0 si preferís número
    // Si querés conservar lo cobrado hasta ahora, comentá la línea de arriba.

    // Anti-recalcular carátula (el server sólo recalcula si esto NO es false)
    body.recalcular_caratula = false;
    body.capitalPagoParcial = null;
    body.esPagoParcial = 0;
    body.estado = 'Sentencia';


    this.expedienteService.actualizarExpediente(item.id, body).subscribe({
      next: () => {
        // 🔄 Reflejar en UI exactamente lo que se mandó
        Object.assign(item, body);

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Cobro restaurado',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (e) => {
        console.error(e);
        Swal.fire({
          icon: 'error',
          title: 'Error al restaurar',
          text: e?.error?.message || 'Intentalo de nuevo'
        });
      }
    });
  });
}*/

restaurarCobro(item: any) {
  Swal.fire({
    icon: 'warning',
    title: '¿Restaurar cobro?',
    html: 'Esto dejará todos los cobros en <b>no cobrado</b> y limpiará fechas/montos de cobro (no toca los estados).',
    showCancelButton: true,
    confirmButtonText: 'Sí, restaurar',
    cancelButtonText: 'Cancelar'
  }).then(res => {
    if (!res.isConfirmed) return;

    // 🔒 CLAVE: preparar el cuerpo ANTES de enviar
    const body = { ...item };

    body.honorarioCobrado           = 0;
    body.capitalCobrado             = 0;
    body.honorarioAlzadaCobrado     = 0;
    body.honorarioEjecucionCobrado  = 0;
    body.honorarioDiferenciaCobrado = 0;

    body.fecha_cobro          = null;
    body.fecha_cobro_capital  = null;
    body.fechaCobroAlzada     = null;
    body.fechaCobroEjecucion  = null;
    body.fechaCobroDiferencia = null;

    body.capitalPagoParcial = null;
    body.recalcular_caratula = false;
    body.esPagoParcial = 0;
    body.estado = 'Sentencia';

    // primero borra pagos, después actualiza expediente
    this.pagosService.eliminarPagosPorExpediente(item.id).subscribe({
      next: () => {
        this.expedienteService.actualizarExpediente(item.id, body).subscribe({
          next: () => {
            Object.assign(item, body);

            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Cobro restaurado',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (e) => {
            console.error(e);
            Swal.fire({
              icon: 'error',
              title: 'Error al restaurar',
              text: e?.error?.message || 'Intentalo de nuevo'
            });
          }
        });
      },
      error: (e) => {
        console.error(e);
        Swal.fire({
          icon: 'error',
          title: 'Error al borrar pagos',
          text: e?.error?.message || 'Intentalo de nuevo'
        });
      }
    });
  });
}

// Paginador
actualizarPagina(): void {
  const start = this.pageIndex * this.pageSize;
  this.honorariosPaginados = this.honorariosDiferidos.slice(start, start + this.pageSize);
}

onPageChange(event: PageEvent): void {
  this.pageSize = event.pageSize;
  this.pageIndex = event.pageIndex;
  this.actualizarPagina();
}

getRowspan(item: any): number {
  let total = 0;

  if (this.mostrarCapital(item)) total++;
  if (this.mostrarHonorario(item)) total++;
  if (this.mostrarAlzada(item)) total++;
  if (this.mostrarEjecucion(item)) total++;
  if (this.mostrarDiferencia(item)) total++;

  return total || 1;
}

}