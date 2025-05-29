import { Component, Inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntil } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';

import { LocalidadesService } from 'src/app/services/localidades.service';
import { LocalidadModel } from 'src/app/models/localidad/localidad.component';
import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonLabel, IonItem } from "@ionic/angular/standalone";

import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-localidad',
  templateUrl: './dialog-localidad.component.html',
  styleUrls: ['./dialog-localidad.component.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, 
    CommonModule, 
    FormsModule,
    MatButtonModule, 
    MatDialogModule, MatFormFieldModule, 
    MatInputModule, ReactiveFormsModule,
    MatListModule, MatCheckboxModule,
    MatSelectModule 
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Agregar esto si usas Ionic

})
export class DialogLocalidadComponent {

  menu: number = 1;

  protected form: FormGroup;
  getExpedientes$!: Subscription;
  expedientesSeleccionados: any[] = [];
  hayExpedientes: boolean = true;

  private destroy$ = new Subject<void>(); 
  provincias: string[] = [
    'Buenos Aires', 'Ciudad Autónoma de Buenos Aires'/*, 'Catamarca', 'Chaco', 'Chubut',
    'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
    'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'*/
  ];
  partidos: any[] = [];
  

  constructor(
    private localidadService: LocalidadesService,
    public dialogRef: MatDialogRef<DialogLocalidadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.form = new FormGroup({
      localidad: new FormControl('', [Validators.required]),  
      partido: new FormControl('', [Validators.required]),
      //provincia: new FormControl('', [Validators.required]),
    });
    

    if (data) {
      this.form.setValue({
        localidad: data.localidad || '',
        partido: data.partido || '',
        //provincia: data.provincia || '',

      });



    }
  }

  ngOnInit() {
    this.cargarPartidos();
  }

  cargarPartidos() {
    this.localidadService.getPartidos()
      .pipe(takeUntil(this.destroy$)) 
      .subscribe(
        (partidos) => {
          this.partidos = partidos;
        },
        (error) => {
          console.error('Error al obtener partidos:', error);
        }
      );
  }


  closeDialog(): void {
    this.dialogRef.close();
  }

  acceptDialog(): void {
    if(this.form.valid){
 
    const cliente: LocalidadModel = {
      localidad: this.form.value.localidad ?? null,
      partido: this.form.value.partido.nombre ?? null,
      provincia: this.form.value.partido.provincia,
      id: '0',
      estado: 'activo'
    };

    this.dialogRef.close(cliente);
  }else {
    const camposFaltantes = this.obtenerCamposFaltantes();
    if (camposFaltantes.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Faltan completar campos',
        html: `<strong>Por favor completá:</strong><br><ul style="text-align: left;">${camposFaltantes.map(campo => `<li>${campo}</li>`).join('')}</ul>`,
        confirmButtonText: 'Entendido',
      });
      return;
    }
  }
    
  }
        public obtenerCamposFaltantes(): string[] {
      const camposObligatorios = [
        { nombre: 'localidad', control: 'localidad' },
        { nombre: 'partido', control: 'partido' },

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

  cambiarMenu(menu: number){
    this.menu = menu;
  }

}
