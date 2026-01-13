// Estructura base para el calendario completo con navegación de meses, eventos y formulario

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { EventoModel } from 'src/app/models/evento/evento.component';
import { EventosService } from 'src/app/services/eventos.service';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MediacionesService } from 'src/app/services/mediaciones.service';
import { MediacionModel } from 'src/app/models/mediacion/mediacion.component';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { startWith, map } from 'rxjs';



import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';


import { takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';


@Component({
  selector: 'app-calendario-avanzado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './calendario-avanzado.component.html',
  styleUrls: ['./calendario-avanzado.component.scss']
})
export class CalendarioAvanzadoComponent implements OnInit {

  currentDate: Date = new Date();
  diasDelMes: { dia: number; tieneEvento: boolean }[] = [];
  nombreMes: string[] = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  anioActual: number = 0;
  mesActual: number = 0;
  eventos: EventoModel[] = [];
  diasConEventos: Set<number> = new Set();
  eventosSeleccionados: EventoModel[] = [];
  fechaSeleccionada: Date | null = null;

  mostrarFormulario = false;
  eventoParaEditar: EventoModel | null = null;

  nuevoEvento: EventoModel = {
    titulo: '',
    descripcion: '',
    fecha_evento: '',
    hora_evento: '',
    tipo_evento: '',
    ubicacion: '',
    mediacion: null,
    clientes: [],
    estado: 'En curso',
    expediente_id: null, 
    link_virtual: null,
    expediente: null,
  };

  nuevaMediacion: MediacionModel = {
    numero: '',
    abogado_id: 0,
    cliente_id: null,
    demandado_id: 0,
    fecha: null,
    mediadora: '',
    finalizada: false
  };

  listaAbogados: UsuarioModel[] = [];
  listaClientes: ClienteModel[] = [];
  listaDemandados: DemandadoModel[] = [];
  clientesAgregados: ClienteModel[] = [];

  clienteCtrl = new FormControl<string>('');
  filteredClientes = this.clienteCtrl.valueChanges.pipe(
    startWith(''),
    map(value => this.filtrarClientes(value || ''))
  );
  clienteSeleccionado: ClienteModel | null = null;

  constructor(
    private eventosService: EventosService,
    private mediacionesService: MediacionesService,
    private clienteService: ClientesService,
    private usuarioService: UsuarioService,
    private demandadoService: DemandadosService
  ) {}

  ngOnInit(): void {
    this.cargarEventos();
    this.cargarClientes();
    this.cargarUsuarios();
    this.cargarDemandados();
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.eventoParaEditar = null;
    this.resetFormulario();
  }

  editarEvento(evento: EventoModel) {
    this.eventoParaEditar = evento;
    this.mostrarFormulario = true;
    this.nuevoEvento = { ...evento };
    this.nuevaMediacion = evento.mediacion ? { ...evento.mediacion } : this.nuevaMediacion;
    this.clientesAgregados = [...(evento.clientes || [])];
    this.actualizarCalendario();
  }
guardarEvento() {
  if (this.nuevoEvento.fecha_evento && this.nuevoEvento.tipo_evento) {
    const esEdicion = !!this.eventoParaEditar;

    const fecha = new Date(this.nuevoEvento.fecha_evento);
    if (this.nuevoEvento.hora_evento) {
      const [hora, minuto] = this.nuevoEvento.hora_evento.split(':').map(Number);
      fecha.setHours(hora);
      fecha.setMinutes(minuto);
      fecha.setSeconds(0);
    }
    this.nuevoEvento.fecha_evento = fecha.toISOString();
    this.nuevoEvento.hora_evento = null;

    // Si tiene mediación
    if (this.nuevoEvento.tipo_evento.includes('Audiencia') || this.nuevoEvento.tipo_evento === 'Mediación') {
      if (!esEdicion) {
        // Crear nueva mediación y luego el evento
        this.mediacionesService.crearMediacion(this.nuevaMediacion).subscribe({
          next: (mediacionCreada) => {
            const eventoConMediacion: EventoModel = {
              ...this.nuevoEvento,
              mediacion_id: mediacionCreada.id,
              clientes: this.clientesAgregados
            };
            this.guardarEventoFinal(eventoConMediacion, false);
          },
          error: () => {
            Swal.fire('Error', 'No se pudo crear la mediación', 'error');
          }
        });
      } else {
        // Ya tiene mediación, actualizar evento
        const eventoEditado: EventoModel = {
          ...this.nuevoEvento,
          clientes: this.clientesAgregados
        };
        this.guardarEventoFinal(eventoEditado, true);
      }
    } else {
      // Evento sin mediación
      const eventoSinMediacion: EventoModel = {
        ...this.nuevoEvento,
        clientes: this.clientesAgregados
      };
      this.guardarEventoFinal(eventoSinMediacion, esEdicion);
    }
  } else {
    alert('Falta completar fecha o tipo');
  }
}

private guardarEventoFinal(evento: EventoModel, esEdicion: boolean) {
  const obs = esEdicion
    ? this.eventosService.editarEvento(evento)
    : this.eventosService.addEvento(evento);

  obs.subscribe({
    next: () => {
      Swal.fire('Éxito', esEdicion ? 'Evento editado correctamente' : 'Evento creado', 'success');
      this.cargarEventos();
      this.resetFormulario();
      this.mostrarFormulario = false;
    },
    error: () => {
      Swal.fire('Error', 'No se pudo guardar el evento', 'error');
    }
  });
}


  resetFormulario() {
    this.nuevoEvento = {
      titulo: '', descripcion: '', fecha_evento: '', hora_evento: '', tipo_evento: '', ubicacion: '', mediacion: null, clientes: [], estado: 'En curso'
    ,expediente_id: null, link_virtual: null, expediente: null};
    this.nuevaMediacion = {
      numero: '', abogado_id: 0, cliente_id: null, demandado_id: 0, fecha: null, mediadora: '', finalizada: false
    };
    this.clientesAgregados = [];
    this.clienteCtrl.setValue('');
  }

  seleccionarCliente(cliente: ClienteModel) {
    if (!this.clientesAgregados.includes(cliente)) this.clientesAgregados.push(cliente);
    this.clienteCtrl.setValue('');
  }

  eliminarCliente(cliente: ClienteModel) {
    const index = this.clientesAgregados.indexOf(cliente);
    if (index > -1) this.clientesAgregados.splice(index, 1);
  }

  displayCliente(cliente: ClienteModel): string {
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : '';
  }

  filtrarClientes(value: string): ClienteModel[] {
    const filtro = value.toLowerCase();
    return this.listaClientes.filter(c => (`${c.nombre} ${c.apellido}`).toLowerCase().includes(filtro));
  }

  cargarEventos() {
    this.eventosService.getEventos().subscribe(eventos => {
      this.eventos = eventos;
      this.actualizarCalendario();
    });
  }

  cargarClientes() {
    this.clienteService.getClientes().subscribe(clientes => this.listaClientes = clientes!);
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe(usuarios => this.listaAbogados = usuarios);
  }

  cargarDemandados() {
    this.demandadoService.getDemandados().subscribe(demandados => this.listaDemandados = demandados);
  }

  seleccionarDia(dia: number) {
    if (dia === 0) return;
    this.fechaSeleccionada = new Date(this.anioActual, this.mesActual, dia);
    const fechaStr = this.fechaSeleccionada.toISOString().slice(0, 10);
    this.eventosSeleccionados = this.eventos.filter(evento => new Date(evento.fecha_evento).toISOString().slice(0, 10) === fechaStr);
  }

  mostrarDetallesEvento(evento: EventoModel) {
    const fecha = new Date(evento.fecha_evento);
    const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const clientes = evento.clientes?.map(c => `${c.nombre} ${c.apellido}`).join(', ') || 'No especificado';
    const ubicacion = evento.ubicacion?.trim() ? evento.ubicacion : 'No indicada';
    const estado = evento.estado || 'Sin estado';

    Swal.fire({
      title: evento.titulo || evento.tipo_evento,
      html: `<div style='text-align:left;'>
        <p><strong>Fecha:</strong> ${fecha.toLocaleDateString('es-AR')}</p>
        <p><strong>Hora:</strong> ${hora}</p>
        <p><strong>Ubicación:</strong> ${ubicacion}</p>
        <p><strong>Estado:</strong> ${estado}</p>
        <p><strong>Clientes:</strong> ${clientes}</p>
      </div>`,
      icon: 'info',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Editar',
      denyButtonText: 'Eliminar',
      cancelButtonText: 'Cerrar'
    }).then(result => {
      if (result.isConfirmed) this.editarEvento(evento);
      else if (result.isDenied) this.confirmarEliminarEvento(evento);
    });
  }

  confirmarEliminarEvento(evento: EventoModel) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) this.eliminarEvento(evento.id!);
    });
  }

  eliminarEvento(id: number) {
    this.eventosService.eliminarEvento(id).subscribe(() => {
      this.eventos = this.eventos.filter(e => e.id !== id);
      Swal.fire('Eliminado', 'El evento ha sido eliminado.', 'success');
      this.cargarEventos();
    }, () => {
      Swal.fire('Error', 'No se pudo eliminar el evento.', 'error');
    });
  }

  obtenerColorTipo(tipo: string): string {
    switch (tipo) {
      case 'Mediación': return 'mediacion';
      case 'Audiencia 360 vitual': return 'audienciaVirtual';
      case 'Audiencia 360 personal': return 'audienciaPersonal';
      case 'Notificación': return 'notificacion';
      case 'Sentencia': return 'sentencia';
      default: return 'otro';
    }
  }

  actualizarCalendario() {
    this.diasConEventos.clear();
    this.mesActual = this.currentDate.getMonth();
    this.anioActual = this.currentDate.getFullYear();

    const cantidadDias = new Date(this.anioActual, this.mesActual + 1, 0).getDate();
    const primerDiaSemana = new Date(this.anioActual, this.mesActual, 1).getDay();

    const eventosDelMes = this.eventos.filter(e => {
      const fecha = new Date(e.fecha_evento);
      return fecha.getFullYear() === this.anioActual && fecha.getMonth() === this.mesActual;
    });

    eventosDelMes.forEach(evento => {
      const fecha = new Date(evento.fecha_evento);
      const dia = fecha.getDate();
      this.diasConEventos.add(dia);
    });

    this.diasDelMes = [];
    for (let i = 0; i < primerDiaSemana; i++) {
      this.diasDelMes.push({ dia: 0, tieneEvento: false });
    }
    for (let dia = 1; dia <= cantidadDias; dia++) {
      this.diasDelMes.push({ dia, tieneEvento: this.diasConEventos.has(dia) });
    }
  }

  cambiarMes(offset: number) {
    this.currentDate.setMonth(this.currentDate.getMonth() + offset);
    this.actualizarCalendario();
    this.eventosSeleccionados = [];
  }

  mesAnterior() { this.cambiarMes(-1); }
  mesSiguiente() { this.cambiarMes(1); }

  sumarUnaHoraDesdeFecha(fecha: string | Date): string {
    const original = new Date(fecha);
    original.setHours(original.getHours() + 1);
    const horas = original.getHours().toString().padStart(2, '0');
    const minutos = original.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }
}
