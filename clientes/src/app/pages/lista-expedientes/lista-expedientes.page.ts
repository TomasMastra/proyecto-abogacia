import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { UsuarioService } from 'src/app/services/usuario.service';

import { DialogExpedienteComponent } from '../../components/dialog-expediente/dialog-expediente.component';
import { DialogExpedienteModificarComponent } from '../../components/dialog-expediente-modificar/dialog-expediente-modificar.component';
import { DialogTipoAltaComponent } from '../../components/dialog-tipo-alta/dialog-tipo-alta.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-expedientes',
  templateUrl: './lista-expedientes.page.html',
  styleUrls: ['./lista-expedientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatTooltipModule, MatPaginatorModule,
  ],
})
export class ListaExpedientesPage implements OnInit, OnDestroy {

  expedientes: ExpedienteModel[] = [];
  expedientesOriginales: ExpedienteModel[] = [];
  expedientesPaginados: ExpedienteModel[] = [];

  busqueda: string = '';
  cargando: boolean = true;
  iniciado: boolean = false;

  // Paginador
  pageSize: number = 15;
  pageIndex: number = 0;
  skeletonRows = Array(this.pageSize).fill(0);
  
  private destroy$ = new Subject<void>();

  constructor(
    private expedienteService: ExpedientesService,
    private usuarioService: UsuarioService,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarExpedientes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarExpedientes(): void {
    this.cargando = true;
    this.iniciado = false;
    this.pageIndex = 0;

    this.expedientesOriginales = [];
    this.expedientes = [];
    this.expedientesPaginados = [];

    this.expedienteService.getExpedientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expedientes) => {
          this.expedientesOriginales = expedientes ?? [];
          this.expedientes = [...this.expedientesOriginales];
          this.pageIndex = 0;
          this.actualizarPagina();
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error al obtener expedientes:', err);
          this.expedientesOriginales = [];
          this.expedientes = [];
          this.expedientesPaginados = [];
          this.cargando = false;
          this.iniciado = true;
        }
      });
  }

  // ── Paginador ─────────────────────────────────────────────
  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.expedientesPaginados = this.expedientes.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  // ── Búsqueda ──────────────────────────────────────────────
  filtrar(): void {
    const texto = this.busqueda.trim().toLowerCase();
    if (!texto) {
      this.expedientes = [...this.expedientesOriginales];
    } else {
      this.expedientes = this.expedientesOriginales.filter(exp =>
        (exp.caratula    && exp.caratula.toLowerCase().includes(texto))   ||
        (exp.numero      && exp.numero.toString().includes(texto))         ||
        (exp.anio        && exp.anio.toString().includes(texto))           ||
        ((exp as any).busqueda && (exp as any).busqueda.toLowerCase().includes(texto))
      );
    }
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  trackByExpedientes(index: number, exp: ExpedienteModel): string {
    return exp.id;
  }

  // ── Dialogs ───────────────────────────────────────────────
  abrirDialog(): void {
    const ref = this.dialog.open(DialogExpedienteComponent, {
      width: '900px', disableClose: true,
      data: { mode: 'expediente', tipo_registro: 'expediente' }
    });
    ref.afterClosed().subscribe((payload: any) => {
      if (!payload) return;
      this.expedienteService.addExpediente(payload).subscribe({
        next: () => {
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Expediente cargado', showConfirmButton: false, timer: 2000 });
          this.cargarExpedientes();
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error al guardar', text: err?.error?.message || 'Revisá los datos' })
      });
    });
  }

  abrirModificar(expediente: ExpedienteModel): void {
    const ref = this.dialog.open(DialogExpedienteModificarComponent, {
      width: '900px', disableClose: true,
      data: { id: expediente.id, tipo_registro: expediente.tipo_registro ?? null }
    });
    ref.afterClosed().subscribe((payload: any) => {
      if (!payload?.id) return;
      this.expedienteService.actualizarExpediente(payload.id, payload).subscribe({
        next: () => {
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Expediente modificado', showConfirmButton: false, timer: 1500 });
          this.cargarExpedientes();
        },
        error: () => Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error al actualizar', showConfirmButton: false, timer: 1500 })
      });
    });
  }

  eliminarExpediente(expediente: ExpedienteModel): void {
    Swal.fire({
      title: '¿Eliminar expediente?',
      text: 'No podrás revertir esta acción.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      if (!expediente.id) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'El expediente no tiene un ID válido.' });
        return;
      }
      expediente.estado = 'eliminado';
      this.expedienteService.actualizarExpediente(expediente.id, expediente).subscribe({
        next: () => {
          this.cargarExpedientes();
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Expediente eliminado.', showConfirmButton: false, timer: 3000 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el expediente.' })
      });
    });
  }

  async agregarClientes(expedienteId: number, clientes: ClienteModel[]): Promise<void> {
    if (!Array.isArray(clientes) || clientes.length === 0) return;
    for (const cliente of clientes) {
      await this.expedienteService.agregarClientesAExpediente(expedienteId, +cliente.id);
    }
  }

  verificarRol(): boolean {
    return this.usuarioService.usuarioLogeado?.rol === 'admin';
  }
}