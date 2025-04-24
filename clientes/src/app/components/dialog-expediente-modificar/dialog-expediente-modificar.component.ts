import { Component, OnInit, Inject } from '@angular/core';


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

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';

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
    MatCardModule
  ]
})

export class DialogExpedienteModificarComponent   {
 protected form: FormGroup;
  juzgados: JuzgadoModel[] = [];
  demandados: DemandadoModel[] = [];
  clientes: ClienteModel[] = [];
  clientesAgregados: ClienteModel[] = [];

  private destroy$ = new Subject<void>(); 
  juzgadoElegido: any; 
  demandadoElegido: any;
  clienteSeleccionado: any; 

  estados: any[] = ['en gestíon', 'inicio', 'prueba', 'clausura p.', 'fiscal', 'sentencia'];
  estadoSeleccionado: any;

  juicios: any[] = ['ordinario', 'sumarisimo'];
  juicioSeleccionado: any;

  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
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


    });

    if (data) {
      
      this.form.setValue({ 
        juzgado: data.juzgado_id || '' , 
        demandado: data.demandado_id || '',
        numero: data.numero || '', 
        anio: data.anio || ''  ,
        juicio: data.juicio,
        estado: data.estado,
        fechaInicio: data.fecha_inicio
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
    this.cargarDemandado();
    this.cargarClientes();

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
                // Si ya hay un juzgado seleccionado, asignarlo al formulario
                if (this.data && this.data.juzgado_id) {
                  const juzgadoSeleccionado = this.juzgados.find(j => +j.id === this.data.juzgado_id);
                  this.form.get('juzgado')?.setValue(juzgadoSeleccionado || '');
                  this.juzgadoElegido = juzgadoSeleccionado;
                }
              },
              (error) => {
                console.error('Error al obtener juzgados:', error);
              }
            );
        }

        cargarDemandado() {
          this.demandadoService.getDemandados()
            .pipe(takeUntil(this.destroy$))
            .subscribe(
              (demandados) => {
                this.demandados = demandados;
                // Si ya hay un demandado seleccionado, asignarlo al formulario
                if (this.data && this.data.demandado_id) {
                  const demandadoSeleccionado = this.demandados.find(d => +d.id === this.data.demandado_id);
                  this.form.get('demandado')?.setValue(demandadoSeleccionado || '');
                  this.demandadoElegido = demandadoSeleccionado;
                }
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
                this.clientesAgregados = this.data.clientes;
                console.log(this.clientes);
      
              },
              (error) => {
                console.error('Error al obtener clientes:', error);
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

          // modificar
          juez_id: null,
          juezModel: { id: '', nombre: '', apellido: '', estado: '' },
          juicio: this.juicioSeleccionado,
          ultimo_movimiento: this.data?.ultimo_movimiento,
          monto: this.data?.monto,
          apela: this.data?.apela,
          juzgadoModel: null,

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
          cantidadUMA:  this.data?.cantidadUMA ??  null,



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
    }
    
    seleccionarCliente(cliente: ClienteModel): void {    
      this.clienteSeleccionado = cliente;
      const clienteExiste = this.clientesAgregados.some((c) => c.id === cliente.id);
    
      if (!clienteExiste) {
        this.clientesAgregados.push(cliente);
        console.log("Cliente agregado:", cliente);
      } else {
        console.log("Este cliente ya está agregado:", cliente);
      }
    }
    
      
      
    
      agregarCliente(): void {
        if (this.clienteSeleccionado) {
          this.clientesAgregados.push(this.clienteSeleccionado);
          this.clienteSeleccionado = null;
        }
      }
    
      eliminarCliente(cliente: ClienteModel): void {
        const index = this.clientesAgregados.indexOf(cliente);
        if (index > -1) {
          this.clientesAgregados.splice(index, 1);
        }
      }
}
