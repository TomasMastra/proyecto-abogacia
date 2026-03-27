import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import { CodigosService } from 'src/app/services/codigos.service';
import { CodigoModel } from 'src/app/models/codigo/codigo.component';

import Swal from 'sweetalert2';
import { IonList } from "@ionic/angular/standalone";

@Component({
  selector: 'app-codigos',
  templateUrl: './codigos.page.html',
  styleUrls: ['./codigos.page.scss'],
  standalone: true,
  imports: [IonList, 
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatDialogModule,
  ],
})
export class CodigosPage implements OnInit, OnDestroy {

  codigos: CodigoModel[] = [];
  codigosOriginales: CodigoModel[] = [];
  listaPaginada: CodigoModel[] = [];

  cargando = true;
  busqueda = '';

  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();
  private normalizar = (s: any) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  constructor(
    private codigosService: CodigosService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarCodigos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarCodigos(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.codigosService.getCodigos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (codigos) => {
          this.codigos = codigos ?? [];
          this.codigosOriginales = [...this.codigos];
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al obtener códigos:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.codigos.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  buscar(): void {
    const texto = this.normalizar(this.busqueda);
    if (!texto) {
      this.codigos = [...this.codigosOriginales];
    } else {
      this.codigos = this.codigosOriginales.filter(c =>
        this.normalizar(c.codigo).includes(texto) ||
        this.normalizar(c.tipo).includes(texto) ||
        this.normalizar(c.descripcion).includes(texto)
      );
    }
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  agregarCodigo(): void {
    Swal.fire({
      title: 'Agregar Código',
      html: `
        <input id="tipo"        class="swal2-input" placeholder="Tipo (ej: CCF, COM...)">
        <input id="codigo"      class="swal2-input" placeholder="Código">
        <textarea id="desc"     class="swal2-textarea" placeholder="Descripción"></textarea>`,
      showCancelButton: true, confirmButtonText: 'Agregar', cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const tipo   = (document.getElementById('tipo') as HTMLInputElement).value.trim();
        const codigo = (document.getElementById('codigo') as HTMLInputElement).value.trim();
        const desc   = (document.getElementById('desc') as HTMLTextAreaElement).value.trim();
        if (!tipo || !codigo) { Swal.showValidationMessage('Tipo y código son obligatorios'); return null; }
        return { tipo, codigo, descripcion: desc };
      }
    }).then(result => {
      if (!result.isConfirmed || !result.value) return;
      this.codigosService.addCodigo(result.value as CodigoModel).subscribe({
        next: () => { this.cargarCodigos(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Código agregado', showConfirmButton: false, timer: 2000 }); },
        error: () => Swal.fire({ icon: 'error', title: 'Error al agregar el código' })
      });
    });
  }

  async eliminarCodigos(j: CodigoModel): Promise<void> {
   /* const result = await Swal.fire({
      title: '¿Eliminar código?', text: 'No podrás revertir esto.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    this.codigosService.deleteCodigo(j.id).subscribe({
      next: () => { this.cargarCodigos(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Código eliminado', showConfirmButton: false, timer: 2000 }); },
      error: () => Swal.fire({ icon: 'error', title: 'Error al eliminar el código' })
    });*/
  }

  goTo(path: string): void { this.router.navigate([path]); }
}