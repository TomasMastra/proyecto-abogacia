import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';

import { DialogExpedienteComponent } from '../../components/dialog-expediente/dialog-expediente.component';
import { DialogExpedienteModificarComponent } from '../../components/dialog-expediente-modificar/dialog-expediente-modificar.component';
import { DialogTipoAltaComponent } from '../../components/dialog-tipo-alta/dialog-tipo-alta.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-lista-mediaciones',
  templateUrl: './lista-mediaciones.page.html',
  styleUrls: ['./lista-mediaciones.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatDialogModule,
    DialogTipoAltaComponent, DialogExpedienteComponent, DialogExpedienteModificarComponent,
  ],
})
export class ListaMediacionesPage implements OnInit, OnDestroy {

  mediaciones: any[] = [];
  mediacionesOriginales: any[] = [];
  listaPaginada: any[] = [];

  cargando = true;
  busqueda = '';

  ordenCampo = '';
  ordenAscendente = true;

  listaUsuarios: UsuarioModel[] = [];
  listaJuzgados: any[] = [];

  tiposJuzgado = ['CCF', 'COM', 'CIV', 'CC'];
  tipoSeleccionado = '';
  juzgadoSeleccionado = '';
  abogadoSeleccionado = '';
  procuradorSeleccionado = '';
  estadoSeleccionado = '';
  estadosMediacion = ['Pendiente', 'Continua', 'Cerrado sin acuerdo', 'Cerrado sin acuerdo - acta pendiente', 'Cerrado sin acuerdo - acta firmada'];

  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarMediaciones();
    this.juzgadoService.getJuzgados().pipe(takeUntil(this.destroy$))
      .subscribe(j => this.listaJuzgados = j || []);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarUsuarios(): void {
    this.usuarioService.getUsuarios().pipe(takeUntil(this.destroy$))
      .subscribe({ next: (u) => this.listaUsuarios = u || [], error: (e) => console.error(e) });
  }

  cargarMediaciones(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.expedienteService.getMediaciones().pipe(takeUntil(this.destroy$)).subscribe({
      next: (expedientes) => {
        this.mediaciones = expedientes || [];
        this.mediacionesOriginales = [...this.mediaciones];
        this.pageIndex = 0;
        this.actualizarPagina();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener mediaciones:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.mediaciones.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  filtrar(): void {
    const texto = (this.busqueda || '').toLowerCase().trim();
    const textoNorm = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    this.mediaciones = this.mediacionesOriginales.filter((m: any) => {
      const tipoOk       = this.tipoSeleccionado      ? m.juzgadoModel?.tipo === this.tipoSeleccionado : true;
      const juzgadoOk    = this.juzgadoSeleccionado   ? m.juzgado_id === +this.juzgadoSeleccionado : true;
      const abogadoOk    = this.abogadoSeleccionado   ? +m.usuario_id === +this.abogadoSeleccionado : true;
      const procuradorOk = this.procuradorSeleccionado? +m.procurador_id === +this.procuradorSeleccionado : true;
      const estadoOk     = this.estadoSeleccionado    ? (m.estado || '').toLowerCase() === this.estadoSeleccionado.toLowerCase() : true;

      const matchParte = (p: any) => {
        if (!p) return false;
        const n = (p.nombre || '').toLowerCase();
        const a = (p.apellido || '').toLowerCase();
        const rs = (p.razonSocial ?? p.razon_social ?? '').toLowerCase();
        return n.includes(texto) || a.includes(texto) || rs.includes(texto) || `${n} ${a}`.trim().includes(texto);
      };

      const numeroOk    = m.numero?.toString().includes(texto);
      const anioOk      = m.anio?.toString().includes(texto);
      const actoraOk    = m.clientes?.some(matchParte) ?? false;
      const demandadoOk = m.demandados?.some(matchParte) ?? false;
      const caratulaOk  = (m.caratula || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(textoNorm);
      const busquedaOk  = texto === '' || numeroOk || anioOk || actoraOk || demandadoOk || caratulaOk;

      return tipoOk && juzgadoOk && abogadoOk && procuradorOk && estadoOk && busquedaOk;
    });
    this.pageIndex = 0;
    this.actualizarPagina();
  }

  getNombreAbogado(usuario_id: any): string {
    if (!usuario_id || +usuario_id === 0) return '-';
    return this.listaUsuarios.find(u => +u.id === +usuario_id)?.nombre ?? '-';
  }

  mostrarFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const soloFecha = fecha.split('T')[0].split(' ')[0];
    if (soloFecha === '1900-01-01') return '';
    const [anio, mes, dia] = soloFecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }

  abrirDialog(): void {
    const ref = this.dialog.open(DialogExpedienteComponent, {
      width: '900px', disableClose: true,
      data: { mode: 'mediacion', tipo_registro: 'mediacion' }
    });
    ref.afterClosed().subscribe((payload: any) => {
      if (!payload) return;
      this.expedienteService.addExpediente(payload).subscribe({
        next: () => { this.cargarMediaciones(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mediación cargada', showConfirmButton: false, timer: 2000 }); },
        error: (err) => Swal.fire({ icon: 'error', title: 'Error al guardar', text: err?.error?.message || 'Revisá los datos' })
      });
    });
  }

  abrirModificar(expediente: any): void {
    const ref = this.dialog.open(DialogExpedienteModificarComponent, {
      width: '900px', disableClose: true,
      data: { id: expediente.id, tipo_registro: expediente.tipo_registro ?? null }
    });
    ref.afterClosed().subscribe((payload: any) => {
      if (!payload?.id) return;
      this.expedienteService.actualizarExpediente(payload.id, payload).subscribe({
        next: () => { this.cargarMediaciones(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Mediación modificada', showConfirmButton: false, timer: 1500 }); },
        error: () => Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'Error al actualizar', showConfirmButton: false, timer: 1500 })
      });
    });
  }

  eliminarExpediente(expediente: any): void {
    Swal.fire({
      title: '¿Estás seguro?', text: 'El expediente pasará a estado eliminado.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed || !expediente.id) return;
      this.expedienteService.actualizarExpediente(expediente.id, { ...expediente, estado: 'eliminado' }).subscribe({
        next: () => { this.cargarMediaciones(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Eliminado correctamente.', showConfirmButton: false, timer: 3000 }); },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar.' })
      });
    });
  }

  goTo(ruta: string): void { this.router.navigate([ruta]); }
}