import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

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

import { IonList, IonItemSliding, IonLabel, IonItem, IonInput, IonHeader } from "@ionic/angular/standalone";

import { OficiosService } from 'src/app/services/oficios.service';
import { OficioModel } from 'src/app/models/oficio/oficio.component';
import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-consultas-oficio',
  templateUrl: './consultas-oficio.page.html',
  styleUrls: ['./consultas-oficio.page.scss'],
  standalone: true,
  imports: [IonHeader, IonInput, IonItem, IonLabel, IonItemSliding, IonList, CommonModule, FormsModule,
    MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatMenuModule, MatProgressSpinnerModule,
    MatSelectModule, MatOptionModule]
})
export class ConsultasOficioPage implements OnInit, OnDestroy {

  cargando = false;
  oficios: OficioModel[] = [];
  oficiosOriginales: OficioModel[] = [];
  hayOficios = true;

  estadoSeleccionado = 'todos';
  parteSeleccionada = '';
  demandadoSeleccionado = '';
  busqueda = '';

  demandados: DemandadoModel[] = [];
  partes = ['actora', 'demanda', 'tercero'];
  estados = ['diligenciado', 'pendiente', 'pedir reiteratoria', 'diligenciar'];

  ordenCampo: string = '';
  ordenAscendente: boolean = true;

  private destroy$ = new Subject<void>();

  constructor(
    private oficiosService: OficiosService,
    private demandadosService: DemandadosService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDemandados();
    this.cargarOficios();
  }

  cargarOficios() {
    this.cargando = true;
    this.oficiosService.getOficios()
      .pipe(takeUntil(this.destroy$))
      .subscribe((oficios) => {
        this.oficios = oficios?.filter(o => o.estado !== 'eliminado') ?? [];
        this.oficiosOriginales = [...this.oficios];
        this.hayOficios = this.oficios.length > 0;
        this.cargando = false;
      }, err => {
        console.error('Error al cargar oficios:', err);
        this.cargando = false;
      });
  }

  cargarDemandados() {
    this.demandadosService.getDemandados()
      .pipe(takeUntil(this.destroy$))
      .subscribe((demandados) => {
        this.demandados = demandados;
      }, err => {
        console.error('Error al cargar demandados:', err);
      });
  }

  filtrar() {
    const texto = this.busqueda.toLowerCase();

    this.oficios = this.oficiosOriginales.filter(oficio => {
      const estadoOk = this.estadoSeleccionado === 'todos' || oficio.estado === this.estadoSeleccionado;
      const parteOk = this.parteSeleccionada ? oficio.parte === this.parteSeleccionada : true;
      const demandadoOk = this.demandadoSeleccionado ? oficio.demandado_id === +this.demandadoSeleccionado : true;

      const expedienteOk = oficio.expedienteModel
        ? (`${oficio.expedienteModel.numero}/${oficio.expedienteModel.anio}`.includes(texto))
        : false;

      return estadoOk && parteOk && demandadoOk && (texto === '' || expedienteOk);
    });
  }
eliminarOficio(oficio: OficioModel) {
  Swal.fire({
    title: '¿Estás seguro?',
    text: 'Este oficio será marcado como eliminado.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      const actualizado: OficioModel = {
        ...oficio,
        estado: 'eliminado' as OficioModel['estado']
      };

      this.oficiosService.actualizarOficio(oficio.id!, actualizado).subscribe(() => {
        this.oficios = this.oficios.filter(o => o.id !== oficio.id);
        this.oficiosOriginales = this.oficiosOriginales.filter(o => o.id !== oficio.id);
        Swal.fire('Eliminado', 'El oficio fue marcado como eliminado.', 'success');
      });
    }
  });
}


  goTo(ruta: string) {
    this.router.navigate([ruta]);
  }

  ordenarPor(campo: string) {
    if (this.ordenCampo === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenCampo = campo;
      this.ordenAscendente = true;
    }
  }

  get oficiosOrdenados() {
    return [...this.oficios].sort((a, b) => {
      const valorA = this.obtenerValorOrden(a, this.ordenCampo);
      const valorB = this.obtenerValorOrden(b, this.ordenCampo);

      if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
      if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
      return 0;
    });
  }

  obtenerValorOrden(item: OficioModel, campo: string): any {
    switch (campo) {
      case 'numero':
        return item.expedienteModel ? `${item.expedienteModel.numero}/${item.expedienteModel.anio}` : '';
      case 'estado':
        return item.estado;
      case 'pate':
        return item.parte;
      case 'fecha_diligenciado':
        return item.fecha_diligenciado || '';
      default:
        return '';
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

