import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { OficiosService } from 'src/app/services/oficios.service';
import { OficioModel } from 'src/app/models/oficio/oficio.component';
import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';

import Swal from 'sweetalert2';

import {
  ESTADOS_OFICIO
} from 'src/app/config/estados-oficio.config';

import {
  ESTADOS_TESTIMONIALES
} from 'src/app/config/estados-testimoniales.config';

import {
  ESTADOS_PERICIA, TIPOS_PERICIA
} from 'src/app/config/estados-pericia.config';

@Component({
  selector: 'app-consultas-oficio',
  templateUrl: './consultas-oficio.page.html',
  styleUrls: ['./consultas-oficio.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatPaginatorModule, MatTooltipModule],
})
export class ConsultasOficioPage implements OnInit, OnDestroy {

  oficios: OficioModel[] = [];
  listaPaginada: OficioModel[] = [];

  oficiosOriginales: OficioModel[] = [];
 
  // Listas filtradas por tipo
  listaOficios:       OficioModel[] = [];
  listaTestimoniales: OficioModel[] = [];
  listaPericias:      OficioModel[] = [];

  cargando = true;
  hayOficios = true;
  busqueda = '';

  estadoSeleccionado = 'todos';
  parteSeleccionada = '';
  demandadoSeleccionado = '';

  demandados: DemandadoModel[] = [];
  partes = ['actora', 'demanda', 'tercero', 'citada'];
   estadosOficio: string[] = ESTADOS_OFICIO;
   estadosTestimonial: string[] = ESTADOS_TESTIMONIALES;
   estadosPericia: string[] = ESTADOS_PERICIA;
   tiposPericia: string[] = TIPOS_PERICIA;

  ordenCampo = '';
  ordenAscendente = true;

  // Paginador
  pageSize = 20;
  pageIndexOficios       = 0;
  pageIndexTestimoniales = 0;
  pageIndexPericias      = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  tabActiva: 'oficios' | 'testimoniales' | 'pericias' = 'oficios';

  listaOficiosPaginada:      OficioModel[] = [];
  listaTestimonalesPaginada: OficioModel[] = [];
  listaPericiasPaginada:     OficioModel[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private oficiosService: OficiosService,
    private demandadosService: DemandadosService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarDemandados();
    this.cargarOficios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarOficios(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.oficiosService.getOficios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (oficios) => {
          this.oficios = oficios?.filter(o => o.estado !== 'eliminado') ?? [];
          this.oficiosOriginales = [...this.oficios];
          this.hayOficios = this.oficios.length > 0;
          this.pageIndexOficios = 0;
          this.pageIndexTestimoniales = 0;
          this.pageIndexPericias = 0;

          this.filtrar();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar oficios:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  cargarDemandados(): void {
    this.demandadosService.getDemandados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (d) => this.demandados = d,
        error: (err) => console.error('Error al cargar demandados:', err)
      });
  }

  // ── Paginadores ────────────────────────────────────────────
  actualizarPaginaOficios(): void {
    const s = this.pageIndexOficios * this.pageSize;
    this.listaOficiosPaginada = this.listaOficios.slice(s, s + this.pageSize);
  }
 
  actualizarPaginaTestimoniales(): void {
    const s = this.pageIndexTestimoniales * this.pageSize;
    this.listaTestimonalesPaginada = this.listaTestimoniales.slice(s, s + this.pageSize);
  }
 
  actualizarPaginaPericias(): void {
    const s = this.pageIndexPericias * this.pageSize;
    this.listaPericiasPaginada = this.listaPericias.slice(s, s + this.pageSize);
  }
 
  onPageOficios(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.pageIndexOficios = e.pageIndex;
    this.actualizarPaginaOficios();
  }
 
  onPageTestimoniales(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.pageIndexTestimoniales = e.pageIndex;
    this.actualizarPaginaTestimoniales();
  }
 
  onPagePericias(e: PageEvent): void {
    this.pageSize = e.pageSize;
    this.pageIndexPericias = e.pageIndex;
    this.actualizarPaginaPericias();
  }

  // ── Filtro ─────────────────────────────────────────────────
  filtrar(): void {
    const texto = this.busqueda.toLowerCase().trim();
 
    const base = this.oficiosOriginales.filter(o => {
      const estadoOk    = this.estadoSeleccionado === 'todos' || o.estado === this.estadoSeleccionado;
      const parteOk     = !this.parteSeleccionada || o.parte === this.parteSeleccionada;
      const demandadoOk = !this.demandadoSeleccionado || String(o.demandado_id) === this.demandadoSeleccionado;
      const textoOk     = !texto ||
        (o.expedienteModel ? `${o.expedienteModel.numero}/${o.expedienteModel.anio}`.includes(texto) : false) ||
        (o.expedienteModel?.caratula || '').toLowerCase().includes(texto) ||
        (o.demandadoModel?.nombre || '').toLowerCase().includes(texto) ||
        (o.parte || '').toLowerCase().includes(texto);
      return estadoOk && parteOk && demandadoOk && textoOk;
    });
 
    this.listaOficios       = base.filter(o => o.tipo === 'oficio');
    this.listaTestimoniales = base.filter(o => o.tipo === 'testimonial');
    this.listaPericias      = base.filter(o => o.tipo === 'pericia');
 
    this.actualizarPaginaOficios();
    this.actualizarPaginaTestimoniales();
    this.actualizarPaginaPericias();
  }

  // ── Ordenamiento ───────────────────────────────────────────
  get oficiosOrdenados(): OficioModel[] {
    return [...this.oficios].sort((a, b) => {
      const vA = this.obtenerValorOrden(a, this.ordenCampo);
      const vB = this.obtenerValorOrden(b, this.ordenCampo);
      if (vA < vB) return this.ordenAscendente ? -1 : 1;
      if (vA > vB) return this.ordenAscendente ? 1 : -1;
      return 0;
    });
  }

  ordenarPor(campo: string): void {
    if (this.ordenCampo === campo) this.ordenAscendente = !this.ordenAscendente;
    else { this.ordenCampo = campo; this.ordenAscendente = true; }
    this.pageIndexOficios = 0;
    this.pageIndexTestimoniales = 0;
    this.pageIndexPericias = 0;

    this.filtrar();
  }

  obtenerValorOrden(item: OficioModel, campo: string): any {
    switch (campo) {
      case 'numero':  return item.expedienteModel ? `${item.expedienteModel.numero}/${item.expedienteModel.anio}` : '';
      case 'estado':  return item.estado;
      case 'parte':   return item.parte;
      default:        return '';
    }
  }

  // ── Acciones ───────────────────────────────────────────────
  eliminarOficio(oficio: OficioModel): void {
    Swal.fire({
      title: '¿Estás seguro?', text: 'Este oficio será marcado como eliminado.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then(result => {
      if (!result.isConfirmed) return;
      const actualizado: OficioModel = { ...oficio, estado: 'eliminado' as OficioModel['estado'] };
      this.oficiosService.actualizarOficio(oficio.id!, actualizado).subscribe(() => {
        this.oficios = this.oficios.filter(o => o.id !== oficio.id);
        this.oficiosOriginales = this.oficiosOriginales.filter(o => o.id !== oficio.id);
            this.pageIndexOficios = 0;
    this.pageIndexTestimoniales = 0;
    this.pageIndexPericias = 0;
        Swal.fire('Eliminado', 'El oficio fue marcado como eliminado.', 'success');
      });
    });
  }

  modificarOficio(oficio: any): void {
    const estadosQueRequierenFecha = new Set(['ordenado', 'diligenciado', 'reiteratorio solicitado']);
    const estadoActual = String(oficio?.estado || '').trim().toLowerCase();
    const estadoOptions = this.estadosOficio.map(e => `<option value="${e}" ${String(oficio.estado) === e ? 'selected' : ''}>${e}</option>`).join('');
    const parteOptions  = this.partes.map(p => `<option value="${p}" ${String(oficio.parte).toLowerCase() === p.toLowerCase() ? 'selected' : ''}>${p}</option>`).join('');
    const demandadoOptions = this.demandados.map(d => `<option value="${d.id}" ${Number(oficio.demandado_id) === Number(d.id) ? 'selected' : ''}>${d.nombre}</option>`).join('');
    const expedienteTexto = oficio.expedienteModel ? `${oficio.expedienteModel.numero}/${oficio.expedienteModel.anio}` : '(sin expediente)';
    const fechaISO = (estadosQueRequierenFecha.has(estadoActual) && oficio.fecha_diligenciado) ? new Date(oficio.fecha_diligenciado).toISOString().split('T')[0] : '';

    Swal.fire({
      title: 'Modificar oficio',
      html: `<div style="text-align:left">
        <label>Expediente</label><input class="swal2-input" type="text" value="${expedienteTexto}" readonly />
        <label>Oficiada / Demandado</label><select id="sw-demandado" class="swal2-select" style="width:100%">${demandadoOptions}</select>
        <label>Parte</label><select id="sw-parte" class="swal2-select" style="width:100%">${parteOptions}</select>
        <label>Estado</label><select id="sw-estado" class="swal2-select" style="width:100%">${estadoOptions}</select>
        <label>Fecha (si corresponde)</label><input id="sw-fecha" class="swal2-input" type="date" value="${fechaISO}" />
      </div>`,
      focusConfirm: false, showCancelButton: true,
      confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const parteSel  = (document.getElementById('sw-parte') as HTMLSelectElement)?.value || '';
        const estadoSel = (document.getElementById('sw-estado') as HTMLSelectElement)?.value || '';
        const fechaInp  = (document.getElementById('sw-fecha') as HTMLInputElement)?.value || '';
        const demandaId = Number((document.getElementById('sw-demandado') as HTMLSelectElement)?.value);
        if (!parteSel || !estadoSel) return Swal.showValidationMessage('Completá parte y estado.');
        if (!demandaId) return Swal.showValidationMessage('Seleccioná la oficiada / demandado.');
        if (estadosQueRequierenFecha.has(estadoSel.toLowerCase()) && !fechaInp) return Swal.showValidationMessage('Este estado requiere fecha.');
          return {
            ...oficio,
            tipo: 'oficio',
            demandado_id: demandaId,
            nombre_oficiada: null,
            parte: parteSel,
            estado: estadoSel,
            fecha_diligenciado: fechaInp || null
          };      
        }
    }).then(res => {
      if (!res.isConfirmed || !res.value) return;
      this.oficiosService.actualizarOficio(oficio.id!, res.value).subscribe({
        next: () => Swal.fire({ icon: 'success', title: 'Oficio actualizado', timer: 1500, showConfirmButton: false }),
        error: err => Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: err?.message || 'Error inesperado' })
      });
    });
  }

  modificarPericia(item: any): void {
    const estadosQueRequierenFecha = new Set(['pendiente']);
    const parteOptions      = this.partes.map(p => `<option value="${p}" ${String(item.parte).toLowerCase() === p.toLowerCase() ? 'selected' : ''}>${p}</option>`).join('');
    const estadoOptions     = this.estadosPericia.map(e => `<option value="${e}" ${String(item.estado).toLowerCase() === e.toLowerCase() ? 'selected' : ''}>${e}</option>`).join('');
    //const tipoPericiaOptions= this.tiposPericia.map(t => `<option value="${t}" ${String(item.tipo_pericia || '') === t ? 'selected' : ''}>${t}</option>`).join('');
    const expedienteTexto   = item?.expedienteModel ? `${item.expedienteModel.numero}/${item.expedienteModel.anio}` : '(sin expediente)';
    const estadoActual      = String(item?.estado || '').trim().toLowerCase();
    const fechaISO          = (item?.fecha_diligenciado) ? new Date(item.fecha_diligenciado).toISOString().split('T')[0] : '';

    const tipoPericiaActual = String(item?.tipo_pericia || '').trim();

    const tipoPericiaOptions =
      `<option value="">Seleccionar tipo de pericia</option>` +
      this.tiposPericia
        .map(t => {
          const selected = String(t).trim() === tipoPericiaActual ? 'selected' : '';
          return `<option value="${t}" ${selected}>${t}</option>`;
        })
        .join('');

        
    
    Swal.fire({
      title: 'Modificar pericia',
      html: `<div style="text-align:left">
        <label>Expediente</label><input class="swal2-input" type="text" value="${expedienteTexto}" readonly />
        <label>Perito</label><input id="sw-nombre" class="swal2-input" type="text" value="${item?.nombre_oficiada || ''}" />
        <label>Parte</label><select id="sw-parte" class="swal2-select" style="width:100%">${parteOptions}</select>
        <label>Estado</label><select id="sw-estado" class="swal2-select" style="width:100%">${estadoOptions}</select>
        <label>Tipo de pericia</label><select id="sw-tipo-pericia" class="swal2-select" style="width:100%">${tipoPericiaOptions}</select>
        <label>Fecha</label><input id="sw-fecha" class="swal2-input" type="date" value="${fechaISO}" />
      </div>`,
      showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre   = (document.getElementById('sw-nombre') as HTMLInputElement)?.value?.trim() || '';
        const parteSel = (document.getElementById('sw-parte') as HTMLSelectElement)?.value || '';
        const estadoSel= (document.getElementById('sw-estado') as HTMLSelectElement)?.value || '';
        const tipoPeri = (document.getElementById('sw-tipo-pericia') as HTMLSelectElement)?.value || '';
        const fechaInp = (document.getElementById('sw-fecha') as HTMLInputElement)?.value || '';
        if (!nombre || !parteSel || !estadoSel || !tipoPeri) return Swal.showValidationMessage('Completá todos los campos.');
        if (estadosQueRequierenFecha.has(estadoSel.toLowerCase()) && !fechaInp) return Swal.showValidationMessage('Este estado requiere fecha.');

        return { ...item, tipo: 'pericia', demandado_id: null, nombre_oficiada: nombre, tipo_pericia: tipoPeri, parte: parteSel, estado: estadoSel,  fecha_diligenciado: fechaInp || item.fecha_diligenciado
 };
      }
    }).then(res => {
      if (!res.isConfirmed || !res.value) return;
      
      this.oficiosService.actualizarOficio(item.id!, res.value).subscribe({
        next: () => { Object.assign(item, res.value); Swal.fire({ icon: 'success', title: 'Pericia actualizada', timer: 1500, showConfirmButton: false }); },
        error: err => Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: err?.message })
      });
    });
  }

  modificarTestimonial(item: any): void {
    const estadosQueRequierenFecha = new Set(['pendiente']);
    const parteOptions   = this.partes.map(p => `<option value="${p}" ${String(item.parte).toLowerCase() === p.toLowerCase() ? 'selected' : ''}>${p}</option>`).join('');
    const estadoOptions  = this.estadosTestimonial.map(e => `<option value="${e}" ${String(item.estado).toLowerCase() === e.toLowerCase() ? 'selected' : ''}>${e}</option>`).join('');
    const expedienteTexto= item?.expedienteModel ? `${item.expedienteModel.numero}/${item.expedienteModel.anio}` : '(sin expediente)';
    const estadoActual   = String(item?.estado || '').trim().toLowerCase();
    const fechaISO       = (estadosQueRequierenFecha.has(estadoActual) && item?.fecha_diligenciado) ? new Date(item.fecha_diligenciado).toISOString().split('T')[0] : '';
    const supletoriaISO  = item?.supletoria ? new Date(item.supletoria).toISOString().split('T')[0] : '';

    Swal.fire({
      title: 'Modificar testimonial',
      html: `<div style="text-align:left">
        <label>Expediente</label><input class="swal2-input" type="text" value="${expedienteTexto}" readonly />
        <label>Testigo</label><input id="sw-nombre" class="swal2-input" disabled type="text" value="${item.nombre_oficiada || ''}" />
        <label>Parte</label><select id="sw-parte" class="swal2-select" style="width:100%">${parteOptions}</select>
        <label>Estado</label><select id="sw-estado" class="swal2-select" style="width:100%">${estadoOptions}</select>
        <label>Supletoria</label><input id="sw-suple" class="swal2-input" type="date" value="${supletoriaISO}" />
        <label>Fecha</label><input id="sw-fecha" class="swal2-input" type="date" value="${fechaISO}" />
      </div>`,
      showCancelButton: true, confirmButtonText: 'Guardar', cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre   = (document.getElementById('sw-nombre') as HTMLInputElement)?.value?.trim() || '';
        const parteSel = (document.getElementById('sw-parte') as HTMLSelectElement)?.value || '';
        const estadoSel= (document.getElementById('sw-estado') as HTMLSelectElement)?.value || '';
        const fechaInp = (document.getElementById('sw-fecha') as HTMLInputElement)?.value || '';
        const supleInp = (document.getElementById('sw-suple') as HTMLInputElement)?.value || '';
        if (!nombre || !parteSel || !estadoSel) return Swal.showValidationMessage('Completá nombre, parte y estado.');
        if (estadosQueRequierenFecha.has(estadoSel.toLowerCase()) && !fechaInp) return Swal.showValidationMessage('Este estado requiere fecha.');
        return { ...item, tipo: 'testimonial', demandado_id: null, nombre_oficiada: nombre, parte: parteSel, estado: estadoSel, fecha_diligenciado: estadosQueRequierenFecha.has(estadoSel.toLowerCase()) ? fechaInp : null, supletoria: supleInp || null };
      }
    }).then(res => {
      if (!res.isConfirmed || !res.value) return;
      this.oficiosService.actualizarOficio(item.id!, res.value).subscribe({
        next: () => { Object.assign(item, res.value); Swal.fire({ icon: 'success', title: 'Testimonial actualizado', timer: 1500, showConfirmButton: false }); },
        error: err => Swal.fire({ icon: 'error', title: 'No se pudo actualizar', text: err?.message })
      });
    });
  }

mostrarFecha(fecha: any): string {
  if (!fecha) return '—';

  // Si viene YYYY-MM-DD o YYYY-MM-DDTHH...
  if (typeof fecha === 'string') {
    const soloFecha = fecha.split('T')[0].split(' ')[0];
    const partes = soloFecha.split('-');

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return soloFecha;
  }

  // Si viene Date
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '—';

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

sumarDias(fecha: any, dias: number): string {
  if (!fecha) return '—';

  const d = new Date(fecha);

  if (isNaN(d.getTime())) return '—';

  d.setDate(d.getDate() + dias);

  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();

  return `${dia}/${mes}/${anio}`;
}

  goTo(ruta: string): void { this.router.navigate([ruta]); }
}