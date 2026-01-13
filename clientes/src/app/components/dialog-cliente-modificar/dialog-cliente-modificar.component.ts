import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { IonCheckbox, IonItemSliding } from "@ionic/angular/standalone";



import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntil } from 'rxjs/operators';


import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

import { IonLabel, IonItem } from "@ionic/angular/standalone";

import Swal from 'sweetalert2';

import { UsuarioService } from 'src/app/services/usuario.service';


function fechaNacimientoValida(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;

  const hoy = new Date().toISOString().split('T')[0]; // '2024-06-02'
  return control.value > hoy ? { fechaInvalida: true } : null;
}

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
  hoy: Date = new Date();


  constructor(
    private clienteService: ClientesService,
    private usuarioService: UsuarioService,
    public dialogRef: MatDialogRef<DialogClienteModificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClienteModel
  ) {
    console.log('Data recibida en el Dialog:', data);

    this.form = new FormGroup({
      nombre: new FormControl('', [Validators.pattern("^(?!\\s*$)[a-zA-ZÀ-ÿ\\s]+$")]), 
      apellido: new FormControl('', [Validators.pattern("^(?!\\s*$)[a-zA-ZÀ-ÿ\\s]+$")]),  
      dni: new FormControl('', [Validators.minLength(7), Validators.maxLength(8), Validators.pattern("^[0-9]+$")]),
      telefono: new FormControl('', [Validators.minLength(6), Validators.maxLength(14), Validators.pattern("^[0-9]+$")]),
      fechaNacimiento: new FormControl('', [fechaNacimientoValida]),
      direccion: new FormControl(''),
      

    });
    

    if (data) {
          const fechaFormateada = data.fecha_nacimiento
      ? new Date(data.fecha_nacimiento).toISOString().split('T')[0] 
      : '';

          const fechaMediacionFormateada = data.fecha_mediacion 
      ? new Date(data.fecha_mediacion).toISOString().split('T')[0] 
      : '';

      this.form.setValue({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        fechaNacimiento: fechaFormateada,
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
        fecha_creacion: this.data?.fecha_creacion ?? '', 
        email: this.form.value.nombre,
        expedientes: this.data?.expedientes ?? null,
        estado: this.data.estado, 
        usuario_id: this.usuarioService.usuarioLogeado!.id.toString(),

      };
  
      this.dialogRef.close(cliente);
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
               }
    }
  }
  

     public obtenerCamposFaltantes(): string[] {
      const camposObligatorios = [
        { nombre: 'Nombre', control: 'nombre' },
        { nombre: 'Apellido', control: 'apellido' },
        { nombre: 'Numero de telefono', control: 'telefono' },
        { nombre: 'Direccion', control: 'direccion' },
        { nombre: 'DNI', control: 'dni' },
        { nombre: 'Fecha de nacimiento', control: 'fechaNacimiento' },


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


