import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MotivosService } from 'src/app/services/motivos.service';
import { MotivoModel } from 'src/app/models/motivo/motivo.component';

import Swal from 'sweetalert2';
import { IonHeader, IonToolbar, IonTitle } from "@ionic/angular/standalone";

@Component({
  selector: 'app-motivos',
  templateUrl: './motivos.page.html',
  styleUrls: ['./motivos.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, 
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule,
  ],
})
export class MotivosPage implements OnInit, OnDestroy {

  motivos: MotivoModel[] = [];
  motivosOriginales: MotivoModel[] = [];
  listaPaginada: MotivoModel[] = [];

  cargando = true;
  busqueda = '';
  tipoSeleccionado = '';

  // Tipos únicos para el filtro (se calculan al cargar)
  tiposDisponibles: string[] = [];

  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private motivosService: MotivosService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarMotivos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarMotivos(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.motivosService.getMotivos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (motivos) => {
          this.motivosOriginales = (motivos ?? []).filter(m => m.estado !== 'eliminado');
          this.motivos = [...this.motivosOriginales];

          // Tipos únicos para el filtro
          this.tiposDisponibles = [...new Set(this.motivosOriginales.map(m => m.tipo).filter(Boolean))].sort();

          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al obtener motivos:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ── Paginador ──────────────────────────────────────────────
  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.motivos.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  // ── Búsqueda y filtro ──────────────────────────────────────
  filtrar(): void {
    const texto = this.busqueda.trim().toLowerCase();
    this.motivos = this.motivosOriginales.filter(m => {
      const textoOk = !texto || (m.nombre || '').toLowerCase().includes(texto);
      const tipoOk  = !this.tipoSeleccionado || m.tipo === this.tipoSeleccionado;
      return textoOk && tipoOk;
    });
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  // ── Agregar ────────────────────────────────────────────────
  agregarMotivo(): void {
    Swal.fire({
      title: 'Agregar motivo',
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre del motivo">
        <select id="tipo" class="swal2-select" style="width:260px;margin-top:8px;">
          <option value="principal">Principal</option>
          ${this.tiposDisponibles.filter(t => t !== 'principal').map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>`,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
        const tipo   = (document.getElementById('tipo')   as HTMLSelectElement).value;
        if (!nombre) { Swal.showValidationMessage('El nombre es obligatorio'); return null; }
        return { nombre, tipo };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      const motivo: MotivoModel = {
        id: '',
        nombre: result.value.nombre,
        tipo: result.value.tipo,
        estado: 'activo',
      };
      this.motivosService.addMotivo(motivo).subscribe({
        next: () => {
          this.cargarMotivos();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Motivo agregado', showConfirmButton: false, timer: 2000 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error al agregar el motivo' })
      });
    });
  }

  // ── Modificar ──────────────────────────────────────────────
  modificarMotivo(motivo: MotivoModel): void {
    Swal.fire({
      title: 'Modificar motivo',
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${motivo.nombre ?? ''}">
        <select id="tipo" class="swal2-select" style="width:260px;margin-top:8px;">
          <option value="principal"   ${motivo.tipo === 'principal'   ? 'selected' : ''}>Principal</option>
          ${this.tiposDisponibles.filter(t => t !== 'principal').map(t =>
            `<option value="${t}" ${motivo.tipo === t ? 'selected' : ''}>${t}</option>`
          ).join('')}
        </select>`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
        const tipo   = (document.getElementById('tipo')   as HTMLSelectElement).value;
        if (!nombre) { Swal.showValidationMessage('El nombre es obligatorio'); return null; }
        return { nombre, tipo };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      const modificado: MotivoModel = { ...motivo, nombre: result.value.nombre, tipo: result.value.tipo };
      this.motivosService.actualizarMotivo(motivo.id, modificado).subscribe({
        next: () => {
          this.cargarMotivos();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Motivo modificado', showConfirmButton: false, timer: 2000 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error al modificar el motivo' })
      });
    });
  }

  // ── Eliminar (soft delete) ─────────────────────────────────
  eliminarMotivo(motivo: MotivoModel): void {
    Swal.fire({
      title: '¿Estás seguro?', text: 'No podrás revertir esto.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.motivosService.actualizarMotivo(motivo.id, { ...motivo, estado: 'eliminado' }).subscribe({
        next: () => {
          this.cargarMotivos();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Motivo eliminado', showConfirmButton: false, timer: 2000 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error al eliminar el motivo' })
      });
    });
  }
}