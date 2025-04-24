import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

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
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule
  ],
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss']
})
export class CalendarioPage implements OnInit, OnDestroy {

  eventos: EventoModel[] = [];
  hayEventos: boolean = false;
  private timeoutId: any;
  mostrarFormulario = false;

  nuevoEvento: EventoModel = {
    titulo: '',
    descripcion: '',
    fecha_evento: '',
    hora_evento: '',
    tipo_evento: '',
    ubicacion: ''
  };
  
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
  guardarEvento() {
    if (
      this.nuevoEvento.titulo &&
      this.nuevoEvento.fecha_evento &&
      this.nuevoEvento.tipo_evento
    ) {
      this.eventosService.addEvento(this.nuevoEvento).subscribe({
        next: (response) => {
          console.log('Evento agregado correctamente:', response);
  
          const eventoConId = { ...this.nuevoEvento, id: response.id };
          this.eventos.push(eventoConId);
  
          this.nuevoEvento = {
            titulo: '',
            descripcion: '',
            fecha_evento: '',
            hora_evento: '',
            tipo_evento: '',
            ubicacion: ''
          };
          this.mostrarFormulario = false;
  
          alert('Evento guardado correctamente');
        },
        error: (error) => {
          console.error('Error al guardar el evento:', error);
          alert('Ocurrió un error al guardar el evento');
        }
      });
  
    } else {
      alert('Completa al menos Título, Fecha y Tipo');
    }
  }
  
}
