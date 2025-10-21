import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

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

import { IonList, IonItemSliding, IonLabel, IonItem, IonInput, IonHeader } from "@ionic/angular/standalone";

import { OficiosService } from 'src/app/services/oficios.service';
import { OficioModel } from 'src/app/models/oficio/oficio.component';
import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-consultas-oficio',
  templateUrl: './consultas-oficio.page.html',
  styleUrls: ['./consultas-oficio.page.scss'],
  standalone: true,
  imports: [IonHeader, IonInput, IonItem, IonLabel, IonItemSliding, IonList, CommonModule, FormsModule,
    MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatMenuModule, MatProgressSpinnerModule,
    MatSelectModule, MatOptionModule]
})
export class ConsultasOficioPage implements OnInit, OnDestroy {

  cargando = false;
  oficios: OficioModel[] = [];
  oficiosOriginales: OficioModel[] = [];
  hayOficios = true;

  estadoSeleccionado = 'todos';
  parteSeleccionada = '';
  demandadoSeleccionado = '';
  busqueda = '';

  demandados: DemandadoModel[] = [];
  partes = ['actora', 'demanda', 'tercero'];
  estados = ['diligenciado', 'pendiente', 'pedir reiteratoria', 'diligenciar', 'reiteratorio solicitado'];


estadosTestimonial: string[] = [
  'Pendiente',

];

estadosPericia: string[] = [
  'Pendiente',

];

tiposPericia: string[] = [
  'Pericial informática',
];
  ordenCampo: string = '';
  ordenAscendente: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private oficiosService: OficiosService,
    private demandadosService: DemandadosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDemandados();
    this.cargarOficios();
  }

  cargarOficios() {
    this.cargando = true;
    this.oficiosService.getOficios()
      .pipe(takeUntil(this.destroy$))
      .subscribe((oficios) => {
        this.oficios = oficios?.filter(o => o.estado !== 'eliminado') ?? [];
        this.oficiosOriginales = [...this.oficios];
        this.hayOficios = this.oficios.length > 0;
        this.cargando = false;
      }, err => {
        console.error('Error al cargar oficios:', err);
        this.cargando = false;
      });
  }

  cargarDemandados() {
    this.demandadosService.getDemandados()
      .pipe(takeUntil(this.destroy$))
      .subscribe((demandados) => {
        this.demandados = demandados;
      }, err => {
        console.error('Error al cargar demandados:', err);
      });
  }

  filtrar() {
    const texto = this.busqueda.toLowerCase();

    this.oficios = this.oficiosOriginales.filter(oficio => {
      const estadoOk = this.estadoSeleccionado === 'todos' || oficio.estado === this.estadoSeleccionado;
      const parteOk = this.parteSeleccionada ? oficio.parte === this.parteSeleccionada : true;
      const demandadoOk = this.demandadoSeleccionado ? oficio.demandado_id === +this.demandadoSeleccionado : true;

      const expedienteOk = oficio.expedienteModel
        ? (`${oficio.expedienteModel.numero}/${oficio.expedienteModel.anio}`.includes(texto))
        : false;

      return estadoOk && parteOk && demandadoOk && (texto === '' || expedienteOk);
    });
  }
eliminarOficio(oficio: OficioModel) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Este oficio será marcado como eliminado.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      const actualizado: OficioModel = {
        ...oficio,
        estado: 'eliminado' as OficioModel['estado']
      };

      this.oficiosService.actualizarOficio(oficio.id!, actualizado).subscribe(() => {
        this.oficios = this.oficios.filter(o => o.id !== oficio.id);
        this.oficiosOriginales = this.oficiosOriginales.filter(o => o.id !== oficio.id);
        Swal.fire('Eliminado', 'El oficio fue marcado como eliminado.', 'success');
      });
    }
  });
}


  goTo(ruta: string) {
    this.router.navigate([ruta]);
  }

  ordenarPor(campo: string) {
    if (this.ordenCampo === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenCampo = campo;
      this.ordenAscendente = true;
    }
  }

  get oficiosOrdenados() {
    return [...this.oficios].sort((a, b) => {
      const valorA = this.obtenerValorOrden(a, this.ordenCampo);
      const valorB = this.obtenerValorOrden(b, this.ordenCampo);

      if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
      if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
      return 0;
    });
  }

  obtenerValorOrden(item: OficioModel, campo: string): any {
    switch (campo) {
      case 'numero':
        return item.expedienteModel ? `${item.expedienteModel.numero}/${item.expedienteModel.anio}` : '';
      case 'estado':
        return item.estado;
      case 'pate':
        return item.parte;
      case 'fecha_diligenciado':
        return item.fecha_diligenciado || '';
      default:
        return '';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  modificarOficio(oficio: any) {
  const estadosQueRequierenFecha = new Set(['ordenado','diligenciado','reiteratorio solicitado']);
  const estadoActual = String(oficio?.estado || '').trim().toLowerCase();

  const estadoOptions = (this.estados || [])
    .map((e: string) => `<option value="${e}" ${String(oficio.estado) === e ? 'selected' : ''}>${e}</option>`).join('');

  const parteOptions = (this.partes || [])
    .map((p: string) => `<option value="${p}" ${String(oficio.parte).toLowerCase() === p.toLowerCase() ? 'selected' : ''}>${p}</option>`).join('');

  const demandadoOptions = (this.demandados || [])
    .map((d: any) => `<option value="${d.id}" ${Number(oficio.demandado_id) === Number(d.id) ? 'selected' : ''}>${d.nombre}</option>`).join('');

  const expedienteTexto = oficio.expedienteModel
    ? `${oficio.expedienteModel.numero}/${oficio.expedienteModel.anio}` : '(sin expediente)';

  const fechaISO = (estadosQueRequierenFecha.has(estadoActual) && oficio.fecha_diligenciado)
    ? new Date(oficio.fecha_diligenciado).toISOString().split('T')[0] : '';

  Swal.fire({
    title: 'Modificar oficio',
    html: `
      <div style="text-align:left">
        <label class="lbl">Expediente</label>
        <input class="swal2-input" type="text" value="${expedienteTexto}" readonly />

        <label class="lbl">Oficiada / Demandado</label>
        <select id="sw-demandado" class="swal2-select" style="width:100%">${demandadoOptions}</select>

        <label class="lbl">Parte</label>
        <select id="sw-parte" class="swal2-select" style="width:100%">${parteOptions}</select>

        <label class="lbl">Estado</label>
        <select id="sw-estado" class="swal2-select" style="width:100%">${estadoOptions}</select>

        <label class="lbl">Fecha (si corresponde)</label>
        <input id="sw-fecha" class="swal2-input" type="date" value="${fechaISO}" />
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const parteSel  = (document.getElementById('sw-parte') as HTMLSelectElement)?.value || '';
      const estadoSel = (document.getElementById('sw-estado') as HTMLSelectElement)?.value || '';
      const fechaInp  = (document.getElementById('sw-fecha') as HTMLInputElement)?.value || '';
      const demandaId = Number((document.getElementById('sw-demandado') as HTMLSelectElement)?.value);

      if (!parteSel || !estadoSel) return Swal.showValidationMessage('Completá parte y estado.');
      if (!demandaId) return Swal.showValidationMessage('Seleccioná la oficiada / demandado.');
      if (estadosQueRequierenFecha.has(estadoSel.toLowerCase()) && !fechaInp)
        return Swal.showValidationMessage('Este estado requiere fecha.');

      const payload: any = {
        ...oficio,
        tipo: 'oficio',
        demandado_id: demandaId,
        nombre_oficiada: null,
        parte: parteSel,
        estado: estadoSel,
        fecha_diligenciado: estadosQueRequierenFecha.has(estadoSel.toLowerCase()) ? fechaInp : null
      };
      return payload;
    }
  }).then(res => {
    if (!res.isConfirmed || !res.value) return;
    this.oficiosService.actualizarOficio(oficio.id!, res.value).subscribe({
      next: () => Swal.fire({ icon:'success', title:'Oficio actualizado', timer:1500, showConfirmButton:false }),
      error: err => Swal.fire({ icon:'error', title:'No se pudo actualizar', text: err?.message || 'Error inesperado' })
    });
  });
}
modificarPericia(item: any) {
  const estadosQueRequierenFecha = new Set(['pendiente']); // ← minúscula

  const parteOptions = (this.partes || [])
    .map((p: string) => `<option value="${p}" ${String(item.parte).toLowerCase() === p.toLowerCase() ? 'selected' : ''}>${p}</option>`).join('');

  const estadoOptions = (this.estadosPericia || ['Pendiente'])
    .map((e: string) => `<option value="${e}" ${String(item.estado).toLowerCase() === e.toLowerCase() ? 'selected' : ''}>${e}</option>`).join('');

  const tipoPericiaOptions = (this.tiposPericia || ['Pericial informática'])
    .map((t: string) => `<option value="${t}" ${String(item.tipo_pericia || '') === t ? 'selected' : ''}>${t}</option>`).join('');

  const expedienteTexto = item?.expedienteModel
    ? `${item.expedienteModel.numero}/${item.expedienteModel.anio}` : '(sin expediente)';

  const estadoActual = String(item?.estado || '').trim().toLowerCase(); // ← minúsculas
  const fechaISO = (estadosQueRequierenFecha.has(estadoActual) && item?.fecha_diligenciado)
    ? new Date(item.fecha_diligenciado).toISOString().split('T')[0]
    : '';

  Swal.fire({
    title: 'Modificar pericia',
    html: `
      <div style="text-align:left">
        <label class="lbl">Expediente</label>
        <input class="swal2-input" type="text" value="${expedienteTexto}" readonly />

        <label class="lbl">Perito</label>
        <input id="sw-nombre" class="swal2-input" type="text" placeholder="Nombre del perito" value="${item?.nombre_oficiada || ''}" />

        <label class="lbl">Parte</label>
        <select id="sw-parte" class="swal2-select" style="width:100%">${parteOptions}</select>

        <label class="lbl">Estado</label>
        <select id="sw-estado" class="swal2-select" style="width:100%">${estadoOptions}</select>

        <label class="lbl">Tipo de pericia</label>
        <select id="sw-tipo-pericia" class="swal2-select" style="width:100%">${tipoPericiaOptions}</select>

        <label class="lbl">Fecha (si corresponde)</label>
        <input id="sw-fecha" class="swal2-input" type="date" value="${fechaISO}" />
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nombre   = (document.getElementById('sw-nombre') as HTMLInputElement)?.value?.trim() || '';
      const parteSel = (document.getElementById('sw-parte') as HTMLSelectElement)?.value || '';
      const estadoSel= (document.getElementById('sw-estado') as HTMLSelectElement)?.value || '';
      const tipoPeri = (document.getElementById('sw-tipo-pericia') as HTMLSelectElement)?.value || '';
      const fechaInp = (document.getElementById('sw-fecha') as HTMLInputElement)?.value || '';

      if (!nombre || !parteSel || !estadoSel || !tipoPeri)
        return Swal.showValidationMessage('Completá perito, parte, estado y tipo de pericia.');
      if (estadosQueRequierenFecha.has(estadoSel.toLowerCase()) && !fechaInp)
        return Swal.showValidationMessage('Este estado requiere fecha.');

      const payload: any = {
        ...item,
        tipo: 'pericia',
        demandado_id: null,
        nombre_oficiada: nombre,
        tipo_pericia: tipoPeri,
        parte: parteSel,
        estado: estadoSel,
        fecha_diligenciado: estadosQueRequierenFecha.has(estadoSel.toLowerCase()) ? fechaInp : null
      };
      return payload;
    }
  }).then(res => {
    if (!res.isConfirmed || !res.value) return;
    this.oficiosService.actualizarOficio(item.id!, res.value).subscribe({
      next: () => {
        Object.assign(item, res.value); // ← reflejar en tabla
        Swal.fire({ icon:'success', title:'Pericia actualizada', timer:1500, showConfirmButton:false });
      },
      error: err => Swal.fire({ icon:'error', title:'No se pudo actualizar', text: err?.message || 'Error inesperado' })
    });
  });
}


modificarTestimonial(item: any) {
  const estadosQueRequierenFecha = new Set(['pendiente']); // ← minúscula

  const parteOptions = (this.partes || [])
    .map((p: string) => `<option value="${p}" ${String(item.parte).toLowerCase() === p.toLowerCase() ? 'selected' : ''}>${p}</option>`).join('');

  const estadoOptions = (this.estadosTestimonial || ['Pendiente'])
    .map((e: string) => `<option value="${e}" ${String(item.estado).toLowerCase() === e.toLowerCase() ? 'selected' : ''}>${e}</option>`).join('');

  const expedienteTexto = item?.expedienteModel
    ? `${item.expedienteModel.numero}/${item.expedienteModel.anio}` : '(sin expediente)';

  const estadoActual = String(item?.estado || '').trim().toLowerCase(); // ← minúsculas
  const fechaISO = (estadosQueRequierenFecha.has(estadoActual) && item?.fecha_diligenciado)
    ? new Date(item.fecha_diligenciado).toISOString().split('T')[0]
    : '';

  const supletoriaISO = item?.supletoria
    ? new Date(item.supletoria).toISOString().split('T')[0]
    : '';

  Swal.fire({
    title: 'Modificar testimonial',
    html: `
      <div style="text-align:left">
        <label class="lbl">Expediente</label>
        <input class="swal2-input" type="text" value="${expedienteTexto}" readonly />

        <label class="lbl">Nombre del testigo</label>
        <input id="sw-nombre" disabled class="swal2-input" type="text" placeholder="Ej: Juan Pérez" value="${item.nombre_oficiada}" />

        <label class="lbl">Parte</label>
        <select id="sw-parte" class="swal2-select" style="width:100%">${parteOptions}</select>

        <label class="lbl">Estado</label>
        <select id="sw-estado" class="swal2-select" style="width:100%">${estadoOptions}</select>

        <label class="lbl">Supletoria (opcional)</label>
        <input id="sw-suple" class="swal2-input" type="date" value="${supletoriaISO}" />

        <label class="lbl">Fecha (si corresponde)</label>
        <input id="sw-fecha" class="swal2-input" type="date" value="${fechaISO}" />

        
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nombre   = (document.getElementById('sw-nombre') as HTMLInputElement)?.value?.trim() || '';
      const parteSel = (document.getElementById('sw-parte') as HTMLSelectElement)?.value || '';
      const estadoSel= (document.getElementById('sw-estado') as HTMLSelectElement)?.value || '';
      const fechaInp = (document.getElementById('sw-fecha') as HTMLInputElement)?.value || '';
      const supleInp = (document.getElementById('sw-suple') as HTMLInputElement)?.value || '';


      if (!nombre || !parteSel || !estadoSel)
        return Swal.showValidationMessage('Completá nombre, parte y estado.');
      if (estadosQueRequierenFecha.has(estadoSel.toLowerCase()) && !fechaInp)
        return Swal.showValidationMessage('Este estado requiere fecha.');

      const payload: any = {
        ...item,
        tipo: 'testimonial',
        demandado_id: null,
        nombre_oficiada: nombre,
        parte: parteSel,
        estado: estadoSel,
        fecha_diligenciado: estadosQueRequierenFecha.has(estadoSel.toLowerCase()) ? fechaInp : null,
        supletoria: supleInp || null
      };

      return payload;
    }
  }).then(res => {
    if (!res.isConfirmed || !res.value) return;
    this.oficiosService.actualizarOficio(item.id!, res.value).subscribe({
      next: () => {
        Object.assign(item, res.value); // ← reflejar en tabla
        Swal.fire({ icon:'success', title:'Testimonial actualizado', timer:1500, showConfirmButton:false });
      },
      error: err => Swal.fire({ icon:'error', title:'No se pudo actualizar', text: err?.message || 'Error inesperado' })
    });
  });
}


}

