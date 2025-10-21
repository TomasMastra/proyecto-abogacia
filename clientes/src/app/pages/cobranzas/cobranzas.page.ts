import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subscription, Observable, forkJoin, Subject } from 'rxjs';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { IonList, IonItemSliding, IonLabel, IonItem, IonInput } from "@ionic/angular/standalone";

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { UsuarioService } from 'src/app/services/usuario.service';

import { Pago } from 'src/app/models/pago/pago.component';
import { PagosService } from 'src/app/services/pagos.service';
import Swal from 'sweetalert2';

// Chart.js


@Component({
  selector: 'app-consultas',
  templateUrl: './cobranzas.page.html',
  styleUrls: ['./cobranzas.page.scss'],
  standalone: true,
  imports: [IonInput, IonItem, IonLabel, IonItemSliding, IonList, CommonModule, FormsModule,
    MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatMenuModule, MatProgressSpinnerModule,
    MatSelectModule,
    MatOptionModule,
  ]
})
export class CobranzasPage implements OnInit {

  cargando: boolean = false;
  expedientes: any[] = [];
  expedientesOriginales: any[] = [];

  hayExpedientes: boolean = true;
  private destroy$ = new Subject<void>();
  busqueda: string = '';

  ordenCampo: string = '';
  ordenAscendente: boolean = true;

  mesesDisponibles: string[] = [];
  cobrosPorMes: {
    [mes: string]: {
      capital: number;
      honorarios: number;
      alzada: number;
      ejecucion: number;
      diferencia: number;
      total: number;
    }
  } = {};

  pagos: Pago[] = [];
  pagosPorMes: Record<string, { cantidad: number; total: number }> = {};
  mesesPagosOrdenados: string[] = [];
  vista: string = 'menu';

  grafico: any;

ngOnInit() {
  this.cargarPagos();

  const desdeAnio = 2016;
  const hoy = new Date();
  const hastaAnio = hoy.getFullYear();
  const hastaMes = hoy.getMonth() + 1;

  const mesesTemporales: string[] = [];

  for (let anio = desdeAnio; anio <= hastaAnio; anio++) {
    const mesFin = (anio === hastaAnio) ? hastaMes : 12;

    for (let mes = 1; mes <= mesFin; mes++) {
      const clave = `${anio}-${mes.toString().padStart(2, '0')}`;
      mesesTemporales.push(clave);
    }
  }

  this.mesesDisponibles = mesesTemporales.reverse();

  this.mesesDisponibles.forEach(mes => {
    const [anio, mesStr] = mes.split('-').map(Number);
    this.obtenerCobrosPorMes(anio, mesStr, mes);
  });
}


  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private router: Router,
    private pagosService: PagosService,

  ) {}

  // ...resto del código sin cambios...

  convertirMes(mes: string): string {
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const numeroMes = parseInt(mes.split('-')[1], 10);
    return meses[numeroMes - 1];
  }



obtenerCobrosPorMes(anio: number, mes: number, claveMes: string) {
  this.expedienteService.obtenerTotalCobranzasPorMes(anio, mes).subscribe(totales => {

      this.cobrosPorMes[claveMes] = {
        capital: totales.totalCapital,
        honorarios: totales.totalHonorarios,
        alzada: totales.totalAlzada,
        ejecucion: totales.totalEjecucion,
        diferencia: totales.totalDiferencia,
        total: totales.totalGeneral
      };
    
  });
}


/* PAGOS */



private toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Devuelve 'YYYY-MM' a partir de 'YYYY-MM-DD' o Date */
private claveMes(fecha: string | Date): string {
  if (fecha instanceof Date) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  }
  const [y, m] = fecha.split('-');
  return `${y}-${m}`;
}

/** Trae todos los pagos y arma: this.pagos, this.pagosPorMes, this.mesesPagosOrdenados */
cargarPagos(): void {
  this.cargando = true;
  this.pagosService.obtenerPagos().subscribe({
    next: (lista: Pago[]) => {
      this.pagos = (lista || []).map(p => ({
        ...p,
        // normalizo fecha si viene como Date
        fecha: typeof p.fecha === 'string' ? p.fecha : this.toISODate(p.fecha as unknown as Date)
      }));
      this.agruparPagosPorMes();
      this.cargando = false;
    },
    error: (e) => {
      console.error('[Cobranzas] Error al obtener pagos', e);
      this.cargando = false;
      Swal.fire('Error', e?.message || 'No se pudieron cargar los pagos', 'error');
    }
  });
}

/** Agrupa this.pagos por YYYY-MM y ordena desc */
agruparPagosPorMes(): void {
  const mapa: Record<string, { cantidad: number; total: number }> = {};

  for (const p of this.pagos) {
    const clave = this.claveMes(p.fecha);
    if (!mapa[clave]) mapa[clave] = { cantidad: 0, total: 0 };
    mapa[clave].cantidad += 1;
    mapa[clave].total += Number(p.monto || 0);
  }

  this.pagosPorMes = mapa;
  this.mesesPagosOrdenados = Object.keys(mapa).sort((a, b) => b.localeCompare(a)); // desc
}

/** Botón: dialog para dar de alta un pago y refrescar las tablas */
async cargarPagoDialog(): Promise<void> {
  const hoy = this.toISODate(new Date());

  const { value: formValues } = await Swal.fire({
    title: 'Cargar pago',
    html: `
      <style>
        .swal2-popup .pago-form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 16px;
          margin-top: 6px;
        }
        .swal2-popup .field {
          display: flex;
          flex-direction: column;
        }
        .swal2-popup .field.full {
          grid-column: 1 / -1;
        }
        .swal2-popup .field label {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #444;
        }
        .swal2-popup .custom-input {
          width: 100%;
          height: 42px;
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: #fff;
          color: #000;
          font-size: 14px;
          font-weight: 500;
          box-shadow: none;
          outline: none;
        }
        .swal2-popup select.custom-input option {
          background: #fff;
          color: #000;
        }
      </style>

      <form id="form-pago" class="pago-form">
        <div class="field">
          <label for="swal-fecha">Fecha</label>
          <input id="swal-fecha" class="custom-input" type="date" value="${hoy}">
        </div>

        <div class="field">
          <label for="swal-monto">Monto</label>
          <input id="swal-monto" class="custom-input" type="number" step="0.01" placeholder="0.00">
        </div>

        <div class="field full">
          <label for="swal-tipo">Tipo de pago</label>
          <select id="swal-tipo" class="custom-input">
            <option value="consulta" selected>consulta</option>
            <option value="carta documento">carta documento</option>
            <option value="otro" selected>otro</option>
          </select>
        </div>
      </form>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const fecha = (document.getElementById('swal-fecha') as HTMLInputElement)?.value;
      const montoStr = (document.getElementById('swal-monto') as HTMLInputElement)?.value;
      const tipo = (document.getElementById('swal-tipo') as HTMLSelectElement)?.value;
      const monto = Number(montoStr);

      if (!fecha || !monto || isNaN(monto) || monto <= 0) {
        Swal.showValidationMessage('Completá fecha y un monto válido (> 0)');
        return null;
      }
      if (!tipo || (tipo !== 'consulta' && tipo !== 'carta documento' && tipo !== 'otro')) {
        Swal.showValidationMessage('Seleccioná un tipo de pago válido');
        return null;
      }
      return { fecha, monto, tipo_pago: tipo };
    },
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar'
  });

  if (!formValues) return;

  this.cargando = true;
  this.pagosService.cargarPago(formValues).subscribe({
    next: () => {
      this.cargando = false;
      Swal.fire('OK', 'Pago cargado con éxito', 'success');
      this.cargarPagos();
    },
    error: (e) => {
      this.cargando = false;
      console.error('[Cobranzas] Error al cargar pago', e);
      Swal.fire('Error', e?.message || 'No se pudo cargar el pago', 'error');
    }
  });
}



get totalCobranzas(): number {
  return Object.values(this.cobrosPorMes)
    .reduce((acc, val) => acc + (val?.total || 0), 0);
}

get totalPagosPorMes(): number {
  return Object.values(this.pagosPorMes)
    .reduce((acc, val) => acc + (val?.total || 0), 0);
}

cambiarMenu(opcion: number): void {
  if (opcion === 1) this.vista = 'cobranzas';
  if (opcion === 2) this.vista = 'pagosPorMes';
  if (opcion === 3) this.vista = 'historial';
  if (opcion === 4) this.vista = 'menu';

}

async eliminarPago(p: Pago): Promise<void> {
    if (!p || (p as any)?.id == null) {
      Swal.fire('Atención', 'No se encontró el ID del pago.', 'warning');
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar pago',
      html: `
        <p>¿Seguro que querés eliminar este pago?</p>
        <ul style="text-align:left">
          <li><strong>Monto:</strong> $${Number(p.monto).toFixed(2)}</li>
          <li><strong>Tipo:</strong> ${p.tipo_pago}</li>
        </ul>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!isConfirmed) return;

    this.cargando = true;
    this.pagosService.eliminarPago((p as any).id).subscribe({
      next: () => {
        // Actualizo arrays locales sin reconsultar todo
        this.pagos = this.pagos.filter(x => (x as any).id !== (p as any).id);
        this.agruparPagosPorMes();
        this.cargando = false;
        Swal.fire('OK', 'Pago eliminado', 'success');
      },
      error: (e) => {
        this.cargando = false;
        console.error('[Cobranzas] Error al eliminar pago', e);
        Swal.fire('Error', e?.message || 'No se pudo eliminar el pago', 'error');
      }
    });
  }

}
