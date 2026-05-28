import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

import { ExpedientesService } from 'src/app/services/expedientes.service';
import { UsuarioService } from '../services/usuario.service';
import { DemandadosService } from '../services/demandado.service';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';

import { forkJoin, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
  ],
})
export class HomePage implements OnInit {

  expedientesActivos: number = 0;
  clientesRegistrados: number = 0;
  sentenciasEmitidas: number = 0;
  honorariosPendientes: number = 0;
  cargando: boolean = true;
  hoy: Date = new Date();
  tabHoy: 'expedientes' | 'oficios' = 'expedientes';

  expedientesAtencionHoy: any[] = [];
  oficiosHoy: any[] = [];

  constructor(
    private router: Router,
    private expedienteService: ExpedientesService,
    public usuarioService: UsuarioService,
    private demandadoService: DemandadosService
  ) {}

  ngOnInit(): void {
    this.cargarAgendaHoy();
    // Cargar todo junto y apagar el skeleton cuando terminen todos
    forkJoin({
      activos:    this.expedienteService.obtenerCantidadExpedientesActivos(),
      clientes:   this.expedienteService.obtenerCantidadClientesRegistrados(),
      sentencias: this.expedienteService.obtenerCantidadSentenciasEmitidas(),
      honorarios: this.expedienteService.obtenerCantidadHonorariosPendientes(),
    }).subscribe({
      next: (data) => {
        this.expedientesActivos   = data.activos;
        this.clientesRegistrados  = data.clientes;
        this.sentenciasEmitidas   = data.sentencias;
        this.honorariosPendientes = data.honorarios;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  goTo(path: string): void {
    this.router.navigate([path], { replaceUrl: true });
  }

  verificarRol(): boolean {
    return this.usuarioService.usuarioLogeado?.rol === 'admin';
  }

    mostrarFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const partes = fecha.split(' ')[0].split('T')[0].split('-');
    if (partes.length !== 3) return '';
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

cargarAgendaHoy(): void {
  this.expedienteService.getAgendaHoy().pipe(
    switchMap((data: any[]) => {
      const agendaHoy = data || [];

      this.expedientesAtencionHoy = agendaHoy.filter(x => x.tipo === 'expediente');

      const pruebas = agendaHoy.filter(x => x.tipo !== 'expediente');

      if (pruebas.length === 0) return of([]);

      return forkJoin(
        pruebas.map(prueba =>
          forkJoin({
            expedienteModel: this.expedienteService.getExpedientePorId(prueba.expediente_id).pipe(
              catchError(() => of(null))
            ),
            demandadoModel: prueba.demandado_id
              ? this.demandadoService.getDemandadoPorId(prueba.demandado_id).pipe(
                  catchError(() => of(null))
                )
              : of(null)
          }).pipe(
            map(({ expedienteModel, demandadoModel }) => ({
              ...prueba,
              expedienteModel,
              demandadoModel
            }))
          )
        )
      );
    })
  ).subscribe({
    next: (pruebasConModelos: any[]) => {
      this.oficiosHoy = pruebasConModelos;
    },
    error: (err) => {
      console.error('Error cargando agenda de hoy:', err);
    }
  });
}
}