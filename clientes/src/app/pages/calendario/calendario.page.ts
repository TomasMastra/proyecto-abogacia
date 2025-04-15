import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { EventosService } from 'src/app/services/eventos.service';
import { EventoModel } from 'src/app/models/evento/evento.component';

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss']
})
export class CalendarioPage implements OnInit, OnDestroy {

  eventos: EventoModel[] = [];
  hayEventos: boolean = false;
  private timeoutId: any;

  constructor(private eventosService: EventosService) {}

  ngOnInit() {
    this.cargarEventos();
  }

  ngOnDestroy() {
    // Limpio el timeout cuando se destruye el componente
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  cargarEventos() {
    this.eventosService.getEventos().subscribe((eventos: EventoModel[]) => {
      this.eventos = [...eventos];
      this.hayEventos = this.eventos.length > 0;
    },
    (error: any) => {
      console.error('Error al obtener eventos:', error);
    },
    () => {
      this.timeoutId = setTimeout(() => {
        this.cargarEventos();
      }, 5000);
    });
    
  }
}
