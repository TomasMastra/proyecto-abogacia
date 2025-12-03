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

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormBuilder  } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { JuzgadosService } from 'src/app/services/juzgados.service';
import { CodigosService } from 'src/app/services/codigos.service';

import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { CodigoModel } from 'src/app/models/codigo/codigo.component';

import { ExpedientesService } from 'src/app/services/expedientes.service';
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
  // -------- form
  protected form: FormGroup = new FormGroup({
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
    codigo: new FormControl<number|null>(null), // ← NUEVO

    // mixto
    actoraTipo: new FormControl<'cliente'|'empresa'>('cliente', [Validators.required]),
    actoraEmpresa: new FormControl<any | null>(null),
    demandadoTipo: new FormControl<'cliente'|'empresa'>('empresa', [Validators.required]),
    demandadoEmpresa: new FormControl<any | null>(null),
  });

  expediente!: ExpedienteModel;
  cargando = false;

  // -------- catálogos / estado
  juzgados: JuzgadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = [];
  demandados: DemandadoModel[] = [];  // empresas
  clientes: ClienteModel[]   = [];
  listaUsuarios: UsuarioModel[] = [];
  codigos: CodigoModel[] = [];
  codigosOriginales: CodigoModel[] = [];

  actorasAgregadas: ParteMixta[] = [];
  demandadosAgregados: ParteMixta[] = [];

  abogadoSeleccionado: UsuarioModel | null = null;
  procuradorSeleccionado: UsuarioModel | null = null;
  juzgadoElegido: JuzgadoModel | null = null;
  codigoSeleccionado: any = null;

  tipos = ['todos', 'CCF', 'COM', 'CIV', 'CC'];
  estados = [
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
  juicios = ['ordinario', 'sumarisimo', 'a definir'];
  mensajeSelectJuzgado = 'Filtrar por juzgado';

  // -------- autocompletes
  actoraClienteCtrl = new FormControl<string>('');
  actoraEmpresaCtrl = new FormControl<string | DemandadoModel>('');

  demandadoClienteCtrl = new FormControl<string>('');
  filteredActoraClientes!: Observable<ClienteModel[]>;
  filteredActoraEmpresas!: Observable<DemandadoModel[]>;

  filteredDemandadoClientes!: Observable<ClienteModel[]>;
  demandadoEmpresaCtrl = new FormControl<string | DemandadoModel>('');
  filteredDemandadoEmpresas!: Observable<DemandadoModel[]>;
  codigosFiltradas: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private demandadoService: DemandadosService,
    private clienteService: ClientesService,
    private expedienteService: ExpedientesService,
    private codigosService: CodigosService,
      private fb: FormBuilder,


    public dialogRef: MatDialogRef<DialogExpedienteModificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpedienteModel
  ) {
    // precarga campos simples
    if (data) {
      const fechaFormateada = data.fecha_inicio
        ? new Date(data.fecha_inicio).toISOString().split('T')[0]
        : '';
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

  // ============================================================
  // lifecycle
  // ============================================================
  ngOnInit(): void {
    //alert(this.data.id);

    this.inicializarForm();
    this.cargarExpediente();

    this.cargarJuzgado();
    this.cargarDemandados();
    this.cargarClientes();
    this.cargarUsuarios();
    this.cargarCodigos();

    // Autocomplete robusto: maneja string u objeto y resetea al enfocar/seleccionar
    // Autocomplete robusto (clientes)
    this.filteredActoraClientes = this.actoraClienteCtrl.valueChanges.pipe(
      startWith(''),
      map(v => this.filtrarClientes(v ?? ''))
    );
    this.filteredDemandadoClientes = this.demandadoClienteCtrl.valueChanges.pipe(
      startWith(''),
      map(v => this.filtrarClientes(v ?? ''))
    );

    this.filteredActoraEmpresas = this.actoraEmpresaCtrl.valueChanges.pipe(
      startWith(''),
      map(v => this.filtrarEmpresas(v ?? ''))
    );
    this.filteredDemandadoEmpresas = this.demandadoEmpresaCtrl.valueChanges.pipe(
      startWith(''),
      map(v => this.filtrarEmpresas(v ?? ''))
    );

    // Traigo las partes del backend (si hay id)
    if (this.data?.id) {
      this.expedienteService.getPartes(+this.data.id).subscribe({
        next: (r) => {
          this.actorasAgregadas = (r.actoras || []).map((a: any) => ({
            tipo: a.tipo === 'cliente' ? 'cliente' : 'empresa',
            id: +a.id,
            nombre: a.nombre!,
            apellido: a.apellido ?? null
          }));
          this.demandadosAgregados = (r.demandados || []).map((d: any) => ({
            tipo: d.tipo === 'cliente' ? 'cliente' : 'empresa',
            id: +d.id,
            nombre: d.nombre!,
            apellido: d.apellido ?? null
          }));

          // setear selects de tipo
          this.form.patchValue({
            actoraTipo: this.actorasAgregadas.some(x => x.tipo === 'empresa') ? 'empresa' : 'cliente',
            demandadoTipo: this.demandadosAgregados.length
              ? this.demandadosAgregados[0].tipo
              : 'empresa'
          });

          // preselección en combos de empresas (si ya están los catálogos)
          const actEmp = this.actorasAgregadas.find(x => x.tipo === 'empresa');
          if (actEmp) {
            const empA = this.demandados.find(e => +e.id === +actEmp.id);
            if (empA) this.form.patchValue({ actoraEmpresa: empA });
          }
          const demEmp = this.demandadosAgregados.find(x => x.tipo === 'empresa');
          if (demEmp) {
            const empD = this.demandados.find(e => +e.id === +demEmp.id);
            if (empD) this.form.patchValue({ demandadoEmpresa: empD });
          }
        },
        error: (e) => console.error('getPartes error', e)
      });
    }
  }

private inicializarForm(): void {
  this.form = this.fb.group({

    // ===========================
    // DATOS PRINCIPALES
    // ===========================
    numero: ['', Validators.required],
    anio: ['', Validators.required],
    estado: ['', Validators.required],
    porcentaje: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    juicio: ['', Validators.required],

    // ===========================
    // TIPO DE JUZGADO
    // (CCF — COM — CIV — todos)
    // ===========================
    tipo: ['todos', Validators.required],

    // ===========================
    // RELACIONES
    // ===========================
    juzgado: [null, Validators.required],   // ← antes era "juzgado"
    abogado: ['', Validators.required],         // usuario_id
    procurador: ['', Validators.required],      // procurador_id
    codigo: [null],                             // código jurisprudencia

    // ===========================
    // ACTORA MIXTA
    // ===========================
    actoraTipo: ['cliente', Validators.required],   // cliente | empresa
    actoraEmpresa: [null],                          // si es empresa va acá

    // ===========================
    // DEMANDADO MIXTO
    // ===========================
    demandadoTipo: ['empresa', Validators.required], // cliente | empresa
    demandadoEmpresa: [null]                         // si es empresa va acá
  });
}

private cargarExpediente(): void {
  this.cargando = true;

  this.expedienteService.getExpedientePorId(this.data.id).subscribe({
    next: (exp) => {
      this.expediente = exp;
      if (!exp) {
        this.cargando = false;
        return;
      }

      // buscar los objetos correspondientes al id
      const juzgadoSel =
        this.juzgados.find(j => +j.id == +exp.juzgado_id!) || null;

      const codigoSel =
        this.codigos.find(c => +c.id == exp.codigo_id) || null;

      const abogadoSel =
        this.listaUsuarios.find(u => +u.id == +exp.usuario_id) || null;

      const procuradorSel =
        this.listaUsuarios.find(u => u.id === exp.procurador_id) || null;

      // por ahora tomamos el primer demandado para el selector
      const primerDemandado =
        exp.demandados && exp.demandados.length ? exp.demandados[0] : null;

      this.form.patchValue({
        numero: exp.numero ?? '',
        anio: exp.anio ?? '',
        estado: exp.estado ?? '',
        porcentaje: exp.porcentaje ?? '',
        fechaInicio: exp.fecha_inicio ? exp.fecha_inicio.substring(0, 10) : '',
        juicio: exp.juicio ?? '',

        tipo: (exp as any).tipo ?? 'todos',

        juzgado: juzgadoSel,
        codigo: codigoSel,
        abogado: abogadoSel,
        procurador: procuradorSel,

        actoraTipo: 'cliente',
        actoraEmpresa: null,

        demandadoTipo: 'empresa',
        demandadoEmpresa: primerDemandado
      });

      // sincronizás los [(ngModel)] también
      this.juzgadoElegido = juzgadoSel;
      this.codigoSeleccionado = codigoSel;
      this.abogadoSeleccionado = abogadoSel;
      this.procuradorSeleccionado = procuradorSel;

      this.cargando = false;
    },
    error: (err) => {
      console.error('Error cargando expediente en diálogo:', err);
      this.cargando = false;
    }
  });
}

  // ============================================================
  // catálogos
  // ============================================================
  cargarJuzgado() {
    this.juzgadoService.getJuzgados()
      .pipe(takeUntil(this.destroy$))
      .subscribe(juzgados => {
        this.juzgadosOriginales = juzgados || [];
        this.juzgados = [...this.juzgadosOriginales];
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
        this.demandados = empresas || [];
        // si ya había actora/demandado empresa, preselecciono
        const actEmp = this.actorasAgregadas.find(a => a.tipo === 'empresa');
        if (actEmp) {
          const emp = this.demandados.find(d => +d.id === +actEmp.id) || null;
          if (emp) this.form.patchValue({ actoraEmpresa: emp });
        }
        const demEmp = this.demandadosAgregados.find(d => d.tipo === 'empresa');
        if (demEmp) {
          const emp = this.demandados.find(d => +d.id === +demEmp.id) || null;
          if (emp) this.form.patchValue({ demandadoEmpresa: emp });
        }
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
        this.listaUsuarios = usuarios || [];
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

  // ============================================================
  // helpers búsqueda
  // ============================================================
  private textoDeCliente(v: any): string {
    if (typeof v === 'string') return v;
    if (!v) return '';
    return `${v?.nombre ?? ''} ${v?.apellido ?? ''}`.trim();
  }
  private filtrarClientes(text: string) {
    const term = (text || '').toLowerCase();
    return this.clientes.filter(c => (`${c?.nombre ?? ''} ${c?.apellido ?? ''}`).toLowerCase().includes(term));
  }
  displayCliente(c: ClienteModel | string): string {
    if (!c) return '';
    if (typeof c === 'string') return c;
    return `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.trim();
  }
  resetActoraFiltro() { this.actoraClienteCtrl.setValue(''); }
  resetDemandadoFiltro() { this.demandadoClienteCtrl.setValue(''); }

  cambiarTipoJuzgado() {
    const tipo = this.form.get('tipo')?.value;
    this.juzgados = (!tipo || tipo === 'todos') ? [...this.juzgadosOriginales] : this.juzgadosOriginales.filter(j => j.tipo === tipo);
  }

  // ============================================================
  // acciones actora
  // ============================================================

    private yaExiste(arr: any[], tipo: 'cliente'|'empresa', id: number): boolean {
    return arr.some(x => x.tipo === tipo && Number(x.id) === Number(id));
  }
  seleccionarActoraCliente(c: ClienteModel) {
    if (!c?.id) return;
    const ya = this.actorasAgregadas.find(x => x.tipo === 'cliente' && x.id === +c.id);
    if (!ya) this.actorasAgregadas.push({ tipo: 'cliente', id: +c.id, nombre: c.nombre!, apellido: c.apellido ?? '' });
    this.actoraClienteCtrl.setValue(''); // limpia input
  }
  seleccionarActoraEmpresa(e: DemandadoModel) {
    if (!e?.id) { Swal.fire('Empresa inválida'); return; }
    const id = Number(e.id);
    if (Number.isNaN(id)) { Swal.fire('ID empresa inválido'); return; }

    if (!this.yaExiste(this.actorasAgregadas, 'empresa', id)) {
      this.actorasAgregadas.push({ tipo: 'empresa', id, nombre: e.nombre ?? '' });
    }
  }
  eliminarActora(a: ParteMixta) {
    this.actorasAgregadas = this.actorasAgregadas.filter(x => !(x.tipo === a.tipo && x.id === a.id));
  }


  eliminarDemandado(d: ParteMixta) {
    this.demandadosAgregados = this.demandadosAgregados.filter(x => !(x.tipo === d.tipo && x.id === d.id));
  }

  // ============================================================
  // guardar / cerrar
  // ============================================================
  acceptDialog(): void {
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

      // partes mixtas
      actoras: this.actorasAgregadas,
      demandados: this.demandadosAgregados,

      // resto se mantiene del data
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
      capitalPagoParcial: this.data.capitalPagoParcial ?? null,

      // Honorarios principal
      estadoHonorariosSeleccionado: this.data.estadoHonorariosSeleccionado ?? null,
      subEstadoHonorariosSeleccionado: this.data.subEstadoHonorariosSeleccionado ?? null,
      fechaHonorariosSubestado: this.data.fechaHonorariosSubestado ?? null,
      estadoLiquidacionHonorariosSeleccionado: this.data.estadoLiquidacionHonorariosSeleccionado ?? null,
      fechaLiquidacionHonorarios: this.data.fechaLiquidacionHonorarios ?? null,
      montoLiquidacionHonorarios: this.data.montoLiquidacionHonorarios ?? null,
      honorarioCobrado: this.data.honorarioCobrado ?? null,
      cantidadUMA: (this.data.cantidadUMA as any) ?? null,

      // EDESUR/EDENOR
      numeroCliente: this.data.numeroCliente ?? null,
      minutosSinLuz: this.data.minutosSinLuz ?? null,
      periodoCorte: this.data.periodoCorte ?? null,

      // Alzada
      estadoHonorariosAlzadaSeleccionado: this.data.estadoHonorariosAlzadaSeleccionado ?? null,
      subEstadoHonorariosAlzadaSeleccionado: this.data.subEstadoHonorariosAlzadaSeleccionado ?? null,
      fechaHonorariosAlzada: this.data.fechaHonorariosAlzada ?? null,
      umaSeleccionado_alzada: this.data.umaSeleccionado_alzada ?? null,
      cantidadUMA_alzada: this.data.cantidadUMA_alzada ?? null,
      montoAcuerdo_alzada: this.data.montoAcuerdo_alzada ?? null,
      honorarioAlzadaCobrado: this.data.honorarioAlzadaCobrado ?? false,
      fechaCobroAlzada: this.data.fechaCobroAlzada ?? null,

      // Ejecución
      estadoHonorariosEjecucionSeleccionado: this.data.estadoHonorariosEjecucionSeleccionado ?? null,
      subEstadoHonorariosEjecucionSeleccionado: this.data.subEstadoHonorariosEjecucionSeleccionado ?? null,
      fechaHonorariosEjecucion: this.data.fechaHonorariosEjecucion ?? null,
      umaSeleccionado_ejecucion: this.data.umaSeleccionado_ejecucion ?? null,
      cantidadUMA_ejecucion: this.data.cantidadUMA_ejecucion ?? null,
      montoHonorariosEjecucion: this.data.montoHonorariosEjecucion ?? null,
      honorarioEjecucionCobrado: this.data.honorarioEjecucionCobrado ?? false,
      fechaCobroEjecucion: this.data.fechaCobroEjecucion ?? null,

      // Diferencia
      estadoHonorariosDiferenciaSeleccionado: this.data.estadoHonorariosDiferenciaSeleccionado ?? null,
      subEstadoHonorariosDiferenciaSeleccionado: this.data.subEstadoHonorariosDiferenciaSeleccionado ?? null,
      fechaHonorariosDiferencia: this.data.fechaHonorariosDiferencia ?? null,
      montoHonorariosDiferencia: this.data.montoHonorariosDiferencia ?? null,
      honorarioDiferenciaCobrado: this.data.honorarioDiferenciaCobrado ?? false,
      fechaCobroDiferencia: this.data.fechaCobroDiferencia ?? null,
      recalcular_caratula: true,
      codigo_id: this.codigoSeleccionado?.id ?? null

    };

    this.dialogRef.close(expediente);
  }

  closeDialog(): void { this.dialogRef.close(); }

  private filtrarEmpresas(termLike: string | DemandadoModel): DemandadoModel[] {
  const toText = (v: string | DemandadoModel) =>
    typeof v === 'string' ? v : (v?.nombre ?? '');
  const normalize = (s: string) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const term = normalize(toText(termLike));
  if (!term) return this.demandados.slice();
  return this.demandados.filter(e => normalize(e.nombre ?? '').includes(term));
}

  displayEmpresa = (e: DemandadoModel) => e ? (e.nombre ?? '') : '';

// ========= DEMANDADOS (múltiples) =========
  seleccionarDemandadoCliente(c: ClienteModel) {
    if (!c?.id) { Swal.fire('Cliente inválido'); return; }
    const id = Number(c.id);
    if (Number.isNaN(id)) { Swal.fire('ID cliente inválido'); return; }

    if (!this.yaExiste(this.demandadosAgregados, 'cliente', id)) {
      this.demandadosAgregados.push({ tipo: 'cliente', id, nombre: c.nombre ?? '', apellido: c.apellido ?? '' });
    }

    // reset para volver a ver toda la lista
    this.demandadoClienteCtrl.setValue('');
  }

  seleccionarDemandadoEmpresa(e: DemandadoModel) {
    if (!e?.id) { Swal.fire('Empresa inválida'); return; }
    const id = Number(e.id);
    if (Number.isNaN(id)) { Swal.fire('ID empresa inválido'); return; }

    if (!this.yaExiste(this.demandadosAgregados, 'empresa', id)) {
      this.demandadosAgregados.push({ tipo: 'empresa', id, nombre: e.nombre ?? '' });
    }
  }

  cargarCodigos() {
    this.codigosService.getCodigos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(codigos => {
        this.codigosOriginales = codigos || [];
        this.codigos = [...this.codigosOriginales];
        if (this.data?.codigo_id) {
          const j = this.codigos.find(x => +x.id === +this.data.codigo_id!);
          if (j) { this.form.get('codigo')?.setValue(j); this.codigoSeleccionado = j; }
        }
      });
  }

cambiarTipoCodigo() {

  const tipo = this.form.get('tipo')?.value;

  if (!tipo || tipo === 'todos') {
    this.codigos = [...this.codigosOriginales];
    return;
  }

  if (tipo === 'COM') {
    // Solo las comerciales
    this.codigos = this.codigosOriginales.filter(j => 
      j.tipo?.toLowerCase() === 'comercial'
    );
  } else {
    // Todo menos las comerciales
    this.codigos = this.codigosOriginales.filter(j => 
      j.tipo?.toLowerCase() !== 'comercial'
    );
  }


}


}
