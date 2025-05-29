import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonCheckbox, IonItemSliding } from "@ionic/angular/standalone";

import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntil } from 'rxjs/operators';


import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';

import { LocalidadesService } from 'src/app/services/localidades.service';
import { LocalidadModel } from 'src/app/models/localidad/localidad.component';

import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { JuzgadosService } from 'src/app/services/juzgados.service';

import { IonLabel, IonItem } from "@ionic/angular/standalone";

import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-juzgado-modificar',
  templateUrl: './dialog-juzgado-modificar.component.html',
  styleUrls: ['./dialog-juzgado-modificar.component.scss'],
  standalone: true,
  imports: [IonItemSliding, IonCheckbox, 
    CommonModule, 
    FormsModule,
    MatButtonModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    ReactiveFormsModule, 
    MatSelectModule
  ]
})
export class DialogJuzgadoModificarComponent {



  menu: number = 1;

  protected form: FormGroup;
  getExpedientes$!: Subscription;
  localidades: any[] = [];
  hayExpedientes: boolean = true;
  private destroy$ = new Subject<void>(); 
  localidadElegida: any; 

  tipos: any[] = ['CCF', 'COM', 'CIV', 'CC'];
  tipoSeleccionado: any;
  constructor(
    private juzgadosService: JuzgadosService, private localidadesService: LocalidadesService,
    public dialogRef: MatDialogRef<DialogJuzgadoModificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = new FormGroup({
      nombre: new FormControl(data?.nombre ?? '', [Validators.required]),
      direccion: new FormControl(data?.direccion ?? ''),
      localidad: new FormControl( '', [Validators.required]),
      tipo: new FormControl( '', [Validators.required]),
    }); 
  }

  ngOnInit() {
    this.cargarLocalidad();
    this.cargarTipo();
  
    // Suscribirse a cambios del formulario para actualizar localidadElegida
    this.form.get('localidad')?.valueChanges.subscribe(value => {
      this.localidadElegida = value;
      console.log('Localidad seleccionada:', this.localidadElegida);
    });
  
    // Si ya hay una localidad en los datos del diálogo, la preseleccionamos
    if (this.data?.localidad) {
      this.form.patchValue({ localidad: this.data.localidad });
      this.localidadElegida = this.data.localidad;
    }
  }
  
/*
  cargarLocalidad() {
    this.localidadesService.getLocalidades()
      .pipe(takeUntil(this.destroy$)) 
      .subscribe(
        (localidades) => {
          this.localidades = localidades;
        },
        (error) => {
          console.error('Error al obtener localidades:', error);
        }
      );
  }*/


  cargarLocalidad() {
    this.localidadesService.getLocalidades()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (localidades) => {
          this.localidades = localidades;
          // Si ya hay un juzgado seleccionado, asignarlo al formulario
          if (this.data && this.data.localidad_id) {
            const localidadElegida = this.localidades.find(j => +j.id === this.data.localidad_id);
            this.form.get('localidad')?.setValue(localidadElegida || '');
            this.localidadElegida = localidadElegida;
          }
        },
        (error) => {
          console.error('Error al obtener localidades:', error);
        }
      );
  }

  cargarTipo(){
    if (this.data) {
      this.tipoSeleccionado = this.data.tipo;
      this.form.get('tipo')?.setValue(this.tipoSeleccionado);
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  acceptDialog(): void {
    if (this.form.valid) {
      const localidadSeleccionada = this.form.value.localidad;
      console.log('Localidad seleccionada:', localidadSeleccionada);

      const tipoSeleccionado = this.form.value.tipo;
      console.log('Localidad seleccionada:', tipoSeleccionado);
  
      const juzgado: JuzgadoModel = {
        localidad_id: localidadSeleccionada?.id ?? null,
        nombre: this.form.value.nombre ?? null,
        direccion: this.form.value.direccion ?? null,
        id: this.data.id,
        estado: 'activo',
        tipo: tipoSeleccionado

      };
  
      this.dialogRef.close(juzgado);
    } else {
    const camposFaltantes = this.obtenerCamposFaltantes();
    if (camposFaltantes.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan completar campos',
        html: `<strong>Por favor completá:</strong><br><ul style="text-align: left;">${camposFaltantes.map(campo => `<li>${campo}</li>`).join('')}</ul>`,
        confirmButtonText: 'Entendido',
      });
      return;
    }    }
  }
  
       public obtenerCamposFaltantes(): string[] {
      const camposObligatorios = [
        { nombre: 'nombre', control: 'nombre' },
        { nombre: 'localidad', control: 'localidad' },
        { nombre: 'tipo', control: 'tipo' },


      ];
    
      const faltantes: string[] = [];
    
      camposObligatorios.forEach(campo => {
        const control = this.form.get(campo.control);
        if (control && control.validator && control.invalid) {
          faltantes.push(campo.nombre);
        }
      });
    
      return faltantes;
    } 
}
