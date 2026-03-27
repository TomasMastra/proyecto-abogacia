import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, forkJoin, of, Subject } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';

import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { JuzgadosService } from 'src/app/services/juzgados.service';
import { ClientesExpedientesService } from 'src/app/services/clientes-expedientes.service';
import { DialogClienteComponent } from '../../components/dialog-cliente/dialog-cliente.component';
import { DialogClienteModificarComponent } from '../../components/dialog-cliente-modificar/dialog-cliente-modificar.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.page.html',
  styleUrls: ['./lista-clientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
  ],
})
export class ListaClientesPage implements OnInit, OnDestroy {

  clientes: ClienteModel[] = [];
  clientesOriginales: ClienteModel[] = [];
  clientesPaginados: ClienteModel[] = [];

  busqueda: string = '';
  cargandoClientes: boolean = true;
  expandido: string | null = null;
  expedientesPorCliente: { [clienteId: string]: any[] } = {};

  // Paginador
  pageSize: number = 25;
  pageIndex: number = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private clienteService: ClientesService,
    private cliExpServ: ClientesExpedientesService,
    private juzgadoService: JuzgadosService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ────────────────────────────────────────────────
cargarClientes(): void {
  this.cargandoClientes = true;

  this.cdr.detectChanges();

  this.clienteService.getClientes()
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (clientes) => {
        this.clientesOriginales = clientes ?? [];
        this.clientes = [...this.clientesOriginales];
        this.pageIndex = 0;
        this.actualizarPagina();
        this.cargandoClientes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener clientes:', err);
        this.clientesOriginales = [];
        this.clientes = [];
        this.clientesPaginados = [];
        this.cargandoClientes = false;
        this.cdr.detectChanges();
      }
    });
}

  // ── Paginador ────────────────────────────────────────────
  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.clientesPaginados = this.clientes.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
    this.expandido = null; // cerrar expandido al cambiar de página
  }

  // ── Búsqueda ─────────────────────────────────────────────
  buscar(): void {
    const q = (this.busqueda ?? '').trim().toLowerCase();
    if (!q) {
      this.clientes = [...this.clientesOriginales];
    } else {
      this.clientes = this.clientesOriginales.filter(c => {
        const nombreApellido = `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.toLowerCase();
        return nombreApellido.includes(q);
      });
    }
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  trackByCliente(index: number, cliente: ClienteModel): string {
    return cliente.id;
  }

  // ── Expandir expedientes ──────────────────────────────────
  toggleExpandirCliente(cliente: ClienteModel): void {
    if (this.expandido === cliente.id) {
      this.expandido = null;
      return;
    }
    this.expandido = cliente.id;

    if (!this.expedientesPorCliente[cliente.id]) {
      this.expedientesPorCliente[cliente.id] = [];
    }
    if (this.expedientesPorCliente[cliente.id].length > 0) return;

    this.clienteService.ObtenerExpedientesPorCliente(cliente.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expedientes) => {
          const exps = Array.isArray(expedientes) ? expedientes : [];
          if (exps.length === 0) {
            this.expedientesPorCliente[cliente.id] = [];
            return;
          }
          const requests = exps.map(exp =>
            this.juzgadoService.getJuzgadoPorId(exp.juzgado_id).pipe(
              map(juzgado => ({ ...exp, juzgadoModel: juzgado })),
              catchError(() => of({ ...exp, juzgadoModel: null }))
            )
          );
          forkJoin(requests).subscribe({
            next: (result) => { this.expedientesPorCliente[cliente.id] = result; },
            error: () => { this.expedientesPorCliente[cliente.id] = exps; }
          });
        },
        error: () => { this.expedientesPorCliente[cliente.id] = []; }
      });
  }

  // ── Dialogs ───────────────────────────────────────────────
  abrirDialog(): void {
    const ref = this.dialog.open(DialogClienteComponent, { width: '500px', disableClose: true });
    ref.afterClosed().subscribe((cliente: ClienteModel) => {
      if (!cliente) return;
      this.clienteService.addCliente(cliente).subscribe({
        next: (response) => {
          cliente.id = response.id;
          const cache = this.clienteService.clientesSubject.value || [];
          this.clienteService.clientesSubject.next([...cache, cliente]);
          if (this.busqueda) this.buscar();
          else this.cargarClientes();
        },
        error: (err) => console.error('Error al agregar cliente:', err)
      });
    });
  }

  abrirModificar(cliente: ClienteModel): void {
    const ref = this.dialog.open(DialogClienteModificarComponent, { width: '500px', data: cliente, disableClose: true });
    ref.afterClosed().subscribe((modificado: ClienteModel) => {
      if (!modificado) return;
      this.clienteService.actualizarCliente(modificado.id, modificado).subscribe({
        next: () => {
          this.clienteService.limpiarClientes();
          this.cargarClientes();
        },
        error: (err) => console.error('Error al actualizar cliente:', err)
      });
    });
  }

  eliminarCliente(cliente: ClienteModel): void {
    Swal.fire({
      title: '¿Eliminár cliente?',
      text: 'Esta acción no se puede revertir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.clienteService.getExpedientesPorCliente(cliente.id).subscribe({
        next: (expedientes) => {
          if (expedientes.length > 0) {
            Swal.fire({ icon: 'error', title: 'No se puede eliminar', text: 'El cliente tiene expedientes en gestión.' });
            return;
          }
          cliente.estado = 'eliminado';
          this.clienteService.actualizarCliente(cliente.id, cliente).subscribe({
            next: () => {
              this.clienteService.limpiarClientes();
              this.cargarClientes();
              Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Cliente eliminado.', showConfirmButton: false, timer: 2500 });
            },
            error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar el cliente.' })
          });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo verificar los expedientes.' })
      });
    });
  }
}