import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { UmaService } from 'src/app/services/uma.service';
import { UmaModel } from 'src/app/models/uma/uma.component';
import { UsuarioService } from 'src/app/services/usuario.service';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-cargar-uma',
  templateUrl: './uma.page.html',
  styleUrls: ['./uma.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
  ],
})
export class UmaPage implements OnInit, OnDestroy {

  // ── Formulario ─────────────────────────────────────────────
  fechaVigencia = '';
  valorUMA: number | null = null;
  guardando = false;

  // ── Historial ──────────────────────────────────────────────
  listaUMA: UmaModel[] = [];
  listaUMAOriginal: UmaModel[] = [];
  listaPaginada: UmaModel[] = [];
  cargando = true;

  // ── Edición inline ─────────────────────────────────────────
  editandoId: number | string | null = null;
  editFecha = '';
  editValor: number | null = null;

  // ── Paginador ──────────────────────────────────────────────
  pageSize = 100;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private umaService: UmaService,
    public usuarioService: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Fecha de hoy como default
    this.fechaVigencia = new Date().toISOString().split('T')[0];
    this.cargarHistorial();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarHistorial(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.umaService.getUMA()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Ordenar por fecha vigencia DESC
          this.listaUMAOriginal = (data ?? []).sort((a, b) =>
            new Date(b.fecha_vigencia).getTime() - new Date(a.fecha_vigencia).getTime()
          );
          this.listaUMA = [...this.listaUMAOriginal];
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar UMA:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ── Paginador ──────────────────────────────────────────────
  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.listaUMA.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  // ── Guardar nuevo valor ────────────────────────────────────
  guardar(): void {
    if (!this.fechaVigencia) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Ingresá la fecha de vigencia', showConfirmButton: false, timer: 2500 });
      return;
    }
    if (this.valorUMA === null || this.valorUMA === undefined) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Ingresá el valor de UMA', showConfirmButton: false, timer: 2500 });
      return;
    }
    if (this.valorUMA <= 0) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'El valor debe ser mayor a cero', showConfirmButton: false, timer: 2500 });
      return;
    }

    this.guardando = true;

    this.umaService.addUMA({
      valor:          this.valorUMA,
      fecha_vigencia: this.fechaVigencia,
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.limpiar();
        this.cargarHistorial();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Valor de UMA guardado', showConfirmButton: false, timer: 2500 });
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire({ icon: 'error', title: 'Error al guardar', text: err?.error?.message || 'Error inesperado' });
      }
    });
  }

  // ── Limpiar formulario ─────────────────────────────────────
  limpiar(): void {
    this.fechaVigencia = new Date().toISOString().split('T')[0];
    this.valorUMA = null;
  }

  // ── Editar ─────────────────────────────────────────────────
  iniciarEdicion(uma: UmaModel): void {
    this.editandoId = uma.id;
    this.editFecha  = uma.fecha_vigencia
      ? new Date(uma.fecha_vigencia).toISOString().split('T')[0]
      : '';
    this.editValor  = uma.valor;
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.editFecha  = '';
    this.editValor  = null;
  }

  guardarEdicion(uma: UmaModel): void {
    if (!this.editFecha || !this.editValor || this.editValor <= 0) {
      Swal.fire({ toast: true, icon: 'warning', title: 'Completá fecha y valor correctamente', showConfirmButton: false, timer: 2500 });
      return;
    }

    this.umaService.actualizarUMA(uma.id, {
      valor:          this.editValor,
      fecha_vigencia: this.editFecha,
    }).subscribe({
      next: () => {
        this.cancelarEdicion();
        this.cargarHistorial();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Valor actualizado', showConfirmButton: false, timer: 2000 });
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error al actualizar' })
    });
  }

  // ── Eliminar ───────────────────────────────────────────────
  eliminar(uma: UmaModel): void {
    Swal.fire({
      title: '¿Eliminar este valor?',
      text: `UMA del ${this.formatearFecha(uma.fecha_vigencia)} — $${uma.valor}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.umaService.eliminarUMA(uma.id).subscribe({
        next: () => {
          this.cargarHistorial();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Valor eliminado', showConfirmButton: false, timer: 2000 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error al eliminar' })
      });
    });
  }

  // ── Utils ──────────────────────────────────────────────────
  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const soloFecha = fecha.split('T')[0].split(' ')[0];
    if (soloFecha === '1900-01-01') return '—';
    const [anio, mes, dia] = soloFecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  formatearValor(valor: number): string {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valor);
  }

  onValorInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Evitar negativos
    const v = parseFloat(input.value);
    if (!isNaN(v) && v < 0) {
      input.value = '0';
      this.valorUMA = 0;
    }
  }

  goTo(path: string): void { this.router.navigate([path]); }
}