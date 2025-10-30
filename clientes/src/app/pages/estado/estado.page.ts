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
import { MatCheckboxModule } from '@angular/material/checkbox';

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

import { UmaService } from 'src/app/services/uma.service';


@Component({
  selector: 'app-estado',
  templateUrl: './estado.page.html',
  styleUrls: ['./estado.page.scss'],
  standalone: true,
  imports: [FormsModule, IonItemSliding, IonList, IonContent, IonHeader, IonTitle, IonToolbar, IonInput, CommonModule, FormsModule,
        MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
        MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule,
        MatMenuModule, MatButtonModule, MatIconModule, MatSelectModule, ReactiveFormsModule,     
        MatFormFieldModule, MatInputModule, MatProgressSpinnerModule, MatCheckboxModule
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

  tipos: any[] = ['CCF', 'COM', 'CIV', 'CC'];
  tipoSeleccionado: any;
  juzgados: JuzgadoModel[] = [];
  juzgadoSeleccionado: any;
estados: any[] = [
  'Sorteado',
  'Inicio - Previo',
  'Inicio - Plantea Revocatoria',
  'Inicio - Da Cumplimiento',
  'Inicio - Solicita',
  'Inicio - Apela',
  'Inicio - Recusa',
  'Inicio - Plantea Nulidad',
  'Inicio - Se Eleve',
  'Traslado demanda - Se Ordena',

  'Traslado demanda - Cedula Confronte',
  'Traslado demanda - Cedula Liberada',
  'Traslado demanda - Cedula Notificada',
  'Traslado demanda - Cedula Sin Notificar',
  'Traslado demanda - Notificado',
  'Traslado demanda - Previo Rebeldia',

  'Contesta demanda - Traslado',
  'Contesta demanda - Cedula',
  'Contesta Traslado',

  'Se resuelva',

  'Apertura a Prueba - Solicita',
  'Apertura a Prueba - Cedula',
  'Apertura a Prueba - Audiencia 360',

  'Pruebas - Se provean',
  'Pruebas - Se provee',
  'Prueba - Cedula Perito',
  'Prueba - Cedula Parte',
  'Prueba - Oficio deox',
  'Prueba - Oficio acredita',
  'Prueba - Oficio solicita reiteratorio',
  'Prueba - Oficio solicita Astreinte',
  'Prueba - Testimonial hace saber',
  'Prueba - Acredita Testimonial',
  'Prueba - Desiste',
  'Prueba - Impugna',
  'Prueba - Se intime parte',
  'Prueba - Se intime perito',

  'Clausura periodo Prueba - Solicita',
  'Clausura periodo Prueba - Pase a certificar',

  'Alegatos - Solicita',
  'Alegatos - Cedula',
  'Alegatos - Presenta',

  'Fiscal - Solicita',
  'Fiscal - Cedula',
  'Fiscal - Previo',
  'Fiscal - Se ordena',
  'Fiscal - Contesta traslado',
  'Defensor Oficial - Solicita',
  'Defensor Oficial - Cedula',
  'Defensor Oficial - Ratifica lo actuado',
  
  'Sentencia - Previo',
  'Sentencia - Solicita',
  'Sentencia - Pasen autos a Sentencia',
  'Sentencia',
  'Archivo',
  'Caducidad'
];
  estadoSeleccionado: any;

  honorarios: any[] = ['Regulacion 1º instancia', 'Difiere regulacion 1º instancia', 'Costas por su orden'];
  honorarioSeleccionado: any = 'Regulacion 1º instancia';

  private destroy$ = new Subject<void>();
  
  valorUMA: number = 70709;
  cantidadUMA: number | null = null;
  montoUMA: number | null = null;

    uma: any[] = [];
    umaSeleccionado: any;
    compararUMA = (a: any, b: any) => a && b && a.valor === b.valor;


  apela: boolean = false;

  montoActual: number = 0;

  cargando: boolean = false;


ultimo_movimiento: string | null = null;
fecha_atencion: string | null = null;

// Capital
estadoCapitalSeleccionado: string | null = null;
subEstadoCapitalSeleccionado: string | null = null;
fechaCapitalSubestado: string | null = null;

montoLiquidacionCapital: number | null = null;

// Honorarios
estadoHonorariosSeleccionado: string | null = null;
subEstadoHonorariosSeleccionado: string | null = null;
fechaHonorariosSubestado: string | null = null;

sala: string | null = null;

deshabilitarApeladoOFirme = false;

honorariosExtrasSeleccionados: string[] = [];

estadosHonorariosExtras: { [tipo: string]: string } = {};
subestadosHonorariosExtras: { [tipo: string]: string } = {};
fechasHonorariosExtras: { [tipo: string]: string } = {}; 

estadosPorTipo: { [tipo: string]: string[] } = {
  alzada: ['apelado', 'firme'],
  ejecucion: ['pendiente', 'firme'],
  diferencia: ['diferido', 'firme']
};

subestadosPorTipo: { [tipo: string]: string[] } = {
  alzada: ['en sala', 'resuelto'],
  ejecucion: ['en tramite', 'finalizado'],
  diferencia: ['diferido por juez', 'esperando regulación']
};


  constructor(
    private router: Router,
    private expedienteService: ExpedientesService,
      private juezService: JuezService,
      private juzgadosService: JuzgadosService,
      private umaService: UmaService
    ) {
  
      this.resetearCamposEstadoYHonorarios();

      this.form = new FormGroup(
        {
          honorario: new FormControl('', [Validators.required]),
          fecha_sentencia: new FormControl('', [Validators.required/*, this.fechaMayorA("2024-09-23")*/]),
          juez: new FormControl('', [Validators.required]),
          //monto: new FormControl('', [Validators.required]),
          tipo: new FormControl(''),

          ultimo_movimiento: new FormControl('', [Validators.required]),

          // Capital
          estadoCapitalSeleccionado: new FormControl('', [Validators.required]),
          subEstadoCapitalSeleccionado: new FormControl('', [Validators.required]),
          fechaCapitalSubestado: new FormControl('', [Validators.required]),

          montoLiquidacionCapital: new FormControl(''),

          // Honorarios
          estadoHonorariosSeleccionado: new FormControl('', [Validators.required]),
          subEstadoHonorariosSeleccionado: new FormControl('', [Validators.required]),
          fechaHonorariosSubestado: new FormControl('', [Validators.required]),

          cantidadUMA: new FormControl(''),
          umaSeleccionado: new FormControl(null, Validators.required),
          sala: new FormControl(''),
          montoAcuerdo: new FormControl(''),
          fecha_atencion: new FormControl(''),

          honorariosExtrasSeleccionados: new FormControl([]),  

          // Alzada
          estado_alzada: new FormControl(''),
          subestado_alzada: new FormControl(''),
          fecha_alzada: new FormControl(''),
          uma_alzada: new FormControl(''),
          valorUMA_alzada: new FormControl(''),

          // Ejecución
          estado_ejecucion: new FormControl(''),
          subestado_ejecucion: new FormControl(''),
          fecha_ejecucion: new FormControl(''),
          uma_ejecucion: new FormControl(''),
          valorUMA_ejecucion: new FormControl(''),
          monto_ejecucion: new FormControl(''),

          // Diferencia
          estado_diferencia: new FormControl(''),
          subestado_diferencia: new FormControl(''),
          fecha_diferencia: new FormControl(''),
          monto_diferencia: new FormControl(''),



        }
      );    


      this.form.get('honorario')?.valueChanges.subscribe((valorSeleccionado) => {
        this.actualizarMonto(valorSeleccionado);
      });

      this.cargarJueces();
      this.cargarJuzgados();
      this.cargarUma();
    }

    ngOnInit() {
      if (!this.form) {
        console.error("El formulario no está inicializado.");
        return;
      }else{
        this.montoActual = this.form.value.monto;

      }

    }

  //calcula los valores para el uma meiante cantidad de uma y valor de uma
  /*calcularMontoUMA() {
    const cantidadUMA = this.form.get('cantidadUMA')?.value;
    const umaSeleccionado = this.form.get('umaSeleccionado')?.value;
    const montoUMA = this.form.get('montoAcuerdo')?.value;

    this.umaSeleccionado  = umaSeleccionado;
    console.log(umaSeleccionado);

    if (cantidadUMA && umaSeleccionado != 'acuerdo') {
    this.montoUMA = umaSeleccionado.valor * cantidadUMA;
    this.form.get('montoAcuerdo')?.clearValidators();
      this.form.get('montoAcuerdo')?.updateValueAndValidity();

    this.form.get('cantidadUMA')?.setValidators([Validators.required]);
    this.form.get('cantidadUMA')?.updateValueAndValidity();
  } else {
    // Está en 'acuerdo'
    //this.form.get('cantidadUMA')?.setValue(null);
    this.cantidadUMA = null;
    this.form.get('cantidadUMA')?.clearValidators();
    this.form.get('cantidadUMA')?.updateValueAndValidity();

    this.form.get('montoAcuerdo')?.setValidators([Validators.required]);
    this.form.get('montoAcuerdo')?.updateValueAndValidity();

    this.montoUMA = montoUMA;
  }

  }*/

  calcularMontoUMA() {
  const umaSel = this.form.get('umaSeleccionado')?.value;          // objeto UMA o 'acuerdo'
  const cantRaw = this.form.get('cantidadUMA')?.value;
  const cant = (cantRaw === '' || cantRaw === null || cantRaw === undefined) ? null : Number(cantRaw);
  const montoAcuerdo = this.form.get('montoAcuerdo')?.value;

  this.umaSeleccionado = umaSel;

  // Caso UMA seleccionado (no 'acuerdo')
  if (umaSel && umaSel !== 'acuerdo') {
    // cantidadUMA es requerida (0 permitido)
    this.form.get('cantidadUMA')?.setValidators([Validators.required, Validators.min(0)]);
    this.form.get('cantidadUMA')?.updateValueAndValidity();

    this.form.get('montoAcuerdo')?.clearValidators();
    this.form.get('montoAcuerdo')?.updateValueAndValidity();

    const valorUMA = Number(umaSel.valor ?? 0);
    // Si cant es null => no calculo; si es 0 => monto 0 (válido)
    this.montoUMA = (cant === null || isNaN(cant)) ? null : (valorUMA * cant);

  } else { // Caso 'acuerdo'
    this.form.get('cantidadUMA')?.clearValidators();
    this.form.get('cantidadUMA')?.updateValueAndValidity();

    this.form.get('montoAcuerdo')?.setValidators([Validators.required, Validators.min(0)]);
    this.form.get('montoAcuerdo')?.updateValueAndValidity();

    this.montoUMA = (montoAcuerdo === '' || montoAcuerdo === null || montoAcuerdo === undefined)
      ? null
      : Number(montoAcuerdo);
  }
}
cambioTipoHonorarioExtra(valores: string[]) {
  this.honorariosExtrasSeleccionados = valores;

  const todosTipos = ['alzada', 'ejecucion', 'diferencia'];

  todosTipos.forEach(tipo => {
    const estadoControl = this.form.get(`estado_${tipo}`);
    const subestadoControl = this.form.get(`subestado_${tipo}`);

    if (valores.includes(tipo)) {
      estadoControl?.setValidators(Validators.required);
      subestadoControl?.setValidators(Validators.required);
    } else {
      estadoControl?.clearValidators();
      subestadoControl?.clearValidators();
      estadoControl?.setValue('');
      subestadoControl?.setValue('');
    }

    estadoControl?.updateValueAndValidity();
    subestadoControl?.updateValueAndValidity();
  });
}






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
      montoLiquidacionCapital: null,
    
      // Honorarios
      estadoHonorariosSeleccionado: null,
      subEstadoHonorariosSeleccionado: null,
      fechaHonorariosSubestado: null,
      cantidadUMA: null,

    });
    
    
    this.router.navigate([path]); 
  }

  //busca un expediente por los campos solicitados (numero, año y tipo de juzgado)
  buscar() {
  const tipo = this.form.value.tipo;

  if (!this.numero || !this.anio || !tipo) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "error",
      title: "Complete todos los campos",
      showConfirmButton: false,
      timer: 1500
    });
    return;  // 🚨 No manda nada si falta algo
  }

  console.log(tipo);
  this.expedienteService.getClientePorNumeroYAnio(this.numero, this.anio, tipo).subscribe(
    (expedientes) => {
      if (!expedientes || expedientes.length === 0) {
        console.error("No se encontraron expedientes con ese número y año.");
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "error",
          title: "No se encontró un expediente",
          showConfirmButton: false,
          timer: 1500
        });
      } else {
        console.log("Expedientes encontrados:", expedientes);
        this.expediente = expedientes[0]; 
         
        this.juzgadosService.getJuzgadoPorId(this.expediente.juzgado_id).subscribe(juzgado => {
          this.expediente.juzgadoModel = juzgado;

        });
          

        this.menu = '2';
        this.estadoSeleccionado = this.expediente.estado;
        this.llenarFormularioConExpediente(this.expediente);
        this.asignarDatos();
        this.calcularMontoUMA();
        //this.actualizarCobrado();
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
        title: "Error en la búsqueda",
        showConfirmButton: false,
        timer: 1500
      });
    }
  );
}

  //Cambia de menu cuando el usuario encuentra un expediente para los datos ingresados
  cambiarMenu(menu: string){
    this.juzgadoSeleccionado = null;
    this.numero = '';
    this.anio = '';
    this.menu = menu;
  }

  //Carga los jueces
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

    // Carga los valores del UMA
    cargarUma() {
      this.umaService.getUMA()
        .pipe(takeUntil(this.destroy$)) 
        .subscribe(
          (uma) => {
            this.uma = uma;
            //this.umaSeleccionado = uma[0];
          },
          (error) => {
            console.error('Error al obtener UMA:', error);
          }
        );
    }

    // Carga los juzgados
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
        { nombre: 'Último Movimiento', control: 'ultimo_movimiento' },
        { nombre: 'tipo', control: 'tipo' },

        // Capital
        { nombre: 'Estado del Capital', control: 'estadoCapitalSeleccionado' },
        { nombre: 'Subestado Capital', control: 'subEstadoCapitalSeleccionado' },
        { nombre: 'Fecha Subestado Capital', control: 'fechaCapitalSubestado' },
        { nombre: 'Monto de Liquidación de Capital', control: 'montoLiquidacionCapital' },
    
        // Honorarios
        { nombre: 'Estado de Honorarios', control: 'estadoHonorariosSeleccionado' },
        { nombre: 'Subestado Honorarios', control: 'subEstadoHonorariosSeleccionado' },
        { nombre: 'Fecha Subestado Honorarios', control: 'fechaHonorariosSubestado' },
        { nombre: 'Cantidad UMA', control: 'cantidadUMA' },
        { nombre: 'Ultimo movimiento', control: 'ultimo_movimiento' },
        { nombre: 'Sala', control: 'sala' },

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



        if (this.estadoSeleccionado == 'Sentencia') {
          const hoy = new Date().toISOString().split('T')[0];
        this.actualizarCobrado();

        if(!this.validarEjecucion()){
            Swal.fire({
              icon: 'warning',
              title: 'Faltan completar la ejecución',
              confirmButtonText: 'Entendido',
            });
            return;
        }



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
      
        const esSentencia = this.estadoSeleccionado === 'Sentencia';

        let fechaReciente: Date | null = null;
        const fechaSentencia = this.form.value.fecha_sentencia ? new Date(this.form.value.fecha_sentencia) : null;
        const fechaCapital = this.fechaCapitalSubestado ? new Date(this.fechaCapitalSubestado) : null;
        const fechaHonorarios = this.fechaHonorariosSubestado ? new Date(this.fechaHonorariosSubestado) : null;
      
        [fechaSentencia, fechaCapital, fechaHonorarios].forEach((f) => {
          if (f && (!fechaReciente || f > fechaReciente)) {
            fechaReciente = f;
          }
        });

        this.actualizarCobrado();
        const faltantes = this.obtenerCamposRequeridos();
        console.log(faltantes); // ['Honorario', 'Fecha de sentencia', ...]
      
        const ultimoMovimientoCalculado = this.form.value.ultimo_movimiento?.trim() !== ''
          ? this.form.value.ultimo_movimiento
          : fechaReciente ?? null;
      
        if ((this.form.valid && esSentencia) || (!esSentencia)) {
          const expediente: ExpedienteModel = {
            id: this.expediente?.id ?? '0',
            titulo: '',
            descripcion: '',
            fecha_creacion: this.expediente?.fecha_creacion ?? '',
            clientes: this.expediente?.clientes ?? null,
            demandados: this.expediente?.demandados,

            juzgado_id: this.expediente?.juzgado_id ?? null,
            demandado_id: this.expediente?.demandado_id ?? null,
            numero: this.expediente.numero,
            anio: this.expediente.anio,
            demandadoModel: this.expediente.demandadoModel,
            estado: this.estadoSeleccionado,
            sala_radicacion: null,
            honorario: esSentencia && this.form.value.honorario?.trim() !== '' ? this.form.value.honorario : null,
            fecha_inicio: this.expediente?.fecha_inicio,
            fecha_sentencia: esSentencia && this.form.value.fecha_sentencia ? this.form.value.fecha_sentencia : null,
            hora_sentencia: null,
            juez_id: esSentencia && this.juezSeleccionado ? this.juezSeleccionado.id : null,
            juezModel: { id: '', nombre: '', apellido: '', estado: '' },
            juicio: this.expediente?.juicio,
            ultimo_movimiento: this.form.value.ultimo_movimiento,
            monto: null,
            apela: esSentencia ? this.apela : null,
            juzgadoModel: null,
            usuario_id: this.expediente.usuario_id,
            porcentaje: this.expediente?.porcentaje,
            fecha_cobro: this.expediente?.fecha_cobro ?? null,
            fecha_cobro_capital: this.expediente?.fecha_cobro_capital ?? null,

            valorUMA: this.form.get('umaSeleccionado')?.value?.valor,
            procurador_id:  this.expediente.procurador_id,
            sala: this.sala,
            requiere_atencion: this.form.value.requiere_atencion,
            fecha_atencion: this.form.value.fecha_atencion ?? null,

            // Capital
            estadoCapitalSeleccionado: esSentencia ? this.estadoCapitalSeleccionado ?? null : null,
            subEstadoCapitalSeleccionado: esSentencia ? this.subEstadoCapitalSeleccionado ?? null : null,
            fechaCapitalSubestado: esSentencia ? this.fechaCapitalSubestado ?? null : null,
            estadoLiquidacionCapitalSeleccionado: null,
            fechaLiquidacionCapital: null,
            montoLiquidacionCapital: esSentencia ? this.montoLiquidacionCapital ?? null : null,
            capitalCobrado: this.expediente?.capitalCobrado,
      
            // Honorarios
            estadoHonorariosSeleccionado: esSentencia ? this.estadoHonorariosSeleccionado ?? null : null,
            subEstadoHonorariosSeleccionado: esSentencia ? this.subEstadoHonorariosSeleccionado ?? null : null,
            fechaHonorariosSubestado: esSentencia ? this.fechaHonorariosSubestado ?? null : null,
            estadoLiquidacionHonorariosSeleccionado: null,
            fechaLiquidacionHonorarios: null,
            montoLiquidacionHonorarios: esSentencia ? this.montoUMA ?? null : null,
            honorarioCobrado: this.expediente?.honorarioCobrado,
            cantidadUMA: esSentencia ? this.cantidadUMA ?? null : null,

            numeroCliente: this.expediente?.numeroCliente ??  null,
            minutosSinLuz: this.expediente?.minutosSinLuz ??  null,
            periodoCorte: this.expediente?.periodoCorte ??  null,

            // ALZADA
            estadoHonorariosAlzadaSeleccionado: this.expediente.estadoHonorariosAlzadaSeleccionado ?? null,
            subEstadoHonorariosAlzadaSeleccionado: this.expediente.subEstadoHonorariosAlzadaSeleccionado ?? null,
            fechaHonorariosAlzada: this.expediente.fechaHonorariosAlzada ?? null,
            umaSeleccionado_alzada: this.expediente.umaSeleccionado_alzada ?? null,
            cantidadUMA_alzada: this.expediente.cantidadUMA_alzada ?? null,
            montoAcuerdo_alzada: this.expediente.montoAcuerdo_alzada ?? null,

            // EJECUCIÓN
            estadoHonorariosEjecucionSeleccionado: this.expediente.estadoHonorariosEjecucionSeleccionado ?? null,
            subEstadoHonorariosEjecucionSeleccionado: this.expediente.subEstadoHonorariosEjecucionSeleccionado ?? null,
            fechaHonorariosEjecucion: this.expediente.fechaHonorariosEjecucion ?? null,
            umaSeleccionado_ejecucion: this.expediente?.umaSeleccionado_ejecucion ?? null,
            cantidadUMA_ejecucion: this.expediente?.cantidadUMA_ejecucion ?? null,
            montoHonorariosEjecucion: this.expediente.montoHonorariosEjecucion ?? null,

            // DIFERENCIA
            estadoHonorariosDiferenciaSeleccionado: this.expediente.estadoHonorariosDiferenciaSeleccionado ?? null,
            subEstadoHonorariosDiferenciaSeleccionado: this.expediente.subEstadoHonorariosDiferenciaSeleccionado ?? null,
            fechaHonorariosDiferencia: this.expediente.fechaHonorariosDiferencia ?? null,
            montoHonorariosDiferencia: this.expediente.montoHonorariosDiferencia ?? null,

            honorarioAlzadaCobrado: this.expediente?.honorarioAlzadaCobrado ?? null,
            fechaCobroAlzada: this.expediente?.fechaCobroAlzada ?? null,

            honorarioEjecucionCobrado: this.expediente?.honorarioEjecucionCobrado ?? null,
            fechaCobroEjecucion: this.expediente?.fechaCobroEjecucion ?? null,

            honorarioDiferenciaCobrado: this.expediente?.honorarioDiferenciaCobrado ?? null,
            fechaCobroDiferencia: this.expediente?.fechaCobroDiferencia ?? null,
            capitalPagoParcial: this.expediente?.capitalPagoParcial,
            recalcular_caratula: false,
            esPagoParcial: this.expediente?.esPagoParcial

          };
      
          console.log('EXPEDIENTE: ', expediente);
          this.expedienteService.deleteClienteExpedientePorId(expediente.id).subscribe({
            next: () => console.log('Clientes eliminados correctamente'),
            error: err => console.error('Error al eliminar clientes:', err),
          });
      
          this.expedienteService.actualizarExpediente(expediente.id, expediente).subscribe({
            next: response => {
              console.log('Expediente actualizado:', response);
              this.menu = '1';
              this.form.reset();
            },
            error: error => {
              console.error('Error al actualizar expediente:', error);
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Error al actualizar expediente",
                text: error?.error?.message || 'Error inesperado del servidor',
              });
            }
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
        return true;
      }
      
      /*Valida si el caracter ingresado es numerico*/
      validateNumber(event: KeyboardEvent) {
        const char = event.key;
        if (!/[0-9]/.test(char) && char !== 'Backspace' && char !== 'Delete' && char !== 'ArrowLeft' && char !== 'ArrowRight') {
          event.preventDefault();
        }
      }
      /* Valida lo que el usuario pega*/
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

        
 //ver       
asignarDatos() {

  this.montoUMA = this.expediente.montoLiquidacionHonorarios;
  // Honorario
  if (this.expediente.honorario != null) {
    this.honorarioSeleccionado = this.expediente.honorario;
  } else {
    this.honorarioSeleccionado = 'Regulacion 1º instancia';
  }

  // Fecha sentencia
  const fecha_sentencia = this.expediente.fecha_sentencia;
  const fechaSentenciaFormateada = fecha_sentencia
    ? new Date(fecha_sentencia).toISOString().split('T')[0]
    : null;

  // Juez
  if (this.expediente.juez_id) {
    const juezEncontrado = this.jueces.find(juez => juez.id === this.expediente.juez_id);
    if (juezEncontrado) this.juezSeleccionado = juezEncontrado;
  }

  this.ultimo_movimiento = this.expediente.ultimo_movimiento
    ? new Date(this.expediente.ultimo_movimiento).toISOString().split('T')[0]
    : null;

      this.fecha_atencion = this.expediente.fecha_atencion
    ? new Date(this.expediente.fecha_atencion).toISOString().split('T')[0]
    : null;

  // Capital
  this.estadoCapitalSeleccionado = this.expediente.estadoCapitalSeleccionado ?? null;
  this.subEstadoCapitalSeleccionado = this.expediente.subEstadoCapitalSeleccionado ?? null;
  this.fechaCapitalSubestado = this.expediente.fechaCapitalSubestado
    ? new Date(this.expediente.fechaCapitalSubestado).toISOString().split('T')[0]
    : null;
  this.montoLiquidacionCapital = this.expediente.montoLiquidacionCapital ?? null;

  // Honorarios
  this.estadoHonorariosSeleccionado = this.expediente.estadoHonorariosSeleccionado ?? null;
  this.subEstadoHonorariosSeleccionado = this.expediente.subEstadoHonorariosSeleccionado ?? null;
  this.fechaHonorariosSubestado = this.expediente.fechaHonorariosSubestado
    ? new Date(this.expediente.fechaHonorariosSubestado).toISOString().split('T')[0]
    : null;
  this.cantidadUMA = this.expediente.cantidadUMA ?? 0;

  // Tipo (Juzgado)
  this.tipoSeleccionado = this.expediente.tipo ?? null;

  this.sala = this.expediente.sala ?? null;

  // Seteo del formulario
  this.form.setValue({
    honorario: this.honorarioSeleccionado,
    fecha_sentencia: fechaSentenciaFormateada,
    juez: this.juezSeleccionado,
    ultimo_movimiento: this.ultimo_movimiento,
    tipo: this.tipoSeleccionado,

    estadoCapitalSeleccionado: this.estadoCapitalSeleccionado,
    subEstadoCapitalSeleccionado: this.subEstadoCapitalSeleccionado,
    fechaCapitalSubestado: this.fechaCapitalSubestado,
    montoLiquidacionCapital: this.montoLiquidacionCapital,

    estadoHonorariosSeleccionado: this.estadoHonorariosSeleccionado,
    subEstadoHonorariosSeleccionado: this.subEstadoHonorariosSeleccionado,
    fechaHonorariosSubestado: this.fechaHonorariosSubestado,
    cantidadUMA: this.cantidadUMA,
    sala: this.sala,
    requiere_atencion: this.expediente.requiere_atencion,
    fecha_atencion: this.expediente.fecha_atencion ?? null,

  });

  // Validaciones
  Object.keys(this.form.controls).forEach(field => {
    const control = this.form.get(field);
    control?.markAsTouched({ onlySelf: true });
    control?.updateValueAndValidity();
  });

  this.actualizarValidacionesCondicionales();
}

//esta bien
resetearCamposEstadoYHonorarios() {
  // Capital
  this.estadoCapitalSeleccionado = null;
  this.subEstadoCapitalSeleccionado = null;
  this.fechaCapitalSubestado = null;
  this.montoLiquidacionCapital = null;

  // Honorarios
  this.estadoHonorariosSeleccionado = null;
  this.subEstadoHonorariosSeleccionado = null;
  this.fechaHonorariosSubestado = null;
  this.cantidadUMA =  0;
}

//esta bien
actualizarHonorario() {
  if (this.honorarioSeleccionado === 'Difiere regulacion 1º instancia') {
    this.estadoHonorariosSeleccionado = 'diferido';
    this.subEstadoHonorariosSeleccionado = 'diferido';

    this.form.get('estadoHonorariosSeleccionado')?.setValue('diferido');
    this.form.get('subEstadoHonorariosSeleccionado')?.setValue('diferido');
  } else {
    this.estadoHonorariosSeleccionado = null;
    this.subEstadoHonorariosSeleccionado = null;

    this.form.get('estadoHonorariosSeleccionado')?.setValue(null);
    this.form.get('subEstadoHonorariosSeleccionado')?.setValue(null);
  }
}

//ver
public actualizarValidacionesCondicionales() {
  
  const subEstadoCapital = this.form.get('subEstadoCapitalSeleccionado');
  const fechaCapitalSubestado = this.form.get('fechaCapitalSubestado');
  const montoLiquidacionCapital = this.form.get('montoLiquidacionCapital');
  const subEstadoHonorarios = this.form.get('subEstadoHonorariosSeleccionado');
  const fechaHonorariosSubestado = this.form.get('fechaHonorariosSubestado');
  const requiereAtencionValor = this.form.get('requiere_atencion')?.value;
  const fechaAtencion = this.form.get('fecha_atencion');
  const sala = this.form.get('sala');

  console.log(this.expediente.juzgadoModel.tipo);
  if(this.expediente.juzgadoModel.tipo == 'CCF' || this.expediente.juzgadoModel.tipo == 'COM'){
    sala?.clearValidators();

    sala?.setValidators([Validators.required]);
  }else{
    sala?.clearValidators();

  }

if (requiereAtencionValor == true) {
  fechaAtencion?.setValidators([Validators.required]);
} else {
  fechaAtencion?.clearValidators();
  fechaAtencion?.setValue(null);
}
fechaAtencion?.updateValueAndValidity();


  // Capital
  if (this.estadoCapitalSeleccionado === 'firme' || this.expediente.estadoCapitalSeleccionado === 'firme') {
    subEstadoCapital?.clearValidators();
    fechaCapitalSubestado?.clearValidators();

    subEstadoCapital?.setValidators([Validators.required]);
    fechaCapitalSubestado?.setValidators([Validators.required]);
    if (this.subEstadoCapitalSeleccionado === 'liquidacion practicada' || this.expediente.subEstadoCapitalSeleccionado === 'firme') {
      montoLiquidacionCapital?.setValidators([Validators.required]);
    } else {
      montoLiquidacionCapital?.clearValidators();
    }

    if (this.subEstadoCapitalSeleccionado === 'embargo ejecutado') {

    }
  } else {
    subEstadoCapital?.setValidators([Validators.required]);
    fechaCapitalSubestado?.setValidators([Validators.required]);
    montoLiquidacionCapital?.clearValidators();
  }

  subEstadoCapital?.updateValueAndValidity();
  fechaCapitalSubestado?.updateValueAndValidity();
  montoLiquidacionCapital?.updateValueAndValidity();

  // Honorarios
  subEstadoHonorarios?.setValidators([Validators.required]);
  fechaHonorariosSubestado?.setValidators([Validators.required]);

  subEstadoHonorarios?.updateValueAndValidity();
  fechaHonorariosSubestado?.updateValueAndValidity();

  // Asegurarse que los updates se ejecuten
Object.keys(this.form.controls).forEach((campo) => {
  this.form.get(campo)?.updateValueAndValidity();
});
}
//esta bien
actualizarCobrado() {
  // CAPITAL COBRADO
  if (this.expediente.capitalCobrado) {
    const estadoCapital = this.form.get('estadoCapitalSeleccionado');
    const subEstadoCapital = this.form.get('subEstadoCapitalSeleccionado');
    const fechaCapital = this.form.get('fechaCapitalSubestado');
    const montoCapital = this.form.get('montoLiquidacionCapital');

    estadoCapital?.clearValidators();  
    subEstadoCapital?.clearValidators();
    fechaCapital?.clearValidators();
    montoCapital?.clearValidators();

    estadoCapital?.updateValueAndValidity();
    subEstadoCapital?.updateValueAndValidity();
    fechaCapital?.updateValueAndValidity();
    montoCapital?.updateValueAndValidity();
  }

  // HONORARIO COBRADO
  if (this.expediente.honorarioCobrado) {
    const estadoHonorarios = this.form.get('estadoHonorariosSeleccionado');
    const subEstadoHonorarios = this.form.get('subEstadoHonorariosSeleccionado');
    const fechaHonorarios = this.form.get('fechaHonorariosSubestado');
    const cantidadUMA = this.form.get('cantidadUMA');
    const montoAcuerdo = this.form.get('montoAcuerdo');
    const valorUMA = this.form.get('valorUMA');
    const umaSeleccionado = this.form.get('umaSeleccionado');

    estadoHonorarios?.clearValidators();
    subEstadoHonorarios?.clearValidators();
    fechaHonorarios?.clearValidators();
    cantidadUMA?.clearValidators();
    montoAcuerdo?.clearValidators();
    valorUMA?.clearValidators();
    umaSeleccionado?.clearValidators();

    estadoHonorarios?.updateValueAndValidity();
    subEstadoHonorarios?.updateValueAndValidity();
    fechaHonorarios?.updateValueAndValidity();
    cantidadUMA?.updateValueAndValidity();

    montoAcuerdo?.updateValueAndValidity();
    valorUMA?.updateValueAndValidity();
    umaSeleccionado?.updateValueAndValidity();

    this.form.get('umaSeleccionado')?.clearValidators();
    this.form.get('umaSeleccionado')?.updateValueAndValidity();


  }
}
//esta bien
/*
public obtenerCamposRequeridos(): string[] {
  const camposFaltantes: string[] = [];

  Object.keys(this.form.controls).forEach((clave) => {
    const control = this.form.get(clave);

    if (control && control.hasValidator(Validators.required) && control.invalid) {
      const campoLegible = this.convertirNombreCampo(clave);
      camposFaltantes.push(campoLegible);
    }
  });

  return camposFaltantes;
}*/
public obtenerCamposRequeridos(): string[] {
  const camposFaltantes: string[] = [];

  Object.keys(this.form.controls).forEach((clave) => {
    const control = this.form.get(clave);

    if (control && control.hasValidator(Validators.required) && control.invalid) {
      let campoLegible = this.convertirNombreCampo(clave);

      // Si es estado/subestado dinámico de honorarios extra
      if (clave.startsWith('estado_')) {
        const tipo = clave.split('_')[1];
        campoLegible = `Estado - ${this.obtenerNombreHonorario(tipo)}`;
      } else if (clave.startsWith('subestado_')) {
        const tipo = clave.split('_')[1];
        campoLegible = `Subestado - ${this.obtenerNombreHonorario(tipo)}`;
      }

      camposFaltantes.push(campoLegible);
    }
  });

  return camposFaltantes;
}

// esta bien
private convertirNombreCampo(nombre: string): string {
  const mapa: { [clave: string]: string } = {
    honorario: 'Honorario',
    fecha_sentencia: 'Fecha de sentencia',
    juez: 'Juez',
    ultimo_movimiento: 'Último movimiento',
    tipo: 'Tipo de juzgado',
    estadoCapitalSeleccionado: 'Estado del Capital',
    subEstadoCapitalSeleccionado: 'Subestado del Capital',
    fechaCapitalSubestado: 'Fecha Subestado Capital',
    montoLiquidacionCapital: 'Monto Capital',
    estadoHonorariosSeleccionado: 'Estado de Honorarios',
    subEstadoHonorariosSeleccionado: 'Subestado de Honorarios',
    fechaHonorariosSubestado: 'Fecha Subestado Honorarios',
    cantidadUMA: 'Cantidad UMA',
    requiere_atencion: 'Requiere atención',
    fecha_atencion: 'Fecha de atención'
  };

  return mapa[nombre] || nombre;
}

private obtenerNombreHonorario(tipo: string): string {
  switch (tipo) {
    case 'alzada': return 'Alzada';
    case 'ejecucion': return 'Ejecución';
    case 'diferencia': return 'Diferencia';
    case 'primera_instancia': return 'Primera Instancia';
    default: return tipo;
  }
}

//esta bien
/*
private llenarFormularioConExpediente(expediente: ExpedienteModel) {
  // 1. Buscás el UMA correspondiente
  const encontradaUMA = this.uma.find(u => u.valor == expediente.valorUMA) ?? null;

  // 2. Construís el objeto de valores a parchar
  const valores: any = {
    honorario: expediente.honorario ?? '',
    fecha_sentencia: expediente.fecha_sentencia
      ? new Date(expediente.fecha_sentencia).toISOString().split('T')[0]
      : '',
    juez: this.jueces.find(j => j.id === expediente.juez_id) ?? null,
    //tipo: expediente.tipo ?? '',
    ultimo_movimiento: expediente.ultimo_movimiento
      ? new Date(expediente.ultimo_movimiento).toISOString().split('T')[0]
      : '',
    estadoCapitalSeleccionado: expediente.estadoCapitalSeleccionado ?? '',
    subEstadoCapitalSeleccionado: expediente.subEstadoCapitalSeleccionado ?? '',
    fechaCapitalSubestado: expediente.fechaCapitalSubestado
      ? new Date(expediente.fechaCapitalSubestado).toISOString().split('T')[0]
      : '',
    montoLiquidacionCapital: expediente.montoLiquidacionCapital ?? '',
    estadoHonorariosSeleccionado: expediente.estadoHonorariosSeleccionado ?? '',
    subEstadoHonorariosSeleccionado: expediente.subEstadoHonorariosSeleccionado ?? '',
    fechaHonorariosSubestado: expediente.fechaHonorariosSubestado
      ? new Date(expediente.fechaHonorariosSubestado).toISOString().split('T')[0]
      : '',
    cantidadUMA: expediente.cantidadUMA ?? '',
    umaSeleccionado: encontradaUMA,
    requiere_atencion: this.expediente.requiere_atencion,
fecha_atencion: expediente.fecha_atencion
  ? new Date(expediente.fecha_atencion).toISOString().split('T')[0]
  : '',


  };

  // 3. Parcheás todo el form de golpe
  this.form.patchValue(valores);

  // 4. Si querés marcar como touched sólo los que vienen con valor:
  Object.entries(valores).forEach(([key, value]) => {
    const control = this.form.get(key);
    if (control && value !== null && value !== '' && value !== undefined) {
      control.markAsTouched();
      control.markAsDirty();
    }
  });

  // 5. Y refrescás las validaciones condicionales
  //this.actualizarValidacionesCondicionales();
}*/
private llenarFormularioConExpediente(expediente: ExpedienteModel) {
  const encontradaUMA = this.uma.find(u => u.valor == expediente.valorUMA) ?? null;

  const valores: any = {
    honorario: expediente.honorario ?? '',
    fecha_sentencia: expediente.fecha_sentencia
      ? new Date(expediente.fecha_sentencia).toISOString().split('T')[0]
      : '',
    juez: this.jueces.find(j => j.id === expediente.juez_id) ?? null,
    ultimo_movimiento: expediente.ultimo_movimiento
      ? new Date(expediente.ultimo_movimiento).toISOString().split('T')[0]
      : '',
    estadoCapitalSeleccionado: expediente.estadoCapitalSeleccionado ?? '',
    subEstadoCapitalSeleccionado: expediente.subEstadoCapitalSeleccionado ?? '',
    fechaCapitalSubestado: expediente.fechaCapitalSubestado
      ? new Date(expediente.fechaCapitalSubestado).toISOString().split('T')[0]
      : '',
    montoLiquidacionCapital: expediente.montoLiquidacionCapital ?? '',
    estadoHonorariosSeleccionado: expediente.estadoHonorariosSeleccionado ?? '',
    subEstadoHonorariosSeleccionado: expediente.subEstadoHonorariosSeleccionado ?? '',
    fechaHonorariosSubestado: expediente.fechaHonorariosSubestado
      ? new Date(expediente.fechaHonorariosSubestado).toISOString().split('T')[0]
      : '',
    cantidadUMA: expediente.cantidadUMA ?? '',
    umaSeleccionado: encontradaUMA,
    requiere_atencion: this.expediente.requiere_atencion,
    fecha_atencion: expediente.fecha_atencion
      ? new Date(expediente.fecha_atencion).toISOString().split('T')[0]
      : '',
  };

  // Carga de tipos extras (ej. alzada)
  const tiposExtras = [
    { tipo: 'alzada', estado: expediente.estadoHonorariosAlzadaSeleccionado, subestado: expediente.subEstadoHonorariosAlzadaSeleccionado, fecha: expediente.fechaHonorariosAlzada }
    // podés agregar los demás tipos luego
  ];

  tiposExtras.forEach(({ tipo, estado, subestado, fecha }) => {
    if (estado || subestado || fecha) {
      this.honorariosExtrasSeleccionados.push(tipo);
      this.estadosHonorariosExtras[tipo] = estado ?? '';
      this.subestadosHonorariosExtras[tipo] = subestado ?? '';
      this.fechasHonorariosExtras[tipo] = fecha
        ? new Date(fecha).toISOString().split('T')[0]
        : '';

      this.form.addControl(`estado_${tipo}`, new FormControl(estado ?? '', Validators.required));
      this.form.addControl(`subestado_${tipo}`, new FormControl(subestado ?? '', Validators.required));
      this.form.addControl(`fecha_${tipo}`, new FormControl(this.fechasHonorariosExtras[tipo], Validators.required));
    }
  });

  this.form.patchValue(valores);

  Object.entries(valores).forEach(([key, value]) => {
    const control = this.form.get(key);
    if (control && value !== null && value !== '' && value !== undefined) {
      control.markAsTouched();
      control.markAsDirty();
    }
  });
}




cambiarEstado(tipo: 'honorario' | 'capital') {
  if (tipo === 'honorario') {
    this.subEstadoHonorariosSeleccionado = null;
    this.form.get('subEstadoHonorariosSeleccionado')?.setValue(null);
  } else {
    //this.estadoCapitalSeleccionado = null;
    //this.form.get('estadoCapitalSeleccionado')?.setValue(null);
    
    this.subEstadoCapitalSeleccionado = null;
    this.form.get('subEstadoCapitalSeleccionado')?.setValue(null);

    // 🔁 Forzamos la validación del campo estadoCapitalSeleccionado
    const estadoCtrl = this.form.get('estadoCapitalSeleccionado');
    estadoCtrl?.markAsTouched();
    estadoCtrl?.markAsDirty();
    estadoCtrl?.updateValueAndValidity();
  }

  this.actualizarValidacionesCondicionales();
}



obtenerResumenExpediente(expediente: ExpedienteModel): string {
  const num = `${expediente.numero}/${expediente.anio}`;
  const cliente = expediente.clientes?.[0];
  const demandado = expediente.demandados?.[0];
  const hayClientes = expediente.clientes?.length;
  const hayDemandados = expediente.demandados?.length;

  if (!hayClientes && hayDemandados === 1) {
    return `${num} (sin actora) contra ${demandado?.nombre}`;
  }

  if (!hayClientes && hayDemandados! > 1) {
    return `${num} (sin actora) contra ${demandado?.nombre} y otros`;
  }

  if (hayClientes === 1 && hayDemandados === 1) {
    return `${num} ${cliente?.nombre} ${cliente?.apellido} contra ${demandado?.nombre}`;
  }

  if (hayClientes === 1 && hayDemandados! > 1) {
    return `${num} ${cliente?.nombre} ${cliente?.apellido} contra ${demandado?.nombre} y otros`;
  }

  if (hayClientes! > 1 && hayDemandados === 1) {
    return `${num} ${cliente?.nombre} ${cliente?.apellido} y otros contra ${demandado?.nombre}`;
  }

  if (hayClientes! > 1 && hayDemandados! > 1) {
    return `${num} ${cliente?.nombre} ${cliente?.apellido} y otros contra ${demandado?.nombre} y otros`;
  }

  return `${num}`; // fallback
}

/*
                <mat-form-field *ngIf="honorariosExtrasSeleccionados.includes('alzada')">
                  <mat-label>Estado - Alzada</mat-label>
                  <mat-select formControlName="estado_alzada" [(ngModel)]="estadosHonorariosExtras['alzada']">
                    <mat-option *ngFor="let est of estadosPorTipo['alzada']" [value]="est">{{ est }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field *ngIf="honorariosExtrasSeleccionados.includes('alzada')">
                  <mat-label>Subestado - Alzada</mat-label>
                  <mat-select formControlName="subestado_alzada">
                    <mat-option *ngFor="let sub of getSubestadosPorEstado('alzada')" [value]="sub">
                      {{ sub }}
                    </mat-option>
                  </mat-select>
                </mat-form-field>

*/
async abrirModalAlzada() {

    if (this.expediente.honorarioAlzadaCobrado === true) {
    await Swal.fire({
      icon: 'info',
      title: 'Honorario ya cobrado',
      text: 'No es posible modificar los datos de alzada porque ya fue cobrado.',
      confirmButtonText: 'Aceptar'
    });
    return; 
  }

  let umaSeleccionada = this.expediente.umaSeleccionado_alzada || '';
  let cantidadUMA = this.expediente.cantidadUMA_alzada || '';
  let montoCalculado = 0;

  const estado = this.expediente.estadoHonorariosAlzadaSeleccionado || '';
  const subestado = this.expediente.subEstadoHonorariosAlzadaSeleccionado || '';
  const fecha = this.expediente.fechaHonorariosAlzada?.split('T')[0] || '';

  const optionsUMA = this.uma.map(uma => `<option value="${uma.valor}" ${uma.valor == umaSeleccionada ? 'selected' : ''}>${uma.valor}</option>`).join('');

  const optionsEstado = ['pendiente', 'firme']
    .map(est => `<option value="${est}" ${est === estado ? 'selected' : ''}>${est}</option>`)
    .join('');

  const subestadosIniciales = this.getSubestadosPorEstado('alzada', estado);
  const optionsSubestado = subestadosIniciales
    .map(sub => `<option value="${sub}" ${sub === subestado ? 'selected' : ''}>${sub}</option>`)
    .join('');

  await Swal.fire({
    title: 'Honorario - Alzada',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap: 8px;">

        <label for="estado">Estado</label>
        <select id="estado" class="swal2-select" style="width:300px">
          <option value="">Seleccionar estado</option>
          ${optionsEstado}
        </select>

        <label for="subestado">Subestado</label>
        <select id="subestado" class="swal2-select" style="width:300px">
          ${optionsSubestado}
        </select>

        <label for="fecha">Fecha</label>
        <input id="fecha" type="date" class="swal2-input" style="width:300px" value="${fecha}">

        <label for="uma">UMA</label>
        <select id="uma" class="swal2-select" style="width:300px">
          <option value="">Seleccionar UMA</option>
          ${optionsUMA}
        </select>

        <label for="cantidadUMA">Cantidad de UMA</label>
        <input id="cantidadUMA" class="swal2-input" placeholder="Cantidad de UMA" value="${cantidadUMA}" type="number" style="width:300px">

        <label for="montoCalculado">Monto Calculado</label>
        <input id="montoCalculado" class="swal2-input" placeholder="Monto (calculado)" disabled style="width:300px" value="">
      </div>
    `,
    didOpen: () => {
      const estadoSelect = document.getElementById('estado') as HTMLSelectElement;
      const subestadoSelect = document.getElementById('subestado') as HTMLSelectElement;

      const umaSelect = document.getElementById('uma') as HTMLSelectElement;
      const cantidadInput = document.getElementById('cantidadUMA') as HTMLInputElement;
      const montoInput = document.getElementById('montoCalculado') as HTMLInputElement;

      const actualizarSubestados = () => {
        const estadoActual = estadoSelect.value;
        const nuevosSubestados = this.getSubestadosPorEstado('alzada', estadoActual);
        subestadoSelect.innerHTML = nuevosSubestados.map(sub => `<option value="${sub}">${sub}</option>`).join('');
      };

      estadoSelect.addEventListener('change', actualizarSubestados);

      const calcularMonto = () => {
        const valorUMA = parseFloat(umaSelect.value);
        const cantidad = parseFloat(cantidadInput.value);
        if (!isNaN(valorUMA) && !isNaN(cantidad)) {
          montoCalculado = valorUMA * cantidad;
          montoInput.value = montoCalculado.toFixed(2);
        } else {
          montoInput.value = '';
        }
      };

      umaSelect.addEventListener('change', calcularMonto);
      cantidadInput.addEventListener('input', calcularMonto);

      calcularMonto();
    },
    confirmButtonText: 'Guardar',
    preConfirm: () => {
      return {
        estado: (document.getElementById('estado') as HTMLInputElement).value,
        subestado: (document.getElementById('subestado') as HTMLInputElement).value,
        fecha: (document.getElementById('fecha') as HTMLInputElement).value,
        umaSeleccionada: (document.getElementById('uma') as HTMLSelectElement).value,
        cantidadUMA: (document.getElementById('cantidadUMA') as HTMLInputElement).value,
        montoCalculado: montoCalculado,
      };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      this.expediente.estadoHonorariosAlzadaSeleccionado = result.value.estado;
      this.expediente.subEstadoHonorariosAlzadaSeleccionado = result.value.subestado;
      this.expediente.fechaHonorariosAlzada = result.value.fecha;
      this.expediente.umaSeleccionado_alzada = result.value.umaSeleccionada;
      this.expediente.cantidadUMA_alzada = result.value.cantidadUMA;
      this.expediente.montoAcuerdo_alzada = result.value.montoCalculado;
    }
  });
}



async abrirModalDiferencia() {
      if (this.expediente.honorarioDiferenciaCobrado === true) {
    await Swal.fire({
      icon: 'info',
      title: 'Honorario ya cobrado',
      text: 'No es posible modificar los datos de diferencia porque ya fue cobrado.',
      confirmButtonText: 'Aceptar'
    });
    return; 
  }
  const estado = this.expediente.estadoHonorariosDiferenciaSeleccionado || '';
  const subestado = this.expediente.subEstadoHonorariosDiferenciaSeleccionado || '';
  const fecha = this.expediente.fechaHonorariosDiferencia?.split('T')[0] || '';
  const monto = this.expediente.montoHonorariosDiferencia || '';

  const subestados = this.getSubestadosPorEstado('diferencia', estado);
  const optionsSubestado = subestados.map(sub =>
    `<option value="${sub}" ${sub === subestado ? 'selected' : ''}>${sub}</option>`
  ).join('');

  await Swal.fire({
    title: 'Honorario - Diferencia',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap: 8px;">
        <select id="estado" class="swal2-select">
          <option value="">Seleccionar estado</option>
          <option value="firme" ${estado === 'firme' ? 'selected' : ''}>Firme</option>
          <option value="apelado" ${estado === 'apelado' ? 'selected' : ''}>Apelado</option>
          <option value="pendiente" ${estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
        </select>

        <select id="subestado" class="swal2-select">${optionsSubestado}</select>

        <input id="fecha" type="date" class="swal2-input" style="width: 300px;" value="${fecha}">
        <input id="monto" class="swal2-input" style="width: 300px;" type="number" placeholder="Monto" value="${monto}">
      </div>
    `,
    didOpen: () => {
      const estadoInput = document.getElementById('estado') as HTMLSelectElement;
      const subestadoSelect = document.getElementById('subestado') as HTMLSelectElement;

      const actualizarSubestados = () => {
        const nuevoEstado = estadoInput.value;
        const nuevosSubestados = this.getSubestadosPorEstado('diferencia', nuevoEstado);
        subestadoSelect.innerHTML = nuevosSubestados
          .map(sub => `<option value="${sub}">${sub}</option>`).join('');
      };

      estadoInput.addEventListener('change', actualizarSubestados);
    },
    confirmButtonText: 'Guardar',
    preConfirm: () => {
      return {
        estado: (document.getElementById('estado') as HTMLInputElement).value,
        subestado: (document.getElementById('subestado') as HTMLInputElement).value,
        fecha: (document.getElementById('fecha') as HTMLInputElement).value,
        monto: (document.getElementById('monto') as HTMLInputElement).value
      };
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      this.expediente.estadoHonorariosDiferenciaSeleccionado = result.value.estado;
      this.expediente.subEstadoHonorariosDiferenciaSeleccionado = result.value.subestado;
      this.expediente.fechaHonorariosDiferencia = result.value.fecha;
      this.expediente.montoHonorariosDiferencia = result.value.monto;
    }
  });
}
/*
async abrirModalEjecucion() {

    if (this.expediente.honorarioEjecucionCobrado === true) {
    await Swal.fire({
      icon: 'info',
      title: 'Honorario ya cobrado',
      text: 'No es posible modificar los datos de ejecución porque ya fue cobrado.',
      confirmButtonText: 'Aceptar'
    });
    return; 
  }

  const estado = this.expediente.estadoHonorariosEjecucionSeleccionado || '';
  const subestado = this.expediente.subEstadoHonorariosEjecucionSeleccionado || '';
  const fecha = this.expediente.fechaHonorariosEjecucion?.split('T')[0] || '';
  const monto = this.expediente.montoHonorariosEjecucion || '';

  const subestados = this.getSubestadosPorEstado('ejecucion', estado);
  const optionsSubestado = subestados.map(sub =>
    `<option value="${sub}" ${sub === subestado ? 'selected' : ''}>${sub}</option>`
  ).join('');

  await Swal.fire({
    title: 'Honorario - Ejecución',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap: 8px;">
        <select id="estado" class="swal2-select">
          <option value="">Seleccionar estado</option>
          <option value="firme" ${estado === 'firme' ? 'selected' : ''}>Firme</option>
          <option value="apelado" ${estado === 'apelado' ? 'selected' : ''}>Apelado</option>
          <option value="pendiente" ${estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
        </select>

        <select id="subestado" class="swal2-select">${optionsSubestado}</select>

        <input id="fecha" type="date" class="swal2-input" style="width: 300px;" value="${fecha}">
        <input id="monto" class="swal2-input" style="width: 300px;" type="number" placeholder="Monto" value="${monto}">
      </div>
    `,
    didOpen: () => {
      const estadoInput = document.getElementById('estado') as HTMLSelectElement;
      const subestadoSelect = document.getElementById('subestado') as HTMLSelectElement;

      const actualizarSubestados = () => {
        const nuevoEstado = estadoInput.value;
        const nuevosSubestados = this.getSubestadosPorEstado('ejecucion', nuevoEstado);
        subestadoSelect.innerHTML = nuevosSubestados
          .map(sub => `<option value="${sub}">${sub}</option>`).join('');
      };

      estadoInput.addEventListener('change', actualizarSubestados);
    },
    confirmButtonText: 'Guardar',
    preConfirm: () => {
      return {
        estado: (document.getElementById('estado') as HTMLInputElement).value,
        subestado: (document.getElementById('subestado') as HTMLInputElement).value,
        fecha: (document.getElementById('fecha') as HTMLInputElement).value,
        monto: (document.getElementById('monto') as HTMLInputElement).value
      };
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      this.expediente.estadoHonorariosEjecucionSeleccionado = result.value.estado;
      this.expediente.subEstadoHonorariosEjecucionSeleccionado = result.value.subestado;
      this.expediente.fechaHonorariosEjecucion = result.value.fecha;
      this.expediente.montoHonorariosEjecucion = result.value.monto;
    }
  });
}*/


async abrirModalEjecucion() {

    if (this.expediente.honorarioEjecucionCobrado === true) {
    await Swal.fire({
      icon: 'info',
      title: 'Honorario ya cobrado',
      text: 'No es posible modificar los datos de ejecucion porque ya fue cobrado.',
      confirmButtonText: 'Aceptar'
    });
    return; 
  }

  let umaSeleccionada = this.expediente.umaSeleccionado_ejecucion || '';
  let cantidadUMA = this.expediente.cantidadUMA_ejecucion || '';
  let montoCalculado = 0;

  const estado = this.expediente.estadoHonorariosEjecucionSeleccionado || '';
  const subestado = this.expediente.subEstadoHonorariosEjecucionSeleccionado || '';
  const fecha = this.expediente.fechaHonorariosEjecucion?.split('T')[0] || '';

  const optionsUMA = this.uma.map(uma => `<option value="${uma.valor}" ${uma.valor == umaSeleccionada ? 'selected' : ''}>${uma.valor}</option>`).join('');

  const optionsEstado = ['apelado', 'pendiente', 'firme']
    .map(est => `<option value="${est}" ${est === estado ? 'selected' : ''}>${est}</option>`)
    .join('');

  const subestadosIniciales = this.getSubestadosPorEstado('ejecucion', estado);
  const optionsSubestado = subestadosIniciales
    .map(sub => `<option value="${sub}" ${sub === subestado ? 'selected' : ''}>${sub}</option>`)
    .join('');

  await Swal.fire({
    title: 'Honorario - Ejecucion',
    html: `
      <div style="display:flex; flex-direction:column; align-items:center; gap: 8px;">

        <label for="estado">Estado</label>
        <select id="estado" class="swal2-select" style="width:300px">
          <option value="">Seleccionar estado</option>
          ${optionsEstado}
        </select>

        <label for="subestado">Subestado</label>
        <select id="subestado" class="swal2-select" style="width:300px">
          ${optionsSubestado}
        </select>

        <label for="fecha">Fecha</label>
        <input id="fecha" type="date" class="swal2-input" style="width:300px" value="${fecha}">

        <label for="uma">UMA</label>
        <select id="uma" class="swal2-select" style="width:300px">
          <option value="">Seleccionar UMA</option>
          ${optionsUMA}
        </select>

        <label for="cantidadUMA">Cantidad de UMA</label>
        <input id="cantidadUMA" class="swal2-input" placeholder="Cantidad de UMA" value="${cantidadUMA}" type="number" style="width:300px">

        <label for="montoCalculado">Monto Calculado</label>
        <input id="montoCalculado" class="swal2-input" placeholder="Monto (calculado)" disabled style="width:300px" value="${montoCalculado || ''}">
      </div>
    `,
    didOpen: () => {
      const estadoSelect = document.getElementById('estado') as HTMLSelectElement;
      const subestadoSelect = document.getElementById('subestado') as HTMLSelectElement;

      const umaSelect = document.getElementById('uma') as HTMLSelectElement;
      const cantidadInput = document.getElementById('cantidadUMA') as HTMLInputElement;
      const montoInput = document.getElementById('montoCalculado') as HTMLInputElement;

      const actualizarSubestados = () => {
        const estadoActual = estadoSelect.value;
        const nuevosSubestados = this.getSubestadosPorEstado('ejecucion', estadoActual);
        subestadoSelect.innerHTML = nuevosSubestados.map(sub => `<option value="${sub}">${sub}</option>`).join('');
      };

      estadoSelect.addEventListener('change', actualizarSubestados);

      const calcularMonto = () => {
        const valorUMA = parseFloat(umaSelect.value);
        const cantidad = parseFloat(cantidadInput.value);
        if (!isNaN(valorUMA) && !isNaN(cantidad)) {
          montoCalculado = valorUMA * cantidad;
          montoInput.value = montoCalculado.toFixed(2);
        } else {
          montoInput.value = '';
        }
      };

      umaSelect.addEventListener('change', calcularMonto);
      cantidadInput.addEventListener('input', calcularMonto);

      calcularMonto();
    },
    confirmButtonText: 'Guardar',
    preConfirm: () => {
      return {
        estado: (document.getElementById('estado') as HTMLInputElement).value,
        subestado: (document.getElementById('subestado') as HTMLInputElement).value,
        fecha: (document.getElementById('fecha') as HTMLInputElement).value,
        umaSeleccionada: (document.getElementById('uma') as HTMLSelectElement).value,
        cantidadUMA: (document.getElementById('cantidadUMA') as HTMLInputElement).value,
        montoCalculado: montoCalculado,
      };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      this.expediente.estadoHonorariosEjecucionSeleccionado = result.value.estado;
      this.expediente.subEstadoHonorariosEjecucionSeleccionado = result.value.subestado;
      this.expediente.fechaHonorariosEjecucion = result.value.fecha;
      this.expediente.umaSeleccionado_ejecucion = result.value.umaSeleccionada;
      this.expediente.cantidadUMA_ejecucion = result.value.cantidadUMA;
      this.expediente.montoHonorariosEjecucion = result.value.montoCalculado;
    }
  });
}


getSubestadosPorEstado(tipo: string, estado: string): string[] {
  if (!estado) return [];

  if (estado === 'apelado') {
    return [
      'pendiente de elevacion',
      'elevacion',
      'en sala',
      'resolucion sala - confirma',
      'resolucion sala - se elevan',
      'resolucion sala - se reducen',
    ];
  } else if (estado === 'pendiente') {
    return [
      'a elevar',
      'solicita se eleve',
      'en sala',
      'autor a resolver',
    ];
  } else if (estado === 'firme') {
    return [
      'espera que vuelva',
      'honorario se intima',
      'honorario cedula',
      'honorario solicita embargo',
      'honorario embargo',
      'da en pago parcial',
      'da en pago total',
      'giro - solicita',
      'giro - previo',
      'giro - consiente',
      'giro',
    ];
  } else if (estado === 'diferido') {
    return ['diferido'];
  }

  return [];
}


validarEjecucion(): any {
  const estado = this.estadoCapitalSeleccionado;
  const subestado = this.subEstadoCapitalSeleccionado;

  if (estado === 'firme' && subestado?.toLowerCase() === 'embargo ejecutado') {
    const ejecucionCargada =
      this.expediente.estadoHonorariosEjecucionSeleccionado &&
      this.expediente.fechaHonorariosEjecucion &&
      this.expediente.montoHonorariosEjecucion;

    if (!ejecucionCargada) {
      return false;
    }
  }

  return true;
}

mostrarMontoCapital(estado: string): boolean {
  const habilitados = [
    'liquidacion practicada',
    'liquidacion traslado - cedula',
    'liquidacion impugnada',
    'liquidacion contesta impugnacion',
    'liquidacion se resuelve impugnacion',
    'liquidacion - se apruebe',
    'liquidacion aprobada - se intime',
    'liquidacion aprobada - cedula',
    'embargo solicita',
    'embarga deox',
    'embargo deox librado',
    'embargo ejecutado',
    'embargo citese de venta',
    'da en pago total',
    'da en pago parcial',
    'CBU peniente',
    'giro - solicita',
    'giro - previo',
    'giro - consentido',
    'giro rechazado',
    'giro'
  ];

  return habilitados.includes(estado);
}


}

