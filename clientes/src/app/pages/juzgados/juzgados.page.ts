import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { DialogJuzgadoComponent } from '../../components/dialog-juzgado/dialog-juzgado.component';
import { DialogJuzgadoModificarComponent } from '../../components/dialog-juzgado-modificar/dialog-juzgado-modificar.component';

import Swal from 'sweetalert2';
import { IonList } from "@ionic/angular/standalone";

@Component({
  selector: 'app-juzgados',
  templateUrl: './juzgados.page.html',
  styleUrls: ['./juzgados.page.scss'],
  standalone: true,
  imports: [IonList, 
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatDialogModule,
  ],
})
export class JuzgadosPage implements OnInit, OnDestroy {

  juzgados: JuzgadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = [];
  listaPaginada: JuzgadoModel[] = [];

  cargando = true;
  hayJuzgados = true;
  busqueda = '';

  // Paginador
  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(20).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private juzgadosService: JuzgadosService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarJuzgados();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
cargarJuzgados(): void {
  this.cargando = true;
  this.cdr.detectChanges();

  requestAnimationFrame(() => {
    this.juzgadosService.getJuzgados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (juzgados) => {
          this.juzgados = juzgados ?? [];
          this.juzgadosOriginales = [...this.juzgados];
          this.hayJuzgados = this.juzgados.length > 0;
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al obtener juzgados:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  });
}

  // ── Paginador ──────────────────────────────────────────────
  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.juzgados.slice(start, start + this.pageSize);
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
      this.juzgados = [...this.juzgadosOriginales];
    } else {
      this.juzgados = this.juzgadosOriginales.filter(j =>
        (j.nombre || '').toLowerCase().includes(texto)
      );
    }
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  // ── Dialogs ────────────────────────────────────────────────
  abrirDialog(): void {
    const ref = this.dialog.open(DialogJuzgadoComponent, { width: '500px', disableClose: true });
    ref.afterClosed().subscribe((juzgado: JuzgadoModel) => {
      if (!juzgado) return;
      this.juzgadosService.addJuzgado(juzgado).subscribe({
        next: () => this.cargarJuzgados(),
        error: (err) => console.error('Error al agregar juzgado:', err)
      });
    });
  }

  abrirModificar(juzgado: JuzgadoModel): void {
    const ref = this.dialog.open(DialogJuzgadoModificarComponent, { width: '500px', data: juzgado, disableClose: true });
    ref.afterClosed().subscribe((modificado: JuzgadoModel) => {
      if (!modificado) return;
      this.juzgadosService.actualizarJuzgado(modificado.id, modificado).subscribe({
        next: () => this.cargarJuzgados(),
        error: (err) => console.error('Error al actualizar juzgado:', err)
      });
    });
  }

  eliminarJuzgado(juzgado: JuzgadoModel): void {
    Swal.fire({
      title: '¿Estás seguro?', text: 'No podrás revertir esto.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.juzgadosService.getExpedientesPorJuzgado(juzgado.id).subscribe(expedientes => {
        if (expedientes.length > 0) {
          Swal.fire({ icon: 'error', title: 'No podés eliminar este juzgado', text: 'Tiene expedientes en gestión.' });
          return;
        }
        juzgado.estado = 'eliminado';
        this.juzgadosService.actualizarJuzgado(juzgado.id, juzgado).subscribe({
          next: () => {
            this.cargarJuzgados();
            Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Juzgado eliminado.', showConfirmButton: false, timer: 3000 });
          },
          error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el juzgado.' })
        });
      });
    });
  }

  goTo(path: string): void { this.router.navigate([path]); }
}