import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { IonHeader, IonToolbar } from "@ionic/angular/standalone";

@Component({
  selector: 'app-fix-capital',
  standalone: true,
  templateUrl: './fix-capital.page.html',
  styleUrls: ['./fix-capital.page.scss'],
  imports: [IonToolbar, IonHeader, CommonModule, FormsModule, MatIconModule, MatPaginatorModule]
})
export class FixCapitalPage implements OnInit {
  cargando = false;
  busqueda = '';
  procuradorSeleccionado = '';
  estadoSeleccionado = '';

  desde = '2025-12-01';
  hasta = new Date().toISOString().slice(0, 10);

  listaUsuarios: any[] = [];
  registros: any[] = [];
  registrosFiltrados: any[] = [];
  listaPaginada: any[] = [];

  pageSize = 500;
  pageIndex = 0;

  skeletonRows = Array(8);

  estadosFix = ['OK', 'REVISAR'];

  usuarioLogueadoId = 7;

  constructor(
    private expedienteService: ExpedientesService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarDatos();
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe({
      next: (res) => {
        this.listaUsuarios = res || [];
      },
      error: (err) => console.error(err)
    });
  }

  cargarDatos() {
    this.cargando = true;
    this.expedienteService.getFixCapital(this.desde, this.hasta).subscribe({
      next: (res) => {
        this.registros = res || [];
        this.filtrar();
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  filtrar() {
    const txt = (this.busqueda || '').toLowerCase().trim();

    this.registrosFiltrados = this.registros.filter((item) => {
      const matchTexto =
        !txt ||
        item.caratula?.toLowerCase().includes(txt) ||
        item.numero?.toString().includes(txt) ||
        item.anio?.toString().includes(txt);

      const matchProcurador =
        !this.procuradorSeleccionado ||
        String(item.procurador_id) === String(this.procuradorSeleccionado);

      const matchEstado =
        !this.estadoSeleccionado || item.estado_fix === this.estadoSeleccionado;

      return matchTexto && matchProcurador && matchEstado;
    });

    this.pageIndex = 0;
    this.actualizarPagina();
  }

  actualizarPagina() {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.registrosFiltrados.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  getNombreAbogado(id: number): string {
    return this.listaUsuarios.find(u => u.id === id)?.nombre || '—';
  }

  mostrarFecha(fecha: string | null): string {
    if (!fecha) return '';
    return fecha.split('T')[0];
  }

  formatearMoneda(valor: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(Number(valor || 0));
  }
}