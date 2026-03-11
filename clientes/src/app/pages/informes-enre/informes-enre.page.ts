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
      console.log('INFORME ENRE DATA:', data);
      console.log('INFORME ENRE LENGTH:', data?.length);

      this.informesOriginales = Array.isArray(data) ? data : [];
      this.informes = [...this.informesOriginales];

      this.cargando = false;
    },
    error: (err) => {
      console.error('ERROR INFORME ENRE:', err);
      this.cargando = false;
    }
  });
}

  filtrar() {
    const texto = this.busqueda.toLowerCase();

    this.informes = this.informesOriginales.filter(item => {
      const empresaOk = this.empresaSeleccionada
        ? item.empresa_id === +this.empresaSeleccionada
        : true;

      const numeroOk = item.numero?.toString().includes(texto);
      const anioOk = item.anio?.toString().includes(texto);

      const clienteOk =
        (item.nombre && item.nombre.toLowerCase().includes(texto)) ||
        (item.apellido && item.apellido.toLowerCase().includes(texto));

      const busquedaOk = texto === '' || numeroOk || anioOk || clienteOk;

      return empresaOk && busquedaOk;
    });
  }
}