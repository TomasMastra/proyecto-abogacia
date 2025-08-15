import { Component, OnInit, Inject } from '@angular/core';
import { Observable, startWith, map } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';

import { MatSelectModule } from '@angular/material/select';  // Asegúrate de importar esto
import { MatOptionModule } from '@angular/material/core';  // Esto también es necesario para mat-option
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';

import Swal from 'sweetalert2';


import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
@Component({
  selector: 'app-dialog-expediente-modificar',
  templateUrl: './dialog-expediente-modificar.component.html',
  styleUrls: ['./dialog-expediente-modificar.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    MatButtonModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    ReactiveFormsModule,
    MatSelectModule,  
    MatOptionModule,  
    MatIconModule,
    MatCardModule,
    MatAutocompleteModule
  ]
})

export class DialogExpedienteModificarComponent   {
 protected form: FormGroup;
  juzgados: JuzgadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = [];

  demandados: DemandadoModel[] = [];
  demandadosAgregados: DemandadoModel[] = [];

  clientes: ClienteModel[] = [];
  clientesAgregados: ClienteModel[] = [];

  private destroy$ = new Subject<void>(); 
  juzgadoElegido: any;
  demandadoElegido: any;
  clienteSeleccionado: any;

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
  'Sentencia'
];
estadoSeleccionado: any;

  juicios: any[] = ['ordinario', 'sumarisimo', 'a definir'];
  juicioSeleccionado: any;

  mensajeSelectJuzgado: any = 'Filtrar por juzgado';

  listaUsuarios: UsuarioModel[] = [];
  abogadoSeleccionado: any;
  procuradorSeleccionado: any;


      clienteCtrl = new FormControl<string>('');
    filteredClientes!: Observable<ClienteModel[]>;
      juezSeleccionado: any;
  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private demandadoService: DemandadosService,
    private clienteService: ClientesService,


    public dialogRef: MatDialogRef<DialogExpedienteModificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpedienteModel
  ) {
    this.form = new FormGroup({
      juzgado: new FormControl('', [Validators.required]),
      demandado: new FormControl('', [Validators.required]),  
      numero: new FormControl('', [Validators.required/*, Validators.min(0), Validators.max(999999)*/]),  
      anio: new FormControl('', [Validators.required]),  
      juicio: new FormControl('', [Validators.required]),
      estado: new FormControl('', [Validators.required]),
      fechaInicio: new FormControl('', [Validators.required]),
      tipo: new FormControl('todos', [Validators.required]),
      porcentaje: new FormControl('', [Validators.required]),
      abogado: new FormControl('', [Validators.required]),
      procurador: new FormControl('', [Validators.required]),      


    });

    if (data) {
      const fechaFormateada = data.fecha_inicio
      ? new Date(data.fecha_inicio).toISOString().split('T')[0] 
      : '';
      this.form.setValue({ 
        tipo: data.juzgadoModel?.tipo ?? 'todos',
        juzgado: data.juzgado_id || '' , 
        demandado: data.demandados || '',
        numero: data.numero || '', 
        anio: data.anio || ''  ,
        juicio: data.juicio,
        estado: data.estado,
        fechaInicio: fechaFormateada,
        porcentaje: data.porcentaje,
        abogado: data.usuario_id,
        procurador: data.procurador_id,

      });


      
    }

    const estadoSeleccionado = this.estados.find(j => j === this.data.estado) || ''; 
    this.form.get('estado')?.setValue(estadoSeleccionado);
    this.estadoSeleccionado = estadoSeleccionado;
    
    const juicioSeleccionado = this.juicios.find(j => j === this.data.juicio) || ''; 
    this.form.get('juicio')?.setValue(juicioSeleccionado);
    this.juicioSeleccionado = juicioSeleccionado;
    
  }

  ngOnInit() {
    this.cargarJuzgado();
    this.cargarDemandados();
    this.cargarClientes();
    this.cargarUsuarios();

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

        if (this.data && this.data.juzgado_id) {
          const juzgadoElegido = this.juzgados.find(d => +d.id === this.data.juzgado_id);
          this.form.get('juzgado')?.setValue(juzgadoElegido || '');
          this.juzgadoElegido = juzgadoElegido;
        }
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
                this.demandadosAgregados = this.data.demandados || [];
                //console.log(this.demandados);
      
              },
              (error) => {
                console.error('Error al obtener clientes:', error);
              }
            );
        }
        cargarClientes() {
          this.clienteService.getClientes()
            .pipe(takeUntil(this.destroy$)) 
            .subscribe(
              (cliente) => {
                this.clientes = cliente!;
                this.clientesAgregados = this.data.clientes;
                //console.log(this.clientes);
      
              },
              (error) => {
                console.error('Error al obtener clientes:', error);
              }
            );
        }
       
            cargarUsuarios() {
            this.usuarioService.getUsuarios()
              .pipe(takeUntil(this.destroy$)) // Cancela la suscripción cuando destroy$ emita
              .subscribe(
                (usuarios) => {
                  this.listaUsuarios = usuarios;
      
                if (this.data && this.data.usuario_id) {
                  const abogadoSeleccionado = this.listaUsuarios.find(d => d.id === +this.data.usuario_id);
                  this.form.get('abogado')?.setValue(abogadoSeleccionado || '');
                  this.abogadoSeleccionado = abogadoSeleccionado;
                }

                if (this.data && this.data.procurador_id) {
                  const procuradorSeleccionado = this.listaUsuarios.find(d => d.id === +this.data.procurador_id!);
                  this.form.get('procurador')?.setValue(procuradorSeleccionado || '');
                  this.procuradorSeleccionado = procuradorSeleccionado;
                }

                        

                },
                (error) => {
                  console.error('Error al obtener abogados:', error);
                }
              );
          }

    acceptDialog(): void {

      if (this.form.valid) {
        const expediente: ExpedienteModel = {
          id: this.data?.id ?? '0',  
          titulo: '',
          descripcion: '', 
          fecha_creacion: this.data?.fecha_creacion ?? '', 
          clientes: this.data?.clientes ?? null,
          demandados: this.data?.demandados,

          juzgado_id: this.juzgadoElegido?.id ?? null, 
          demandado_id: this.demandadoElegido?.id ?? null,    
          numero: this.form.value.numero,
          anio: this.form.value.anio,
          demandadoModel: this.demandadoElegido,
          estado: this.estadoSeleccionado,
          sala_radicacion: this.form.value.sala_radicacion ?? null,
          honorario: 'prueba',
          fecha_inicio: this.form.value.fechaInicio ?? null,
          fecha_sentencia: this.data?.fecha_sentencia ?? null, 
          hora_sentencia: this.form.value.hora_sentencia ?? null, 
          fecha_cobro: this.data?.fecha_cobro ?? null,
          fecha_cobro_capital: this.data?.fecha_cobro_capital ?? null,
          valorUMA: this.data?.valorUMA ?? null,
          // modificar
          juez_id: this.data?.juez_id ?? null,
          juezModel: { id: '', nombre: '', apellido: '', estado: '' },
          juicio: this.form.value.juicio,
          ultimo_movimiento: this.data?.ultimo_movimiento,
          monto: this.data?.monto,
          apela: this.data?.apela,
          juzgadoModel: null,
          usuario_id: this.abogadoSeleccionado.id,
          porcentaje: this.form.value.porcentaje,
          procurador_id:  this.procuradorSeleccionado.id,
          sala: this.data?.sala,


          // 📌 Campos nuevos - Capital
          estadoCapitalSeleccionado: this.data?.estadoCapitalSeleccionado ?? null,
          subEstadoCapitalSeleccionado: this.data?.subEstadoCapitalSeleccionado ?? null,
          fechaCapitalSubestado: this.data?.fechaCapitalSubestado ?? null,
          estadoLiquidacionCapitalSeleccionado: this.data?.estadoLiquidacionCapitalSeleccionado ?? null,
          fechaLiquidacionCapital: this.data?.fechaLiquidacionCapital ?? null,
          montoLiquidacionCapital: this.data?.montoLiquidacionCapital ?? null,
          capitalCobrado: this.data?.capitalCobrado ??  null,


          // 📌 Campos nuevos - Honorarios
          estadoHonorariosSeleccionado: this.data?.estadoHonorariosSeleccionado ?? null,
          subEstadoHonorariosSeleccionado: this.data?.subEstadoHonorariosSeleccionado ?? null,
          fechaHonorariosSubestado: this.data?.fechaHonorariosSubestado ?? null,
          estadoLiquidacionHonorariosSeleccionado: this.data?.estadoLiquidacionHonorariosSeleccionado ?? null,
          fechaLiquidacionHonorarios: this.data?.fechaLiquidacionHonorarios ?? null,
          montoLiquidacionHonorarios: this.data?.montoLiquidacionHonorarios ?? null,
          honorarioCobrado: this.data?.honorarioCobrado ??  null,
          cantidadUMA:  this.data?.cantidadUMA ?? null,
          requiere_atencion: this.data?.requiere_atencion,
          fecha_atencion: this.data?.fecha_atencion,


          numeroCliente: this.data?.numeroCliente ??  null,
          minutosSinLuz: this.data?.minutosSinLuz ??  null,
          periodoCorte: this.data?.periodoCorte ??  null,

              // 📌 Extras
          estadoHonorariosAlzadaSeleccionado: this.data?.estadoHonorariosAlzadaSeleccionado ?? null,
          subEstadoHonorariosAlzadaSeleccionado: this.data?.subEstadoHonorariosAlzadaSeleccionado ?? null,
          fechaHonorariosAlzada: this.data?.fechaHonorariosAlzada ?? null,
          umaSeleccionado_alzada: this.data?.umaSeleccionado_alzada ?? null,
          cantidadUMA_alzada: this.data?.cantidadUMA_alzada ?? null,
          montoAcuerdo_alzada: this.data?.montoAcuerdo_alzada ?? null,

          estadoHonorariosEjecucionSeleccionado: this.data?.estadoHonorariosEjecucionSeleccionado ?? null,
          subEstadoHonorariosEjecucionSeleccionado: this.data?.subEstadoHonorariosEjecucionSeleccionado ?? null,
          fechaHonorariosEjecucion: this.data?.fechaHonorariosEjecucion ?? null,
          umaSeleccionado_ejecucion: this.data?.umaSeleccionado_alzada ?? null,
          cantidadUMA_ejecucion: this.data?.cantidadUMA_alzada ?? null,
          montoHonorariosEjecucion: this.data?.montoHonorariosEjecucion ?? null,

          estadoHonorariosDiferenciaSeleccionado: this.data?.estadoHonorariosDiferenciaSeleccionado ?? null,
          subEstadoHonorariosDiferenciaSeleccionado: this.data?.subEstadoHonorariosDiferenciaSeleccionado ?? null,
          fechaHonorariosDiferencia: this.data?.fechaHonorariosDiferencia ?? null,
          montoHonorariosDiferencia: this.data?.montoHonorariosDiferencia ?? null,

            honorarioAlzadaCobrado: this.data?.honorarioAlzadaCobrado ?? null,
            fechaCobroAlzada: this.data?.fechaCobroAlzada ?? null,

            honorarioEjecucionCobrado: this.data?.honorarioEjecucionCobrado ?? null,
            fechaCobroEjecucion: this.data?.fechaCobroEjecucion ?? null,

            honorarioDiferenciaCobrado: this.data?.honorarioDiferenciaCobrado ?? null,
            fechaCobroDiferencia: this.data?.fechaCobroDiferencia ?? null,
            capitalPagoParcial: this.data?.capitalPagoParcial



        };
    
        this.dialogRef.close(expediente);
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

    /*
          juzgado: new FormControl('', [Validators.required]),
      demandado: new FormControl('', [Validators.required]),  
      numero: new FormControl('', [Validators.required, Validators.min(0), Validators.max(999999)]),  
      anio: new FormControl('', [Validators.required]),  
      juicio: new FormControl('', [Validators.required]),
      estado: new FormControl('', [Validators.required]),
      fechaInicio: new FormControl('', [Validators.required]),
      tipo: new FormControl('todos', [Validators.required]),

    */
     public obtenerCamposFaltantes(): string[] {
      const camposObligatorios = [
        { nombre: 'juzgado', control: 'juzgado' },
        { nombre: 'demandado', control: 'demandado' },
        { nombre: 'numero', control: 'numero' },
        { nombre: 'anio', control: 'anio' },
        { nombre: 'juicio', control: 'juicio' },
        { nombre: 'estado', control: 'estado' },
        { nombre: 'fechaInicio', control: 'fechaInicio' },
        { nombre: 'tipo', control: 'tipo' },
        { nombre: 'porcentaje', control: 'porcentaje' },
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
}
