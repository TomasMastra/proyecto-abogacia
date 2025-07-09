import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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

  expedientes: ExpedienteModel[] = [];
  demandados: DemandadoModel[] = [];

  expedienteSeleccionado: any;
  demandadoSeleccionado: any;

  partes: string[] = ['actora', 'demanda', 'tercero'];
  estadosOficio: string[] = ['diligenciado', 'pendiente', 'pedir reiteratorio', 'reiteratorio solicitado','diligenciar'];
  busqueda: string = '';
  expedienteCtrl = new FormControl('');
  filteredExpedientes: Observable<ExpedienteModel[]> = of([]);




  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private expedienteService: ExpedientesService,
    private oficiosService: OficiosService,
    private demandadosService: DemandadosService,

  ) {
    this.form = new FormGroup({
      expediente: new FormControl('', [Validators.required]),
      oficiada: new FormControl('', [Validators.required]),
      parte: new FormControl('', [Validators.required]),
      estado: new FormControl('', [Validators.required]),
      fecha_diligenciado: new FormControl(null)
    });
  }

  ngOnInit() {
    this.cargarExpedientes();
    this.cargarDemandados();

    console.log(this.expedientes);

    this.filteredExpedientes = this.expedienteCtrl.valueChanges.pipe(
      startWith(''),
      map(texto => this.filtrarExpedientes(texto!))
    );

    console.log(this.filteredExpedientes);

  }

seleccionarExpediente(expediente: ExpedienteModel) {
  this.form.get('expediente')?.setValue(expediente);
  this.expedienteSeleccionado = expediente;
}



filtrarExpedientes(texto: string): ExpedienteModel[] {
  if (!this.expedientes || !Array.isArray(this.expedientes)) return [];

  const term = texto.toLowerCase();

  return this.expedientes.filter(exp => {
    const numeroAnio = `${exp.numero}/${exp.anio}`.toLowerCase();
    const clientes = exp.clientes?.map(c => `${c.nombre} ${c.apellido}`.toLowerCase()).join(' ') || '';
    return numeroAnio.includes(term) || clientes.includes(term);
  });
}



cargarExpedientes() {
  this.expedienteService.getExpedientes().subscribe(expedientes => {
    this.expedientes = expedientes!;
    //this.filteredExpedientes = expedientes!;
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





  guardarOficio() {
    if (this.form.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Faltan campos obligatorios',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });
      return;
    }

    const payload = {
      expediente_id: this.form.value.expediente.id,
      demandado_id: this.form.value.oficiada.id,
      parte: this.form.value.parte,
      estado: this.form.value.estado,
      fecha_diligenciado: this.form.value.fecha_diligenciado || null
    };

    this.cargando = true;
    this.oficiosService.agregarOficio(payload).subscribe({
      next: () => {
        Swal.fire({
          toast: true,
          icon: 'success',
          title: 'Oficio guardado correctamente',
          timer: 2000,
          position: 'top-end',
          showConfirmButton: false
        });
        this.form.reset();
        this.expedienteCtrl.setValue('');
        this.expedienteSeleccionado = null;        
        this.cargando = false;
      },
      error: err => {
        console.error('Error al guardar oficio:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar oficio',
          text: err.message,
        });
        this.cargando = false;
      }
    });
  }


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
}





displayExpediente(expediente: ExpedienteModel): string {
  if (!expediente) return '';
  const cliente = expediente.clientes?.[0];
  const demandado = expediente.demandados?.[0];
  return `${expediente.numero}/${expediente.anio} ${cliente ? cliente.nombre + ' ' + cliente.apellido : '(sin actora)'} contra ${demandado?.nombre || '(sin demandado)'}`;
}


}
