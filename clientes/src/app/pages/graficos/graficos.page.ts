import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { ChartComponent } from 'src/app/components/chart/chart.component'; // Asegurate de que la ruta sea correcta

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.page.html',
  styleUrls: ['./graficos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, ChartComponent]
})
export class GraficosPage implements OnInit {

  tipoGrafico: string = ''; // default

  demandadosPorMes: { [mes: string]: number } = {};
  mesesDisponibles: string[] = [];
  cobrosPorMes: { [mes: string]: any[] } = {};
  expedientes: ExpedienteModel[] = [];

mesSeleccionado: string = '';
demandadosPorNombre: { [nombre: string]: number } = {};

  constructor(private expedienteService: ExpedientesService) {}

  ngOnInit() {
    this.obtenerExpedientes();
    this.obtenerCobranza();
  }

  obtenerCobranza() {
    const desdeAnio = 2014;
    const hoy = new Date();
    const hastaAnio = hoy.getFullYear();
    const hastaMes = hoy.getMonth() + 1;

    const mesesTemporales: string[] = [];

    for (let anio = desdeAnio; anio <= hastaAnio; anio++) {
      const mesInicio = 1;
      const mesFin = (anio === hastaAnio) ? hastaMes : 12;

      for (let mes = mesInicio; mes <= mesFin; mes++) {
        const clave = `${anio}-${mes.toString().padStart(2, '0')}`;
        mesesTemporales.push(clave);
      }
    }

    this.mesesDisponibles = mesesTemporales.reverse();

    this.mesesDisponibles.forEach(mes => {
      const [anio, mesStr] = mes.split('-').map(Number);

     /* this.expedienteService.obtenerCobrosPorMes(anio, mesStr).subscribe(cobros => {
        let total = 0;

        for (const item of cobros) {
          if (item.fecha_cobro_capital) total += item.montoCapital || 0;
          if (item.fecha_cobro) total += item.montoHonorarios || 0;
          if (item.fechaCobroAlzada) total += item.montoAlzada || 0;
          if (item.fechaCobroEjecucion) total += item.montoEjecucion || 0;
          if (item.fechaCobroDiferencia) total += item.montoDiferencia || 0;
        }

        if (total > 0) {
          this.cobrosPorMes[mes] = [{ monto: total }];
        }
      });*/
    });
  }

  obtenerExpedientes() {
    this.expedienteService.getExpedientes().subscribe(data => {
      this.expedientes = data!;
      console.log(this.expedientes);
      //this.contarDemandadosPorNombreEnMes();
    });
    console.log(this.expedientes);
    console.log(this.demandadosPorMes);

  }

actualizarDemandadosPorNombreEnMes(mesFiltrado: string) {
  const resultado: { [nombre: string]: number } = {};

  this.expedientes.forEach(exp => {
    const fecha = new Date(exp.fecha_inicio! || exp.ultimo_movimiento!);
    const claveMes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;

    if (claveMes === mesFiltrado && exp.demandados?.length) {
      exp.demandados.forEach(d => {
        const nombre = d.nombre?.trim() || 'Sin nombre';
        resultado[nombre] = (resultado[nombre] || 0) + 1;
      });
    }
  });

  this.demandadosPorNombre = resultado;
  console.log('Demandados por nombre para gráfico:', this.demandadosPorNombre);
}




  transformarDemandadosParaGrafico(): { [mes: string]: any[] } {
    const result: { [mes: string]: any[] } = {};

    for (const mes in this.demandadosPorMes) {
      result[mes] = [{ monto: this.demandadosPorMes[mes] }];
    }

    return result;
  }
}
