import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators,  } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonCard, IonCardContent, IonText, IonItem, IonItemOption, IonItemOptions, IonLabel, IonItemSliding, IonList, IonIcon, IonButton, IonButtons, IonInput } from '@ionic/angular/standalone';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';

import { Router } from '@angular/router';

import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';

import { JuezService } from 'src/app/services/juez.service';
import { JuezModel } from 'src/app/models/juez/juez.component';

import Swal from 'sweetalert2'

import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-estado',
  templateUrl: './estado.page.html',
  styleUrls: ['./estado.page.scss'],
  standalone: true,
  imports: [FormsModule, IonItemSliding, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonInput, CommonModule, FormsModule,
        MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
        MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule,
        MatMenuModule, MatButtonModule, MatIconModule, MatSelectModule, ReactiveFormsModule
  ]
})
export class EstadoPage implements OnInit {

  protected form: FormGroup;

  expediente: any;
  numero: string = '';
  anio: string = '';
  menu: string = '1';
  honorario: string = '';
  jueces: JuezModel[] = [];

  estados: any[] = ['en gestíon', 'prueba', 'clausura p.', 'fiscal', 'sentencia'];
  estadoSeleccionado: any;

  private destroy$ = new Subject<void>(); 
  
  juezSeleccionado: JuezModel | null = null;

  apelable: any;

  constructor(
    private router: Router,     
    private expedienteService: ExpedientesService,
      private juezService: JuezService,
    ) {
  
      this.form = new FormGroup({
        honorario: new FormControl(''),
        fecha_inicio: new FormControl('')
      });
      
  /*
      if (data) {
        this.form.setValue({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          fechaNacimiento: data.fechaNacimiento || '',
          direccion: data.direccion || '',
          dni: data.dni || '',
          telefono: data.telefono || '',
        });
      }*/
  
      this.cargarJueces();
    }

  ngOnInit() {
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  buscar() {
    this.expedienteService.getClientePorNumeroYAnio(this.numero, this.anio).subscribe(
      (expedientes) => {
        if (!expedientes || expedientes.length === 0) {
          console.error("No se encontraron expedientes con ese número y año.");
          //alert("No se encontraron expedientes con ese número y año."); // O manejarlo de otra forma
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "No se encontro un expediente",
            showConfirmButton: false,
            timer: 1500
          });

        } else {
          console.log("Expedientes encontrados:", expedientes);
          this.expediente = expedientes[0]; // Guardar el expediente
          this.menu = '2';

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "success",
            title: "Expediente encontrado",
            showConfirmButton: false,
            timer: 1500
          });
        }
      },
      (error) => {
        console.error("Error en la búsqueda:", error);
        //alert("Ocurrió un error al buscar el expediente.");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "Ingrese numero y año",
          showConfirmButton: false,
          timer: 1500
        });
      }
    );
  }

  cambiarMenu(menu: string){
    this.menu = menu;
  }

    cargarJueces() {
      this.juezService.getJuez()
        .pipe(takeUntil(this.destroy$)) 
        .subscribe(
          (jueces) => {
            this.jueces = jueces;
          },
          (error) => {
            console.error('Error al obtener jueces:', error);
          }
        );
    }


    actualizarEstado(){
      alert('Honorario: ' + this.form.value.honorario);
      alert('Fecha de inicio: ' + this.form.value.fecha_inicio);
      
      if (this.form.valid) {

        const expediente: ExpedienteModel = {
          id: this.expediente?.id ?? '0',  
          titulo: '',
          descripcion: '', 
          fecha_creacion: this.expediente?.fecha_creacion ?? '', 
          clientes: this.expediente?.clientes ?? null,
          juzgado_id: this.expediente?.juzgado_id ?? null, // Asumiendo que `juzgadoEelegido` tiene un campo `id`
          demandado_id: this.expediente?.demandado_id ?? null,    
          numero: this.form.value.numero,
          anio: this.form.value.anio,
          demandadoModel: this.expediente.demandadoModel,
          estado: this.form?.value.estado,

          sala_radicacion:  null,
          honorario: this.form.value.honorario ?? null,
          fecha_inicio: this.form.value.fecha_inicio ?? null,
          fecha_sentencia: this.form.value.fecha_sentencia ?? null, 
          hora_sentencia:  null, 

          // modificar
          juez_id: '1',
          juezModel: { id:  '', nombre:  '' }
          
        };

        this.expedienteService.actualizarExpediente(expediente.id, expediente);

}else {
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "error",
    title: "Seleccione un juez",
    showConfirmButton: false,
    timer: 1500
  });
}
}



/*

acceptDialog(): void {
      if (this.form.valid) {

        const expediente: ExpedienteModel = {
          id: this.data?.id ?? '0',  
          titulo: '',
          descripcion: '', 
          fecha_creacion: this.data?.fecha_creacion ?? '', 
          clientes: this.data?.clientes ?? null,
          juzgado_id: this.juzgadoElegido?.id ?? null, // Asumiendo que `juzgadoEelegido` tiene un campo `id`
          demandado_id: this.demandadoElegido?.id ?? null,    
          numero: this.form.value.numero,
          anio: this.form.value.anio,
          demandadoModel: this.demandadoElegido,
          estado: this.data?.estado,
          sala_radicacion: this.form.value.sala_radicacion ?? null,
          honorario: 'prueba',
          fecha_inicio: this.form.value.fecha_inicio ?? null,
          fecha_sentencia: this.form.value.fecha_sentencia ?? null, 
          hora_sentencia: this.form.value.hora_sentencia ?? null, 

          // modificar
          juez_id: null,
          juezModel: { id: '', nombre: '' },
        };
    
        this.dialogRef.close(expediente);
      } else {
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
      }
    }*/
}
