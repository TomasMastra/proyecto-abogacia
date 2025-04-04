import { Component, Inject } from '@angular/core';
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
    MatIconModule   
  ]
})
export class DialogExpedienteComponent {
  protected form: FormGroup;

   juzgados: JuzgadoModel[] = [];
   demandados: DemandadoModel[] = [];
   clientes: ClienteModel[] = [];
   clientesAgregados: ClienteModel[] = [];
   jueces: JuezModel[] = [];


   estados: any[] = ['en gestíon', 'inicio', 'prueba', 'clausura p.', 'fiscal', 'sentencia'];
   estadoSeleccionado: any = 'inicio';

   juicios: any[] = ['ordinario', 'sumarisimo'];
   juicioSeleccionado: any;

   menu: string = '1';

    private destroy$ = new Subject<void>(); 
    juzgadoElegido: any; 
    demandadoElegido: any;
    clienteSeleccionado: any; 
    juezSeleccionado: any;

/*
  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private demandadoService: DemandadosService,
    private clienteService: ClientesService,


    public dialogRef: MatDialogRef<DialogExpedienteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {

    this.form = new FormGroup({
      //titulo: new FormControl('', [Validators.required]),  
      //descripcion: new FormControl('', [ Validators.minLength(6), Validators.maxLength(200)]),  
      juzgado: new FormControl('', [Validators.required]),
      demandado: new FormControl('', [Validators.required]),  
      numero: new FormControl('', [Validators.required, Validators.min(0), Validators.max(999999)]),  
      anio: new FormControl('', [Validators.required]),  
      clientes: new FormArray([])  // FormArray para los clientes


    });

    if (data) {
      this.form.setValue({
        //titulo: data.titulo || '',
        //descripcion: data.descripcion || '',  
        juzgado: data.juzgado || '' , 
        demandado: data.demandado || '',
        numero: data.numero || '', 
        anio: data.anio || ''  


      });
    }
  }*/


    constructor(
      private expedienteService: ExpedientesService,
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

      });
    
      // Si hay datos para cargar, asignarlos al formulario
      if (data) {
        this.form.setValue({
          juzgado: data.juzgado || '',
          demandado: data.demandado || '',
          numero: data.numero || '',
          anio: data.anio || '',
          estado: data.estado || '',

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


    this.form.get('estado')?.valueChanges.subscribe(estado => {
      this.estadoSeleccionado = estado;  // Puedes actualizar el valor si lo necesitas
      //this.actualizarValidadoresPorEstado(estado);  // Para actualizar los validadores según el estado
    });

  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  cargarJuzgado() {
    this.juzgadoService.getJuzgados()
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
          this.clientes = cliente;
          console.log(this.clientes);

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
        juzgado_id: this.juzgadoElegido?.id ?? null,
        demandado_id: this.demandadoElegido?.id ?? null,
        numero: this.form.value.numero,
        anio: this.form.value.anio,
        demandadoModel: { id: '', nombre: '', estado: '' },
        estado: this.estadoSeleccionado, // Este es el valor por defecto. Se actualizaría si el estado es 'sentencia'.
        sala_radicacion: null,
        honorario: this.form.value.honorario ?? null,
        fecha_inicio: this.form.value.fecha_inicio ?? new Date().toISOString().split('T')[0],
        fecha_sentencia: null,
        hora_sentencia: null,
        juez_id: this.juezSeleccionado?.id ?? null,
        juezModel: { id: '', nombre: '' },
        juicio: this.juicioSeleccionado,
        ultimo_movimiento: this.data?.ultimo_movimiento,
        monto: null,
        apela: null


      };

    this.dialogRef.close(expediente);
  }else {

  }
}
  

  seleccionarCliente(cliente: ClienteModel): void {
    // Mostrar una alerta (opcional, para ver el cliente seleccionado)
    console.log("Cliente seleccionado:", cliente);
    
    // Asignar el cliente seleccionado a la variable clienteSeleccionado
    this.clienteSeleccionado = cliente;
  
    // Verificar si el cliente ya está agregado a la lista
    if (this.clientesAgregados.indexOf(cliente) === -1) {
      // Si no está en la lista, agregarlo
      this.clientesAgregados.push(cliente);
    }
  }
  
  

  agregarCliente(): void {


    if (this.clienteSeleccionado) {
      this.clientesAgregados.push(this.clienteSeleccionado);  // Agregar cliente al expediente
      this.clienteSeleccionado = null;  // Limpiar la selección
    }
  }

  eliminarCliente(cliente: ClienteModel): void {
    const index = this.clientesAgregados.indexOf(cliente);
    if (index > -1) {
      this.clientesAgregados.splice(index, 1);  // Eliminar cliente de la lista
    }
  }



}
