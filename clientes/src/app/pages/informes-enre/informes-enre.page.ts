import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { InformesEnreService } from 'src/app/services/informes-enre.service';
import { InformeEnreModel } from 'src/app/models/informe-enre/informe-enre.component';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-informes-enre',
  standalone: true,
  templateUrl: './informes-enre.page.html',
  styleUrls: ['./informes-enre.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ]
})
export class InformesEnrePage {

  cargando = false;

  modoCarga: 'expediente' | 'manual' = 'expediente';

  informes: any[] = [];
  informesOriginales: any[] = [];

  informesAgrupados: any[] = [];
  informesAgrupadosOriginales: any[] = [];

  clientes: ClienteModel[] = [];

  busqueda = '';
  empresaSeleccionada = '';

  tabActiva: 'para-reactivar' | 'en-tramite' | 'con-cortes' | 'sin-cortes' = 'para-reactivar';

  listaParaReactivar: any[] = [];
  listaEnTramite: any[] = [];
  listaConCortes: any[] = [];
  listaSinCortes: any[] = [];

  listaParaReactivarOriginal: any[] = [];
  listaEnTramiteOriginal: any[] = [];
  listaConCortesOriginal: any[] = [];
  listaSinCortesOriginal: any[] = [];

  modalAbierto = false;
  modoEdicion = false;

  expedienteSeleccionado: any = null;
  clienteSeleccionado: ClienteModel | null = null;

  formModal: any = this.getFormVacio();

  // Paginador — uno por tab
  pageSize = 20;
  pageIndexReactivar = 0;
  pageIndexTramite = 0;
  pageIndexConCortes = 0;
  pageIndexSinCortes = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  get listaParaReactivarPaginada() { const s = this.pageIndexReactivar * this.pageSize; return this.listaParaReactivar.slice(s, s + this.pageSize); }
  get listaEnTramitePaginada()     { const s = this.pageIndexTramite   * this.pageSize; return this.listaEnTramite.slice(s, s + this.pageSize); }
  get listaConCortesPaginada()     { const s = this.pageIndexConCortes * this.pageSize; return this.listaConCortes.slice(s, s + this.pageSize); }
  get listaSinCortesPaginada()     { const s = this.pageIndexSinCortes * this.pageSize; return this.listaSinCortes.slice(s, s + this.pageSize); }

  onPageReactivar(e: any)  { this.pageSize = e.pageSize; this.pageIndexReactivar = e.pageIndex; }
  onPageTramite(e: any)    { this.pageSize = e.pageSize; this.pageIndexTramite   = e.pageIndex; }
  onPageConCortes(e: any)  { this.pageSize = e.pageSize; this.pageIndexConCortes = e.pageIndex; }
  onPageSinCortes(e: any)  { this.pageSize = e.pageSize; this.pageIndexSinCortes = e.pageIndex; }

  constructor(private expedientesService: ExpedientesService, private clientesService: ClientesService, 
    private informesEnreService: InformesEnreService
) {}

  ngOnInit() {
    this.cargar();
    this.cargarClientes();
  }

  getFormVacio() {
    return {
      id_relevamiento: null,
      numero_cliente_edesur: '',
      fecha_pedido_informe: '',
      fecha_respuesta_informe: '',
      tiene_cortes: null,
      dias_cortes: null,
      observaciones: '',
      //estado: 'pendiente_relevamiento',
      estado_descripcion: 'Pendiente de relevamiento'
    };
  }

  cargar() {
    this.cargando = true;

    this.expedientesService.getInformeEnre().subscribe({
      next: (dataExpedientes: any[]) => {

        this.informesEnreService.getInformesManuales().subscribe({
          next: (dataManuales: any[]) => {

            const agrupadosExpedientes = this.agruparPorExpediente(dataExpedientes || []);

            const manualesNormalizados = (dataManuales || []).map(item => ({
              ...item,

              es_manual: true,
              id: item.id,
              informe_enre_id: item.id,
              expediente_id: null,
              cliente_id: Number(item.cliente_id),


              numero: null,
              anio: null,
              caratula: item.nombre_cliente || `${item.nombre || ''} ${item.apellido || ''}`.trim(),

              clientes: [{
                cliente_id: item.cliente_id,
                nombre: item.nombre || item.nombre_cliente || '',
                apellido: item.apellido || ''
              }],

              empresa_id: item.empresa_id,
              fecha_inicio: item.fecha_inicio,

              numero_cliente_edesur: item.numero_cliente_edesur ?? '',
              fecha_pedido_informe: item.fecha_pedido_informe ?? '',
              fecha_respuesta_informe: item.fecha_respuesta_informe ?? '',
              tiene_cortes: this.normalizarBoolean(item.tiene_cortes),
              dias_cortes: item.dias_cortes ?? null,
              observaciones_reclamo: item.observaciones_reclamo ?? '',
              estado_reclamo: item.estado_reclamo ?? 'pendiente_relevamiento'
            }));

            this.informesAgrupadosOriginales = [
              ...agrupadosExpedientes,
              ...manualesNormalizados
            ];

            this.informesAgrupados = [...this.informesAgrupadosOriginales];

            this.recalcularListas();
            this.cargando = false;
          },
          error: (err) => {
            console.error('ERROR INFORMES MANUALES:', err);
            this.cargando = false;
          }
        });
      },
      error: (err) => {
        console.error('ERROR INFORME ENRE:', err);
        this.cargando = false;
      }
    });
  }

  cargarClientes() {
  this.clientesService.getClientes().subscribe({
    next: (data: any[]) => {
      this.clientes = data || [];
    },
    error: (err) => {
      console.error('Error al cargar clientes:', err);
      this.clientes = [];
    }
  });
}

  recalcularListas() {
    const baseFiltrada = this.aplicarFiltroBase(this.informesAgrupadosOriginales);

    const enriquecida = baseFiltrada.map(item => {
      const estadoCalculado = this.obtenerEstado(item);

      return {
        ...item,
        estado_calculado: estadoCalculado.estado,
        estado_descripcion: estadoCalculado.descripcion
      };
    });

    this.listaParaReactivarOriginal = enriquecida.filter(x => x.estado_calculado  === 'pendiente_relevamiento');
    this.listaEnTramiteOriginal = enriquecida.filter(
      x => x.estado_calculado === 'informe_pedido' || x.estado_calculado === 'informe_respondido_pendiente_cortes'
    );
    this.listaConCortesOriginal = enriquecida.filter(x => x.estado_calculado  === 'con_cortes');
    this.listaSinCortesOriginal = enriquecida.filter(x => x.estado_calculado  === 'sin_cortes');

    this.listaParaReactivar = [...this.listaParaReactivarOriginal];
    this.listaEnTramite = [...this.listaEnTramiteOriginal];
    this.listaConCortes = [...this.listaConCortesOriginal];
    this.listaSinCortes = [...this.listaSinCortesOriginal];
  }

  filtrar() {
    this.recalcularListas();
  }

  aplicarFiltroBase(lista: any[]) {
    const texto = (this.busqueda || '').toLowerCase().trim();

    return (lista || []).filter(item => {
      const empresaOk = this.empresaSeleccionada
        ? Number(item.empresa_id) === Number(this.empresaSeleccionada)
        : true;

      const numeroOk = item.numero?.toString().toLowerCase().includes(texto);
      const anioOk = item.anio?.toString().toLowerCase().includes(texto);
      const caratulaOk = (item.caratula || '').toLowerCase().includes(texto);

      const clienteOk = item.clientes?.some((cliente: any) =>
        (`${cliente.nombre || ''} ${cliente.apellido || ''}`)
          .toLowerCase()
          .includes(texto)
      );

      const busquedaOk = !texto || numeroOk || anioOk || clienteOk || caratulaOk;

      return empresaOk && busquedaOk;
    });
  }
agruparPorExpediente(data: any[]) {
  const mapa = new Map<string, any>();

  data.forEach(item => {
    const key = `${item.numero}-${item.anio}-${item.empresa_id}-${item.fecha_inicio}`;

    if (!mapa.has(key)) {
      mapa.set(key, {
        id: item.id ?? item.expediente_id ?? null,
        expediente_id: item.expediente_id ?? item.id ?? null,

        numero: item.numero,
        anio: item.anio,
        empresa_id: item.empresa_id,
        empresa: item.empresa,
        fecha_inicio: item.fecha_inicio,
        caratula: item.caratula || `${item.numero}/${item.anio}`,
        clientes: [],

        numero_cliente_edesur: item.numero_cliente_edesur ?? '',
        fecha_pedido_informe: item.fecha_pedido_informe ?? '',
        fecha_respuesta_informe: item.fecha_respuesta_informe ?? '',
        tiene_cortes: this.normalizarBoolean(item.tiene_cortes),
        dias_cortes: item.dias_cortes ?? null,
        observaciones_reclamo: item.observaciones_reclamo ?? '',
        estado_reclamo: item.estado_reclamo ?? 'pendiente_relevamiento'
      });
    }

    mapa.get(key).clientes.push({
      cliente_id: item.cliente_id,
      nombre: item.nombre,
      apellido: item.apellido
    });
  });

  return Array.from(mapa.values());
}

  normalizarBoolean(valor: any): boolean | null {
    if (valor === true || valor === 'true' || valor === 1 || valor === '1' || valor === 'SI' || valor === 'Si' || valor === 'sí' || valor === 'S') {
      return true;
    }

    if (valor === false || valor === 'false' || valor === 0 || valor === '0' || valor === 'NO' || valor === 'No' || valor === 'N') {
      return false;
    }

    return null;
  }

obtenerEstado(item: any): { estado: string; descripcion: string } {
  const estadoOriginal =
    item?.estado_reclamo ?? item?.estado ?? 'pendiente_relevamiento';

  const descripciones: Record<string, string> = {
    informe_pedido: 'Informe pedido',
    informe_respondido_pendiente_cortes: 'Falta definir si tiene cortes',
    con_cortes: 'Con cortes',
    sin_cortes: 'Sin cortes',
    pendiente_relevamiento: 'Pendiente de relevamiento'
  };

  return {
    estado: estadoOriginal,
    descripcion: descripciones[estadoOriginal] || 'Pendiente de relevamiento'
  };
}

abrirModalNuevo(item: any) {
  this.modoCarga = 'expediente';
  this.modoEdicion = false;
  this.modalAbierto = true;
  this.expedienteSeleccionado = { ...item };

  this.formModal = {
    ...this.getFormVacio(),
    numero_cliente_edesur: item.numero_cliente_edesur || '',
    fecha_pedido_informe: this.formatearFechaInput(item.fecha_pedido_informe),
    fecha_respuesta_informe: this.formatearFechaInput(item.fecha_respuesta_informe),
    tiene_cortes: item.tiene_cortes ?? null,
    dias_cortes: item.dias_cortes ?? null,
    observaciones: item.observaciones || ''
  };
}

abrirModalEditar(item: any) {
  this.modoCarga = item.es_manual ? 'manual' : 'expediente';
  this.modoEdicion = true;
  this.modalAbierto = true;
  this.expedienteSeleccionado = item.es_manual ? null : { ...item };

  this.formModal = {
    ...this.getFormVacio(),

    id: item.id ?? item.informe_enre_id ?? null,
    id_relevamiento: item.id_relevamiento ?? null,

    cliente_id: Number(item.cliente_id ?? item.clientes?.[0]?.cliente_id ?? null),
    empresa_id: Number(item.empresa_id ?? 1),
    fecha_inicio: this.formatearFechaInput(item.fecha_inicio),

    numero_cliente_edesur: item.numero_cliente_edesur || '',
    fecha_pedido_informe: this.formatearFechaInput(item.fecha_pedido_informe),
    fecha_respuesta_informe: this.formatearFechaInput(item.fecha_respuesta_informe),
    tiene_cortes: item.tiene_cortes ?? null,
    dias_cortes: item.dias_cortes ?? null,
    observaciones: item.observaciones_reclamo || item.observaciones || '',
    estado_reclamo: item.estado_reclamo || 'pendiente_relevamiento'
  };
}

  cerrarModal() {
    this.modalAbierto = false;
    this.modoEdicion = false;
    this.expedienteSeleccionado = null;
    this.formModal = this.getFormVacio();
  }

  calcularEstadoReclamo(): string {
  if (!this.formModal.fecha_pedido_informe) {
    return 'pendiente_relevamiento';
  }

  if (!this.formModal.fecha_respuesta_informe) {
    return 'informe_pedido';
  }

  if (this.formModal.tiene_cortes === true) {
    return 'con_cortes';
  }

  if (this.formModal.tiene_cortes === false) {
    return 'sin_cortes';
  }

  return 'informe_respondido_pendiente_cortes';
}

guardarModal() {


  if (this.modoCarga === 'manual') {

    if (!this.formModal.cliente_id) {
      alert('Seleccioná un cliente.');
      return;
    }

    if (!this.formModal.fecha_inicio) {
      alert('Cargá la fecha de inicio.');
      return;
    }

    if (!this.formModal.empresa_id) {
      alert('Seleccioná la empresa.');
      return;
    }

    const payload: InformeEnreModel = {
      cliente_id: this.formModal.cliente_id,
      empresa_id: Number(this.formModal.empresa_id),
      fecha_inicio: this.formModal.fecha_inicio,

      numero_cliente_edesur: this.formModal.numero_cliente_edesur || null,
      fecha_pedido_informe: this.formModal.fecha_pedido_informe || null,
      fecha_respuesta_informe: this.formModal.fecha_respuesta_informe || null,
      tiene_cortes: this.formModal.fecha_respuesta_informe ? this.formModal.tiene_cortes : null,
      dias_cortes: this.formModal.tiene_cortes === true ? Number(this.formModal.dias_cortes) : null,
      observaciones_reclamo: this.formModal.observaciones || null,
      estado_reclamo: this.calcularEstadoReclamo()
    };

    this.cargando = true;

    const request$ = this.modoEdicion && this.formModal.id
  ? this.informesEnreService.actualizarInformeManual(this.formModal.id, payload)
  : this.informesEnreService.crearInformeManual(payload);

request$.subscribe({
      next: () => {
        this.cerrarModal();
        this.cargar();
      },
      error: (err) => {
        console.error('Error al guardar informe manual:', err);
        this.cargando = false;
        alert('No se pudo guardar el informe manual.');
      }
    });

    return;
  }

  if (!this.expedienteSeleccionado) return;

  const idExpediente =
    this.expedienteSeleccionado.id ?? this.expedienteSeleccionado.expediente_id;

  if (!idExpediente) {
    alert('El expediente no tiene id válido.');
    return;
  }

  if (!this.formModal.numero_cliente_edesur?.toString().trim()) {
    alert('Debés cargar el número de cliente EDESUR.');
    return;
  }

  if (!this.formModal.fecha_pedido_informe) {
    alert('Debés cargar la fecha de pedido de informe.');
    return;
  }

  let estadoReclamo = 'informe_pedido';

  if (this.formModal.fecha_respuesta_informe) {
    if (this.formModal.tiene_cortes === true) {
      if (this.formModal.dias_cortes == null || Number(this.formModal.dias_cortes) <= 0) {
        alert('Debés cargar los días reclamables.');
        return;
      }
      estadoReclamo = 'con_cortes';
    } else if (this.formModal.tiene_cortes === false) {
      estadoReclamo = 'sin_cortes';
    } else {
      estadoReclamo = 'informe_respondido_pendiente_cortes';
    }
  }

  const expedienteActualizado: any = {
    ...this.expedienteSeleccionado,

    numero_cliente_edesur: this.formModal.numero_cliente_edesur,
    fecha_pedido_informe: this.formModal.fecha_pedido_informe || null,
    fecha_respuesta_informe: this.formModal.fecha_respuesta_informe || null,
    tiene_cortes: this.formModal.fecha_respuesta_informe
      ? this.formModal.tiene_cortes
      : null,
    dias_cortes:
      this.formModal.fecha_respuesta_informe && this.formModal.tiene_cortes === true
        ? Number(this.formModal.dias_cortes)
        : null,
    observaciones_reclamo: this.formModal.observaciones_reclamo || null,
    estado_reclamo: estadoReclamo
  };

  console.log('GUARDANDO:', expedienteActualizado);

  this.cargando = true;

  this.expedientesService.actualizarExpediente(idExpediente, expedienteActualizado).subscribe({
    next: () => {
      this.cerrarModal();
      this.cargar();
    },
    error: (error) => {
      console.error('Error al actualizar expediente:', error);
      this.cargando = false;
      alert('No se pudo guardar el relevamiento.');
    }
  });
}


resetCortes() {
  this.formModal.fecha_respuesta_informe = null;
  this.formModal.tiene_cortes = null;
  this.formModal.dias_cortes = null;
}

  actualizarRegistroEnMemoria(registroActualizado: any) {
    this.informesAgrupadosOriginales = this.informesAgrupadosOriginales.map(item => {
      const mismoExpediente =
        Number(item.expediente_id ?? 0) === Number(registroActualizado.expediente_id ?? 0) &&
        Number(item.numero ?? 0) === Number(registroActualizado.numero ?? 0) &&
        Number(item.anio ?? 0) === Number(registroActualizado.anio ?? 0);

      if (!mismoExpediente) return item;

      return {
        ...item,
        numero_cliente_edesur: registroActualizado.numero_cliente_edesur,
        fecha_pedido_informe: registroActualizado.fecha_pedido_informe,
        fecha_respuesta_informe: registroActualizado.fecha_respuesta_informe,
        tiene_cortes: registroActualizado.tiene_cortes,
        dias_cortes: registroActualizado.dias_cortes,
        observaciones: registroActualizado.observaciones,
        estado: registroActualizado.estado,
        estado_descripcion: registroActualizado.estado_descripcion
      };
    });
  }

deshacerCambios(item: any) {
  if (item.es_manual) {
    const payload = {
      cliente_id: item.cliente_id ?? item.clientes?.[0]?.cliente_id,
      empresa_id: Number(item.empresa_id ?? 1),
      fecha_inicio: this.formatearFechaInput(item.fecha_inicio),

      numero_cliente_edesur: item.numero_cliente_edesur ?? null,
      fecha_pedido_informe: item.fecha_pedido_informe ?? null,
      fecha_respuesta_informe: null,
      tiene_cortes: null,
      dias_cortes: null,
      observaciones_reclamo: item.observaciones_reclamo ?? null,
      estado_reclamo: 'informe_pedido'
    };

    this.informesEnreService.actualizarInformeManual(item.id, payload as any).subscribe({
      next: () => this.cargar(),
      error: (error) => {
        console.error('Error al deshacer informe manual:', error);
        alert('No se pudo deshacer.');
      }
    });

    return;
  }

  const idExpediente = item.id ?? item.expediente_id;

  if (!idExpediente) {
    alert('El expediente no tiene id válido.');
    return;
  }

  const expedienteActualizado = {
    ...item,
    fecha_respuesta_informe: null,
    tiene_cortes: null,
    dias_cortes: null,
    estado_reclamo: 'informe_pedido'
  };

  this.expedientesService.actualizarExpediente(idExpediente, expedienteActualizado).subscribe({
    next: () => this.cargar(),
    error: (error) => {
      console.error('Error al deshacer cambios:', error);
      alert('No se pudo deshacer.');
    }
  });
}

iniciar(item: any) {
  const idExpediente = item.id ?? item.expediente_id;

  if (!idExpediente) {
    alert('El expediente no tiene id válido.');
    return;
  }

  const expedienteActualizado = {
    ...item,
    estado_reclamo: 'informe_pedido'
  };

  this.expedientesService.actualizarExpediente(idExpediente, expedienteActualizado).subscribe({
    next: () => this.cargar(),
    error: (error) => {
      console.error('Error al deshacer cambios:', error);
      alert('No se pudo deshacer.');
    }
  });
}

  calcularAntiguedad(fecha: string | null | undefined): string {
    if (!fecha) return '-';

    const fechaBase = new Date(fecha);
    if (isNaN(fechaBase.getTime())) return '-';

    const hoy = new Date();

    let anios = hoy.getFullYear() - fechaBase.getFullYear();
    let meses = hoy.getMonth() - fechaBase.getMonth();

    if (meses < 0) {
      anios--;
      meses += 12;
    }

    if (anios <= 0 && meses <= 0) return 'Menos de 1 mes';
    if (anios <= 0) return `${meses} mes${meses === 1 ? '' : 'es'}`;

    return `${anios} año${anios === 1 ? '' : 's'} y ${meses} mes${meses === 1 ? '' : 'es'}`;
  }

  formatearFechaInput(fecha: string | null | undefined): string {
    if (!fecha) return '';

    const soloFecha = fecha.split('T')[0].split(' ')[0];
    if (soloFecha === '1900-01-01') return '';

    return soloFecha;
  }

  getTituloClientes(item: any): string {
    if (!item?.clientes || item.clientes.length === 0) return '';

    if (item.clientes.length === 1) {
      return `${item.clientes[0].nombre} ${item.clientes[0].apellido}`;
    }

    return `${item.clientes[0].nombre} ${item.clientes[0].apellido} y otros`;
  }

  mostrarFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';

    const soloFecha = fecha.split('T')[0].split(' ')[0];

    if (soloFecha === '1900-01-01') return '';

    const partes = soloFecha.split('-');
    if (partes.length !== 3) return '';

    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }

  abrirModalManual() {
  this.modoCarga = 'manual';
  this.modoEdicion = false;
  this.modalAbierto = true;

  this.expedienteSeleccionado = null;

  this.formModal = {
    ...this.getFormVacio(),
    nombre_cliente: '',
    cliente_id: null,
    empresa_id: 1,
    fecha_inicio: ''
  };
}
}