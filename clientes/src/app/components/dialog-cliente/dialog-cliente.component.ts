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

import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonLabel, IonItem } from "@ionic/angular/standalone";

import Swal from 'sweetalert2';

import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-dialog-cliente',
  templateUrl: './dialog-cliente.component.html',
  styleUrls: ['./dialog-cliente.component.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, 
    CommonModule, 
    FormsModule,
    MatButtonModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, ReactiveFormsModule,
    MatListModule,  // <-- Agregado
    MatCheckboxModule // <-- Agregado
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // Agregar esto si usas Ionic

})
export class DialogClienteComponent {

  menu: number = 1;

  protected form: FormGroup;
  listaExpedientes: ExpedienteModel[] = [];
  getExpedientes$!: Subscription;
  expedientesSeleccionados: any[] = [];
  hayExpedientes: boolean = true;

  private destroy$ = new Subject<void>(); 


  constructor(
    private clienteService: ClientesService,
    private usuarioService: UsuarioService,
    private expedienteService: ExpedientesService,
    public dialogRef: MatDialogRef<DialogClienteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.form = new FormGroup({
      nombre: new FormControl('', [Validators.required, Validators.pattern("^(?!\\s*$)[a-zA-ZÀ-ÿ\\s]+$")]),
      apellido: new FormControl('', [Validators.required, Validators.pattern("^(?!\\s*$)[a-zA-ZÀ-ÿ\\s]+$")]),  
      dni: new FormControl('', [Validators.minLength(5), Validators.maxLength(8), Validators.pattern("^[0-9]+$")]),
      telefono: new FormControl('', [Validators.minLength(5), Validators.maxLength(14), Validators.pattern("^[0-9]+$")]),
      fechaNacimiento: new FormControl(''),  // No tiene validadores
      direccion: new FormControl('')  // No tiene validadores
    });
    

    if (data) {
      this.form.setValue({
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        fechaNacimiento: data.fechaNacimiento || '',
        direccion: data.direccion || '',
        dni: data.dni || '',
        telefono: data.telefono || '',
      });



    }

    this.cargarExpedientes();
  }

  ngOnInit() {


    this.cargarExpedientes(); // Cargar expedientes al iniciar


  }

  cargarExpedientes() {
    this.expedienteService.getExpedientes()
      .pipe(takeUntil(this.destroy$)) // Cancela la suscripción cuando destroy$ emita
      .subscribe(
        (expedientes) => {
          this.listaExpedientes = expedientes;
          //this.expedientesOriginales = [...expedientes];
          this.hayExpedientes = this.listaExpedientes.length > 0;
        },
        (error) => {
          console.error('Error al obtener expedientes:', error);
        }
      );
  }
  closeDialog(): void {
    this.dialogRef.close();
  }

  acceptDialog(): void {
    if(this.form.valid){
 
    const cliente: ClienteModel = {
      nombre: this.form.value.nombre ?? null,
      apellido: this.form.value.apellido ?? null,
      fecha_nacimiento: '1990-01-01 00:00:00.000',
      direccion: this.form.value.direccion && this.form.value.direccion.trim() !== '' ? this.form.value.direccion : '1',
      dni: this.form.value.dni && this.form.value.dni.trim() !== '' ? Number(this.form.value.dni) : 1,
      telefono: this.form.value.telefono && this.form.value.telefono.trim() !== '' ? this.form.value.telefono : '1',
      email: this.form.value.nombre,
      id: '0',
      fecha_creacion: 'ejemplo',
      expedientes: this.expedientesSeleccionados,
      estado: 'en gestión',
      usuario_id: this.usuarioService.usuarioLogeado.id,
      //expedientes: null


    };

    this.dialogRef.close(cliente);
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

    //alert(mensaje); 
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
        { nombre: 'apellido', control: 'apellido' },

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

isSelected(expediente: any): boolean {
    return this.expedientesSeleccionados.includes(expediente);
  }

  // Alterna la selección de un expediente
  toggleSelection(expediente: any): void {
    const index = this.expedientesSeleccionados.indexOf(expediente);
    if (index === -1) {
      // Si no está seleccionado, lo agregamos
      this.expedientesSeleccionados.push(expediente);
    } else {
      // Si está seleccionado, lo eliminamos
      this.expedientesSeleccionados.splice(index, 1);
    }
    console.log(this.expedientesSeleccionados);  // Muestra la lista de expedientes seleccionados
  }
}
