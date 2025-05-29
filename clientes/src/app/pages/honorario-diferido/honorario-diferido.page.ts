import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subscription, Observable, forkJoin, Subject } from 'rxjs';


import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { IonList, IonItemSliding, IonLabel, IonItem, IonInput } from "@ionic/angular/standalone";

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

import Swal from 'sweetalert2'


@Component({
  selector: 'app-honorario-diferido',
  templateUrl: './honorario-diferido.page.html',
  styleUrls: ['./honorario-diferido.page.scss'],
  standalone: true,
    imports: [IonInput, IonItem, IonLabel, IonItemSliding, IonList, CommonModule, FormsModule,
      MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
      MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatMenuModule, MatProgressSpinnerModule,
      MatSelectModule,
      MatOptionModule,
    ]
})
export class HonorarioDiferidoPage implements OnInit {

  cargando: boolean = false;
  honorariosDiferidos: any[] = [];
  honorariosOriginales: any[] = [];

  hayHonorarios: boolean = true;
  private destroy$ = new Subject<void>();
  busqueda: string = '';

  ordenCampo: string = '';
  ordenAscendente: boolean = true;

  estado: string = 'sentencia'; // o 'cobrado'

  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,

    private router: Router
  ) {}

  ngOnInit() {
    this.cargarHonorariosDiferidos();
    //this.cargarPorEstado('cobrado');

  }
  cargarHonorariosDiferidos() {
    this.cargando = true;
    this.expedienteService.getHonorarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (honorarios) => {
          this.honorariosDiferidos = honorarios;
          this.hayHonorarios = this.honorariosDiferidos.length > 0;

      
  
          // ✅ Solo agregar el juzgado a cada expediente
          this.honorariosDiferidos.forEach(expediente => {
            this.juzgadoService.getJuzgadoPorId(expediente.juzgado_id).subscribe(juzgado => {
              expediente.juzgadoModel = juzgado;

            });
          });
  
          this.cargando = false;
        },
        (error) => {
          console.error('Error al obtener expedientes:', error);
          this.cargando = false;
        }
      );
  }
  
  cargarPorEstado(estado: string) {
    this.cargando = true;
    this.expedienteService.getExpedientesPorEstado(estado)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (honorarios) => {
          //this.honorariosDiferidos = honorarios;
          this.honorariosDiferidos = honorarios;
          this.hayHonorarios = this.honorariosDiferidos.length > 0;
  
          this.honorariosDiferidos.forEach(expediente => {
            this.juzgadoService.getJuzgadoPorId(expediente.juzgado_id).subscribe(juzgado => {
              expediente.juzgadoModel = juzgado;
            });
          });
  
          this.busqueda = '';
          this.cargando = false;
        },
        (error) => {
          console.error('Error al obtener expedientes:', error);
          this.cargando = false;
        }
      );
  }

  

  goTo(ruta: string) {
    this.router.navigate([ruta]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  cambiarEstado(event: Event) {
    const selectedValue = (event.target as HTMLSelectElement).value;
    console.log('Estado seleccionado:', selectedValue);
    
    this.estado = selectedValue;
  
    if (selectedValue === 'todos') {
      this.cargarHonorariosDiferidos();
    } else {  
      //this.cargarPorEstado(selectedValue);
    }
  }

  async buscar() {
    this.expedienteService.buscarExpedientes(this.busqueda).subscribe(
      (expediente) => {
        this.honorariosDiferidos = expediente;
        this.honorariosOriginales = [...expediente];
        this.hayHonorarios = this.honorariosDiferidos.length > 0;

        this.honorariosDiferidos.forEach(expediente => {
          this.juzgadoService.getJuzgadoPorId(expediente.juzgado_id).subscribe(juzgado => {
            expediente.juzgadoModel = juzgado;
          });
        });
        //this.texto = 'No se encontraron expedientes';
      },
      (error) => {
        console.error('Error al obtener expedientes:', error);
      },
      
    );
}

obtenerJuzgado(id: number){

}



get honorariosDiferidosOrdenados() {
  return [...this.honorariosDiferidos].sort((a, b) => {
    const campo = this.ordenCampo;

    const valorA = this.obtenerValorOrden(a, campo);
    const valorB = this.obtenerValorOrden(b, campo);

    if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
    if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
    return 0;
  });
}

ordenarPor(campo: string) {
  if (this.ordenCampo === campo) {
    this.ordenAscendente = !this.ordenAscendente;
  } else {
    this.ordenCampo = campo;
    this.ordenAscendente = true;
  }
}

obtenerValorOrden(item: any, campo: string): any {
  switch (campo) {
    case 'numero': return `${item.numero}/${item.anio}`;
    case 'caratula':
      return item.clientes.length > 0
        ? `${item.clientes[0].nombre} ${item.clientes[0].apellido}`
        : '(sin actora)';
    case 'estadoCapital':
      return item.subEstadoCapitalSeleccionado || item.estadoLiquidacionCapitalSeleccionado || '';
    case 'fechaCapital':
      return item.fechaCapitalSubestado || item.fechaLiquidacionCapital || '';
    case 'estadoHonorarios':
      return item.subEstadoHonorariosSeleccionado || item.estadoLiquidacionHonorariosSeleccionado || '';
    case 'fechaHonorarios':
      return item.fechaHonorariosSubestado || item.fechaLiquidacionHonorarios || '';
    default:
      return '';
  }
}



//////////////////////////

cobrar(tipo: 'capital' | 'honorario', expediente: ExpedienteModel) {
  Swal.fire({
    title: `¿Seguro que querés cobrar el ${tipo === 'capital' ? 'capital' : 'honorario'}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, cobrar',
    cancelButtonText: 'Cancelar',
  }).then((result) => {
    if (result.isConfirmed) {
      // Marcar como cobrado
      if (tipo === 'capital') {
        expediente.capitalCobrado = true;
      } else if (tipo === 'honorario') {
        expediente.honorarioCobrado = true;
      }

      const ambosCobrados = expediente.capitalCobrado && expediente.honorarioCobrado;

      if (ambosCobrados) {
        expediente.estado = 'cobrado';
      }

      this.expedienteService.actualizarExpediente(expediente.id, expediente).subscribe({
        next: () => {
          this.cargarPorEstado('sentencia');

          if (ambosCobrados) {
            // 🔥 Removemos el expediente de la lista
            this.honorariosDiferidos = this.honorariosDiferidos.filter(e => e.id !== expediente.id);

            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "success",
              title: "Se cobró el capital y el honorario. Estado actualizado a COBRADO.",
              showConfirmButton: false,
              timer: 3000
            });
          } else if (tipo === 'capital') {
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "success",
              title: "Capital cobrado correctamente.",
              showConfirmButton: false,
              timer: 3000
            });
          } else if (tipo === 'honorario') {
            Swal.fire({
              toast: true,
              position: "top-end",
              icon: "success",
              title: "Honorario cobrado correctamente.",
              showConfirmButton: false,
              timer: 3000
            });
          }
        },
        error: (err) => {
          console.error('Error al actualizar el expediente:', err);
          if (tipo === 'capital') expediente.capitalCobrado = false;
          if (tipo === 'honorario') expediente.honorarioCobrado = false;

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: "Error al cobrar. Intentalo nuevamente.",
            showConfirmButton: false,
            timer: 3000
          });
        }
      });
    }
  });
}


  
}