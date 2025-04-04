import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors  } from '@angular/forms';
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

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

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
        MatMenuModule, MatButtonModule, MatIconModule, MatSelectModule, ReactiveFormsModule,     
        MatFormFieldModule, MatInputModule
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
  juezSeleccionado: any;

  juzSel: any;

  juzgados: JuzgadoModel[] = [];
  juzgadoSeleccionado: any;

  estados: any[] = ['en gestíon', 'inicio', 'prueba', 'clausura p.', 'fiscal', 'sentencia'];
  estadoSeleccionado: any;

  honorarios: any[] = ['Reputacion 1º instancia', 'Difiere reputacion 1º instancia', 'Costas por su orden'];
  honorarioSeleccionado: any = 'Reputacion 1º instancia';

  private destroy$ = new Subject<void>();
  

  apela: boolean = false;

  montoActual: number = 0;



  constructor(
    private router: Router,
    private expedienteService: ExpedientesService,
      private juezService: JuezService,
      private juzgadosService: JuzgadosService,
    ) {
  
      this.form = new FormGroup(
        {
          honorario: new FormControl('', [Validators.required]),
          fecha_sentencia: new FormControl('', [Validators.required/*, this.fechaMayorA("2024-09-23")*/]),
          juez: new FormControl('', [Validators.required]),
          monto: new FormControl('', [Validators.required]),
        }
      );    

      this.form.get('honorario')?.valueChanges.subscribe((valorSeleccionado) => {
        this.actualizarMonto(valorSeleccionado);
      });

      this.cargarJueces();
      this.cargarJuzgados();
    }

    ngOnInit() {
      if (!this.form) {
        console.error("El formulario no está inicializado.");
        return;
      }else{
        this.montoActual = this.form.value.monto;

      }
    }
    


  
  /*
  fechaSentenciaMayorQueInicio: ValidatorFn = (form: AbstractControl) => {
    if (!this.expediente || !this.expediente?.fecha_inicio) {
      return null; // Si `expediente` aún no está cargado, no aplicar validación
    }

    const fechaInicio = new Date(this.expediente[0].fecha_inicio);
    const fechaSentencia = new Date(form.get('fecha_sentencia')?.value);

    if (fechaSentencia && fechaInicio && fechaSentencia <= fechaInicio) {
      return { fechaInvalida: true }; // Error si la fecha_sentencia no es mayor
    }
    return null;
  };

  fechaMayorA(fechaMinima: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null; // Si no hay valor, no hay error
      const fechaSeleccionada = new Date(control.value);
      const fechaMinimaDate = new Date(fechaMinima);
  
      return fechaSeleccionada > fechaMinimaDate ? null : { fechaInvalida: true };
    };
  }*/
  

  goTo(path: string) {
    this.menu = '1';

    this.form.reset();

    this.form.reset({
      honorario: '',
      fecha_sentencia: this.form.value.fecha_sentencia,
      juez: this.form.value.juez
    });
    this.router.navigate([path]); 
  }

 
  buscar() {
      this.expedienteService.getClientePorNumeroYAnio(this.numero, this.anio, this.juzgadoSeleccionado?.id).subscribe(
        (expedientes) => {
          if (!expedientes || expedientes.length === 0) {
            console.error("No se encontraron expedientes con ese número y año.");
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
            this.expediente = expedientes[0]; 
            this.menu = '2';
            this.estadoSeleccionado = this.expediente.estado;
            this.asignarDatos();

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
          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Complete el formulario",
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

    cargarJuzgados() {
      this.juzgadosService.getJuzgados()
        .pipe(takeUntil(this.destroy$)) 
        .subscribe(
          (juzgados) => {
            this.juzgados = juzgados;
          },
          (error) => {
            console.error('Error al obtener juzgados:', error);
          }
        );
    }


    actualizarEstado(){
      if ( (this.form.valid && this.estadoSeleccionado == 'sentencia') || (this.estadoSeleccionado != 'sentencia')) {
        const expediente: ExpedienteModel = {
          id: this.expediente?.id ?? '0',  
          titulo: '',
          descripcion: '', 
          fecha_creacion: this.expediente?.fecha_creacion ?? '', 
          clientes: this.expediente?.clientes ?? null,
          juzgado_id: this.expediente?.juzgado_id ?? null, // Asumiendo que `juzgadoEelegido` tiene un campo `id`
          demandado_id: this.expediente?.demandado_id ?? null,    
          numero: this.expediente.numero,
          anio: this.expediente.anio,
          demandadoModel: this.expediente.demandadoModel,
          estado: this.estadoSeleccionado,

          sala_radicacion:  null,
          honorario: this.form.value.honorario?.trim() === '' ? null : this.form.value.honorario,
          fecha_inicio: this.expediente?.fecha_inicio,
          fecha_sentencia: this.form.value.fecha_sentencia?.trim() === '' ? null : this.form.value.fecha_sentencia, 
          hora_sentencia:  null, 

          juez_id: this.juezSeleccionado ? this.juezSeleccionado.id : null,
          juezModel: { id:  '', nombre:  '' },

          juicio: this.expediente?.juicio,
          ultimo_movimiento: this.expediente?.ultimo_movimiento,
          monto: this.form.value.monto,
          apela: this.apela

          
        };

        this.expedienteService.deleteClienteExpedientePorId(expediente.id).subscribe(response => {
          console.log('Respuesta del servidor:', response);
        }, error => {
          console.error('Error al eliminar clientes:', error);
        });

        this.expedienteService.actualizarExpediente(expediente.id, expediente)
        .subscribe(response => {
          console.log('Expediente actualizado:', response);
          this.menu = '1';
          this.form.reset();

        }, error => {
          console.error('Error al actualizar expediente:', error);
        });


          }else {
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "error",
              title: "Faltan datos por ingresar",
              showConfirmButton: false,
              timer: 1500
            });
          }
          }

      /*Valida si el caracter ingresado es numerico*/
      validateNumber(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char) && char !== 'Backspace' && char !== 'Delete' && char !== 'ArrowLeft' && char !== 'ArrowRight') {
          event.preventDefault();
        }
      }
    
      validatePaste(event: ClipboardEvent) {
        const clipboardData = event.clipboardData || (window as any).clipboardData;
        const pastedData = clipboardData.getData('Text');
        if (!/^\d+$/.test(pastedData)) {
          event.preventDefault();
        }
      }



      actualizarMonto(honorario: string) {
        const montos = {
          'Reputacion 1º instancia': this.expediente.monto,
          'Difiere reputacion 1º instancia': 0.00,
          'Costas por su orden': 0.00
        };
      
        this.form.get('monto')?.setValue(montos[honorario as keyof typeof montos] ?? '');
      }

  asignarDatos(){
    
  //HONORARIO
  this.honorarioSeleccionado = this.expediente.honorario;

  //FECHA SENTENCIA
  const fecha_sentencia = this.expediente.fecha_sentencia;
  const fecha = new Date(fecha_sentencia);
  const fechaFormateada = fecha.toISOString().split('T')[0]; // Esto da el formato yyyy-MM-dd
  this.form.get('fecha_sentencia')?.setValue(fechaFormateada);
  console.log(fecha_sentencia);

    //MONTO DEL HONORARIO
  const monto = this.expediente.monto;
  this.form.get('monto')?.setValue(this.expediente.monto);



  if (this.expediente.juez_id) {
    const juezEncontrado = this.jueces.find(juez => juez.id === this.expediente.juez_id);
    if (juezEncontrado) {
      console.log('juez encontrado');
      this.form.get('juez')?.setValue(juezEncontrado);
    }
  }
      

}
      
}

