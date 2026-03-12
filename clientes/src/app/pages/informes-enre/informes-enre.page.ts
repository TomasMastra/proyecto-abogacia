import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-informes-enre',
  standalone: true,
  templateUrl: './informes-enre.page.html',
  styleUrls: ['./informes-enre.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class InformesEnrePage {

  cargando = false;

  informes: any[] = [];
  informesOriginales: any[] = [];

  informesAgrupados: any[] = [];
  informesAgrupadosOriginales: any[] = [];

  busqueda = '';
  empresaSeleccionada = '';

  constructor(private expedientesService: ExpedientesService) {}

  ngOnInit() {
    this.cargar();
  }

cargar() {
  this.cargando = true;

  this.expedientesService.getInformeEnre().subscribe({
    next: (data: any[]) => {
      this.informesOriginales = data || [];
      this.informes = data || [];

      this.informesAgrupadosOriginales = this.agruparPorExpediente(this.informesOriginales);
      this.informesAgrupados = [...this.informesAgrupadosOriginales];

      this.cargando = false;
    },
    error: (err) => {
      console.error('ERROR INFORME ENRE:', err);
      this.cargando = false;
    }
  });
}

filtrar() {
  const texto = (this.busqueda || '').toLowerCase().trim();

  this.informesAgrupados = this.informesAgrupadosOriginales.filter(item => {

    const empresaOk = this.empresaSeleccionada
      ? Number(item.empresa_id) === Number(this.empresaSeleccionada)
      : true;

    const numeroOk = item.numero?.toString().includes(texto);
    const anioOk = item.anio?.toString().includes(texto);

    const clienteOk = item.clientes?.some((cliente: any) =>
      (`${cliente.nombre || ''} ${cliente.apellido || ''}`)
        .toLowerCase()
        .includes(texto)
    );

    const busquedaOk = !texto || numeroOk || anioOk || clienteOk;

    return empresaOk && busquedaOk;
  });
}

  agruparPorExpediente(data: any[]) {
  const mapa = new Map<string, any>();

  data.forEach(item => {
    const key = `${item.numero}-${item.anio}-${item.empresa_id}-${item.fecha_inicio}`;

    if (!mapa.has(key)) {
      mapa.set(key, {
        numero: item.numero,
        anio: item.anio,
        empresa_id: item.empresa_id,
        empresa: item.empresa,
        fecha_inicio: item.fecha_inicio,
        clientes: []
      });
    }

    mapa.get(key).clientes.push({
      cliente_id: item.cliente_id,
      nombre: item.nombre,
      apellido: item.apellido
    });
  });

  return Array.from(mapa.values());
}

getTituloClientes(item: any): string {
  if (!item.clientes || item.clientes.length === 0) return '';

  if (item.clientes.length === 1) {
    return `${item.clientes[0].nombre} ${item.clientes[0].apellido}`;
  }

  return `${item.clientes[0].nombre} ${item.clientes[0].apellido} y otros`;
}
}