import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import Swal from 'sweetalert2';
import { IonList } from '@ionic/angular/standalone';

import { EstudioService, EstudioModel } from 'src/app/services/estudio.service';

@Component({
  selector: 'app-estudios',
  templateUrl: './estudios.page.html',
  styleUrls: ['./estudios.page.scss'],
  standalone: true,
  imports: [
    IonList,
    CommonModule,
    FormsModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatDialogModule,
  ],
})
export class EstudiosPage implements OnInit, OnDestroy {

  estudios: EstudioModel[] = [];
  estudiosOriginales: EstudioModel[] = [];
  listaPaginada: EstudioModel[] = [];

  cargando = true;
  busqueda = '';

  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  private normalizar = (s: any) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  constructor(
    private estudioService: EstudioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarEstudios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarEstudios(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.estudioService.getEstudios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.estudios = data ?? [];
          this.estudiosOriginales = [...this.estudios];
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Error cargando estudios:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.estudios.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  buscar(): void {
    const texto = this.normalizar(this.busqueda);

    this.estudios = !texto
      ? [...this.estudiosOriginales]
      : this.estudiosOriginales.filter(e =>
          this.normalizar(e.nombre).includes(texto)
        );

    this.pageIndex = 0;
    this.actualizarPagina();
  }

  agregarEstudio(): void {
    Swal.fire({
      title: 'Agregar estudio',
      html: `<input id="nombre-estudio" class="swal2-input" placeholder="Nombre del estudio">`,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = (document.getElementById('nombre-estudio') as HTMLInputElement).value.trim();

        if (!nombre) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return null;
        }

        return nombre;
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;

      this.estudioService.crearEstudio(result.value).subscribe({
        next: () => {
          this.cargarEstudios();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Estudio agregado',
            showConfirmButton: false,
            timer: 2000
          });
        },
        error: err => Swal.fire({
          icon: 'error',
          title: 'Error al agregar estudio',
          text: err?.error?.mensaje || err?.error?.message || 'Error inesperado'
        })
      });
    });
  }

  async eliminarEstudio(e: EstudioModel): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar estudio?',
      text: 'No podrás eliminarlo si tiene abogados asociados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.estudioService.deleteEstudio(e.id).subscribe({
      next: () => {
        this.cargarEstudios();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Estudio eliminado',
          showConfirmButton: false,
          timer: 2000
        });
      },
      error: err => Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar',
        text: err?.error?.mensaje || err?.error?.message || 'El estudio tiene abogados asociados.'
      })
    });
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  editarEstudio(estudio: EstudioModel): void {
  Swal.fire({
    title: 'Modificar estudio',
    html: `
      <input
        id="nombre-estudio"
        class="swal2-input"
        placeholder="Nombre"
        value="${estudio.nombre ?? ''}">
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',

    preConfirm: () => {
      const nombre = (
        document.getElementById('nombre-estudio') as HTMLInputElement
      ).value.trim();

      if (!nombre) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return false;
      }

      return {
        nombre,
        estado: estudio.estado
      };
    }

  }).then(result => {

    if (!result.isConfirmed || !result.value) return;

    this.estudioService.updateEstudio(estudio.id, result.value).subscribe({
      next: () => {
        this.cargarEstudios();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Estudio actualizado',
          timer: 1800,
          showConfirmButton: false
        });
      },
      error: () =>
        Swal.fire('Error', 'No se pudo actualizar el estudio', 'error')
    });

  });
}
}