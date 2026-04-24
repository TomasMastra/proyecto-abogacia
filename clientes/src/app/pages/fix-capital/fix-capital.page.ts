import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { IonHeader, IonToolbar } from "@ionic/angular/standalone";
import Swal from 'sweetalert2';

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

  desde = '2013-10-01';
  //hasta = new Date().toISOString().slice(0, 10);
  hasta = '2026-04-20'

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

autoFixFila(item: any) {
  const porcentaje = Number(item.porcentaje_usuario_logueado ?? 0);
  const actual = Number(item.monto_fuente_actual ?? 0);

  if (!actual) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin monto',
      text: 'Este expediente no tiene monto base para calcular.'
    });
    return;
  }

  if (!porcentaje) {
    Swal.fire({
      icon: 'warning',
      title: 'Sin porcentaje',
      text: 'No se pudo calcular el porcentaje del usuario logueado.'
    });
    return;
  }

  if (porcentaje === 100) {
    Swal.fire({
      icon: 'info',
      title: 'No hace falta corregir',
      text: 'Este caso ya representa el 100%, no se modifica capital_test.'
    });
    return;
  }

  const capitalEsperado = Number((actual / (porcentaje / 100)).toFixed(2));

  Swal.fire({
    icon: 'question',
    title: 'Actualizar capital_test',
    html: `
      <div style="text-align:left">
        <p><strong>Expediente:</strong> ${item.numero}/${item.anio}</p>
        <p><strong>Carátula:</strong> ${item.caratula ?? '-'}</p>
        <p><strong>Monto actual:</strong> ${this.formatearMoneda(actual)}</p>
        <p><strong>Porcentaje usuario:</strong> ${porcentaje}%</p>
        <p><strong>Capital esperado:</strong> ${this.formatearMoneda(capitalEsperado)}</p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (!result.isConfirmed) return;

    this.expedienteService.actualizarCapitalTest(item.id, capitalEsperado).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: `Se guardó capital_test = ${this.formatearMoneda(capitalEsperado)}`
        });
        this.cargarDatos();
      },
      error: (err) => {
        console.error('Error al actualizar capital_test', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar capital_test.'
        });
      }
    });
  });
}

autoFix50Masivo() {
  const items = this.listaPaginada.filter(item =>
    Number(item.porcentaje_usuario_logueado) === 50 &&
    (item.capital_test === null || item.capital_test === undefined) &&
    Number(item.monto_fuente_actual) > 0 &&
    item.esPagoParcial !== true
  );

  if (items.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'Sin registros',
      text: 'No hay expedientes no parciales al 50% para corregir.'
    });
    return;
  }

  Swal.fire({
    icon: 'warning',
    title: 'Fix masivo 50%',
    html: `
      <div style="text-align:left">
        <p>Se van a actualizar <strong>${items.length}</strong> expedientes.</p>
        <p><strong>Solo no parciales</strong></p>
        <p><strong>Solo 50%</strong></p>
        <p>Se guardará <strong>capital_test = monto_fuente_actual × 2</strong></p>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Actualizar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {
    if (!result.isConfirmed) return;

    let procesados = 0;
    let errores = 0;

    items.forEach(item => {
      const capitalTest = Number((Number(item.monto_fuente_actual) * 2).toFixed(2));

      this.expedienteService.actualizarCapitalTest(item.id, capitalTest).subscribe({
        next: () => {
          procesados++;

          if (procesados + errores === items.length) {
            Swal.fire({
              icon: errores ? 'warning' : 'success',
              title: errores ? 'Terminado con errores' : 'Actualización completa',
              text: `Actualizados: ${procesados} - Errores: ${errores}`
            });
            this.cargarDatos();
          }
        },
        error: (err) => {
          console.error('Error al actualizar expediente', item.id, err);
          errores++;

          if (procesados + errores === items.length) {
            Swal.fire({
              icon: 'warning',
              title: 'Terminado con errores',
              text: `Actualizados: ${procesados} - Errores: ${errores}`
            });
            this.cargarDatos();
          }
        }
      });
    });
  });
}

}