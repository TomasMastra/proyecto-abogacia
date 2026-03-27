import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { LocalidadesService } from 'src/app/services/localidades.service';
import { LocalidadModel } from 'src/app/models/localidad/localidad.component';

import Swal from 'sweetalert2';
import { IonList, IonItemSliding } from "@ionic/angular/standalone";

@Component({
  selector: 'app-demandado',
  templateUrl: './demandado.page.html',
  styleUrls: ['./demandado.page.scss'],
  standalone: true,
  imports: [IonItemSliding, IonList, 
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatDialogModule,
  ],
})
export class DemandadoPage implements OnInit, OnDestroy {

  demandados: DemandadoModel[] = [];
  demandadosOriginales: DemandadoModel[] = [];
  listaPaginada: DemandadoModel[] = [];
  localidades: LocalidadModel[] = [];

  cargando = true;
  busqueda = '';

  // Paginador
  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private demandadosService: DemandadosService,
    private expedientesService: ExpedientesService,
    private localidadesService: LocalidadesService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarDemandados();
    this.cargarLocalidades();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarDemandados(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.demandadosService.getDemandados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (demandados) => {
          this.demandados = demandados ?? [];
          this.demandadosOriginales = [...this.demandados];
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al obtener demandados:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  cargarLocalidades(): void {
    this.localidadesService.getLocalidades()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (l) => this.localidades = l ?? [],
        error: (err) => console.error('Error al obtener localidades:', err)
      });
  }

  // ── Paginador ──────────────────────────────────────────────
  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.demandados.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  // ── Búsqueda ───────────────────────────────────────────────
  buscar(): void {
    const texto = this.busqueda.trim().toLowerCase();
    if (!texto) {
      this.demandados = [...this.demandadosOriginales];
    } else {
      this.demandados = this.demandadosOriginales.filter(d =>
        (d.nombre || '').toLowerCase().includes(texto)
      );
    }
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  // ── Acciones ───────────────────────────────────────────────
  agregarDemandado(): void {
    const opcionesLocalidades = this.localidades
      .map(loc => `<option value="${loc.id}">${loc.localidad}</option>`).join('');

    Swal.fire({
      title: 'Agregar Demandado',
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left;margin-top:10px">
          <input id="nombre"    class="swal2-input" placeholder="Nombre del demandado" style="margin:0">
          <input id="direccion" class="swal2-input" placeholder="Dirección" style="margin:0">
          <select id="localidad_id" class="swal2-select" style="width:100%">
            <option value="">Seleccione localidad</option>
            ${opcionesLocalidades}
          </select>
          <label style="display:flex;align-items:center;gap:8px;font-size:14px">
            <input type="checkbox" id="esOficio" style="width:18px;height:18px">
            ¿Es oficiado?
          </label>
        </div>`,
      focusConfirm: false, showCancelButton: true,
      confirmButtonText: 'Agregar', cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre      = (document.getElementById('nombre') as HTMLInputElement).value.trim();
        const direccion   = (document.getElementById('direccion') as HTMLInputElement).value.trim();
        const localidad_id= +(document.getElementById('localidad_id') as HTMLSelectElement).value;
        const esOficio    = (document.getElementById('esOficio') as HTMLInputElement).checked;
        if (!nombre || !direccion || !localidad_id) { Swal.showValidationMessage('Todos los campos son obligatorios'); return null; }
        return { nombre, direccion, localidad_id, esOficio };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      const demandado: DemandadoModel = { id: '', nombre: result.value.nombre, direccion: result.value.direccion, localidad_id: result.value.localidad_id, estado: 'en gestión', esOficio: result.value.esOficio };
      this.demandadosService.addDemandado(demandado).subscribe({
        next: () => { this.cargarDemandados(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Demandado agregado', showConfirmButton: false, timer: 2000 }); },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo agregar el demandado.' })
      });
    });
  }

  modificarDemandado(demandado: DemandadoModel): void {
    const opcionesLocalidades = this.localidades
      .map(loc => `<option value="${loc.id}" ${loc.id.toString() === String(demandado.localidad_id) ? 'selected' : ''}>${loc.localidad}</option>`).join('');
    const checked = demandado.esOficio ? 'checked' : '';

    Swal.fire({
      title: 'Modificar Demandado',
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left;margin-top:10px">
          <input id="nombre"    class="swal2-input" placeholder="Nombre" value="${demandado.nombre ?? ''}" style="margin:0">
          <input id="direccion" class="swal2-input" placeholder="Dirección" value="${demandado.direccion ?? ''}" style="margin:0">
          <select id="localidad" class="swal2-select" style="width:100%">
            <option value="">Seleccione localidad</option>
            ${opcionesLocalidades}
          </select>
          <label style="display:flex;align-items:center;gap:8px;font-size:14px">
            <input type="checkbox" id="esOficio" ${checked} style="width:18px;height:18px">
            ¿Es oficiado?
          </label>
        </div>`,
      focusConfirm: false, showCancelButton: true,
      confirmButtonText: 'Modificar', cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre      = (document.getElementById('nombre') as HTMLInputElement).value.trim();
        const direccion   = (document.getElementById('direccion') as HTMLInputElement).value.trim();
        const localidad_id= +(document.getElementById('localidad') as HTMLSelectElement).value;
        const esOficio    = (document.getElementById('esOficio') as HTMLInputElement).checked;
        if (!nombre || !direccion || !localidad_id) { Swal.showValidationMessage('Todos los campos son obligatorios'); return null; }
        return { nombre, direccion, localidad_id, esOficio };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      const modificado: DemandadoModel = { ...demandado, ...result.value };
      this.demandadosService.actualizarDemandado(demandado.id, modificado).subscribe({
        next: () => { this.cargarDemandados(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Demandado modificado', showConfirmButton: false, timer: 2000 }); },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo modificar el demandado.' })
      });
    });
  }

  eliminarDemandado(demandado: DemandadoModel): void {
    Swal.fire({
      title: '¿Estás seguro?', text: 'No podrás revertir esto.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      if (!demandado.id) { Swal.fire({ icon: 'error', title: 'Error', text: 'El demandado no tiene un ID válido.' }); return; }

      this.expedientesService.getExpedientesPorDemandado(demandado.id).subscribe(expedientes => {
        if (expedientes.length > 0) {
          Swal.fire({ icon: 'error', title: 'No se puede eliminar', text: 'Este demandado está asociado a un expediente en gestión.' });
          return;
        }
        demandado.estado = 'eliminado';
        this.demandadosService.actualizarDemandado(demandado.id, demandado).subscribe({
          next: () => { this.cargarDemandados(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Demandado eliminado.', showConfirmButton: false, timer: 3000 }); },
          error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el demandado.' })
        });
      });
    });
  }

  goTo(path: string): void { this.router.navigate([path]); }
}