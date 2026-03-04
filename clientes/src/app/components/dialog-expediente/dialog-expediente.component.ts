import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { ClientesService } from 'src/app/services/clientes.service';
import { DemandadosService } from 'src/app/services/demandado.service';
import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuezService } from 'src/app/services/juez.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { CodigosService } from 'src/app/services/codigos.service';

import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { JuezModel } from 'src/app/models/juez/juez.component';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { CodigoModel } from 'src/app/models/codigo/codigo.component';

@Component({
  selector: 'app-dialog-expediente',
  templateUrl: './dialog-expediente.component.html',
  styleUrls: ['./dialog-expediente.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatListModule
  ]
})
export class DialogExpedienteComponent {
  form: FormGroup;

  demandados: DemandadoModel[] = [];
  clientes: ClienteModel[] = [];
  juzgados: JuzgadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = [];
  jueces: JuezModel[] = [];
  listaUsuarios: UsuarioModel[] = [];
  codigos: CodigoModel[] = [];
  codigosOriginales: CodigoModel[] = [];

  mode: 'expediente' | 'mediacion' = 'expediente';


  // múltiples
  actorasAgregadas: Array<{tipo: 'cliente'|'empresa'; id: number; nombre: string; apellido?: string | null}> = [];
  demandadosAgregados: Array<{tipo: 'cliente'|'empresa'; id: number; nombre: string; apellido?: string | null}> = [];

  // autocompletes (clientes)
  actoraClienteCtrl = new FormControl<string | ClienteModel>('');
  filteredActoraClientes!: Observable<ClienteModel[]>;
  demandadoClienteCtrl = new FormControl<string | ClienteModel>('');
  filteredDemandadoClientes!: Observable<ClienteModel[]>;

  actoraEmpresaCtrl = new FormControl<string | DemandadoModel>('');
  filteredActoraEmpresas!: Observable<DemandadoModel[]>;

  demandadoEmpresaCtrl = new FormControl<string | DemandadoModel>('');
  filteredDemandadoEmpresas!: Observable<DemandadoModel[]>;


  mensajeSelectJuzgado = 'Filtrar juzgado';
  tipos: any[] = ['todos', 'CCF', 'COM', 'CIV', 'CC'];
  juicios: any[] = ['ordinario', 'sumarisimo', 'a definir'];
  estados: any[] = [
    'Sorteado', 'Inicio - Previo', 'Se resuelva',
    'Sentencia - Previo', 'Sentencia - Solicita'
  ];

  juzgadoElegido: any = null;
  abogadoSeleccionado: any = null;
  procuradorSeleccionado: any = null;
  juezSeleccionado: any = null;
  codigoSeleccionado: any = null;

  constructor(
    private clienteService: ClientesService,
    private demandadoService: DemandadosService,
    private juzgadoService: JuzgadosService,
    private juezService: JuezService,
    private usuarioService: UsuarioService,
    private codigoService: CodigosService,
    public dialogRef: MatDialogRef<DialogExpedienteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
      this.mode = this.data?.mode ?? 'expediente';

    this.form = new FormGroup({
      numero: new FormControl('', [Validators.required, Validators.min(0)]),
      anio: new FormControl('', [Validators.required]),
      estado: new FormControl('', [Validators.required]),
      porcentaje: new FormControl('', [Validators.required]),
      juicio: new FormControl('', [Validators.required]),
      fechaInicio: new FormControl('', [Validators.required]),

      tipo: new FormControl('todos', [Validators.required]),
      juzgado: new FormControl('', [Validators.required]),

      abogado: new FormControl('', [Validators.required]),
      procurador: new FormControl('', [Validators.required]),
      juez: new FormControl(null),

      honorario: new FormControl(''),
      codigo: new FormControl<number|null>(null),

      // ACTORA (mixta)
      actoraTipo: new FormControl<'cliente'|'empresa'>('cliente', Validators.required),
      actoraCliente: new FormControl(null),
      actoraEmpresa: new FormControl(null),

      // DEMANDADO (mixta)
      demandadoTipo: new FormControl<'empresa'|'cliente'>('empresa', Validators.required),
      demandadoEmpresa: new FormControl(null),
      demandadoCliente: new FormControl(null),

      monto_capital: new FormControl('', [Validators.required, Validators.min(0)]),
      monto_honorarios: new FormControl('', [Validators.required, Validators.min(0)]),
    });

    // Mantiene validadores en sync con el tipo actual
    this.form.get('actoraTipo')?.valueChanges.subscribe(() => this.onCambioTipo('actora'));
    this.form.get('demandadoTipo')?.valueChanges.subscribe(() => this.onCambioTipo('demandado'));
  }

  // ========= utils de búsqueda (robustos con string u objeto) =========
  private normalize(s: any): string {
    return (s ?? '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private valueToSearchText(val: string | ClienteModel): string {
    if (!val) return '';
    if (typeof val === 'string') return val;
    // si es objeto, armo "nombre apellido" para que siga funcionando el filtro
    return `${val.nombre ?? ''} ${val.apellido ?? ''}`.trim();
  }

  private filtrarClientes(termLike: string | ClienteModel): ClienteModel[] {
    const term = this.normalize(this.valueToSearchText(termLike));
    if (!term) return this.clientes.slice(); // si está vacío: devolver todo
    return this.clientes.filter(c => {
      const full = this.normalize(`${c.nombre ?? ''} ${c.apellido ?? ''}`);
      return full.includes(term);
    });
  }

  displayCliente(c: ClienteModel): string {
    return c ? `${c.nombre ?? ''} ${c.apellido ?? ''}`.trim() : '';
  }

  ngOnInit() {
    this.cargarCatalogos();       // clientes/demandados/juzgados/jueces/codigos/usuarios
    this.configurarAutocompletes();
    this.precargarSiVieneData();  // patchValue si te pasan data
    this.configurarTiposMixtos(); // actora/demandado (validators sync)
    this.configurarModo();        // mediación vs expediente (validadores + estado fijo)

  }

private configurarModo() {
  const disableNoMediacion = (name: string) => {
    const c = this.form.get(name);
    if (!c) return;
    c.clearValidators();
    c.setValue(null, { emitEvent: false });
    c.disable({ emitEvent: false });
    c.updateValueAndValidity({ emitEvent: false });
  };

  const enableWith = (name: string, validators: any[] | null) => {
    const c = this.form.get(name);
    if (!c) return;
    c.enable({ emitEvent: false });
    c.setValidators(validators);
    c.updateValueAndValidity({ emitEvent: false });
  };

  if (this.mode === 'mediacion') {
    // ❌ campos que no van en mediación
    disableNoMediacion('numero');
    disableNoMediacion('tipo');
    disableNoMediacion('juzgado');
    disableNoMediacion('codigo');
    disableNoMediacion('juicio');

    // ✅ estado fijo
    this.form.get('estado')?.setValue('Mediacion', { emitEvent: false });
    this.form.get('estado')?.disable({ emitEvent: false });
    this.form.get('estado')?.clearValidators();
    this.form.get('estado')?.updateValueAndValidity({ emitEvent: false });

    // ✅ campos que sí van
    enableWith('anio', [Validators.required]);
    enableWith('porcentaje', [Validators.required, Validators.min(0)]);
    enableWith('fechaInicio', [Validators.required]);

    enableWith('abogado', [Validators.required]);
    enableWith('procurador', [Validators.required]);

    enableWith('monto_capital', [Validators.required, Validators.min(0)]);
    enableWith('monto_honorarios', [Validators.required, Validators.min(0)]);

  } else {
    // ✅ EXPEDIENTE normal (restauro validadores)
    enableWith('numero', [Validators.required, Validators.min(0)]);
    enableWith('anio', [Validators.required]);
    enableWith('estado', [Validators.required]);
    enableWith('porcentaje', [Validators.required]);
    enableWith('juicio', [Validators.required]);
    enableWith('fechaInicio', [Validators.required]);

    enableWith('tipo', [Validators.required]);
    enableWith('juzgado', [Validators.required]);
    enableWith('abogado', [Validators.required]);
    enableWith('procurador', [Validators.required]);

    // codigo no es required (dejalo opcional)
    enableWith('codigo', null);

    // ❌ montos no aplican en expediente
    disableNoMediacion('monto_capital');
    disableNoMediacion('monto_honorarios');
  }
}

private cargarCatalogos() {
  this.clienteService.getClientes().subscribe(c => this.clientes = c || []);
  this.demandadoService.getDemandados().subscribe(d => this.demandados = d || []);

  this.juzgadoService.getJuzgados().subscribe(j => {
    this.juzgadosOriginales = j || [];
    this.juzgados = [...this.juzgadosOriginales];
  });

  this.juezService.getJuez().subscribe(j => this.jueces = j || []);
  this.codigoService.getCodigos().subscribe(c => {
    this.codigosOriginales = c || [];
    this.codigos = [...this.codigosOriginales];
  });

  this.usuarioService.getUsuarios().subscribe(u => {
    this.listaUsuarios = u || [];

    const abogado = this.listaUsuarios.find(x => x.id === this.usuarioService.usuarioLogeado?.id) || null;
    this.abogadoSeleccionado = abogado;

    // 👇 si tu select usa formControlName="abogado" (recomendado)
    if (abogado?.id) this.form.patchValue({ abogado: abogado.id }, { emitEvent: false });
  });
}

private configurarAutocompletes() {
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

private precargarSiVieneData() {
  const d = this.data;

  // si data no trae campos de expediente, salí
  if (!d || (d.numero === undefined && d.anio === undefined && d.fecha_inicio === undefined)) return;

  this.form.patchValue({
    numero: d.numero ?? null,
    anio: d.anio ?? null,
    estado: d.estado ?? null,
    porcentaje: d.porcentaje ?? null,
    juicio: d.juicio ?? null,
    fechaInicio: d.fecha_inicio ?? null,
    tipo: d.tipo ?? 'todos',

    // mediación (si vinieran)
    monto_capital: d.monto_capital ?? null,
    monto_honorarios: d.monto_honorarios ?? null,
  }, { emitEvent: false });
}
private configurarTiposMixtos() {
  this.onCambioTipo('actora');
  this.onCambioTipo('demandado');

  this.form.get('actoraTipo')?.valueChanges.subscribe(() => this.onCambioTipo('actora'));
  this.form.get('demandadoTipo')?.valueChanges.subscribe(() => this.onCambioTipo('demandado'));
}
  // ========= init =========
  /*
  ngOnInit() {

if (this.mode !== 'mediacion') {
  this.form.get('monto_capital')?.clearValidators();
  this.form.get('monto_honorarios')?.clearValidators();
  this.form.get('monto_capital')?.updateValueAndValidity({ emitEvent: false });
  this.form.get('monto_honorarios')?.updateValueAndValidity({ emitEvent: false });
}    this.clienteService.getClientes().subscribe(c => { this.clientes = c || []; });
    this.demandadoService.getDemandados().subscribe(d => { this.demandados = d || []; });
    this.juzgadoService.getJuzgados().subscribe(j => {
      this.juzgadosOriginales = j || [];
      this.juzgados = [...this.juzgadosOriginales];
    });
    this.juezService.getJuez().subscribe(j => { this.jueces = j || []; });
    this.codigoService.getCodigos().subscribe(j => { this.codigos = j || []; });


    this.usuarioService.getUsuarios().subscribe(u => {
      this.listaUsuarios = u || [];
      this.abogadoSeleccionado = this.listaUsuarios.find(x => x.id === this.usuarioService.usuarioLogeado?.id) || null;
    });

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


    if (this.data) {
      this.form.patchValue({
        numero: this.data.numero ?? '',
        anio: this.data.anio ?? '',
        estado: this.data.estado ?? '',
        porcentaje: this.data.porcentaje ?? '',
        juicio: this.data.juicio ?? '',
        fechaInicio: this.data.fecha_inicio ?? '',
        tipo: this.data.tipo ?? 'todos',
      });
    }

    // Aseguro validadores de subcontroles según tipo
    this.onCambioTipo('actora');
    this.onCambioTipo('demandado');
  }*/

  cambiarTipoJuzgado() {
    const tipo = this.form.get('tipo')?.value;
    if (!tipo || tipo === 'todos') this.juzgados = [...this.juzgadosOriginales];
    else this.juzgados = this.juzgadosOriginales.filter(j => j.tipo === tipo);
  }

  onCambioTipo(rol: 'actora' | 'demandado') {
    if (rol === 'actora') {
      if (this.form.value.actoraTipo === 'cliente') {
        this.form.get('actoraCliente')?.clearValidators(); // usamos la lista actorasAgregadas, no el control
        this.form.get('actoraEmpresa')?.clearValidators();
        this.form.patchValue({ actoraEmpresa: null });
      } else {
        this.form.get('actoraEmpresa')?.clearValidators();
        this.form.get('actoraCliente')?.clearValidators();
        this.form.patchValue({ actoraCliente: null });
      }
      this.form.get('actoraCliente')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('actoraEmpresa')?.updateValueAndValidity({ emitEvent: false });
    }

    if (rol === 'demandado') {
      if (this.form.value.demandadoTipo === 'cliente') {
        this.form.get('demandadoCliente')?.clearValidators();
        this.form.get('demandadoEmpresa')?.clearValidators();
        this.form.patchValue({ demandadoEmpresa: null });
      } else {
        this.form.get('demandadoEmpresa')?.clearValidators();
        this.form.get('demandadoCliente')?.clearValidators();
        this.form.patchValue({ demandadoCliente: null });
      }
      this.form.get('demandadoCliente')?.updateValueAndValidity({ emitEvent: false });
      this.form.get('demandadoEmpresa')?.updateValueAndValidity({ emitEvent: false });
    }
  }

  // ========= ACTORA =========
  private yaExiste(arr: any[], tipo: 'cliente'|'empresa', id: number): boolean {
    return arr.some(x => x.tipo === tipo && Number(x.id) === Number(id));
  }

  seleccionarActoraCliente(c: ClienteModel) {
    if (!c?.id) { Swal.fire('Cliente inválido'); return; }
    const id = Number(c.id);
    if (Number.isNaN(id)) { Swal.fire('ID cliente inválido'); return; }

    if (!this.yaExiste(this.actorasAgregadas, 'cliente', id)) {
      this.actorasAgregadas.push({ tipo: 'cliente', id, nombre: c.nombre ?? '', apellido: c.apellido ?? '' });
    }

    // reset del input del autocomplete para que muestre todo de nuevo
    this.actoraClienteCtrl.setValue('');
  }

  seleccionarActoraEmpresa(e: DemandadoModel) {
    if (!e?.id) { Swal.fire('Empresa inválida'); return; }
    const id = Number(e.id);
    if (Number.isNaN(id)) { Swal.fire('ID empresa inválido'); return; }

    if (!this.yaExiste(this.actorasAgregadas, 'empresa', id)) {
      this.actorasAgregadas.push({ tipo: 'empresa', id, nombre: e.nombre ?? '' });
    }
  }

  eliminarActora(a: any) {
    this.actorasAgregadas = this.actorasAgregadas.filter(x => !(x.tipo === a.tipo && x.id === a.id));
  }

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

  eliminarDemandado(d: any) {
    this.demandadosAgregados = this.demandadosAgregados.filter(x => !(x.tipo === d.tipo && x.id === d.id));
  }

  // ========= cierre =========
  closeDialog() { this.dialogRef.close(); }

  acceptDialog(): void {
  if (!this.form.valid) {
    Swal.fire({
      icon: 'warning',
      title: this.mode === 'mediacion' ? 'Faltan datos de la mediación' : 'Faltan datos del expediente'
    });
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

  const isMediacion = this.mode === 'mediacion';

  const base: any = {
    titulo: '',
    descripcion: (this.form as any).value.descripcion ?? null,

    anio: this.form.value['anio'],
    porcentaje: this.form.value['porcentaje'],
    fecha_inicio: this.form.value['fechaInicio'],

    juez_id: this.juezSeleccionado?.id ?? null,
    usuario_id: this.abogadoSeleccionado?.id ?? null,
    procurador_id: this.procuradorSeleccionado?.id ?? null,

    actoras: this.actorasAgregadas,
    demandados: this.demandadosAgregados,
    recalcular_caratula: true,
    tipo_registro: 'expediente'

  };

  const payload = isMediacion
  ? {
      ...base,
      estado: 'Mediacion',

      // ✅ nombres reales de tu BD / backend
      montoLiquidacionCapital: this.form.value['monto_capital'],
      montoLiquidacionHonorarios: this.form.value['monto_honorarios'],

      // no van en mediación
      numero: null,
      tipo: null,
      juzgado_id: null,
      codigo_id: null,
      juicio: null,
      tipo_registro: 'mediacion'
    }
  : {
      ...base,
      numero: this.form.value['numero'],
      estado: this.form.value['estado'],
      juicio: this.form.value['juicio'],
      tipo: this.form.value['tipo'],
      juzgado_id: this.form.value['juzgado']?.id ?? null,
      codigo_id: this.codigoSeleccionado?.id ?? null,
    };

  this.dialogRef.close(payload);
}

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
