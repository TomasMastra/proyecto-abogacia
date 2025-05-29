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

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonLabel, IonItem } from "@ionic/angular/standalone";

import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-localidad',
  templateUrl: './dialog-juzgado.component.html',
  styleUrls: ['./dialog-juzgado.component.scss'],
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
export class DialogJuzgadoComponent {

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
    public dialogRef: MatDialogRef<DialogJuzgadoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.form = new FormGroup({
      nombre: new FormControl('', [Validators.required]),  
      direccion: new FormControl(/*'', [Validators.required]*/),
      localidad: new FormControl('', [Validators.required]),
      tipo: new FormControl('', [Validators.required]),

    });
    

    if (data) {
      this.form.setValue({
        localidad: data.localidad || '',
        nombre: data.nombre || '',
        //direccion: data.direccion || '',
        tipo: data.tipo || '',

        

      });



    }
  }

  ngOnInit() {
    this.cargarLocalidad();
  }

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
  }
  closeDialog(): void {
    this.dialogRef.close();
  }

  acceptDialog(): void {
    if(this.form.valid){
      const tipoSeleccionado = this.form.value.tipo;
      console.log('Localidad seleccionada:', tipoSeleccionado);

      const juzgado: JuzgadoModel = {
      localidad_id: Number(this.localidadElegida.id),
      nombre: this.form.value.nombre ?? null,
      direccion: this.form.value.direccion,
      id: '0',
      estado: 'activo',
      tipo: tipoSeleccionado
    };

    this.dialogRef.close(juzgado);
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

  cambiarMenu(menu: number){
    this.menu = menu;
  }

}
