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

import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { JuezModel } from 'src/app/models/juez/juez.component';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';

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

  actorasAgregadas: any[] = [];     // múltiples
  demandadosAgregados: any[] = [];  // solo 1

  actoraClienteCtrl = new FormControl<string>('');
  filteredActoraClientes!: Observable<ClienteModel[]>;
  demandadoClienteCtrl = new FormControl<string>('');
  filteredDemandadoClientes!: Observable<ClienteModel[]>;

  mensajeSelectJuzgado = 'Filtrar juzgado';
  tipos: any[] = ['todos', 'CCF', 'COM', 'CIV', 'CC'];
  juicios: any[] = ['ordinario', 'sumarisimo', 'a definir'];
  estados: any[] = ['Sorteado', 'Inicio - Previo', 'Se resuelva', 'Sentencia - Previo', 'Sentencia - Solicita'];

  juzgadoElegido: any = null;
  abogadoSeleccionado: any = null;
  procuradorSeleccionado: any = null;
  juezSeleccionado: any = null;

  constructor(
    private clienteService: ClientesService,
    private demandadoService: DemandadosService,
    private juzgadoService: JuzgadosService,
    private juezService: JuezService,
    private usuarioService: UsuarioService,
    public dialogRef: MatDialogRef<DialogExpedienteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
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

      // ACTORA (mixta)
      actoraTipo: new FormControl<'cliente'|'empresa'>('cliente', Validators.required),
      actoraCliente: new FormControl(null),
      actoraEmpresa: new FormControl(null),

      // DEMANDADO (mixta)
      demandadoTipo: new FormControl<'empresa'|'cliente'>('empresa', Validators.required),
      demandadoEmpresa: new FormControl(null),
      demandadoCliente: new FormControl(null),
    });

    this.form.get('actoraTipo')?.valueChanges.subscribe(() => this.onCambioTipo('actora'));
    this.form.get('demandadoTipo')?.valueChanges.subscribe(() => this.onCambioTipo('demandado'));
  }

  ngOnInit() {
    this.clienteService.getClientes().subscribe(c => { this.clientes = c || []; });
    this.demandadoService.getDemandados().subscribe(d => { this.demandados = d || []; });
    this.juzgadoService.getJuzgados().subscribe(j => { this.juzgadosOriginales = j || []; this.juzgados = [...this.juzgadosOriginales]; });
    this.juezService.getJuez().subscribe(j => { this.jueces = j || []; });
    this.usuarioService.getUsuarios().subscribe(u => {
      this.listaUsuarios = u || [];
      this.abogadoSeleccionado = this.listaUsuarios.find(x => x.id === this.usuarioService.usuarioLogeado?.id) || null;
    });

    this.filteredActoraClientes = this.actoraClienteCtrl.valueChanges.pipe(startWith(''), map(v => this.filtrarClientes(v || '')));
    this.filteredDemandadoClientes = this.demandadoClienteCtrl.valueChanges.pipe(startWith(''), map(v => this.filtrarClientes(v || '')));

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

    this.onCambioTipo('actora');
    this.onCambioTipo('demandado');
  }

  filtrarClientes(text: string) {
    const term = (text || '').toLowerCase();
    return this.clientes.filter(c => (`${c.nombre} ${c.apellido}`).toLowerCase().includes(term));
  }

  displayCliente(c: ClienteModel): string { return c ? `${c.nombre} ${c.apellido}` : ''; }

  cambiarTipoJuzgado() {
    const tipo = this.form.get('tipo')?.value;
    if (!tipo || tipo === 'todos') this.juzgados = [...this.juzgadosOriginales];
    else this.juzgados = this.juzgadosOriginales.filter(j => j.tipo === tipo);
  }

  onCambioTipo(rol: 'actora' | 'demandado') {
    if (rol === 'actora') {
      if (this.form.value.actoraTipo === 'cliente') {
        this.form.get('actoraCliente')?.setValidators([Validators.required]);
        this.form.get('actoraEmpresa')?.clearValidators();
        this.form.patchValue({ actoraEmpresa: null });
      } else {
        this.form.get('actoraEmpresa')?.setValidators([Validators.required]);
        this.form.get('actoraCliente')?.clearValidators();
        this.form.patchValue({ actoraCliente: null });
      }
      this.form.get('actoraCliente')?.updateValueAndValidity();
      this.form.get('actoraEmpresa')?.updateValueAndValidity();
    }

    if (rol === 'demandado') {
      if (this.form.value.demandadoTipo === 'cliente') {
        this.form.get('demandadoCliente')?.setValidators([Validators.required]);
        this.form.get('demandadoEmpresa')?.clearValidators();
        this.form.patchValue({ demandadoEmpresa: null });
      } else {
        this.form.get('demandadoEmpresa')?.setValidators([Validators.required]);
        this.form.get('demandadoCliente')?.clearValidators();
        this.form.patchValue({ demandadoCliente: null });
      }
      this.form.get('demandadoCliente')?.updateValueAndValidity();
      this.form.get('demandadoEmpresa')?.updateValueAndValidity();
    }
  }

  // ACTORA
  seleccionarActoraCliente(c: ClienteModel) {
    this.form.get('actoraCliente')?.setValue(c);
    const id = Number(c.id); if (Number.isNaN(id)) { Swal.fire('ID cliente inválido'); return; }
    this.actorasAgregadas.push({ tipo: 'cliente', id, nombre: c.nombre ?? '', apellido: c.apellido ?? '' });
    this.actoraClienteCtrl.setValue('');
  }
  seleccionarActoraEmpresa(e: DemandadoModel) {
    const id = Number(e.id); if (Number.isNaN(id)) { Swal.fire('ID empresa inválido'); return; }
    this.actorasAgregadas.push({ tipo: 'empresa', id, nombre: e.nombre ?? '' });
  }
  eliminarActora(a: any) { this.actorasAgregadas = this.actorasAgregadas.filter(x => x !== a); }

  // DEMANDADO (solo 1)
  seleccionarDemandadoCliente(c: ClienteModel) {
    this.form.get('demandadoCliente')?.setValue(c);

    const id = Number(c.id); if (Number.isNaN(id)) { Swal.fire('ID cliente inválido'); return; }
    if (this.demandadosAgregados.length >= 1) { Swal.fire('Solo un demandado permitido'); return; }
    this.demandadosAgregados = [{ tipo: 'cliente', id, nombre: c.nombre ?? '', apellido: c.apellido ?? '' }];
    this.demandadoClienteCtrl.setValue('');
  }
  seleccionarDemandadoEmpresa(e: DemandadoModel) {
    const id = Number(e.id); if (Number.isNaN(id)) { Swal.fire('ID empresa inválido'); return; }
    if (this.demandadosAgregados.length >= 1) { Swal.fire('Solo un demandado permitido'); return; }
    this.demandadosAgregados = [{ tipo: 'empresa', id, nombre: e.nombre ?? '' }];
  }
  eliminarDemandado(_: any) { this.demandadosAgregados = []; }

  closeDialog() { this.dialogRef.close(); }

acceptDialog(): void {
  // Debug de controles inválidos
  const invalid = Object.entries(this.form.controls)
    .filter(([_, c]) => c.invalid)
    .map(([k, c]) => `${k}: ${JSON.stringify(c.errors)}`);
  console.log('Controles inválidos =>', invalid);

  // Validaciones mínimas
  if (!this.form.valid || this.actorasAgregadas.length === 0 || this.demandadosAgregados.length === 0) {
    Swal.fire({ icon: 'warning', title: 'Faltan datos obligatorios' });
    return;
  }

  // Armar payload para el padre (quien hace el POST)
  const expediente = {
    titulo: '',
    descripcion: this.form.value.descripcion ?? null,
    numero: this.form.value.numero,
    anio: this.form.value.anio,
    estado: this.form.value.estado,
    juicio: this.form.value.juicio,
    porcentaje: this.form.value.porcentaje,
    fecha_inicio: this.form.value.fechaInicio,

    // IDs que el backend necesita
    juzgado_id: this.form.value.juzgado?.id ?? null,
    juez_id: this.juezSeleccionado?.id ?? null,
    usuario_id: this.abogadoSeleccionado?.id ?? null,     // abogado responsable
    procurador_id: this.procuradorSeleccionado?.id ?? null,

    // Roles mixtos
    actoras: this.actorasAgregadas,      // [{tipo:'cliente'|'empresa', id, nombre, apellido?}]
    demandados: this.demandadosAgregados // [{tipo:'cliente'|'empresa', id, nombre, apellido?}]
  };

  // Devolver al componente padre (él hace el POST)
  this.dialogRef.close(expediente);
}





}
