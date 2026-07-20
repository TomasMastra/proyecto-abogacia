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

import { UsuarioService } from 'src/app/services/usuario.service';
import { EstudioService, EstudioModel } from 'src/app/services/estudio.service';

@Component({
  selector: 'app-abogados-presentados',
  templateUrl: './abogados-presentados.page.html',
  styleUrls: ['./abogados-presentados.page.scss'],
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
export class AbogadosPresentadosPage implements OnInit, OnDestroy {

  abogados: any[] = [];
  abogadosOriginales: any[] = [];
  listaPaginada: any[] = [];

  estudios: EstudioModel[] = [];

  cargando = true;
  busqueda = '';

  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  private normalizar = (s: any) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  constructor(
    private usuarioService: UsuarioService,
    private estudioService: EstudioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarTodo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarTodo(): void {
    this.cargarEstudios();
    this.cargarAbogados();
  }

  cargarEstudios(): void {
    this.estudioService.getEstudios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.estudios = data ?? [];
          this.cdr.detectChanges();
        },
        error: err => console.error('Error cargando estudios:', err)
      });
  }

  cargarAbogados(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.usuarioService.getUsuariosPresentados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.abogados = data ?? [];
          this.abogadosOriginales = [...this.abogados];
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error('Error cargando abogados presentados:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.abogados.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  buscar(): void {
    const texto = this.normalizar(this.busqueda);

    if (!texto) {
      this.abogados = [...this.abogadosOriginales];
    } else {
      this.abogados = this.abogadosOriginales.filter(a =>
        this.normalizar(a.nombre).includes(texto) ||
        this.normalizar(a.email).includes(texto) ||
        this.normalizar(a.telefono).includes(texto) ||
        this.normalizar(a.estudio_nombre).includes(texto)
      );
    }

    this.pageIndex = 0;
    this.actualizarPagina();
  }

  agregarEstudio(): void {
    Swal.fire({
      title: 'Agregar estudio',
      html: `
        <input id="nombre-estudio" class="swal2-input" placeholder="Nombre del estudio">
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = (document.getElementById('nombre-estudio') as HTMLInputElement).value.trim();

        if (!nombre) {
          Swal.showValidationMessage('El nombre del estudio es obligatorio');
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

  agregarAbogado(): void {
    const estudiosOptions = `
      <option value="">Seleccionar estudio</option>
      ${this.estudios.map(e => `
        <option value="${e.id}">${e.nombre}</option>
      `).join('')}
    `;

    Swal.fire({
      title: 'Agregar abogado presentado',
      html: `
        <input id="nombre" class="swal2-input" placeholder="Nombre">
        <input id="email" class="swal2-input" placeholder="Email">
        <input id="telefono" class="swal2-input" placeholder="Teléfono">
        <select id="estudio_id" class="swal2-select" style="width: 100%;">
          ${estudiosOptions}
        </select>
      `,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
        const email = (document.getElementById('email') as HTMLInputElement).value.trim();
        const telefono = (document.getElementById('telefono') as HTMLInputElement).value.trim();
        const estudio_id = Number((document.getElementById('estudio_id') as HTMLSelectElement).value) || null;

        if (!nombre) {
          Swal.showValidationMessage('El nombre es obligatorio');
          return null;
        }

        if (!email) {
          Swal.showValidationMessage('El email es obligatorio');
          return null;
        }
          if (!telefono) {
          Swal.showValidationMessage('El telefono es obligatorio');
          return null;
        }

        if (!estudio_id) {
          Swal.showValidationMessage('Debe seleccionar un estudio');
          return null;
        }

        return { nombre, email, telefono, estudio_id };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;

      this.usuarioService.crearUsuarioPresentado(
        result.value.nombre,
        result.value.email,
        result.value.telefono,
        result.value.estudio_id
      ).subscribe({
        next: () => {
          this.cargarAbogados();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Abogado agregado',
            showConfirmButton: false,
            timer: 2000
          });
        },
        error: err => Swal.fire({
          icon: 'error',
          title: 'Error al agregar abogado',
          text: err?.error?.mensaje || err?.error?.message || 'Error inesperado'
        })
      });
    });
  }

  async eliminarAbogado(a: any): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar abogado?',
      text: 'No podrás eliminarlo si está vinculado a un expediente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (!result.isConfirmed) return;

    this.usuarioService.deleteUsuarioPresentado(a.id).subscribe({
      next: () => {
        this.cargarAbogados();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Abogado eliminado',
          showConfirmButton: false,
          timer: 2000
        });
      },
      error: err => Swal.fire({
        icon: 'error',
        title: 'No se pudo eliminar',
        text: err?.error?.mensaje || err?.error?.message || 'El abogado puede estar vinculado a un expediente.'
      })
    });
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  editarAbogado(abogado: any): void {

  const estudiosOptions = `
    <option value="">Seleccionar estudio</option>
    ${this.estudios.map(e => `
      <option
        value="${e.id}"
        ${Number(e.id) === Number(abogado.estudio_id) ? 'selected' : ''}>
        ${e.nombre}
      </option>
    `).join('')}
  `;

  Swal.fire({

    title: 'Modificar abogado presentado',

    html: `
      <input
        id="nombre"
        class="swal2-input"
        placeholder="Nombre"
        value="${abogado.nombre ?? ''}">

      <input
        id="email"
        class="swal2-input"
        placeholder="Email"
        value="${abogado.email ?? ''}">

      <input
        id="telefono"
        class="swal2-input"
        placeholder="Teléfono"
        value="${abogado.telefono ?? ''}">

      <select
        id="estudio"
        class="swal2-select"
        style="width:100%">
        ${estudiosOptions}
      </select>
    `,

    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',

    preConfirm: () => {

      const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
      const email = (document.getElementById('email') as HTMLInputElement).value.trim();
      const telefono = (document.getElementById('telefono') as HTMLInputElement).value.trim();

      const estudio_id =
        Number((document.getElementById('estudio') as HTMLSelectElement).value) || null;

      if (!nombre) {
        Swal.showValidationMessage('El nombre es obligatorio');
        return false;
      }

      if (!email) {
        Swal.showValidationMessage('El email es obligatorio');
        return false;
      }

      if (!estudio_id) {
        Swal.showValidationMessage('Debe seleccionar un estudio');
        return false;
      }

      return {
        nombre,
        email,
        telefono,
        estudio_id
      };
    }

  }).then(result => {

    if (!result.isConfirmed || !result.value) return;

    this.usuarioService
      .updateUsuarioPresentado(abogado.id, result.value)
      .subscribe({

        next: () => {

          this.cargarAbogados();

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Abogado actualizado',
            timer: 1800,
            showConfirmButton: false
          });

        },

        error: () =>
          Swal.fire('Error', 'No se pudo actualizar el abogado', 'error')

      });

  });

}

  
}