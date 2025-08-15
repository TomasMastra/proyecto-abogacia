import { Component, Inject } from '@angular/core';
import { Observable, startWith, map } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray  } from '@angular/forms';
import { NgModule } from '@angular/core';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';

import { JuezService } from 'src/app/services/juez.service';
import { JuezModel } from 'src/app/models/juez/juez.component';

import { takeUntil } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { Subject } from 'rxjs';

import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';

import Swal from 'sweetalert2';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';

@Component({
  selector: 'app-dialog-expediente',
  templateUrl: './dialog-expediente.component.html',
  styleUrls: ['./dialog-expediente.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatButtonModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, ReactiveFormsModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatIconModule,
    MatAutocompleteModule
  ]
})
export class DialogExpedienteComponent {
  protected form: FormGroup;

   juzgados: JuzgadoModel[] = [];
   juzgadosOriginales: JuzgadoModel[] = [];

   demandados: DemandadoModel[] = [];
   demandadosAgregados: DemandadoModel[] = [];

   clientes: ClienteModel[] = [];
   clientesAgregados: ClienteModel[] = [];

   jueces: JuezModel[] = [];

   tipos: any[] = ['todos', 'CCF', 'COM', 'CIV', 'CC'];
   tipoSeleccionado: any = 'todos';
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
];
   estadoSeleccionado: any = 'inicio';

   juicios: any[] = ['ordinario', 'sumarisimo', 'a definir'];
   juicioSeleccionado: any;

   menu: string = '1';

    private destroy$ = new Subject<void>(); 
    juzgadoElegido: any; 
    demandadoElegido: any;
    clienteSeleccionado: any; 

    clienteCtrl = new FormControl<string>('');
    filteredClientes!: Observable<ClienteModel[]>;
    juezSeleccionado: any;
    mensajeSelectJuzgado: any = 'Filtrar juzgado';

    listaUsuarios: UsuarioModel[] = [];
    abogadoSeleccionado: any;
    procuradorSeleccionado: any;


    constructor(
      private expedienteService: ExpedientesService,
      private usuarioService: UsuarioService,
      private juzgadoService: JuzgadosService,
      private demandadoService: DemandadosService,
      private clienteService: ClientesService,
      private juezService: JuezService,

      public dialogRef: MatDialogRef<DialogExpedienteComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any
    ) {
      this.form = new FormGroup({
        juzgado: new FormControl('', [Validators.required]),
        demandado: new FormControl('', [Validators.required]),
        numero: new FormControl('', [Validators.required, Validators.min(0), Validators.max(999999)]),
        anio: new FormControl('', [Validators.required]),
        clientes: new FormArray([]),
        estado: new FormControl('', [Validators.required]),
        juicio: new FormControl('', [Validators.required]),
        fechaInicio: new FormControl('', [Validators.required]),
        tipo: new FormControl('todos', [Validators.required]),
        porcentaje: new FormControl('', [Validators.required]),
        abogado: new FormControl('', [Validators.required]),
        procurador: new FormControl('', [Validators.required]),

        // EDESUR Y EDENOR
        numeroCliente: new FormControl(''),
        minutosSinLuz: new FormControl(''),
        periodoCorte: new FormControl(''),

      });
    
      // Si hay datos para cargar, asignarlos al formulario
      if (data) {
        this.form.setValue({
          juzgado: data.juzgado || '',
          demandado: data.demandado || '',
          numero: data.numero || '',
          anio: data.anio || '',
          estado: data.estado || '',
          juicio: data.juicio || '',
          porcentaje: data.porcentaje || '',
          abogado: data.usuario_id || '',
          procurador: data.procurador_id || '',
        });
    
        //this.actualizarValidadoresPorEstado(data.estado);  // Asume que "estado" es una propiedad en "data"
      }
    }
    

  ngOnInit() {
    this.clienteSeleccionado = null; // Limpiar la selección

    this.cargarJuzgado();
    this.cargarDemandados();
    this.cargarClientes();
    this.cargarJueces();
    this.cargarUsuarios();

    this.form.get('estado')?.valueChanges.subscribe(estado => {
      this.estadoSeleccionado = estado;  // Puedes actualizar el valor si lo necesitas
      //this.actualizarValidadoresPorEstado(estado);  // Para actualizar los validadores según el estado
    });
        this.filteredClientes = this.clienteCtrl.valueChanges.pipe(
      startWith(''),
      map(text => this.filtrarClientes(text!))
    );

  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  private filtrarClientes(text: string) {
  const term = text.toLowerCase();
  return this.clientes.filter(c =>
    (`${c.nombre} ${c.apellido}`).toLowerCase().includes(term)
  );
}

  /** Le dice al autocomplete cómo “stringificar” un ClienteModel */
  displayCliente(cliente: ClienteModel): string {
    return cliente
      ? `${cliente.nombre} ${cliente.apellido}`
      : '';
  }

cambiarTipoJuzgado() {
  const tipo = this.form.get('tipo')?.value;
  console.log('Tipo seleccionado:', tipo);

  if (!tipo || tipo === 'todos') {
    this.juzgados = [...this.juzgadosOriginales];
  } else {
    this.juzgados = this.juzgadosOriginales.filter(j => j.tipo === tipo);
  }
}

  
cargarJuzgado() {
  this.juzgadoService.getJuzgados()
    .pipe(takeUntil(this.destroy$)) 
    .subscribe(
      (juzgados) => {
        this.juzgadosOriginales = juzgados;
        this.juzgados = [...juzgados];
      },
      (error) => {
        console.error('Error al obtener juzgados:', error);
      }
    );
}

  cargarDemandados() {
    this.demandadoService.getDemandados()
      .pipe(takeUntil(this.destroy$)) 
      .subscribe(
        (demandado) => {
          this.demandados = demandado;
        },
        (error) => {
          console.error('Error al obtener demandados:', error);
        }
      );
  }

  cargarClientes() {
    this.clienteService.getClientes()
      .pipe(takeUntil(this.destroy$)) 
      .subscribe(
        (cliente) => {
          this.clientes = cliente!;
          //console.log(this.clientes);

        },
        (error) => {
          console.error('Error al obtener clientes:', error);
        }
      );
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

    cargarUsuarios() {
    this.usuarioService.getUsuarios()
      .pipe(takeUntil(this.destroy$)) // Cancela la suscripción cuando destroy$ emita
      .subscribe(
        (usuarios) => {
          this.listaUsuarios = usuarios;
            //this.abogadoSeleccionado = this.usuarioService.usuarioLogeado;
          //this.expedientesOriginales = [...expedientes];
          //this.hayExpedientes = this.listaExpedientes.length > 0;
          this.abogadoSeleccionado = this.listaUsuarios.find(u => u.id === this.usuarioService.usuarioLogeado?.id);

        },
        (error) => {
          console.error('Error al obtener abogados:', error);
        }
      );
  }
  
  acceptDialog(): void {
    console.log('Datos recibidos en el formulario:', this.data); // 👈 Verifica la estructura de los datos
  
    // Aseguramos que el formulario está validado antes de proceder
    if (this.form.valid) {
      console.log(this.clientesAgregados);
      
      // Crear el objeto expediente con los datos del formulario
      const expediente: ExpedienteModel = {
        id: this.data?.id ?? '0',
        titulo: '',
        descripcion: '',
        fecha_creacion: this.data?.fecha_creacion ?? '',
        clientes: this.clientesAgregados,
        demandados: this.demandadosAgregados ?? [],
        juzgado_id: this.juzgadoElegido?.id ?? null,
        demandado_id: this.demandadoElegido?.id ?? null,
        numero: this.form.value.numero,
        anio: this.form.value.anio,
        demandadoModel: null,
        estado: this.estadoSeleccionado, // Este es el valor por defecto. Se actualizaría si el estado es 'sentencia'.
        sala_radicacion: null,
        honorario: this.form.value.honorario ?? null,
        fecha_inicio: this.form.value.fechaInicio ?? null,
        fecha_sentencia: null,
        hora_sentencia: null,
        juez_id: this.juezSeleccionado?.id ?? null,
        juezModel: { id: '', nombre: '', apellido: '', estado: '' },
        juicio: this.form.value.juicio,
        ultimo_movimiento: this.data?.ultimo_movimiento,
        monto: null,
        apela: null,
        juzgadoModel: null,
        usuario_id: this.abogadoSeleccionado.id,
        porcentaje: this.form.value.porcentaje,
        fecha_cobro: null,
        fecha_cobro_capital: null,
        valorUMA: null,
        procurador_id:  this.procuradorSeleccionado.id,
        sala: null,
        requiere_atencion: false,
        fecha_atencion: null,



        // 📌 Campos nuevos - Capital
        estadoCapitalSeleccionado: null,
        subEstadoCapitalSeleccionado: null,
        fechaCapitalSubestado: null,
        estadoLiquidacionCapitalSeleccionado: null,
        fechaLiquidacionCapital: null,
        montoLiquidacionCapital: null,
        capitalCobrado: false,


        // 📌 Campos nuevos - Honorarios
        estadoHonorariosSeleccionado: null,
        subEstadoHonorariosSeleccionado: null,
        fechaHonorariosSubestado: null,
        estadoLiquidacionHonorariosSeleccionado: null,
        fechaLiquidacionHonorarios: null,
        montoLiquidacionHonorarios: null,
        honorarioCobrado: false,
        cantidadUMA: null,
        numeroCliente: this.form.value.numeroCliente || null,
        minutosSinLuz: this.form.value.minutosSinLuz || null,
        periodoCorte: this.form.value.periodoCorte || null,

            honorarioAlzadaCobrado: this.data?.honorarioAlzadaCobrado ?? null,
            fechaCobroAlzada: this.data?.fechaCobroAlzada ?? null,

            honorarioEjecucionCobrado: this.data?.honorarioEjecucionCobrado ?? null,
            fechaCobroEjecucion: this.data?.fechaCobroEjecucion ?? null,

            honorarioDiferenciaCobrado: this.data?.honorarioDiferenciaCobrado ?? null,
            fechaCobroDiferencia: this.data?.fechaCobroDiferencia ?? null,
            capitalPagoParcial: this.data?.capitalPagoParcial ?? null

        

      };

    this.dialogRef.close(expediente);
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
        { nombre: 'juzgado', control: 'juzgado' },
        { nombre: 'demandado', control: 'demandado' },
        { nombre: 'numero', control: 'numero' },
        { nombre: 'anio', control: 'anio' },
        { nombre: 'juicio', control: 'juicio' },
        { nombre: 'estado', control: 'estado' },
        //{ nombre: 'fecha de inicio', control: 'fechaInicio' },
        { nombre: 'tipo', control: 'tipo' },
        { nombre: 'porcentaje', control: 'porcentaje' },
        { nombre: 'abogado', control: 'abogado' },
        { nombre: 'procurador', control: 'procurador' },

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

  seleccionarDemandado(demandado: DemandadoModel): void { 
    this.demandadoElegido = demandado;
  
    if (this.demandadosAgregados.indexOf(demandado) === -1) {
      this.demandadosAgregados.push(demandado);
    }
  }


seleccionarCliente(cliente: ClienteModel): void { 
  this.clienteSeleccionado = cliente;

  if (!this.clientesAgregados.includes(cliente)) {
    this.clientesAgregados.push(cliente);
  }

  // Limpia el input para que puedas buscar otro cliente
  this.clienteCtrl.setValue('');

  // 👇 Reasigna el observable para que vuelva a escuchar cambios del input
  this.filteredClientes = this.clienteCtrl.valueChanges.pipe(
    startWith(''),
    map(text => this.filtrarClientes(text!))
  );
}


  
  

  agregarCliente(): void {

    if (this.clienteSeleccionado) {
      this.clientesAgregados.push(this.clienteSeleccionado);
      this.clienteSeleccionado = null;
    }
  }

  eliminarDemandado(demandado: DemandadoModel): void {
    const index = this.demandadosAgregados.indexOf(demandado);
    if (index > -1) {
      this.demandadosAgregados.splice(index, 1);
    }
  }

  eliminarCliente(cliente: ClienteModel): void {
    const index = this.clientesAgregados.indexOf(cliente);
    if (index > -1) {
      this.clientesAgregados.splice(index, 1);
    }
  }


    cambiarDemandado(demandado: any) {
  //alert(demandado.nombre);
  this.demandadoElegido = demandado;
  this.setValidacionesEmpresaElectrica(demandado);

}
  esEmpresaElectrica(demandado: any): boolean {
  //const empresa = demandado.nombre.toLowerCase();
  return demandado.id === 1 || demandado.id === 7;
}

setValidacionesEmpresaElectrica(demandado: any) {
  const esElectrica = this.esEmpresaElectrica(demandado);

  if (esElectrica) {
    this.form.get('numeroCliente')?.setValidators([Validators.required]);
    this.form.get('minutosSinLuz')?.setValidators([Validators.required]);
    this.form.get('periodoCorte')?.setValidators([Validators.required]);
  } else {
    this.form.get('numeroCliente')?.clearValidators();
    this.form.get('minutosSinLuz')?.clearValidators();
    this.form.get('periodoCorte')?.clearValidators();
  }

  this.form.get('numeroCliente')?.updateValueAndValidity();
  this.form.get('minutosSinLuz')?.updateValueAndValidity();
  this.form.get('periodoCorte')?.updateValueAndValidity();
}



}
