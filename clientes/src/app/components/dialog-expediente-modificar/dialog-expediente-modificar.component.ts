import { Component, Inject, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormBuilder } from '@angular/forms';
import { Observable, startWith, map, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import Swal from 'sweetalert2';

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

type ParteMixta =
  | { tipo: 'empresa'; id: number; nombre: string }
  | { tipo: 'cliente'; id: number; nombre: string; apellido?: string | null };

type DialogExpedienteModificarData = {
  id: number;
  tipo_registro?: string | null; // lo mandás desde abrirModificar()
};

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
export class DialogExpedienteModificarComponent implements OnInit, OnDestroy {
  // =========================
  // FORM
  // =========================
  form!: FormGroup;

  // =========================
  // DATA
  // =========================
  expediente!: ExpedienteModel;
  mode: 'expediente' | 'mediacion' = 'expediente';

  // estados
  estadosMediacion = ['Pendiente','Continua','Cerrado con acuerdo','Cerrado sin acuerdo'];
  estados: string[] = [
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
  estadosVisibles: string[] = [];

  // combos
  tipos = ['todos', 'CCF', 'COM', 'CIV', 'CC'];
  juicios = ['ordinario', 'sumarisimo', 'a definir'];
  mensajeSelectJuzgado = 'Filtrar por juzgado';

  // catálogos
  juzgados: JuzgadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = [];
  demandados: DemandadoModel[] = [];
  clientes: ClienteModel[] = [];
  listaUsuarios: UsuarioModel[] = [];
  codigos: CodigoModel[] = [];
  codigosOriginales: CodigoModel[] = [];

  // partes
  actorasAgregadas: ParteMixta[] = [];
  demandadosAgregados: ParteMixta[] = [];

  // autocompletes
  actoraClienteCtrl = new FormControl<string>('');
  actoraEmpresaCtrl = new FormControl<string | DemandadoModel>('');
  demandadoClienteCtrl = new FormControl<string>('');
  demandadoEmpresaCtrl = new FormControl<string | DemandadoModel>('');

  filteredActoraClientes!: Observable<ClienteModel[]>;
  filteredDemandadoClientes!: Observable<ClienteModel[]>;
  filteredActoraEmpresas!: Observable<DemandadoModel[]>;
  filteredDemandadoEmpresas!: Observable<DemandadoModel[]>;

  private destroy$ = new Subject<void>();

  constructor(
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private demandadoService: DemandadosService,
    private clienteService: ClientesService,
    private expedienteService: ExpedientesService,
    private codigosService: CodigosService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<DialogExpedienteModificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogExpedienteModificarData
  ) {}

  // =========================
  // INIT / DESTROY
  // =========================
  ngOnInit(): void {
    // 1) MODO INICIAL (rápido) por data
    const tr0 = (this.data?.tipo_registro ?? '').toString().toLowerCase();
    this.mode = tr0 === 'mediacion' ? 'mediacion' : 'expediente';
    this.setEstadosVisibles();

    // 2) Crear form UNA SOLA VEZ
    this.inicializarForm();
    this.configurarModo();
    this.configurarAutocompletes();

    // 3) Catálogos
    this.cargarJuzgado();
    this.cargarDemandados();
    this.cargarClientes();
    this.cargarUsuarios();
    this.cargarCodigos();

    // 4) Datos desde backend
    this.cargarExpediente();
    this.cargarPartes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================
  // FORM
  // =========================
  private inicializarForm(): void {
    this.form = this.fb.group({
      numero: [null],
      anio: [null, Validators.required],
      estado: [null, Validators.required],
      porcentaje: [null, Validators.required],
      fechaInicio: [null, Validators.required],
      juicio: [null],
      tipo: ['todos'],
      juzgado: [null],
      abogado: [null, Validators.required],
      procurador: [null, Validators.required],
      codigo: [null],

      // mediación
      montoLiquidacionCapital: [null],
      montoLiquidacionHonorarios: [null],

      // mixto
      actoraTipo: ['cliente', Validators.required],
      actoraEmpresa: [null],
      demandadoTipo: ['empresa', Validators.required],
      demandadoEmpresa: [null],
    });
  }

  private setEstadosVisibles(): void {
    this.estadosVisibles = this.mode === 'mediacion' ? this.estadosMediacion : this.estados;
  }

  private configurarModo(): void {
    const esMed = this.mode === 'mediacion';

    const numero = this.form.get('numero');
    const juicio = this.form.get('juicio');
    const tipo = this.form.get('tipo');
    const juzgado = this.form.get('juzgado');
    const codigo = this.form.get('codigo');

    const montoCap = this.form.get('montoLiquidacionCapital');
    const montoHon = this.form.get('montoLiquidacionHonorarios');

    if (esMed) {
      // NO van
      [numero, juicio, tipo, juzgado, codigo].forEach(c => {
        c?.clearValidators();
        c?.setValue(null, { emitEvent: false });
        c?.disable({ emitEvent: false });
        c?.updateValueAndValidity({ emitEvent: false });
      });

      // SI van (obligatorios)
      montoCap ?.setValidators([Validators.required, Validators.min(0)]);
      montoHon?.setValidators([Validators.required, Validators.min(0)]);
      montoCap ?.enable({ emitEvent: false });
      montoHon?.enable({ emitEvent: false });
      montoCap ?.updateValueAndValidity({ emitEvent: false });
      montoHon?.updateValueAndValidity({ emitEvent: false });
    } else {
      // SI van
      numero?.setValidators([Validators.required, Validators.min(0)]);
      juicio?.setValidators([Validators.required]);
      tipo?.setValidators([Validators.required]);
      juzgado?.setValidators([Validators.required]);

      [numero, juicio, tipo, juzgado, codigo].forEach(c => {
        c?.enable({ emitEvent: false });
        c?.updateValueAndValidity({ emitEvent: false });
      });

      // NO van
      montoCap ?.clearValidators();
      montoHon?.clearValidators();
      montoCap ?.setValue(null, { emitEvent: false });
      montoHon?.setValue(null, { emitEvent: false });
      montoCap ?.disable({ emitEvent: false });
      montoHon?.disable({ emitEvent: false });
      montoCap ?.updateValueAndValidity({ emitEvent: false });
      montoHon?.updateValueAndValidity({ emitEvent: false });
    }
  }


  // =========================
  // CARGAS
  // =========================
  private cargarExpediente(): void {
    this.expedienteService.getExpedientePorId(this.data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exp: any) => {
          if (!exp) return;

          this.expediente = exp;

          // MODO FINAL: backend manda la posta
            const tr = (exp?.tipo_registro ?? '').toString().toLowerCase();
            this.mode = tr === 'mediacion' ? 'mediacion' : 'expediente';
          this.setEstadosVisibles();
          this.configurarModo();

          console.log(this.mode, exp?.tipo_registro);

          // preselecciones (si catálogos todavía no llegaron, quedan null; luego los re-parcheamos)
          const juzgadoSel = this.juzgados.find(j => +j.id === +exp.juzgado_id) || null;
          const codigoSel  = this.codigos.find(c => +c.id === +exp.codigo_id) || null;
          const abogadoSel = this.listaUsuarios.find(u => +u.id === +exp.usuario_id) || null;
          const procurSel  = this.listaUsuarios.find(u => +u.id === +exp.procurador_id) || null;

          this.form.patchValue({
            numero: exp.numero ?? null,
            anio: exp.anio ?? null,
            estado: exp.estado ?? null,
            porcentaje: exp.porcentaje ?? null,
            fechaInicio: exp.fecha_inicio ? String(exp.fecha_inicio).substring(0, 10) : null,
            juicio: exp.juicio ?? null,
            tipo: (exp as any).tipo ?? 'todos',

            juzgado: juzgadoSel,
            codigo: codigoSel,
            abogado: abogadoSel,
            procurador: procurSel,

            // mediación
            montoLiquidacionCapital: exp.montoLiquidacionCapital ?? null,
            montoLiquidacionHonorarios: exp.montoLiquidacionHonorarios ?? null,
          }, { emitEvent: false });

          // filtros dependientes
          if (this.mode !== 'mediacion') {
            this.cambiarTipoJuzgado();
            this.cambiarTipoCodigo();
          }

          this.cdr.markForCheck();
        },
        error: (e) => {
          console.error('getExpedientePorId ERROR', e);
          Swal.fire({ icon: 'error', title: 'Error cargando expediente' });
        }
      });
  }

  private cargarPartes(): void {
    this.expedienteService.getPartes(+this.data.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (r: any) => {
          this.actorasAgregadas = (r?.actoras || []).map((a: any) => ({
            tipo: a.tipo === 'cliente' ? 'cliente' : 'empresa',
            id: +a.id,
            nombre: a.nombre!,
            apellido: a.apellido ?? null
          }));

          this.demandadosAgregados = (r?.demandados || []).map((d: any) => ({
            tipo: d.tipo === 'cliente' ? 'cliente' : 'empresa',
            id: +d.id,
            nombre: d.nombre!,
            apellido: d.apellido ?? null
          }));

          this.form.patchValue({
            actoraTipo: this.actorasAgregadas.some(x => x.tipo === 'empresa') ? 'empresa' : 'cliente',
            demandadoTipo: this.demandadosAgregados.length ? this.demandadosAgregados[0].tipo : 'empresa',
          }, { emitEvent: false });

          this.cdr.markForCheck();
        },
        error: (e) => console.error('getPartes ERROR', e)
      });
  }

  cargarJuzgado(): void {
    this.juzgadoService.getJuzgados()
      .pipe(takeUntil(this.destroy$))
      .subscribe(juzgados => {
        this.juzgadosOriginales = juzgados || [];
        this.juzgados = [...this.juzgadosOriginales];

        // re-enganchar selección si ya cargó expediente
        const exp: any = this.expediente as any;
        if (exp?.juzgado_id) {
          const j = this.juzgados.find(x => +x.id === +exp.juzgado_id) || null;
          if (j) this.form.patchValue({ juzgado: j }, { emitEvent: false });
        }

        this.cdr.markForCheck();
      });
  }

  cargarDemandados(): void {
    this.demandadoService.getDemandados()
      .pipe(takeUntil(this.destroy$))
      .subscribe(empresas => {
        this.demandados = empresas || [];
        this.cdr.markForCheck();
      });
  }

  cargarClientes(): void {
    this.clienteService.getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(clientes => {
        this.clientes = clientes || [];
        this.cdr.markForCheck();
      });
  }

  cargarUsuarios(): void {
    this.usuarioService.getUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this.listaUsuarios = usuarios || [];

        // re-enganchar selección si ya cargó expediente
        const exp: any = this.expediente as any;
        if (exp?.usuario_id) {
          const ab = this.listaUsuarios.find(u => +u.id === +exp.usuario_id) || null;
          if (ab) this.form.patchValue({ abogado: ab }, { emitEvent: false });
        }
        if (exp?.procurador_id) {
          const pr = this.listaUsuarios.find(u => +u.id === +exp.procurador_id) || null;
          if (pr) this.form.patchValue({ procurador: pr }, { emitEvent: false });
        }

        this.cdr.markForCheck();
      });
  }

  cargarCodigos(): void {
    this.codigosService.getCodigos()
      .pipe(takeUntil(this.destroy$))
      .subscribe(codigos => {
        this.codigosOriginales = codigos || [];
        this.codigos = [...this.codigosOriginales];

        // re-enganchar selección si ya cargó expediente
        const exp: any = this.expediente as any;
        if (exp?.codigo_id) {
          const c = this.codigos.find(x => +x.id === +exp.codigo_id) || null;
          if (c) this.form.patchValue({ codigo: c }, { emitEvent: false });
        }

        this.cdr.markForCheck();
      });
  }

  // =========================
  // AUTOCOMPLETE
  // =========================
  private configurarAutocompletes(): void {
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
  }

  private filtrarClientes(text: string): ClienteModel[] {
    const term = (text || '').toLowerCase();
    return this.clientes.filter(c =>
      (`${c?.nombre ?? ''} ${c?.apellido ?? ''}`).toLowerCase().includes(term)
    );
  }

  displayCliente(c: ClienteModel | string): string {
    if (!c) return '';
    if (typeof c === 'string') return c;
    return `${c?.nombre ?? ''} ${c?.apellido ?? ''}`.trim();
  }

  private filtrarEmpresas(termLike: string | DemandadoModel): DemandadoModel[] {
    const toText = (v: string | DemandadoModel) => typeof v === 'string' ? v : (v?.nombre ?? '');
    const normalize = (s: string) =>
      (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const term = normalize(toText(termLike));
    if (!term) return this.demandados.slice();
    return this.demandados.filter(e => normalize(e.nombre ?? '').includes(term));
  }

  displayEmpresa = (e: DemandadoModel) => e ? (e.nombre ?? '') : '';

  // =========================
  // FILTROS
  // =========================
  cambiarTipoJuzgado(): void {
    const tipo = this.form.get('tipo')?.value;
    this.juzgados = (!tipo || tipo === 'todos')
      ? [...this.juzgadosOriginales]
      : this.juzgadosOriginales.filter(j => j.tipo === tipo);
  }

  cambiarTipoCodigo(): void {
    const tipo = this.form.get('tipo')?.value;

    if (!tipo || tipo === 'todos') {
      this.codigos = [...this.codigosOriginales];
      return;
    }

    if (tipo === 'COM') {
      this.codigos = this.codigosOriginales.filter(j => (j.tipo ?? '').toLowerCase() === 'comercial');
    } else {
      this.codigos = this.codigosOriginales.filter(j => (j.tipo ?? '').toLowerCase() !== 'comercial');
    }
  }

  // =========================
  // PARTES (AGREGAR/ELIMINAR)
  // =========================
  private yaExiste(arr: any[], tipo: 'cliente'|'empresa', id: number): boolean {
    return arr.some(x => x.tipo === tipo && Number(x.id) === Number(id));
  }

  seleccionarActoraCliente(c: ClienteModel): void {
    if (!c?.id) return;
    const id = Number(c.id);
    if (!this.yaExiste(this.actorasAgregadas, 'cliente', id)) {
      this.actorasAgregadas.push({ tipo: 'cliente', id, nombre: c.nombre!, apellido: c.apellido ?? '' });
    }
    this.actoraClienteCtrl.setValue('');
  }

  seleccionarActoraEmpresa(e: DemandadoModel): void {
    if (!e?.id) { Swal.fire('Empresa inválida'); return; }
    const id = Number(e.id);
    if (!this.yaExiste(this.actorasAgregadas, 'empresa', id)) {
      this.actorasAgregadas.push({ tipo: 'empresa', id, nombre: e.nombre ?? '' });
    }
    this.actoraEmpresaCtrl.setValue('');
  }

  eliminarActora(a: ParteMixta): void {
    this.actorasAgregadas = this.actorasAgregadas.filter(x => !(x.tipo === a.tipo && x.id === a.id));
  }

  seleccionarDemandadoCliente(c: ClienteModel): void {
    if (!c?.id) { Swal.fire('Cliente inválido'); return; }
    const id = Number(c.id);
    if (!this.yaExiste(this.demandadosAgregados, 'cliente', id)) {
      this.demandadosAgregados.push({ tipo: 'cliente', id, nombre: c.nombre ?? '', apellido: c.apellido ?? '' });
    }
    this.demandadoClienteCtrl.setValue('');
  }

  seleccionarDemandadoEmpresa(e: DemandadoModel): void {
    if (!e?.id) { Swal.fire('Empresa inválida'); return; }
    const id = Number(e.id);
    if (!this.yaExiste(this.demandadosAgregados, 'empresa', id)) {
      this.demandadosAgregados.push({ tipo: 'empresa', id, nombre: e.nombre ?? '' });
    }
    this.demandadoEmpresaCtrl.setValue('');
  }

  eliminarDemandado(d: ParteMixta): void {
    this.demandadosAgregados = this.demandadosAgregados.filter(x => !(x.tipo === d.tipo && x.id === d.id));
  }

  // =========================
  // GUARDAR / CERRAR
  // =========================
  acceptDialog(): void {
    if (!this.form.valid) {
      Swal.fire({ icon: 'warning', title: 'Faltan datos obligatorios' });
      return;
    }
    if (this.actorasAgregadas.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Agregá al menos una actora' });
      return;
    }
    if (this.demandadosAgregados.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Agregá al menos un demandado' });
      return;
    }

    const esMed = this.mode === 'mediacion';

    const payload: any = {
      id: (this.expediente as any)?.id ?? this.data.id,

      anio: this.form.value.anio,
      estado: this.form.value.estado,
      porcentaje: this.form.value.porcentaje,
      fecha_inicio: this.form.value.fechaInicio,

      usuario_id: this.form.value.abogado?.id ?? null,
      procurador_id: this.form.value.procurador?.id ?? null,

      actoras: this.actorasAgregadas,
      demandados: this.demandadosAgregados,

      recalcular_caratula: true,
      tipo_registro: esMed ? 'mediacion' : 'expediente',
    };

    if (esMed) {
      payload.montoLiquidacionCapital  = this.form.value.montoLiquidacionCapital ;
      payload.montoLiquidacionHonorarios = this.form.value.montoLiquidacionHonorarios;

      payload.numero = null;
      payload.juzgado_id = null;
      payload.juicio = null;
      payload.codigo_id = null;
    } else {
      payload.numero = this.form.value.numero;
      payload.juicio = this.form.value.juicio;
      payload.juzgado_id = this.form.value.juzgado?.id ?? null;
      payload.codigo_id = this.form.value.codigo?.id ?? null;
    }

    this.dialogRef.close(payload);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}