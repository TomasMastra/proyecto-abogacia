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
 
      console.log('localidadElegida.id', this.localidadElegida.id);
      console.log('Tipo de localidadElegida.id', typeof this.localidadElegida.id);

      const juzgado: JuzgadoModel = {
      localidad_id: Number(this.localidadElegida.id),
      nombre: this.form.value.nombre ?? null,
      direccion: this.form.value.direccion,
      id: '0',
      estado: 'activo'
    };

    this.dialogRef.close(juzgado);
  }else {
    let mensaje = "Errores en los siguientes campos:\n";

    Object.keys(this.form.controls).forEach(campo => {
      const control = this.form.get(campo);
      if (control?.invalid) {
        mensaje += `- ${campo}: `;

        if (control.errors?.['required']) {
          mensaje += "Este campo es obligatorio.\n";
        }
        if (control.errors?.['email']) {
          mensaje += "Debe ser un correo válido.\n";
        }
        if (control.errors?.['pattern']) {
          mensaje += "Formato inválido.\n";
        }
        if (control.errors?.['minlength']) {
          mensaje += `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.\n`;
        }
        if (control.errors?.['maxlength']) {
          mensaje += `Debe tener máximo ${control.errors['maxlength'].requiredLength} caracteres.\n`;
        }
      }
    });

    alert(mensaje); 
  }
    
  }

  cambiarMenu(menu: number){
    this.menu = menu;
  }

}
