import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpedientesService } from 'src/app/services/expedientes.service';
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

  informes: any[] = [];
  informesOriginales: any[] = [];

  informesAgrupados: any[] = [];
  informesAgrupadosOriginales: any[] = [];

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

  constructor(private expedientesService: ExpedientesService) {}

  ngOnInit() {
    this.cargar();
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
      estado: 'pendiente_relevamiento',
      estado_descripcion: 'Pendiente de relevamiento'
    };
  }

  cargar() {
    this.cargando = true;

    this.expedientesService.getInformeEnre().subscribe({
      next: (data: any[]) => {
        this.informesOriginales = data || [];
        this.informes = data || [];

        const agrupados = this.agruparPorExpediente(this.informesOriginales);

        this.informesAgrupadosOriginales = [...agrupados];
        this.informesAgrupados = [...agrupados];

        this.recalcularListas();

        this.cargando = false;
      },
      error: (err) => {
        console.error('ERROR INFORME ENRE:', err);
        this.cargando = false;
      }
    });
  }

  recalcularListas() {
    const baseFiltrada = this.aplicarFiltroBase(this.informesAgrupadosOriginales);

    const enriquecida = baseFiltrada.map(item => {
      const estadoCalculado = this.obtenerEstado(item);

      return {
        ...item,
        estado: estadoCalculado.estado,
        estado_descripcion: estadoCalculado.descripcion
      };
    });

    this.listaParaReactivarOriginal = enriquecida.filter(x => x.estado === 'pendiente_relevamiento');
    this.listaEnTramiteOriginal = enriquecida.filter(
      x => x.estado === 'informe_pedido' || x.estado === 'informe_respondido_pendiente_cortes'
    );
    this.listaConCortesOriginal = enriquecida.filter(x => x.estado === 'con_cortes');
    this.listaSinCortesOriginal = enriquecida.filter(x => x.estado === 'sin_cortes');

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
  const estado = item.estado_reclamo || item.estado;

  if (estado === 'informe_pedido') {
    return {
      estado: 'informe_pedido',
      descripcion: 'Informe pedido'
    };
  }

  if (estado === 'informe_respondido_pendiente_cortes') {
    return {
      estado: 'informe_respondido_pendiente_cortes',
      descripcion: 'Falta definir si tiene cortes'
    };
  }

  if (estado === 'con_cortes') {
    return {
      estado: 'con_cortes',
      descripcion: 'Con cortes'
    };
  }

  if (estado === 'sin_cortes') {
    return {
      estado: 'sin_cortes',
      descripcion: 'Sin cortes'
    };
  }

  return {
    estado: 'pendiente_relevamiento',
    descripcion: 'Pendiente de relevamiento'
  };
}

  abrirModalNuevo(item: any) {
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
  this.modoEdicion = true;
  this.modalAbierto = true;
  this.expedienteSeleccionado = { ...item };

  this.formModal = {
    id_relevamiento: item.id_relevamiento ?? null,
    numero_cliente_edesur: item.numero_cliente_edesur || '',
    fecha_pedido_informe: this.formatearFechaInput(item.fecha_pedido_informe),
    fecha_respuesta_informe: this.formatearFechaInput(item.fecha_respuesta_informe),
    tiene_cortes: item.tiene_cortes ?? null,
    dias_cortes: item.dias_cortes ?? null,
    observaciones_reclamo: item.observaciones_reclamo || '',
    estado_reclamo: item.estado_reclamo || 'pendiente_relevamiento'
  };

  console.log('EDITAR item:', item);
  console.log('EDITAR formModal:', this.formModal);
}
  cerrarModal() {
    this.modalAbierto = false;
    this.modoEdicion = false;
    this.expedienteSeleccionado = null;
    this.formModal = this.getFormVacio();
  }
guardarModal() {
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
      if (!this.formModal.dias_cortes || Number(this.formModal.dias_cortes) <= 0) {
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
  const idExpediente = item.id ?? item.expediente_id;

  if (!idExpediente) {
    alert('El expediente no tiene id válido.');
    return;
  }

  const expedienteActualizado = {
    ...item,
    numero_cliente_edesur: null,
    fecha_respuesta_informe: null,
    fecha_pedido_informe: null,
    tiene_cortes: null,
    dias_cortes: null,
    estado_reclamo: null
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
}