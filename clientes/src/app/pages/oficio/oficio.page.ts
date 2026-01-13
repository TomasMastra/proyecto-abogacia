import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule, FormBuilder } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IonInput, IonList, IonItem, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import Swal from 'sweetalert2';

import { ExpedientesService } from 'src/app/services/expedientes.service';
import { OficiosService } from 'src/app/services/oficios.service';
import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { OficioModel } from 'src/app/models/oficio/oficio.component';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { startWith, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; // ¡no te olvides!

@Component({
  selector: 'app-oficios',
  templateUrl: './oficio.page.html',
  styleUrls: ['./oficio.page.scss'],
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, 
    CommonModule, ReactiveFormsModule, FormsModule,
    IonInput, IonItem, IonList,
    MatSelectModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatIconModule,
    MatAutocompleteModule,     MatDatepickerModule,
    MatNativeDateModule,
  ]
})
export class OficiosPage implements OnInit {
  form: FormGroup;
  cargando = false;
  menu: number = 0;

  expedientes: ExpedienteModel[] = [];
  demandados: DemandadoModel[] = [];

  expedienteSeleccionado: any;
  demandadoSeleccionado: any;

  partes: string[] = ['actora', 'demanda', 'tercero'];
  estadosOficio: string[] = ['Ordenado', 'Diligenciado', 'Pedir reiteratorio / ampliatorio', 'Reiteratorio solicitado'];
  estadosTestimonial: string[] = ['Pendiente'];
  estadosPericia: string[] = ['Pendiente'];
  tiposPericia: string[] = ['Pericial informática'];

  busqueda: string = '';
  expedienteCtrl = new FormControl('');
  filteredExpedientes: Observable<ExpedienteModel[]> = of([]);




  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private expedienteService: ExpedientesService,
    private oficiosService: OficiosService,
    private demandadosService: DemandadosService,
    private fb: FormBuilder,


  ) {
    this.form = new FormGroup({
      expediente: new FormControl('', [Validators.required]),
      oficiada: new FormControl('', [Validators.required]),
      parte: new FormControl('', [Validators.required]),
      estado: new FormControl('', [Validators.required]),
      fecha_diligenciado: new FormControl(null)
    });
  }
/*
  ngOnInit() {
    this.cargarExpedientes();
    this.cargarDemandados();

    console.log(this.expedientes);

    this.filteredExpedientes = this.expedienteCtrl.valueChanges.pipe(
      startWith(''),
      map(texto => this.filtrarExpedientes(texto!))
    );

    console.log(this.filteredExpedientes);

  }*/

seleccionarExpediente(expediente: ExpedienteModel) {
  this.form.get('expediente')?.setValue(expediente);
  this.expedienteSeleccionado = expediente;
}


cambiarMenu(nuevoMenu: number) {
  this.menu = nuevoMenu;

  if (this.menu === 1) { // Oficios
    this.form = this.fb.group({
      expediente: ['', Validators.required],
      oficiada: ['', Validators.required],
      parte: ['', Validators.required],
      estado: ['', Validators.required],
      fecha_diligenciado: ['']
    });
  } else if (this.menu === 2) { // Testimoniales
    this.form = this.fb.group({
      expediente: ['', Validators.required],
      testigo: ['', Validators.required],
      supletoria: [null],
      parte: ['', Validators.required],
      estado: ['', Validators.required],
      fecha_diligenciado: ['']
    });
  } else if (this.menu === 3) { // Pericias
    this.form = this.fb.group({
      expediente: ['', Validators.required],
      parte: ['', Validators.required],
      perito: ['', Validators.required],
      tipo_pericia: ['Pericial informática', Validators.required],
      estado: ['', Validators.required],
      // USAMOS EL MISMO NOMBRE DE SIEMPRE:
      fecha_diligenciado: ['']    // ← no más fecha_entrega
    });
  }

  this.aplicarValidadoresPorTipo(); // opcional, para dejar todo alineado
}


ngOnInit() {
  this.cargarExpedientes();
  this.cargarDemandados();

  this.filteredExpedientes = this.expedienteCtrl.valueChanges.pipe(
    startWith(''),
    map(texto => this.filtrarExpedientes(texto!))
  );

  if (this.menu === 1) { // Oficios
    this.form = this.fb.group({
      expediente: ['', Validators.required],
      oficiada: ['', Validators.required],
      parte: ['', Validators.required],
      estado: ['', Validators.required],
      fecha_diligenciado: ['']
    });
  } else if (this.menu === 2) { // Testimoniales
    this.form = this.fb.group({
      expediente: ['', Validators.required],
      testigo: ['', Validators.required],
      fecha_audiencia: ['', Validators.required],
      estado: ['', Validators.required],
      supletoria: [null], // si ya lo agregaste
    });
  } else if (this.menu === 3) { // Pericias
    this.form = this.fb.group({
      expediente: ['', Validators.required],
      perito: ['', Validators.required],
      tipo_pericia: ['Pericial informática', Validators.required], // ✅ nuevo
      estado: ['', Validators.required],
      fecha_entrega: [''] // la mapeamos al guardar
    });
  }
}



filtrarExpedientes(valor: string | ExpedienteModel): ExpedienteModel[] {
  if (!this.expedientes || !Array.isArray(this.expedientes)) return [];

  let termino: string;

  // Si viene un objeto, lo forzamos a texto
  if (typeof valor === 'object' && valor !== null) {
    termino = this.displayExpediente(valor).toLowerCase();
  } else {
    termino = valor?.toLowerCase?.() ?? '';
  }

  return this.expedientes.filter(exp => {
    const numeroAnio = `${exp.numero}/${exp.anio}`.toLowerCase();
    const clientes = exp.clientes?.map(c => `${c.nombre} ${c.apellido}`.toLowerCase()).join(' ') || '';
    return numeroAnio.includes(termino) || clientes.includes(termino);
  });
}




cargarExpedientes() {
  this.expedienteService.getExpedientes().subscribe(expedientes => {
    this.expedientes = expedientes!;
  });
}

cargarDemandados() {
  this.demandadosService.getOficiados().subscribe(demandados => {
    this.demandados = demandados!;
  });
}

onSeleccionarExpediente(expediente: any) {
  this.expedienteSeleccionado = expediente;
  this.demandadoSeleccionado = expediente.demandadoModel;
  this.form.get('oficiada')?.setValue(this.demandadoSeleccionado);
}




// Tipo actual a partir del menú (ajustá si usás otra variable/enum)
private getTipoActual(): 'oficio'|'testimonial'|'pericia' {
  if (this.menu === 1) return 'oficio';
  if (this.menu === 2 ) return 'testimonial';
  return 'pericia';
}

// Campos requeridos por tipo (re-usa tus mismos formControls)
private getCamposRequeridosPorTipo(tipo: 'oficio'|'testimonial'|'pericia') {
  // Todos piden expediente + estado
  const base = ['expediente', 'estado', 'parte'] as const;

  if (tipo === 'oficio') {
    // en oficios “oficiada” es la oficiada (select de demandados)
    return [...base, 'oficiada'] as const;
  }
  if (tipo === 'testimonial') {
    // en testimoniales “oficiada” la usamos como nombre del testigo (input)
    return [...base, 'oficiada', /*'fecha_diligenciado' (si querés exigirla en Fijada/Tomada)*/] as const;
  }
  // pericia: oficiada = perito (input), fecha según estado
  return [...base, 'oficiada'] as const;
}

// Aplicá validadores dinámicos según el tipo y estado seleccionado
private aplicarValidadoresPorTipo() {
  const tipo = this.getTipoActual();
  const estado = (this.form.value.estado || '').toString().toLowerCase();

  ['expediente','oficiada','parte','estado','fecha_diligenciado','perito','tipo_pericia']
    .forEach(c => this.form.get(c)?.clearValidators());

  this.form.get('expediente')?.setValidators([Validators.required]);
  this.form.get('estado')?.setValidators([Validators.required]);

  if (tipo === 'oficio') {
    this.form.get('parte')?.setValidators([Validators.required]);
    this.form.get('oficiada')?.setValidators([Validators.required]);
    if (['diligenciado','reiteratorio solicitado'].includes(estado)) {
      this.form.get('fecha_diligenciado')?.setValidators([Validators.required]);
    }
  } else if (tipo === 'testimonial') {
    this.form.get('parte')?.setValidators([Validators.required]);
    (this.form.get('testigo') ?? this.form.get('oficiada'))?.setValidators([Validators.required]);
    // fecha opcional según tu lógica
  } else if (tipo === 'pericia') {
    this.form.get('parte')?.setValidators([Validators.required]);            // ← agregado
    this.form.get('perito')?.setValidators([Validators.required]);
    this.form.get('tipo_pericia')?.setValidators([Validators.required]);
    if (['notificado','informe presentado'].includes(estado)) {
      this.form.get('fecha_diligenciado')?.setValidators([Validators.required]); // ← mismo nombre
    }
  }

  Object.keys(this.form.controls).forEach(c => this.form.get(c)?.updateValueAndValidity());
}

// Utilidad para extraer ID (si viene objeto) o string (si viene texto)
private normalizarOficiada() {
  const val = this.form.value.oficiada;
  // si es un demandado (objeto) tiene id/nombre
  if (val && typeof val === 'object') {
    return { demandado_id: val.id ?? null, texto: val.nombre ?? null };
  }
  // si es texto (testigo/perito)
  if (typeof val === 'string') {
    return { demandado_id: null, texto: val };
  }
  return { demandado_id: null, texto: null };
}

// ✅ NUEVO: guardar unificado
guardarPrueba() {
  const tipo = this.getTipoActual();
  this.aplicarValidadoresPorTipo();

  if (this.form.invalid) {
    Swal.fire({ icon: 'error', title: 'Faltan campos obligatorios', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    return;
  }

  const payload: any = {
    expediente_id: this.form.value.expediente.id,
    estado: this.form.value.estado,
    tipo, // 'oficio' | 'testimonial' | 'pericia'
  };

  if (tipo === 'oficio') {
    payload.parte = this.form.value.parte;
    payload.demandado_id = this.form.value.oficiada?.id ?? null;
    payload.fecha_diligenciado = this.form.value.fecha_diligenciado || null;
  }

if (tipo === 'testimonial') {
  payload.parte = this.form.value.parte;
  payload.nombre_oficiada = this.form.value.testigo ?? null;
  payload.fecha_diligenciado = this.form.value.fecha_diligenciado ?? null;
  payload.supletoria = this.form.value.supletoria ?? null;
}


if (tipo === 'pericia') {
  payload.parte = this.form.value.parte ?? null; 
  payload.nombre_oficiada = this.form.value.perito ?? null;
  payload.tipo_pericia = this.form.value.tipo_pericia ?? null;
  payload.fecha_diligenciado = this.form.value.fecha_diligenciado || null;
}


  this.cargando = true;
  this.oficiosService.agregarOficio(payload).subscribe({
    next: () => {
      Swal.fire({ toast: true, icon: 'success', title: 'Prueba guardada correctamente', timer: 2000, position: 'top-end', showConfirmButton: false });
      this.form.reset();
      this.expedienteCtrl.setValue('');
      this.expedienteSeleccionado = null;
      this.cargando = false;
    },
    error: err => {
      console.error('Error al guardar prueba:', err);
      Swal.fire({ icon: 'error', title: 'Error al guardar prueba', text: err.message });
      this.cargando = false;
    }
  });
}

// Llamá a esto cuando cambia el estado (ya lo tenías)
onEstadoChange(estado: string) {
  // reutilizamos la misma lógica dinámica
  this.aplicarValidadoresPorTipo();
}


/*
onEstadoChange(estado: string) {
  const fechaControl = this.form.get('fecha_diligenciado');

  const requiereFecha = ['diligenciado', 'reiteratorio solicitado'].includes(estado.toLowerCase());

  console.log(requiereFecha);
    fechaControl?.clearValidators();
    fechaControl?.setValue(null);
  if (requiereFecha) {
    fechaControl?.setValidators([Validators.required]);
  } else {
    fechaControl?.clearValidators();
    fechaControl?.setValue(null);
  }

  fechaControl?.updateValueAndValidity();
}*/




/*
displayExpediente(expediente: ExpedienteModel): string {
  if (!expediente) return '';
  const cliente = expediente.clientes?.[0];
  const demandado = expediente.demandados?.[0];
  return `${expediente.numero}/${expediente.anio} ${cliente ? cliente.nombre + ' ' + cliente.apellido : '(sin actora)'} contra ${demandado?.nombre || '(sin demandado)'}`;
}*/

displayExpediente(expediente: ExpedienteModel): string {
  if (!expediente) return '';
  const cliente = expediente.clientes?.[0];
  const demandado = expediente.demandados?.[0];
  return `${expediente.numero}/${expediente.anio} ${cliente ? cliente.nombre + ' ' + cliente.apellido : '(sin actora)'} contra ${demandado?.nombre || '(sin demandado)'}`;
}

limpiarBusqueda() {
  this.expedienteCtrl.setValue('');
  this.expedienteSeleccionado = null;
  this.form.get('expediente')?.setValue(null);
}


}
