import { Component, Inject, OnInit } from '@angular/core';
import { Observable, startWith, map } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import Swal from 'sweetalert2';

type ParteMixta =
  | { tipo: 'empresa'; id: number; nombre: string }
  | { tipo: 'cliente'; id: number; nombre: string; apellido?: string | null };

@Component({
  selector: 'app-dialog-expediente-modificar',
  templateUrl: './dialog-expediente-modificar.component.html',
  styleUrls: ['./dialog-expediente-modificar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatCardModule,
    MatAutocompleteModule
  ]
})
export class DialogExpedienteModificarComponent implements OnInit {
  protected form: FormGroup;

  juzgados: JuzgadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = [];

  demandados: DemandadoModel[] = [];                // empresas
  clientes: ClienteModel[] = [];

  actorasAgregadas: ParteMixta[] = [];
  demandadosAgregados: ParteMixta[] = [];

  private destroy$ = new Subject<void>();
  juzgadoElegido: any;

  tipos: any[] = ['todos', 'CCF', 'COM', 'CIV', 'CC'];
  mensajeSelectJuzgado: any = 'Filtrar por juzgado';

  estados: any[] = [
    'Sorteado','Inicio - Previo','Inicio - Plantea Revocatoria','Inicio - Da Cumplimiento',
    'Inicio - Solicita','Inicio - Apela','Inicio - Recusa','Inicio - Plantea Nulidad','Inicio - Se Eleve',
    'Traslado demanda - Se Ordena','Traslado demanda - Cedula Confronte','Traslado demanda - Cedula Liberada',
    'Traslado demanda - Cedula Notificada','Traslado demanda - Cedula Sin Notificar','Traslado demanda - Notificado',
    'Traslado demanda - Previo Rebeldia','Contesta demanda - Traslado','Contesta demanda - Cedula','Contesta Traslado',
    'Se resuelva','Apertura a Prueba - Solicita','Apertura a Prueba - Cedula','Apertura a Prueba - Audiencia 360',
    'Pruebas - Se provean','Pruebas - Se provee','Prueba - Cedula Perito','Prueba - Cedula Parte','Prueba - Oficio deox',
    'Prueba - Oficio acredita','Prueba - Oficio solicita reiteratorio','Prueba - Oficio solicita Astreinte',
    'Prueba - Testimonial hace saber','Prueba - Acredita Testimonial','Prueba - Desiste','Prueba - Impugna',
    'Prueba - Se intime parte','Prueba - Se intime perito','Clausura periodo Prueba - Solicita',
    'Clausura periodo Prueba - Pase a certificar','Alegatos - Solicita','Alegatos - Cedula','Alegatos - Presenta',
    'Fiscal - Solicita','Fiscal - Cedula','Fiscal - Previo','Fiscal - Se ordena','Fiscal - Contesta traslado',
    'Defensor Oficial - Solicita','Defensor Oficial - Cedula','Defensor Oficial - Ratifica lo actuado',
    'Sentencia - Previo','Sentencia - Solicita','Sentencia - Pasen autos a Sentencia','Sentencia','Archivo','Caducidad'
  ];

  juicios: any[] = ['ordinario', 'sumarisimo', 'a definir'];

  listaUsuarios: UsuarioModel[] = [];
  abogadoSeleccionado: any;
  procuradorSeleccionado: any;
  juezSeleccionado: any; // si más tarde lo volvés a usar

  // Autocompletes
  actoraClienteCtrl = new FormControl<string>('');
  demandadoClienteCtrl = new FormControl<string>('');
  filteredActoraClientes!: Observable<ClienteModel[]>;
  filteredDemandadoClientes!: Observable<ClienteModel[]>;

  constructor(
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private demandadoService: DemandadosService,
    private clienteService: ClientesService,
    public dialogRef: MatDialogRef<DialogExpedienteModificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpedienteModel
  ) {
    // Form
    this.form = new FormGroup({
      numero: new FormControl('', [Validators.required]),
      anio: new FormControl('', [Validators.required]),
      estado: new FormControl('', [Validators.required]),
      porcentaje: new FormControl('', [Validators.required]),
      fechaInicio: new FormControl('', [Validators.required]),
      juicio: new FormControl('', [Validators.required]),
      tipo: new FormControl('todos', [Validators.required]),
      juzgado: new FormControl('', [Validators.required]),
      abogado: new FormControl('', [Validators.required]),
      procurador: new FormControl('', [Validators.required]),

      // Mixto
      actoraTipo: new FormControl<'cliente'|'empresa'>('cliente', [Validators.required]),
      actoraEmpresa: new FormControl<any | null>(null),
      demandadoTipo: new FormControl<'cliente'|'empresa'>('empresa', [Validators.required]),
      demandadoEmpresa: new FormControl<any | null>(null),
    });

    // Precarga de campos simples
    if (data) {
      const fechaFormateada = data.fecha_inicio ? new Date(data.fecha_inicio).toISOString().split('T')[0] : '';
      this.form.patchValue({
        numero: data.numero ?? '',
        anio: data.anio ?? '',
        estado: data.estado ?? '',
        porcentaje: data.porcentaje ?? '',
        fechaInicio: fechaFormateada,
        juicio: data.juicio ?? '',
      });
    }
  }

  ngOnInit(): void {
    this.cargarJuzgado();
    this.cargarDemandados();
    this.cargarClientes();
    this.cargarUsuarios();

    // Autocomplete filtros
    this.filteredActoraClientes = this.actoraClienteCtrl.valueChanges.pipe(
      startWith(''),
      map(text => this.filtrarClientes(text || ''))
    );
    this.filteredDemandadoClientes = this.demandadoClienteCtrl.valueChanges.pipe(
      startWith(''),
      map(text => this.filtrarClientes(text || ''))
    );

    // Precarga de actoras/demandados desde this.data
    this.preCargarPartes();
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  // ==== Carga de catálogos
  cargarJuzgado() {
    this.juzgadoService.getJuzgados()
      .pipe(takeUntil(this.destroy$))
      .subscribe(juzgados => {
        this.juzgadosOriginales = juzgados;
        this.juzgados = [...juzgados];
        if (this.data?.juzgado_id) {
          const j = this.juzgados.find(x => +x.id === +this.data.juzgado_id!);
          if (j) { this.form.get('juzgado')?.setValue(j); this.juzgadoElegido = j; }
        }
      });
  }

  cargarDemandados() {
    this.demandadoService.getDemandados()
      .pipe(takeUntil(this.destroy$))
      .subscribe(empresas => {
        this.demandados = empresas;
      });
  }

  cargarClientes() {
    this.clienteService.getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(clientes => { this.clientes = clientes || []; });
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this.listaUsuarios = usuarios;
        if (this.data?.usuario_id) {
          const ab = this.listaUsuarios.find(u => +u.id === +this.data.usuario_id);
          if (ab) { this.form.get('abogado')?.setValue(ab); this.abogadoSeleccionado = ab; }
        }
        if (this.data?.procurador_id) {
          const pr = this.listaUsuarios.find(u => +u.id === +this.data.procurador_id!);
          if (pr) { this.form.get('procurador')?.setValue(pr); this.procuradorSeleccionado = pr; }
        }
      });
  }

  // ==== Filtros y helpers
  private filtrarClientes(text: string) {
    const term = text.toLowerCase();
    return this.clientes.filter(c => (`${c.nombre} ${c.apellido || ''}`).toLowerCase().includes(term));
  }

  displayCliente(c: ClienteModel): string {
    return c ? `${c.nombre} ${c.apellido || ''}` : '';
  }

  cambiarTipoJuzgado() {
    const tipo = this.form.get('tipo')?.value;
    this.juzgados = (!tipo || tipo === 'todos') ? [...this.juzgadosOriginales] : this.juzgadosOriginales.filter(j => j.tipo === tipo);
  }

  onCambioTipo(_seccion: 'actora'|'demandado') {
    // si querés, podés limpiar controles al cambiar tipo
  }

  // ==== Precarga de partes desde this.data
  private preCargarPartes() {
    // ACTORAS: vienen en data.clientes (clientes) + podría haber empresas si ya migraste la tabla
    if (Array.isArray(this.data?.clientes)) {
      // clientes actoras
      for (const c of this.data.clientes) {
        if (!c?.id) continue;
        this.actorasAgregadas.push({ tipo: 'cliente', id: +c.id, nombre: c.nombre!, apellido: c.apellido });
      }
    }
    // Si tu API ya te devuelve actoras empresas aparte, agregalas acá.
    // (Si no, no pasa nada; la edición te permite sumar/borrar y se guardará en el PUT.)

    // DEMANDADOS (empresas actuales)
    if (Array.isArray(this.data?.demandados)) {
      for (const e of this.data.demandados as any[]) {
        if (!e?.id) continue;
        // Si tus demandados son empresas en el modelo, entran como 'empresa'
        this.demandadosAgregados.push({ tipo: 'empresa', id: +e.id, nombre: (e as any).nombre || e.nombre });
      }
    }
  }

  // ==== Selecciones
  seleccionarActoraCliente(c: ClienteModel) {
    this.actoraClienteCtrl.setValue('');
    if (!c?.id) return;
    const ya = this.actorasAgregadas.find(x => x.tipo === 'cliente' && x.id === +c.id);
    if (!ya) this.actorasAgregadas.push({ tipo: 'cliente', id: +c.id, nombre: c.nombre!, apellido: c.apellido });
  }

  seleccionarActoraEmpresa(e: DemandadoModel) {
    if (!e?.id) return;
    const ya = this.actorasAgregadas.find(x => x.tipo === 'empresa' && x.id === +e.id);
    if (!ya) this.actorasAgregadas.push({ tipo: 'empresa', id: +e.id, nombre: e.nombre! });
  }

  eliminarActora(a: ParteMixta) {
    this.actorasAgregadas = this.actorasAgregadas.filter(x => !(x.tipo === a.tipo && x.id === a.id));
  }

  seleccionarDemandadoCliente(c: ClienteModel) {
    this.demandadoClienteCtrl.setValue('');
    if (!c?.id) return;
    this.demandadosAgregados = [{ tipo: 'cliente', id: +c.id, nombre: c.nombre!, apellido: c.apellido }]; // solo 1 demandado
  }

  seleccionarDemandadoEmpresa(e: DemandadoModel) {
    if (!e?.id) return;
    this.demandadosAgregados = [{ tipo: 'empresa', id: +e.id, nombre: e.nombre! }]; // solo 1 demandado
  }

  eliminarDemandado(d: ParteMixta) {
    this.demandadosAgregados = this.demandadosAgregados.filter(x => !(x.tipo === d.tipo && x.id === d.id));
  }

  // ==== Guardar
  acceptDialog(): void {
    // debug de inválidos
    const invalid = Object.entries(this.form.controls)
      .filter(([_, c]) => c.invalid)
      .map(([k, c]) => `${k}: ${JSON.stringify(c.errors)}`);
    console.log('Controles inválidos =>', invalid);

    if (!this.form.valid || this.actorasAgregadas.length === 0 || this.demandadosAgregados.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Faltan datos obligatorios' });
      return;
    }

    const expediente = {
    id: this.data?.id, 
    numero: this.form.value.numero, 
    anio: this.form.value.anio, 
    estado: this.form.value.estado, 
    porcentaje: this.form.value.porcentaje, 
    juicio: this.form.value.juicio, 
    fecha_inicio: this.form.value.fechaInicio, 
    juzgado_id: this.form.value.juzgado?.id ?? null, 
    usuario_id: this.form.value.abogado?.id ?? null, 
    procurador_id: this.form.value.procurador?.id ?? null,
    actoras: this.actorasAgregadas, 
    demandados: this.demandadosAgregados,

    // Campos que se mantienen
    titulo: this.data.titulo ?? null,
    descripcion: this.data.descripcion ?? '',
    fecha_creacion: this.data.fecha_creacion,
    demandado_id: this.data.demandado_id ?? null,
    demandadoModel: this.data.demandadoModel ?? null,
    sala_radicacion: this.data.sala_radicacion ?? null,
    honorario: this.data.honorario ?? null,
    fecha_sentencia: this.data.fecha_sentencia ?? null,
    hora_sentencia: this.data.hora_sentencia ?? null,
    juez_id: this.data.juez_id ?? null,
    juezModel: this.data.juezModel ?? null,
    ultimo_movimiento: this.data.ultimo_movimiento ?? null,
    monto: this.data.monto ?? null,
    apela: this.data.apela ?? null,
    juzgadoModel: this.data.juzgadoModel ?? null,
    sala: this.data.sala ?? null,
    fecha_cobro: this.data.fecha_cobro ?? null,
    fecha_cobro_capital: this.data.fecha_cobro_capital ?? null,
    valorUMA: this.data.valorUMA ?? null,
    requiere_atencion: this.data.requiere_atencion ?? false,
    fecha_atencion: this.data.fecha_atencion ?? null,

    // Capital
    estadoCapitalSeleccionado: this.data.estadoCapitalSeleccionado ?? null,
    subEstadoCapitalSeleccionado: this.data.subEstadoCapitalSeleccionado ?? null,
    fechaCapitalSubestado: this.data.fechaCapitalSubestado ?? null,
    estadoLiquidacionCapitalSeleccionado: this.data.estadoLiquidacionCapitalSeleccionado ?? null,
    fechaLiquidacionCapital: this.data.fechaLiquidacionCapital ?? null,
    montoLiquidacionCapital: this.data.montoLiquidacionCapital ?? null,
    capitalCobrado: this.data.capitalCobrado ?? null,

    // Honorarios (principal)
    estadoHonorariosSeleccionado: this.data.estadoHonorariosSeleccionado ?? null,
    subEstadoHonorariosSeleccionado: this.data.subEstadoHonorariosSeleccionado ?? null,
    fechaHonorariosSubestado: this.data.fechaHonorariosSubestado ?? null,
    estadoLiquidacionHonorariosSeleccionado: this.data.estadoLiquidacionHonorariosSeleccionado ?? null,
    fechaLiquidacionHonorarios: this.data.fechaLiquidacionHonorarios ?? null,
    montoLiquidacionHonorarios: this.data.montoLiquidacionHonorarios ?? null,
    honorarioCobrado: this.data.honorarioCobrado ?? null,
    cantidadUMA: (this.data.cantidadUMA as any) ?? null,

    // Datos especiales (EDESUR/EDENOR)
    numeroCliente: this.data.numeroCliente ?? null,
    minutosSinLuz: this.data.minutosSinLuz ?? null,
    periodoCorte: this.data.periodoCorte ?? null,

    // Honorarios – Alzada
    estadoHonorariosAlzadaSeleccionado: this.data.estadoHonorariosAlzadaSeleccionado ?? null,
    subEstadoHonorariosAlzadaSeleccionado: this.data.subEstadoHonorariosAlzadaSeleccionado ?? null,
    fechaHonorariosAlzada: this.data.fechaHonorariosAlzada ?? null,
    umaSeleccionado_alzada: this.data.umaSeleccionado_alzada ?? null,
    cantidadUMA_alzada: this.data.cantidadUMA_alzada ?? null,
    montoAcuerdo_alzada: this.data.montoAcuerdo_alzada ?? null,
    honorarioAlzadaCobrado: this.data.honorarioAlzadaCobrado ?? false,
    fechaCobroAlzada: this.data.fechaCobroAlzada ?? null,

    // Honorarios – Ejecución
    estadoHonorariosEjecucionSeleccionado: this.data.estadoHonorariosEjecucionSeleccionado ?? null,
    subEstadoHonorariosEjecucionSeleccionado: this.data.subEstadoHonorariosEjecucionSeleccionado ?? null,
    fechaHonorariosEjecucion: this.data.fechaHonorariosEjecucion ?? null,
    umaSeleccionado_ejecucion: this.data.umaSeleccionado_ejecucion ?? null,
    cantidadUMA_ejecucion: this.data.cantidadUMA_ejecucion ?? null,
    montoHonorariosEjecucion: this.data.montoHonorariosEjecucion ?? null,
    honorarioEjecucionCobrado: this.data.honorarioEjecucionCobrado ?? false,
    fechaCobroEjecucion: this.data.fechaCobroEjecucion ?? null,

    // Honorarios – Diferencia
    estadoHonorariosDiferenciaSeleccionado: this.data.estadoHonorariosDiferenciaSeleccionado ?? null,
    subEstadoHonorariosDiferenciaSeleccionado: this.data.subEstadoHonorariosDiferenciaSeleccionado ?? null,
    fechaHonorariosDiferencia: this.data.fechaHonorariosDiferencia ?? null,
    montoHonorariosDiferencia: this.data.montoHonorariosDiferencia ?? null,
    honorarioDiferenciaCobrado: this.data.honorarioDiferenciaCobrado ?? false,
    fechaCobroDiferencia: this.data.fechaCobroDiferencia ?? null,

    // Otros
    //capitalPagoParcial: this.data.capitalPagoParcial ?? null,
    //caratula: this.data.caratula ?? null,
    };

    this.dialogRef.close(expediente);
  }
}
