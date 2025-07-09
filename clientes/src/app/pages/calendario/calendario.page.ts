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
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';


import { takeUntil } from 'rxjs/operators';
import { Subject, Observable, of } from 'rxjs';


@Component({
  selector: 'app-calendario',
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
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss']
})
export class CalendarioPage implements OnInit {

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
    expediente: null
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
  listaExpedientes: ExpedienteModel[] = [];
  clientesAgregados: ClienteModel[] = [];

  editando: boolean = false;

  clienteCtrl = new FormControl<string>('');
  filteredClientes = this.clienteCtrl.valueChanges.pipe(
    startWith(''),
    map(value => this.filtrarClientes(value || ''))
  );
  clienteSeleccionado: ClienteModel | null = null;
  expedienteCtrl = new FormControl('');
  filteredExpedientes: Observable<ExpedienteModel[]> = of([]);



  constructor(
    private eventosService: EventosService,
    private mediacionesService: MediacionesService,
    private clienteService: ClientesService,
    private usuarioService: UsuarioService,
    private demandadoService: DemandadosService,
    private expedienteService: ExpedientesService
  ) {}

  ngOnInit(): void {
    this.cargarEventos();
    this.cargarClientes();
    this.cargarUsuarios();
    this.cargarDemandados();
    this.cargarExpedientes();

    this.filteredExpedientes = this.expedienteCtrl.valueChanges.pipe(
      startWith(''),
      map(texto => this.filtrarExpedientes(texto!))
    );

  }

seleccionarExpediente(expediente: ExpedienteModel) {
  this.nuevoEvento.expediente_id = Number(expediente.id);  // 👈 casteo explícito
}


  filtrarExpedientes(texto: string): ExpedienteModel[] {
  const term = texto.toLowerCase();

  return this.listaExpedientes.filter(exp => {
    const numeroAnio = `${exp.numero}/${exp.anio}`.toLowerCase();
    const clientes = exp.clientes?.map(c => `${c.nombre} ${c.apellido}`.toLowerCase()).join(' ') || '';

    return numeroAnio.includes(term) || clientes.includes(term);
  });
}


  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.eventoParaEditar = null;
    this.resetFormulario();
  }

  editarEvento(evento: EventoModel) {
    this.editando = true;
    this.eventoParaEditar = evento;
    this.mostrarFormulario = true;
    this.nuevoEvento = { ...evento };
    this.nuevaMediacion = evento.mediacion ? { ...evento.mediacion } : this.nuevaMediacion;
    this.clientesAgregados = [...(evento.clientes || [])];
    this.actualizarCalendario();
    this.cargarEventos();
  }

  guardarEvento() {
    if (this.nuevoEvento.fecha_evento && this.nuevoEvento.tipo_evento) {
      if (this.nuevoEvento.tipo_evento === 'mediacion') {
        console.log('Clientes agregados para enviar:', this.clientesAgregados);
        this.mediacionesService.crearMediacion(this.nuevaMediacion).subscribe({
          next: (mediacionCreada) => {
        const eventoConMediacion: EventoModel = {
          ...this.nuevoEvento,
          mediacion_id: mediacionCreada.id,
          mediacion: null, // o mediacionCreada si querés guardar también el objeto
          clientes: this.clientesAgregados
        };


            this.guardarEventoFinal(eventoConMediacion);
            this.actualizarCalendario();
          },
          error: (error) => {
            console.error('Error al crear mediación:', error);
            alert('Error al crear la mediación');
          }
        });
      } else {
        const eventoSinMediacion = {
          ...this.nuevoEvento,
        };
        this.guardarEventoFinal(eventoSinMediacion);
      }
    } else {
      alert('Completa al menos Título, Fecha y Tipo');
    }
  }

  private guardarEventoFinal(evento: EventoModel) {
  const fecha = new Date(evento.fecha_evento); // Convertimos a Date real

  // Si tiene hora, se la seteamos a la fecha
  if (evento.hora_evento) {
    const [hora, minuto] = evento.hora_evento.split(':').map(Number);
    fecha.setHours(hora);
    fecha.setMinutes(minuto);
    fecha.setSeconds(0);
  }

  evento.fecha_evento = fecha.toISOString(); // Formato ISO para backend
  evento.hora_evento = null;
  evento.clientes = this.clientesAgregados;

  if (this.eventoParaEditar) {
    // 👉 Ya existe, actualizamos
    this.editando = false;

    evento.id = this.eventoParaEditar.id;
    this.eventosService.editarEvento(evento).subscribe({
      next: () => {
        Swal.fire('Actualizado', 'El evento fue actualizado.', 'success');
        this.resetFormulario();
        this.cargarEventos();
        this.mostrarFormulario = false;
        this.eventoParaEditar = null;
      },
      error: () => {
        Swal.fire('Error', 'No se pudo actualizar el evento.', 'error');
      }
    });
  } else {
    // 👉 Nuevo evento
    this.eventosService.addEvento(evento).subscribe({
      next: (response) => {
        const eventoConId = { ...evento, id: response.id };
        this.eventos.push(eventoConId);
        this.resetFormulario();
        this.cargarEventos();
        this.mostrarFormulario = false;

        Swal.fire({
          icon: 'success',
          title: 'Evento agregado con éxito',
          confirmButtonText: 'Entendido',
        });
      },
      error: (error) => {
        console.error('Error al guardar el evento:', error);
        alert('Ocurrió un error al guardar el evento');
      }
    });
  }
}


  resetFormulario() {
    this.nuevoEvento = {
      titulo: '', descripcion: '', fecha_evento: '', hora_evento: '', tipo_evento: '', ubicacion: '', mediacion: null, clientes: [], estado: 'En curso',
    expediente_id: null, link_virtual: null, expediente: null};
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
    this.actualizarCalendario(); // 🧠 Recalcula los días con eventos
    if (this.fechaSeleccionada) {
      const fechaStr = this.fechaSeleccionada.toISOString().slice(0, 10);
      this.eventosSeleccionados = eventos.filter(e => 
        new Date(e.fecha_evento).toISOString().slice(0, 10) === fechaStr
      );
    }
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

  cargarExpedientes() {
    this.expedienteService.getExpedientes().subscribe(expedientes => this.listaExpedientes = expedientes!);
  }

  seleccionarDia(dia: number) {
    if (dia === 0) return;
    this.fechaSeleccionada = new Date(this.anioActual, this.mesActual, dia);
    const fechaStr = this.fechaSeleccionada.toISOString().slice(0, 10);
    this.eventosSeleccionados = this.eventos.filter(evento => new Date(evento.fecha_evento).toISOString().slice(0, 10) === fechaStr);
  }

mostrarDetallesEvento(evento: EventoModel) {

  const expediente = evento.expediente;
let caratula = '';

if (expediente) {
  const numeroAnio = `${expediente.numero}/${expediente.anio}`;

  const actor = expediente.clientes.length > 1
    ? `${expediente.clientes[0].apellido} ${expediente.clientes[0].nombre} y otros`
    : expediente.clientes.length === 1
      ? `${expediente.clientes[0].apellido} ${expediente.clientes[0].nombre}`
      : '(sin actora)';

  const demandado = expediente.demandados.length > 1
    ? `${expediente.demandados[0].nombre} y otros`
    : expediente.demandados.length === 1
      ? expediente.demandados[0].nombre
      : '(sin demandado)';

  const juicio = expediente.juicio ? ` por ${expediente.juicio}` : '';

  caratula = `${numeroAnio} ${actor} c/ ${demandado}${juicio}`;
}

  const fecha = new Date(evento.fecha_evento);
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  const clientes = (evento.clientes?.length ? evento.clientes : evento.expediente?.clientes || [])
    .map(c => `${c.nombre} ${c.apellido}`)
    .join(', ') || 'No especificado';

  const estado = evento.estado || 'Sin estado';

  // 🟢 LINK (si es virtual)
  const esVirtual = evento.tipo_evento === 'Audiencia 360 virtual';
  const linkHTML = esVirtual && evento.link_virtual
    ? `<p><strong>Link:</strong> <a href="${evento.link_virtual}" target="_blank">${evento.link_virtual}</a></p>`
    : '';

  // 🟢 UBICACIÓN (si es personal)
  const esPresencial = evento.tipo_evento === 'Audiencia 360 personal';
  const ubicacion = evento.expediente?.juzgadoModel?.direccion || 'No indicada';
  const ubicacionHTML = esPresencial
    ? `<p><strong>Ubicación:</strong> ${ubicacion}</p>`
    : '';

  Swal.fire({
    title: evento.titulo || evento.tipo_evento,
    
    html: `<div style='text-align:left;'>
      ${caratula ? `<p><strong>Carátula:</strong> ${caratula}</p>` : ''}
      <p><strong>Fecha:</strong> ${fecha.toLocaleDateString('es-AR')}</p>
      <p><strong>Hora:</strong> ${hora}</p>
      <p><strong>Estado:</strong> ${estado}</p>
      <p><strong>Asistirán:</strong> ${clientes}</p>
      ${ubicacionHTML}
      ${linkHTML}
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
      this.cargarEventos();
      this.actualizarCalendario();
      this.scrollArriba();
      Swal.fire('Eliminado', 'El evento ha sido eliminado.', 'success');

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

  scrollArriba() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

actualizarEvento(evento: EventoModel) {
  this.eventosService.editarEvento(evento).subscribe({
    next: () => {
      Swal.fire('Actualizado', 'El evento fue actualizado.', 'success');
      this.cargarEventos();
      this.actualizarCalendario();
      this.scrollArriba();

      this.mostrarFormulario = false;
      this.eventoParaEditar = null;
    },
    error: () => {
      Swal.fire('Error', 'No se pudo actualizar el evento.', 'error');
    }
  });
}

displayExpediente(expediente: ExpedienteModel): string {
  if (!expediente) return '';
  const cliente = expediente.clientes?.[0];
  const demandado = expediente.demandados?.[0];
  return `${expediente.numero}/${expediente.anio} ${cliente ? cliente.nombre + ' ' + cliente.apellido : '(sin actora)'} contra ${demandado?.nombre || '(sin demandado)'}`;
}


}
