import { Component } from '@angular/core';
import { ConfiguracionService, FontSizeOption } from 'src/app/services/configuracion.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
    standalone: true,
  imports: [
    MatIconModule, CommonModule
    
  ]
})
export class ConfiguracionPage {
  fontSize: FontSizeOption;

  opciones: { label: string; value: FontSizeOption }[] = [
    { label: 'Chica', value: 'chica' },
    { label: 'Mediana', value: 'mediana' },
    { label: 'Grande', value: 'grande' },
    { label: 'Muy grande', value: 'muy-grande' }
  ];

constructor(private config: ConfiguracionService) {
  this.fontSize = this.config.getCurrent() ?? 'mediana';
}

  cambiarTamano(valor: FontSizeOption): void {
    this.fontSize = valor;
    this.config.apply(valor);
  }

  getLabelActual(): string {
    return this.opciones.find(o => o.value === this.fontSize)?.label ?? 'Mediana';
  }

  getDescripcion(valor: FontSizeOption): string {
  switch (valor) {
    case 'chica': return 'Más contenido en pantalla';
    case 'mediana': return 'Tamaño recomendado';
    case 'grande': return 'Más cómodo para leer';
    case 'muy-grande': return 'Máxima legibilidad';
    default: return '';
  }
}

getScale(valor: FontSizeOption): number {
  switch (valor) {
    case 'chica': return 0.85;
    case 'mediana': return 1;
    case 'grande': return 1.18;
    case 'muy-grande': return 1.38;
    default: return 1;
  }
}
}