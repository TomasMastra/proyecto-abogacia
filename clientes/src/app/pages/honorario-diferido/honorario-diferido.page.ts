import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subscription, Observable, forkJoin, Subject } from 'rxjs';


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
import { MatDialog } from '@angular/material/dialog';

import { IonList, IonItemSliding, IonLabel, IonItem, IonInput } from "@ionic/angular/standalone";

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { UsuarioService } from 'src/app/services/usuario.service';

import Swal from 'sweetalert2'


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
    ]
})
export class HonorarioDiferidoPage implements OnInit, OnDestroy {

  cargando: boolean = false;
  honorariosDiferidos: any[] = [];
  honorariosOriginales: any[] = [];

  hayHonorarios: boolean = true;
  private destroy$ = new Subject<void>();
  busqueda: string = '';

  ordenCampo: string = '';
  ordenAscendente: boolean = true;

  estado: string = 'sentencia'; // o 'cobrado'
  listaUsuarios: UsuarioModel[] = [];
  valorUMA: number = 70709;

estadoHonorarioSeleccionado: any;
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
  'giro - consentido' // este es diferente de 'giro - consiente'
];






  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarPorEstado('sentencia');
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
      .subscribe(
        (honorarios) => {
          //this.honorariosDiferidos = honorarios;
          this.honorariosDiferidos = honorarios!;
          this.hayHonorarios = this.honorariosDiferidos.length > 0;
          this.honorariosOriginales = honorarios!
  
          this.honorariosDiferidos.forEach(expediente => {
            this.juzgadoService.getJuzgadoPorId(expediente.juzgado_id).subscribe(juzgado => {
              expediente.juzgadoModel = juzgado;
            });
          });
  
          this.busqueda = '';
        this.ordenarPor('giro');

          this.cargando = false;
        },
        (error) => {
          console.error('Error al obtener expedientes:', error);
          this.cargando = false;
        }
      );
  }

  goTo(path: string) {
    this.cargando = false;      // <— agrega esto
    this.router.navigate([path], { replaceUrl: true });
  }



cargarUsuarios() {
  this.usuarioService.getUsuarios()
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (usuarios) => {
        this.listaUsuarios = usuarios;
      },
      (error) => {
        console.error('Error al obtener usuarios:', error);
      }
    );
}

cambiarEstado(event: Event) {
  const selectedValue = (event.target as HTMLSelectElement).value;
  console.log('Estado seleccionado:', selectedValue);

  this.estado = selectedValue;

  if (selectedValue === 'todos') {
    this.cargarHonorariosDiferidos();
  } else if (selectedValue === 'cobrado') {
    this.expedienteService.getExpedientesCobrados().subscribe(expedientes => {
      this.honorariosDiferidos = expedientes!;
      this.honorariosOriginales = expedientes!;
      this.ordenarPor('giro');
    });
  } else if (selectedValue === 'sentencia') {
    this.cargarPorEstado('sentencia'); // o podés hacer otro método si querés separar lógica
  }
}

get honorariosDiferidosOrdenados() {
  return [...this.honorariosDiferidos].sort((a, b) => {
    const campo = this.ordenCampo;

    const valorA = this.obtenerValorOrden(a, campo);
    const valorB = this.obtenerValorOrden(b, campo);

    if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
    if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
    return 0;
  });
}

ordenarPor(campo: string) {
  if (this.ordenCampo === campo) {
    this.ordenAscendente = !this.ordenAscendente;
  } else {
    this.ordenCampo = campo;
    this.ordenAscendente = true;
  }
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

      // Chequea prioridad en orden: honorarios, capital, alzada, ejecución, diferencia
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



async cobrar(tipo: 'capital' | 'honorario' | 'alzada' | 'ejecucion' | 'diferencia', expediente: ExpedienteModel) {
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
if (tipo === 'capital') {
  const montoResult = await Swal.fire({
    title: '¿Cuánto te pagaron del capital?',
    input: 'number',
    inputLabel: 'Monto abonado',
    inputPlaceholder: 'Ingresá el monto',
    toast: true,
    inputAttributes: {
      min: '0',
      step: '0.01'
    },
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValue: expediente.capitalPagoParcial || this.calcularCobroFinal(expediente.montoLiquidacionCapital, expediente.porcentaje!, +expediente.usuario_id) || ''
  });

  if (!montoResult.isConfirmed || montoResult.value === '') return;

  const montoAbonado = parseFloat(montoResult.value);

/*
  if (montoAbonado > montoTotal) {
    await Swal.fire({
      icon: 'error',
      title: 'Monto inválido',
      text: `El monto ingresado no puede superar los $${montoTotal.toLocaleString()}`,
      confirmButtonText: 'Aceptar'
    });
    return;
  }*/

  expediente.capitalPagoParcial = montoAbonado;
  expediente.fecha_cobro_capital = fechaSeleccionada;
  expediente.capitalCobrado = true;
  //expediente.montoLiquidacionCapital = montoAbonado;

  this.finalizarCobro(expediente, tipo, tipoTexto);
  return;
}


  // Casos honorarios normales
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


finalizarCobro(expediente: ExpedienteModel, tipo: string, tipoTexto: string) {
  const montoCapital = expediente.montoLiquidacionCapital ?? 0;
  const capitalPagado = expediente.capitalPagoParcial ?? 0;

  // Validación segura: solo marcar capital como cobrado si se abonó todo
  //expediente.capitalCobrado = capitalPagado == montoCapital;

  const capitalListo = expediente.capitalCobrado;
  const honorarioListo = expediente.honorarioCobrado;
  const alzadaListo = expediente.honorarioAlzadaCobrado || expediente.montoAcuerdo_alzada == null;
  const ejecucionListo = expediente.honorarioEjecucionCobrado || expediente.montoHonorariosEjecucion == null;
  const diferenciaListo = expediente.honorarioDiferenciaCobrado || expediente.montoHonorariosDiferencia == null;

  const todosCobrados = capitalListo && honorarioListo && alzadaListo && ejecucionListo && diferenciaListo;

  if (todosCobrados) expediente.estado = 'Cobrado';
/**/ 
  this.expedienteService.actualizarExpediente(expediente.id, expediente).subscribe({
    next: () => {
      this.cargarPorEstado('sentencia');

      const tituloToast = todosCobrados
        ? "Todos los rubros cobrados. Estado actualizado a COBRADO."
        : `${tipoTexto} cobrado correctamente.`;

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

      // Revertir en caso de error solo lo que corresponda
      if (tipo === 'capital') {
        expediente.capitalCobrado = false;
        expediente.fecha_cobro_capital = null;
        expediente.capitalPagoParcial = null;
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
}



// Muestra el renglón si el expediente corresponde al estado seleccionado
esVisible(item: any): boolean {
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
      item.honorarioCobrado ||
      item.honorarioAlzadaCobrado ||
      item.honorarioEjecucionCobrado ||
      item.honorarioDiferenciaCobrado ||
      item.estado == 'Archivo'
    );
  }

  return true;
}


mostrarCapital(item: any): boolean {
  return (this.estado === 'cobrado' && item.capitalCobrado) || 
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
}


calcularCobroFinalHonorario(monto: number | null, usuario_id: number): number {
  
  if (monto != null && usuario_id != null) {
    const usuario = this.listaUsuarios.find(u => u.id === usuario_id);
    if (usuario && usuario.porcentajeHonorarios != null) {
    return (monto * (100 - usuario.porcentajeHonorarios)) / 100;

    }
  }
  return 0;
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
  this.honorariosDiferidos = [];  // limpia datos por si quedan pegados
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
/*
filtrar() {
  const texto = this.busqueda.toLowerCase();

  this.honorariosDiferidos = this.honorariosOriginales.filter(expediente => {
    const estadoBuscado = this.estadoHonorarioSeleccionado?.toLowerCase();

    const coincideEstado = (estado: string | null | undefined, fechaCobro: string | null | undefined) => {
      return estado?.toLowerCase() === estadoBuscado && !fechaCobro;
    };

    const estadoCoincide = this.estadoHonorarioSeleccionado
      ? (
        coincideEstado(expediente.subEstadoHonorariosSeleccionado, expediente.fecha_cobro) ||
        coincideEstado(expediente.subEstadoCapitalSeleccionado, expediente.fecha_cobro_capital) ||
        coincideEstado(expediente.subEstadoAlzadaSeleccionado, expediente.fechaCobroAlzada) ||
        coincideEstado(expediente.subEstadoEjecucionSeleccionado, expediente.fechaCobroEjecucion) ||
        coincideEstado(expediente.subEstadoDiferenciaSeleccionado, expediente.fechaCobroDiferencia)
      )
      : true;

    const numeroOk = expediente.numero?.toString().includes(texto);
    const anioOk = expediente.anio?.toString().includes(texto);

    const clienteOk = expediente.clientes?.some((cliente: any) =>
      (cliente.nombre && cliente.nombre.toLowerCase().includes(texto)) ||
      (cliente.apellido && cliente.apellido.toLowerCase().includes(texto))
    ) ?? false;

    const busquedaOk = texto === '' || numeroOk || anioOk || clienteOk;

    return estadoCoincide && busquedaOk;
  });
}*/
filtrar() {
  const texto = (this.busqueda || '').toLowerCase().trim();

  this.honorariosDiferidos = this.honorariosOriginales.filter((expediente: any) => {
    const estadoBuscado = this.estadoHonorarioSeleccionado?.toLowerCase();

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

    return estadoCoincide && busquedaOk;
  });
}





tieneEstadoGiroPorTipo(item: any, tipo: string): boolean {
  const revisar = (estado: string | undefined) =>
    estado?.toLowerCase() === 'giro';

  if (this.estado !== 'sentencia') {
    return false;
  }
    switch (tipo) {
    case 'capital':
      return (
        !item.capitalCobrado &&
        (revisar(item.subEstadoCapitalSeleccionado) || revisar(item.estadoLiquidacionCapitalSeleccionado))
      );

    case 'honorarios':
      return (
        !item.honorarioCobrado &&
        (revisar(item.subEstadoHonorariosSeleccionado) || revisar(item.estadoLiquidacionHonorariosSeleccionado))
      );

    case 'alzada':
      return (
        !item.alzadaCobrado &&
        revisar(item.subEstadoAlzadaSeleccionado)
      );

    case 'ejecucion':
      return (
        !item.ejecucionCobrado &&
        revisar(item.subEstadoEjecucionSeleccionado)
      );

    case 'diferencia':
      return (
        !item.diferenciaCobrado &&
        revisar(item.subEstadoDiferenciaSeleccionado)
      );

    default:
      return false;
  }
}
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

    this.expedienteService.restaurarCobro(item.id).subscribe({
      next: () => {
        // 🔄 reflejo en UI (sin tocar liquidaciones)
        item.honorarioCobrado           = 0;
        item.capitalCobrado             = 0;
        item.honorarioAlzadaCobrado     = 0;
        item.honorarioEjecucionCobrado  = 0;
        item.honorarioDiferenciaCobrado = 0;

        item.fecha_cobro            = null;
        item.fecha_cobro_capital    = null;
        item.fechaCobroAlzada       = null;
        item.fechaCobroEjecucion    = null;
        item.fechaCobroDiferencia   = null;

        //item.montoAcuerdo_alzada       = null;
        //item.montoHonorariosEjecucion  = null;
        //item.montoHonorariosDiferencia = null;

        item.capitalPagoParcial = null;
        item.recalcular_caratula = false;

        Swal.fire({
          toast:true, position:'top-end', icon:'success',
          title:'Cobro restaurado', timer:1500, showConfirmButton:false
        });
      },
      error: (e) => {
        console.error(e);
        Swal.fire({icon:'error',title:'Error al restaurar', text:e?.error?.message || 'Intentalo de nuevo'});
      }
    });
  });
}

  
}