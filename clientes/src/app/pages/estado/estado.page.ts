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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

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
        MatFormFieldModule, MatInputModule, MatProgressSpinnerModule
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

  estados: any[] = ['en gestíon', 'inicio', 'prueba', 'clausura periodo prueba', 'fiscal', 'sentencia', 'cobrado'];
  estadoSeleccionado: any;

  honorarios: any[] = ['Regulacion 1º instancia', 'Difiere regulacion 1º instancia', 'Costas por su orden'];
  honorarioSeleccionado: any = 'Regulacion 1º instancia';

  private destroy$ = new Subject<void>();
  
  valorUMA: number = 67632;
  cantidadUMA: number = 0;
  montoUMA: number | null = null;


  apela: boolean = false;

  montoActual: number = 0;

  cargando: boolean = false;


ultimo_movimiento: string | null = null;
// Capital
estadoCapitalSeleccionado: string | null = null;
subEstadoCapitalSeleccionado: string | null = null;
fechaCapitalSubestado: string | null = null;
estadoLiquidacionCapitalSeleccionado: string | null = null;
fechaLiquidacionCapital: string | null = null;
montoLiquidacionCapital: number | null = null;

// Honorarios
estadoHonorariosSeleccionado: string | null = null;
subEstadoHonorariosSeleccionado: string | null = null;
fechaHonorariosSubestado: string | null = null;
estadoLiquidacionHonorariosSeleccionado: string | null = null;
fechaLiquidacionHonorarios: string | null = null;
//montoLiquidacionHonorarios: number | null = null;

deshabilitarApeladoOFirme = false;


  constructor(
    private router: Router,
    private expedienteService: ExpedientesService,
      private juezService: JuezService,
      private juzgadosService: JuzgadosService,
    ) {
  
      this.resetearCamposEstadoYHonorarios();

      this.form = new FormGroup(
        {
          honorario: new FormControl('', [Validators.required]),
          fecha_sentencia: new FormControl('', [Validators.required/*, this.fechaMayorA("2024-09-23")*/]),
          juez: new FormControl('', [Validators.required]),
          //monto: new FormControl('', [Validators.required]),

          ultimo_movimiento: new FormControl('', [Validators.required]),


          // Capital
          estadoCapitalSeleccionado: new FormControl('', [Validators.required]),
          subEstadoCapitalSeleccionado: new FormControl(''),
          fechaCapitalSubestado: new FormControl(''),
          estadoLiquidacionCapitalSeleccionado: new FormControl(''),
          fechaLiquidacionCapital: new FormControl(''),
          montoLiquidacionCapital: new FormControl(''),

          // Honorarios
          estadoHonorariosSeleccionado: new FormControl('', [Validators.required]),
          subEstadoHonorariosSeleccionado: new FormControl(''),
          fechaHonorariosSubestado: new FormControl(''),
          estadoLiquidacionHonorariosSeleccionado: new FormControl(''),
          fechaLiquidacionHonorarios: new FormControl(''),
          cantidadUMA: new FormControl('', [Validators.required]),
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
    
    calcularMontoUMA() {
      if (this.cantidadUMA && this.valorUMA) {
        this.montoUMA = this.valorUMA * this.cantidadUMA;
      } else {
        this.montoUMA = 0;
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
      honorario: null,
      fecha_sentencia: this.form.value.fecha_sentencia,
      juez: this.form.value.juez,
    
      // Capital
      estadoCapitalSeleccionado: null,
      subEstadoCapitalSeleccionado: null,
      fechaCapitalSubestado: null,
      estadoLiquidacionCapitalSeleccionado: null,
      fechaLiquidacionCapital: null,
      montoLiquidacionCapital: null,
    
      // Honorarios
      estadoHonorariosSeleccionado: null,
      subEstadoHonorariosSeleccionado: null,
      fechaHonorariosSubestado: null,
      estadoLiquidacionHonorariosSeleccionado: null,
      fechaLiquidacionHonorarios: null,
      cantidadUMA: null,
      //montoLiquidacionHonorarios: null
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
            this.calcularMontoUMA();

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
    this.juzgadoSeleccionado = null;
    this.numero = '';
    this.anio = '';
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

   public obtenerCamposFaltantes(): string[] {
      const camposObligatorios = [
        { nombre: 'Honorario', control: 'honorario' },
        { nombre: 'Fecha de Sentencia', control: 'fecha_sentencia' },
        { nombre: 'Juez', control: 'juez' },
        //{ nombre: 'Monto', control: 'monto' },
        { nombre: 'Último Movimiento', control: 'ultimo_movimiento' },
    
        // Capital
        { nombre: 'Estado del Capital', control: 'estadoCapitalSeleccionado' },
        { nombre: 'Subestado Capital', control: 'subEstadoCapitalSeleccionado' },
        { nombre: 'Estado Liquidación Capital', control: 'estadoLiquidacionCapitalSeleccionado' },
        { nombre: 'Fecha Subestado Capital', control: 'fechaCapitalSubestado' },
        { nombre: 'Fecha Liquidación Capital', control: 'fechaLiquidacionCapital' },
        { nombre: 'Monto de Liquidación de Capital', control: 'montoLiquidacionCapital' },
    
        // Honorarios
        { nombre: 'Estado de Honorarios', control: 'estadoHonorariosSeleccionado' },
        { nombre: 'Subestado Honorarios', control: 'subEstadoHonorariosSeleccionado' },
        { nombre: 'Estado Liquidación Honorarios', control: 'estadoLiquidacionHonorariosSeleccionado' },
        { nombre: 'Fecha Subestado Honorarios', control: 'fechaHonorariosSubestado' },
        { nombre: 'Fecha Liquidación Honorarios', control: 'fechaLiquidacionHonorarios' },
        { nombre: 'Cantidad UMA', control: 'cantidadUMA' },
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
      
    actualizarEstado() {
      if(this.estadoSeleccionado == 'sentencia'){

        // VER
        const hoy = new Date().toISOString().split('T')[0];
        this.form.get('ultimo_movimiento')?.setValue(hoy);
        
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
      const esSentencia = this.estadoSeleccionado === 'sentencia';
    

      // Obtenemos las fechas en formato Date
      let fechaReciente: Date | null = null;

      const fechaSentencia = this.form.value.fecha_sentencia ? new Date(this.form.value.fecha_sentencia) : null;
      const fechaCapital = this.fechaLiquidacionCapital ? new Date(this.fechaLiquidacionCapital) : null;
      const fechaHonorarios = this.fechaLiquidacionHonorarios ? new Date(this.fechaLiquidacionHonorarios) : null;
      
      [fechaSentencia, fechaCapital, fechaHonorarios].forEach((f) => {
        if (f && (!fechaReciente || f > fechaReciente)) {
          fechaReciente = f;
        }
      });
      
      const ultimoMovimientoCalculado = this.form.value.ultimo_movimiento?.trim() !== ''
        ? this.form.value.ultimo_movimiento
        : fechaReciente ?? null; // directo sin .toISOString()
      
      
      if ((this.form.valid && esSentencia) || (!esSentencia)) {
        const expediente: ExpedienteModel = {
          // 📌 DATOS INICIALES
          id: this.expediente?.id ?? '0',
          titulo: '',
          descripcion: '',
          fecha_creacion: this.expediente?.fecha_creacion ?? '',
          clientes: this.expediente?.clientes ?? null,
          juzgado_id: this.expediente?.juzgado_id ?? null,
          demandado_id: this.expediente?.demandado_id ?? null,
          numero: this.expediente.numero,
          anio: this.expediente.anio,
          demandadoModel: this.expediente.demandadoModel,
          estado: this.estadoSeleccionado,
          sala_radicacion: null,
    
          // 📌 SENTENCIA
          honorario: esSentencia && this.form.value.honorario?.trim() !== '' ? this.form.value.honorario : null,
          fecha_inicio: this.expediente?.fecha_inicio,
          fecha_sentencia: esSentencia && this.form.value.fecha_sentencia ? this.form.value.fecha_sentencia : null,
          hora_sentencia: null,
          juez_id: esSentencia && this.juezSeleccionado ? this.juezSeleccionado.id : null,
          juezModel: { id: '', nombre: '', apellido: '', estado: '' },
    
          
          juicio: this.expediente?.juicio,
          ultimo_movimiento: ultimoMovimientoCalculado,
          monto: null,
          apela: esSentencia ? this.apela : null,
          juzgadoModel: null,

          // 📌 Capital
          estadoCapitalSeleccionado: esSentencia ? this.estadoCapitalSeleccionado ?? null : null,
          subEstadoCapitalSeleccionado: esSentencia ? this.subEstadoCapitalSeleccionado ?? null : null,
          fechaCapitalSubestado: esSentencia ? this.fechaCapitalSubestado ?? null : null,
          estadoLiquidacionCapitalSeleccionado: esSentencia ? this.estadoLiquidacionCapitalSeleccionado ?? null : null,
          fechaLiquidacionCapital: esSentencia ? this.fechaLiquidacionCapital ?? null : null,
          montoLiquidacionCapital: esSentencia ? this.montoLiquidacionCapital ?? null : null,
          capitalCobrado: this.expediente?.capitalCobrado,

          // 📌 Honorarios
          estadoHonorariosSeleccionado: esSentencia ? this.estadoHonorariosSeleccionado ?? null : null,
          subEstadoHonorariosSeleccionado: esSentencia ? this.subEstadoHonorariosSeleccionado ?? null : null,
          fechaHonorariosSubestado: esSentencia ? this.fechaHonorariosSubestado ?? null : null,
          estadoLiquidacionHonorariosSeleccionado: esSentencia ? this.estadoLiquidacionHonorariosSeleccionado ?? null : null,
          fechaLiquidacionHonorarios: esSentencia ? this.fechaLiquidacionHonorarios ?? null : null,
          montoLiquidacionHonorarios: esSentencia ? this.montoUMA ?? null : null,
          honorarioCobrado: this.expediente?.honorarioCobrado,
          cantidadUMA: esSentencia ? this.cantidadUMA ?? null : null,
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

            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "error",
              title: "Faltan datos por ingresar",
              showConfirmButton: false,
              timer: 1500
            });
          });
    
      } else {
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
          'Regulacion 1º instancia': this.expediente.monto,
          'Difiere regulacion 1º instancia': 0.00,
          'Costas por su orden': 0.00
        };
      
        this.form.get('monto')?.setValue(montos[honorario as keyof typeof montos] ?? '');

      }

      asignarDatos() {  
        // Honorario
        this.honorarioSeleccionado = this.expediente.honorario;
      
        // Fecha sentencia formateada
        const fecha_sentencia = this.expediente.fecha_sentencia;
        const fechaSentenciaFormateada = new Date(fecha_sentencia).toISOString().split('T')[0];
      
        // Juez seleccionado
        if (this.expediente.juez_id) {
          const juezEncontrado = this.jueces.find(juez => juez.id === this.expediente.juez_id);
          if (juezEncontrado) {
            this.juezSeleccionado = juezEncontrado;
          }
        }
        this.ultimo_movimiento = this.expediente.ultimo_movimiento 
          ? new Date(this.expediente.ultimo_movimiento).toISOString().split('T')[0] 
          : null;
      
      
        // Capital
        this.estadoCapitalSeleccionado = this.expediente.estadoCapitalSeleccionado ?? null;
        this.subEstadoCapitalSeleccionado = this.expediente.subEstadoCapitalSeleccionado ?? null;  

        this.fechaCapitalSubestado = this.expediente.fechaCapitalSubestado 
          ? new Date(this.expediente.fechaCapitalSubestado).toISOString().split('T')[0] 
          : null;
        this.estadoLiquidacionCapitalSeleccionado = this.expediente.estadoLiquidacionCapitalSeleccionado ?? null;
        this.fechaLiquidacionCapital = this.expediente.fechaLiquidacionCapital 
          ? new Date(this.expediente.fechaLiquidacionCapital).toISOString().split('T')[0] 
          : null;
        this.montoLiquidacionCapital = this.expediente.montoLiquidacionCapital ?? null;
      
        // Honorarios
        this.estadoHonorariosSeleccionado = this.expediente.estadoHonorariosSeleccionado ?? null;
        this.subEstadoHonorariosSeleccionado = this.expediente.subEstadoHonorariosSeleccionado ?? null;
        this.fechaHonorariosSubestado = this.expediente.fechaHonorariosSubestado 
          ? new Date(this.expediente.fechaHonorariosSubestado).toISOString().split('T')[0] 
          : null;
        this.estadoLiquidacionHonorariosSeleccionado = this.expediente.estadoLiquidacionHonorariosSeleccionado ?? null;
        this.fechaLiquidacionHonorarios = this.expediente.fechaLiquidacionHonorarios 
          ? new Date(this.expediente.fechaLiquidacionHonorarios).toISOString().split('T')[0] 
          : null;
        //this.montoLiquidacionHonorarios = this.expediente.montoLiquidacionHonorarios ?? null;
        this.cantidadUMA = this.expediente.cantidadUMA ?? null;

        // 2️⃣ Cuando todo está listo, recién ahí seteamos el formulario
        this.form.setValue({
          honorario: this.honorarioSeleccionado,
          fecha_sentencia: fechaSentenciaFormateada,
          juez: this.juezSeleccionado,
          //monto: this.expediente.monto,
          ultimo_movimiento: this.ultimo_movimiento,
      
          estadoCapitalSeleccionado: this.estadoCapitalSeleccionado,
          subEstadoCapitalSeleccionado: this.subEstadoCapitalSeleccionado,
          fechaCapitalSubestado: this.fechaCapitalSubestado,
          estadoLiquidacionCapitalSeleccionado: this.estadoLiquidacionCapitalSeleccionado,
          fechaLiquidacionCapital: this.fechaLiquidacionCapital,
          montoLiquidacionCapital: this.montoLiquidacionCapital,
      
          estadoHonorariosSeleccionado: this.estadoHonorariosSeleccionado,
          subEstadoHonorariosSeleccionado: this.subEstadoHonorariosSeleccionado,
          fechaHonorariosSubestado: this.fechaHonorariosSubestado,
          estadoLiquidacionHonorariosSeleccionado: this.estadoLiquidacionHonorariosSeleccionado,
          fechaLiquidacionHonorarios: this.fechaLiquidacionHonorarios,
          cantidadUMA: this.cantidadUMA,
         // cantidadUMA: this.montoLiquidacionHonorarios,

        });
        //this.cantidadUMA = this.expediente.cantidadUMA;

        // 3️⃣ Opcional: refrescamos las validaciones por seguridad
        Object.keys(this.form.controls).forEach(field => {
          const control = this.form.get(field);
          control?.markAsTouched({ onlySelf: true });
          control?.updateValueAndValidity();
        });
      
        // 4️⃣ Por último, actualizamos las validaciones condicionales
        this.actualizarValidacionesCondicionales();
      }
      

actualizarEstadoCapital() {

  //console.log(this.montoLiquidacionCapital);
  if (this.estadoCapitalSeleccionado === 'apelado' || this.estadoCapitalSeleccionado === 'pendiente') {
    // Si es apelado, limpio los de liquidación
    this.estadoLiquidacionCapitalSeleccionado = null;
    this.fechaLiquidacionCapital = null;
    this.montoLiquidacionCapital = null;

    this.form.get('estadoLiquidacionCapitalSeleccionado')?.setValue(null);
    this.form.get('fechaLiquidacionCapital')?.setValue(null);
    this.form.get('montoLiquidacionCapital')?.setValue(null);

  } else if (this.estadoCapitalSeleccionado === 'firme') {
    // Si es firme, limpio los subestados de apelación
    this.subEstadoCapitalSeleccionado = null;
    this.fechaCapitalSubestado = null;

    this.form.get('subEstadoCapitalSeleccionado')?.setValue(null);
    this.form.get('fechaCapitalSubestado')?.setValue(null);

  } else if (this.estadoCapitalSeleccionado === ''){
    console.error('Error al modificar el estado del capital');
  }else {
        // Si es apelado, limpio los de liquidación
        this.estadoLiquidacionCapitalSeleccionado = null;
        this.fechaLiquidacionCapital = null;
        this.montoLiquidacionCapital = null;
    
        this.form.get('estadoLiquidacionCapitalSeleccionado')?.setValue(null);
        this.form.get('fechaLiquidacionCapital')?.setValue(null);
        this.form.get('montoLiquidacionCapital')?.setValue(null);
  }
}

actualizarHonorario() {
  if (this.honorarioSeleccionado === 'Difiere regulacion 1º instancia') {
    this.estadoHonorariosSeleccionado = 'diferido';
    this.subEstadoHonorariosSeleccionado = 'diferido';
    this.estadoLiquidacionHonorariosSeleccionado = null;
    this.fechaLiquidacionHonorarios = null;
    //this.montoLiquidacionHonorarios = null;

    this.fechaHonorariosSubestado = null;


    // 🧹 Limpieza del formulario reactivo
    this.form.get('estadoHonorariosSeleccionado')?.setValue('diferido');
    this.form.get('subEstadoHonorariosSeleccionado')?.setValue('diferido');
    this.form.get('estadoLiquidacionHonorariosSeleccionado')?.setValue(null);
    this.form.get('fechaLiquidacionHonorarios')?.setValue(null);
    this.form.get('montoLiquidacionHonorarios')?.setValue(null);
    this.form.get('fechaHonorariosSubestado')?.setValue(null);


  } else {
    this.estadoHonorariosSeleccionado = null;
    this.subEstadoHonorariosSeleccionado = null;
    this.estadoLiquidacionHonorariosSeleccionado = null;
    this.fechaLiquidacionHonorarios = null;
    //this.montoLiquidacionHonorarios = null;

    this.fechaHonorariosSubestado = null;


    // 🧹 Limpieza del formulario reactivo
    this.form.get('estadoHonorariosSeleccionado')?.setValue(null);
    this.form.get('subEstadoHonorariosSeleccionado')?.setValue(null);
    this.form.get('estadoLiquidacionHonorariosSeleccionado')?.setValue(null);
    this.form.get('fechaLiquidacionHonorarios')?.setValue(null);
    this.form.get('montoLiquidacionHonorarios')?.setValue(null);
  }
}






actualizarEstadoDeLiquidacionCapital(){
  if(this.estadoLiquidacionCapitalSeleccionado != 'liquidacion practicada'){
    this.montoLiquidacionCapital = null;
  }

  if (this.estadoCapitalSeleccionado !== 'firme') {
    this.subEstadoCapitalSeleccionado == null;
    this.montoLiquidacionCapital = null;
    this.estadoLiquidacionCapitalSeleccionado = null;
    this.fechaLiquidacionHonorarios = null;

    this.form.get('montoLiquidacionHonorarios')?.setValue(null);
    this.form.get('fechaLiquidacionHonorarios')?.setValue(null);


  }
}





resetearCamposEstadoYHonorarios() {
  // Capital
  this.estadoCapitalSeleccionado = null;
  this.subEstadoCapitalSeleccionado = null;
  this.fechaCapitalSubestado = null;
  this.estadoLiquidacionCapitalSeleccionado = null;
  this.fechaLiquidacionCapital = null;
  this.montoLiquidacionCapital = null;

  // Honorarios
  this.estadoHonorariosSeleccionado = null;
  this.subEstadoHonorariosSeleccionado = null;
  this.fechaHonorariosSubestado = null;
  this.estadoLiquidacionHonorariosSeleccionado = null;
  this.fechaLiquidacionHonorarios = null;
  this.cantidadUMA =  0;
  //this.montoLiquidacionHonorarios = null;
}



public actualizarValidacionesCondicionales() {
  // Capital - Subestado
  const subEstadoCapital = this.form.get('subEstadoCapitalSeleccionado');
  const fechaCapitalSubestado = this.form.get('fechaCapitalSubestado');

  // Capital - Liquidación
  const estadoLiquidacionCapital = this.form.get('estadoLiquidacionCapitalSeleccionado');
  const fechaLiquidacionCapital = this.form.get('fechaLiquidacionCapital');
  const montoLiquidacionCapital = this.form.get('montoLiquidacionCapital');

  // Honorarios - Subestado
  const subEstadoHonorarios = this.form.get('subEstadoHonorariosSeleccionado');
  const fechaHonorariosSubestado = this.form.get('fechaHonorariosSubestado');

  // Honorarios - Liquidación
  const estadoLiquidacionHonorarios = this.form.get('estadoLiquidacionHonorariosSeleccionado');
  const fechaLiquidacionHonorarios = this.form.get('fechaLiquidacionHonorarios');
  const montoLiquidacionHonorarios = this.form.get('montoLiquidacionHonorarios');

  if (this.form.value.estadoCapitalSeleccionado === 'apelado' || this.form.value.estadoCapitalSeleccionado === 'pendiente') {
    subEstadoCapital?.setValidators([Validators.required]);
    fechaCapitalSubestado?.setValidators([Validators.required]);

    estadoLiquidacionCapital?.clearValidators();
    fechaLiquidacionCapital?.clearValidators();
    montoLiquidacionCapital?.clearValidators();

    this.form.get('estadoLiquidacionCapitalSeleccionado')?.setValue(null);
    this.form.get('fechaLiquidacionCapital')?.setValue(null);
    this.form.get('montoLiquidacionCapital')?.setValue(null);

    this.estadoLiquidacionCapitalSeleccionado = null;
    this.fechaLiquidacionCapital = null;
    this.montoLiquidacionCapital = null;


  } else {
    subEstadoCapital?.clearValidators();
    fechaCapitalSubestado?.clearValidators();


  }
  subEstadoCapital?.updateValueAndValidity();
  fechaCapitalSubestado?.updateValueAndValidity();



  if (this.form.value.estadoCapitalSeleccionado === 'firme') {
    estadoLiquidacionCapital?.setValidators([Validators.required]);
    fechaLiquidacionCapital?.setValidators([Validators.required]);

    subEstadoCapital?.clearValidators();
    fechaCapitalSubestado?.clearValidators();

    this.subEstadoCapitalSeleccionado = null;
    this.fechaCapitalSubestado = null;

    this.form.get('subEstadoCapital')?.setValue(null);
    this.form.get('fechaCapitalSubestado')?.setValue(null);
  } else {
    subEstadoCapital?.setValidators([Validators.required]);
    fechaCapitalSubestado?.setValidators([Validators.required]);

    estadoLiquidacionCapital?.clearValidators();
    fechaLiquidacionCapital?.clearValidators();
    //VER ACA
  }
  estadoLiquidacionCapital?.updateValueAndValidity();
  fechaLiquidacionCapital?.updateValueAndValidity();

  if (this.form.value.estadoLiquidacionCapitalSeleccionado === 'liquidacion practicada') {
    montoLiquidacionCapital?.setValidators([Validators.required]);
  } else {
    montoLiquidacionCapital?.clearValidators();
    //estadoLiquidacionCapital?.setValidators([Validators.required]);

  }
  montoLiquidacionCapital?.updateValueAndValidity();


//////////////////// honorarios
  if (this.form.value.estadoHonorariosSeleccionado === 'apelado' || this.form.value.estadoHonorariosSeleccionado === 'diferido' || 
    this.form.value.estadoHonorariosSeleccionado === 'pendiente'
  ) {
    subEstadoHonorarios?.setValidators([Validators.required]);
    fechaHonorariosSubestado?.setValidators([Validators.required]);

    estadoLiquidacionHonorarios?.clearValidators();
    fechaLiquidacionHonorarios?.clearValidators();
    //montoLiquidacionHonorarios?.clearValidators();

    this.estadoLiquidacionHonorariosSeleccionado = null;
    this.fechaLiquidacionHonorarios = null;
    //this.montoLiquidacionHonorarios = null;

    this.form.get('estadoLiquidacionHonorariosSeleccionado')?.setValue(null);
    this.form.get('fechaLiquidacionHonorarios')?.setValue(null);
    //this.form.get('montoLiquidacionHonorarios')?.setValue(null);

  } else {
    subEstadoHonorarios?.clearValidators();
    fechaHonorariosSubestado?.clearValidators();
  }
  subEstadoHonorarios?.updateValueAndValidity();
  fechaHonorariosSubestado?.updateValueAndValidity();



  if (this.form.value.estadoHonorariosSeleccionado === 'firme') {
    estadoLiquidacionHonorarios?.setValidators([Validators.required]);
    fechaLiquidacionHonorarios?.setValidators([Validators.required]);

    subEstadoHonorarios?.clearValidators();
    fechaHonorariosSubestado?.clearValidators();

    this.subEstadoHonorariosSeleccionado = null;
    this.fechaHonorariosSubestado = null;

      // Limpio también el formulario reactivo
  this.form.get('subEstadoHonorariosSeleccionado')?.setValue(null);
  this.form.get('fechaHonorariosSubestado')?.setValue(null);
  } else {
    estadoLiquidacionHonorarios?.clearValidators();
    fechaLiquidacionHonorarios?.clearValidators();
  }
  estadoLiquidacionHonorarios?.updateValueAndValidity();
  fechaLiquidacionHonorarios?.updateValueAndValidity();

  if (this.form.value.estadoLiquidacionHonorariosSeleccionado === 'liquidacion practicada') {
    //montoLiquidacionHonorarios?.setValidators([Validators.required]);
  } else {
    //montoLiquidacionHonorarios?.clearValidators();

    //this.montoLiquidacionHonorarios = null;
    //this.form.get('montoLiquidacionHonorarios')?.setValue(null); 
  }
  montoLiquidacionHonorarios?.updateValueAndValidity();

  montoLiquidacionHonorarios?.setValidators([Validators.required]);

}

    
/*
actualizarEstadoHonorario() {

  //console.log(this.montoLiquidacionCapital);
  if (this.estadoHonorariosSeleccionado === 'apelado') {
    // Si es apelado, limpio los de liquidación
    this.estadoLiquidacionHonorariosSeleccionado = null;
    this.fechaLiquidacionHonorarios = null;
    this.montoLiquidacionHonorarios = null;

    this.form.get('estadoLiquidacionHonorariosSeleccionado')?.setValue(null);
    this.form.get('fechaLiquidacionHonorarios')?.setValue(null);
    this.form.get('montoLiquidacionHonorarios')?.setValue(null);


  } else if (this.estadoHonorariosSeleccionado === 'firme') {
    // Si es firme, limpio los subestados de apelación
    this.subEstadoHonorariosSeleccionado = null;
    this.fechaHonorariosSubestado = null;

      // Limpio también el formulario reactivo
  this.form.get('subEstadoHonorariosSeleccionado')?.setValue(null);
  this.form.get('fechaHonorariosSubestado')?.setValue(null);


  } else if (this.estadoHonorariosSeleccionado === 'diferido'){

        // Si es apelado, limpio los de liquidación
        this.estadoLiquidacionHonorariosSeleccionado = null;
        this.fechaLiquidacionHonorarios = null;
        this.montoLiquidacionHonorarios = null;
    
        this.form.get('estadoLiquidacionHonorariosSeleccionado')?.setValue(null);
        this.form.get('fechaLiquidacionHonorarios')?.setValue(null);
        this.form.get('montoLiquidacionHonorarios')?.setValue(null);
  }else {
        // Si es apelado, limpio los de liquidación
        this.estadoLiquidacionHonorariosSeleccionado = null;
        this.fechaLiquidacionHonorarios = null;
        this.montoLiquidacionHonorarios = null;

        this.fechaLiquidacionHonorarios = null;
        this.montoLiquidacionHonorarios = null;

        this.form.get('estadoLiquidacionHonorariosSeleccionado')?.setValue(null);
        this.form.get('fechaLiquidacionHonorarios')?.setValue(null);
        this.form.get('montoLiquidacionHonorarios')?.setValue(null);
  }
}*/
/*
actualizarEstadoLiquidacionHonorarios(){
  if (this.estadoLiquidacionHonorariosSeleccionado !== 'liquidacion practicada') {
    this.montoLiquidacionHonorarios = null;


    this.form.get('montoLiquidacionHonorarios')?.setValue(null); 
  }

  if (this.estadoHonorariosSeleccionado !== 'firme') {
    this.subEstadoCapitalSeleccionado == null;
    this.montoLiquidacionHonorarios = null;
    this.estadoLiquidacionHonorariosSeleccionado = null;
    this.form.get('montoLiquidacionHonorarios')?.setValue(null);
  }
  
}*/
}

