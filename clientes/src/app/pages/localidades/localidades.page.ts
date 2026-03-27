import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { LocalidadesService } from 'src/app/services/localidades.service';
import { LocalidadModel } from 'src/app/models/localidad/localidad.component';
import { DialogLocalidadComponent } from '../../components/dialog-localidad/dialog-localidad.component';
import { DialogLocalidadModificarComponent } from '../../components/dialog-localidad-modificar/dialog-localidad-modificar.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-localidades',
  templateUrl: './localidades.page.html',
  styleUrls: ['./localidades.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatDialogModule,
  ],
})
export class LocalidadesPage implements OnInit, OnDestroy {

  localidades: LocalidadModel[] = [];
  localidadesOriginales: LocalidadModel[] = [];
  listaPaginada: LocalidadModel[] = [];

  cargando = true;
  busqueda = '';

  // Paginador
  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private localidadesService: LocalidadesService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarLocalidades();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarLocalidades(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.localidadesService.getLocalidades()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (localidades) => {
          this.localidades = localidades ?? [];
          this.localidadesOriginales = [...this.localidades];
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al obtener localidades:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ── Paginador ──────────────────────────────────────────────
  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.localidades.slice(start, start + this.pageSize);
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
      this.localidades = [...this.localidadesOriginales];
    } else {
      this.localidades = this.localidadesOriginales.filter(l =>
        (l.localidad || '').toLowerCase().includes(texto)
      );
    }
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  // ── Dialogs ────────────────────────────────────────────────
  abrirDialog(): void {
    const ref = this.dialog.open(DialogLocalidadComponent, { width: '500px', disableClose: true });
    ref.afterClosed().subscribe((localidad: LocalidadModel) => {
      if (!localidad) return;
      this.localidadesService.addLocalidad(localidad).subscribe({
        next: () => this.cargarLocalidades(),
        error: (err) => console.error('Error al agregar localidad:', err)
      });
    });
  }

  abrirModificar(localidad: LocalidadModel): void {
    const ref = this.dialog.open(DialogLocalidadModificarComponent, { width: '500px', data: localidad, disableClose: true });
    ref.afterClosed().subscribe((modificado: LocalidadModel) => {
      if (!modificado) return;
      this.localidadesService.actualizarLocalidad(modificado.id, modificado).subscribe({
        next: () => this.cargarLocalidades(),
        error: (err) => console.error('Error al actualizar localidad:', err)
      });
    });
  }

  eliminarLocalidad(localidad: LocalidadModel): void {
    Swal.fire({
      title: '¿Estás seguro?', text: 'No podrás revertir esto.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      if (!localidad.id) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'La localidad no tiene un ID válido.' });
        return;
      }
      localidad.estado = 'eliminado';
      this.localidadesService.actualizarLocalidad(localidad.id, localidad).subscribe({
        next: () => {
          this.cargarLocalidades();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Localidad eliminada.', showConfirmButton: false, timer: 3000 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la localidad.' })
      });
    });
  }

  goTo(path: string): void { this.router.navigate([path]); }
}