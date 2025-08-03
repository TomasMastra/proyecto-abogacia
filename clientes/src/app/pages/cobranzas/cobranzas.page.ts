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
  cobrosPorMes: { [mes: string]: any[] } = {};

  grafico: any;
ngOnInit() {
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
    private router: Router
  ) {}

  // ...resto del código sin cambios...

  convertirMes(mes: string): string {
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const numeroMes = parseInt(mes.split('-')[1], 10);
    return meses[numeroMes - 1];
  }

  calcularTotalMes(mes: string): number {
    return (this.cobrosPorMes[mes] || []).reduce((acc, item) => acc + Number(item.monto || 0), 0);
  }


  obtenerCobrosPorMes(anio: number, mes: number, claveMes: string) {
  this.expedienteService.obtenerCobrosPorMes(anio, mes).subscribe(cobros => {
    let total = 0;

const validarYSumar = (fechaStr: string | null, monto: number) => {
  if (!fechaStr) return;

  const partes = fechaStr.split('T')[0].split('-'); // ["2025", "08", "01"]
  const año = parseInt(partes[0], 10);
  const mesStr = partes[1];

  if (año === anio && parseInt(mesStr, 10) === mes) {
    total += monto || 0;
  }
};


    for (const item of cobros) {
      validarYSumar(item.fecha_cobro_capital, item.montoCapital);
      validarYSumar(item.fecha_cobro, item.montoHonorarios);
      validarYSumar(item.fechaCobroAlzada, item.montoAlzada);
      validarYSumar(item.fechaCobroEjecucion, item.montoEjecucion);
      validarYSumar(item.fechaCobroDiferencia, item.montoDiferencia);
    }

    if (total > 0) {
      this.cobrosPorMes[claveMes] = [{ monto: total }];
    }
  });
}


}
