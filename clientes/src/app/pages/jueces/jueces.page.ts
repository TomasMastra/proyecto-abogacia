import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import { JuezService } from 'src/app/services/juez.service';
import { JuezModel } from 'src/app/models/juez/juez.component';

import Swal from 'sweetalert2';
import { IonList, IonItem, IonItemSliding } from "@ionic/angular/standalone";

@Component({
  selector: 'app-jueces',
  templateUrl: './jueces.page.html',
  styleUrls: ['./jueces.page.scss'],
  standalone: true,
  imports: [IonItemSliding, IonItem, IonList, 
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatDialogModule,
  ],
})
export class JuecesPage implements OnInit, OnDestroy {

  jueces: JuezModel[] = [];
  juecesOriginales: JuezModel[] = [];
  listaPaginada: JuezModel[] = [];

  cargando = true;
  busqueda = '';

  // Paginador
  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private juezService: JuezService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarJueces();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarJueces(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.juezService.getJuez()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (jueces) => {
          this.jueces = jueces ?? [];
          this.juecesOriginales = [...this.jueces];
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al obtener jueces:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  // ── Paginador ──────────────────────────────────────────────
  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.jueces.slice(start, start + this.pageSize);
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
      this.jueces = [...this.juecesOriginales];
    } else {
      this.jueces = this.juecesOriginales.filter(j => {
        const nombre = (j.nombre || '').toLowerCase();
        const apellido = (j.apellido || '').toLowerCase();
        return nombre.includes(texto) || apellido.includes(texto) || `${nombre} ${apellido}`.includes(texto);
      });
    }
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  // ── Acciones ───────────────────────────────────────────────
  agregarJuez(): void {
    Swal.fire({
      title: 'Agregar Juez',
      html: `<input id="nombre" class="swal2-input" placeholder="Nombre">
             <input id="apellido" class="swal2-input" placeholder="Apellido">`,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      preConfirm: () => {
        const nombre   = (document.getElementById('nombre') as HTMLInputElement).value;
        const apellido = (document.getElementById('apellido') as HTMLInputElement).value;
        if (!nombre || !apellido) { Swal.showValidationMessage('Debe ingresar nombre y apellido'); return null; }
        return { nombre, apellido };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      const juez: JuezModel = { id: '', nombre: result.value.nombre, apellido: result.value.apellido, estado: 'activo' };
      this.juezService.addJuez(juez).subscribe({
        next: () => {
          this.cargarJueces();
          Swal.fire({ toast: true, icon: 'success', title: 'Juez agregado', showConfirmButton: false, timer: 3000, position: 'top-end' });
        },
        error: () => Swal.fire({ toast: true, icon: 'error', title: 'Error al agregar juez', showConfirmButton: false, timer: 3000 })
      });
    });
  }

  modificarJuez(juez: JuezModel): void {
    Swal.fire({
      title: 'Modificar Juez',
      html: `<input id="nombre" class="swal2-input" placeholder="Nombre" value="${juez.nombre}">
             <input id="apellido" class="swal2-input" placeholder="Apellido" value="${juez.apellido}">`,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      preConfirm: () => {
        const nombre   = (document.getElementById('nombre') as HTMLInputElement).value;
        const apellido = (document.getElementById('apellido') as HTMLInputElement).value;
        if (!nombre || !apellido) { Swal.showValidationMessage('Debe completar ambos campos'); return null; }
        return { nombre, apellido };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      const modificado: JuezModel = { ...juez, nombre: result.value.nombre, apellido: result.value.apellido };
      this.juezService.actualizarJuez(modificado.id, modificado).subscribe({
        next: () => {
          this.cargarJueces();
          Swal.fire({ toast: true, icon: 'success', title: 'Juez modificado', showConfirmButton: false, timer: 3000, position: 'top-end' });
        },
        error: () => Swal.fire({ toast: true, icon: 'error', title: 'Error al modificar juez', showConfirmButton: false, timer: 3000 })
      });
    });
  }

  eliminarJuez(juez: JuezModel): void {
    Swal.fire({
      title: '¿Estás seguro?', text: 'No podrás revertir esto.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.juezService.getExpedientesPorJuez(juez.id).subscribe(expedientes => {
        if (expedientes.length > 0) {
          Swal.fire({ icon: 'error', title: 'No podés eliminar este juez', text: 'Tiene expedientes en gestión.' });
          return;
        }
        juez.estado = 'eliminado';
        this.juezService.actualizarJuez(juez.id, juez).subscribe({
          next: () => {
            this.cargarJueces();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Juez eliminado.', showConfirmButton: false, timer: 3000 });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el juez.' })
        });
      });
    });
  }

  goTo(path: string): void { this.router.navigate([path]); }
}