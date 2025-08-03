import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart-cobranzas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements OnChanges {

  @ViewChild('canvasCobranzas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() cobrosPorMes: { [mes: string]: any[] } = {};

  grafico: any;
/*
  @Input() demandadosPorMes: { [mes: string]: number } = {};
  @ViewChild('canvasDemandados', { static: true }) canvasDemandadosRef!: ElementRef<HTMLCanvasElement>;

  graficoDemandados: any;*/

    @ViewChild('canvasDemandados', { static: true }) canvasDemandadosRef!: ElementRef<HTMLCanvasElement>;
    @Input() demandadosPorNombre: { [nombre: string]: number } = {};
  graficoDemandados: any;


ngOnChanges(changes: SimpleChanges): void {
  if (changes['cobrosPorMes'] && this.cobrosPorMes) {
    this.inicializarGraficoCobros();
  }

  if (changes['demandadosPorNombre'] && this.demandadosPorNombre) {
    this.inicializarGraficoDemandados();
  }
}


  inicializarGraficoCobros() {
    const clavesMes = Object.keys(this.cobrosPorMes).sort().reverse();

    const labels = clavesMes.map(mes => `${this.convertirMes(mes)} / ${mes.split('-')[0]}`);
    const data = clavesMes.map(mes => this.cobrosPorMes[mes]?.[0]?.monto || 0);

    if (this.grafico) this.grafico.destroy();

    const ctx = this.canvasRef.nativeElement.getContext('2d');

    this.grafico = new Chart(ctx!, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Cobrado',
          data,
          backgroundColor: 'rgba(0, 123, 255, 0.7)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const monto = context.raw as number;
                  return `$${monto.toLocaleString()}`;
                }
              }
            }

        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => `$${value.toLocaleString()}`
            }
          }
        }
      }
    });
  }

  convertirMes(mes: string): string {
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const numeroMes = parseInt(mes.split('-')[1], 10);
    return meses[numeroMes - 1];
  }
  
inicializarGraficoDemandados() {
  const nombres = Object.keys(this.demandadosPorNombre);
  const cantidades = nombres.map(nombre => this.demandadosPorNombre[nombre]);

  if (this.graficoDemandados) this.graficoDemandados.destroy();

  const ctx = this.canvasDemandadosRef.nativeElement.getContext('2d');

  this.graficoDemandados = new Chart(ctx!, {
    type: 'bar',
    data: {
      labels: nombres,
      datasets: [{
        label: 'Cantidad de Demandados',
        data: cantidades,
        backgroundColor: 'rgba(255, 193, 7, 0.7)',
        borderColor: 'rgba(255, 193, 7, 1)',
        borderWidth: 1
      }]
    },
options: {
  // ... otras opciones
  scales: {
    y: {
      type: 'logarithmic', // <--- ¡Añade esta línea!
      ticks: {
        // Formatear las etiquetas para que sean más legibles en una escala logarítmica
        callback: function(value: any, index: any, values: any) {
          if (value === 1 || value === 10 || value === 100 || value === 1000) {
            return value;
          }
        },
      }
    }
  }
}
  });
}


}
