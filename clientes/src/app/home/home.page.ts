import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { forkJoin } from 'rxjs';

import { ExpedientesService } from 'src/app/services/expedientes.service';
import { UsuarioService } from '../services/usuario.service';

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

  constructor(
    private router: Router,
    private expedienteService: ExpedientesService,
    public usuarioService: UsuarioService,
  ) {}

  ngOnInit(): void {
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
}