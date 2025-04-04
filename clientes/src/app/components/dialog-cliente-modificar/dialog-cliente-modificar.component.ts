import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonCheckbox, IonItemSliding } from "@ionic/angular/standalone";



import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntil } from 'rxjs/operators';


import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

import { IonLabel, IonItem } from "@ionic/angular/standalone";

@Component({
  selector: 'app-dialog-cliente-modificar',
  templateUrl: './dialog-cliente-modificar.component.html',
  styleUrls: ['./dialog-cliente-modificar.component.scss'],
  standalone: true,
  imports: [IonItemSliding, IonCheckbox, 
    CommonModule, 
    FormsModule,
    MatButtonModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    ReactiveFormsModule
  ]
})
export class DialogClienteModificarComponent {

  protected form: FormGroup;
  menu: number = 1;

  constructor(
    private clienteService: ClientesService,
    public dialogRef: MatDialogRef<DialogClienteModificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClienteModel
  ) {
    this.form = new FormGroup({
      nombre: new FormControl('', [Validators.pattern("^(?!\\s*$)[a-zA-ZÀ-ÿ\\s]+$")]), 
      apellido: new FormControl('', [Validators.pattern("^(?!\\s*$)[a-zA-ZÀ-ÿ\\s]+$")]),  
      dni: new FormControl('', [Validators.minLength(7), Validators.maxLength(8), Validators.pattern("^[0-9]+$")]),
      telefono: new FormControl('', [Validators.minLength(6), Validators.maxLength(14), Validators.pattern("^[0-9]+$")]),
      fechaNacimiento: new FormControl(''),  // No tiene validadores
      direccion: new FormControl('')  // No tiene validadores
    });
    

    if (data) {
      const fechaNacimiento = this.data.fecha_nacimiento;
      const fechas = new Date(this.data.fecha_nacimiento!);
      const fechaFormateada = fechaNacimiento!.toString().split('T')[0]; // Esto da el formato yyyy-MM-dd

      this.form.setValue({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        fechaNacimiento: fechaFormateada || '',
        direccion: data.direccion || '',
        dni: data.dni || '',
        telefono: data.telefono || '',


      });



    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  acceptDialog(): void {
    if (this.form.valid) {
      const cliente: ClienteModel = {
        ...this.data, // Mantiene los valores previos en caso de que no se modifiquen
        id: this.data?.id ?? '0',
        nombre: this.form.value.nombre ?? this.data.nombre,
        apellido: this.form.value.apellido ?? this.data.apellido,
        fecha_nacimiento: this.form.value.fechaNacimiento || this.data.fecha_nacimiento || new Date().toISOString().split('T')[0],
        direccion: this.form.value.direccion ?? this.data.direccion,
        dni: this.form.value.dni ? Number(this.form.value.dni) : this.data.dni,
        telefono: this.form.value.telefono ?? this.data.telefono,
        fecha_creacion: this.data?.fecha_creacion ?? 'ejemplo', 
        email: this.form.value.nombre,
        expedientes: this.data?.expedientes ?? null,
        estado: this.data.estado, 
      };
  
      this.dialogRef.close(cliente);
    } else {
      let mensaje = "Errores en los siguientes campos:\n";
      Object.keys(this.form.controls).forEach(campo => {
        const control = this.form.get(campo);
        if (control?.invalid) {
          mensaje += `- ${campo}: `;
          if (control.errors?.['required']) mensaje += "Este campo es obligatorio.\n";
          if (control.errors?.['email']) mensaje += "Debe ser un correo válido.\n";
          if (control.errors?.['pattern']) mensaje += "Formato inválido.\n";
          if (control.errors?.['minlength']) mensaje += `Debe tener al menos ${control.errors['minlength'].requiredLength} caracteres.\n`;
          if (control.errors?.['maxlength']) mensaje += `Debe tener máximo ${control.errors['maxlength'].requiredLength} caracteres.\n`;
        }
      });
    }
  }
  

}
