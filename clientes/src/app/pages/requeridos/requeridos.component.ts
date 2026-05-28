import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { IonLabel } from "@ionic/angular/standalone";
import {
  ESTADOS_EXPEDIENTE,
  ESTADOS_BLOQUEADOS,
  COBRADO_BLOQUEADO
} from 'src/app/config/estados-expediente.config';

@Component({
  selector: 'app-requeridos',
  templateUrl: './requeridos.component.html',
  styleUrls: ['./requeridos.component.scss'],
  standalone: true,
  imports: [IonLabel, 
    CommonModule,
    FormsModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule,
  ],
})
export class RequeridosPage implements OnInit, OnDestroy {

  expedientes: any[] = [];
  expedientesOriginales: any[] = [];
  expedientesPaginados: any[] = [];

  busqueda: string = '';
  cargando: boolean = true;

  ordenCampo: string = 'fecha_requerido';
  ordenAscendente: boolean = true;

  listaUsuarios: UsuarioModel[] = [];
  listaJuzgados: any[] = [];

  tiposJuzgado: string[] = ['CCF', 'COM', 'CIV', 'CC'];
  tipoSeleccionado: string = '';
  juzgadoSeleccionado: string = '';
  juicioSeleccionado: string = '';
  abogadoSeleccionado: string = '';
  procuradorSeleccionado: string = '';
  estadoSeleccionado: string = '';

  tabActiva: 'sentencia' | 'sin-sentencia' = 'sentencia';

  tiposJuicio: string[] = ['sumarisimo', 'ordinario', 'a definir'];

  estados: string[] = ESTADOS_EXPEDIENTE.filter(
    e => !COBRADO_BLOQUEADO.includes(e)
  );

  // Paginador
  pageSize: number = 20;
  pageIndex: number = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarExpedientes();
    this.juzgadoService.getJuzgados().subscribe(j => this.listaJuzgados = j);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────
  cargarExpedientes(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.expedienteService.getExpedientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expedientes) => {
          const filtrados = (expedientes ?? []).filter(e =>
            e.estado !== 'eliminado' && e.estado !== 'Archivo' && e.fecha_atencion
          );
          this.expedientesOriginales = filtrados;
          this.pageIndex = 0;
          this.filtrar();
          this.actualizarPagina();
          this.cargando = false;
          this.cdr.detectChanges();

this.expedientesOriginales.forEach(exp => {
  this.juzgadoService.getJuzgadoPorId(exp.juzgado_id).subscribe(j => {
    exp.juzgadoModel = j;

    this.filtrar();
            });
          });
        },
        error: (err) => {
          console.error('Error al obtener expedientes:', err);
          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }

  cargarUsuarios(): void {
    this.usuarioService.getUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (u) => this.listaUsuarios = u,
        error: (e) => console.error('Error al obtener usuarios:', e)
      });
  }

  // ── Paginador ──────────────────────────────────────────────
  actualizarPagina(): void {
    const ordenados = this.honorariosDiferidosOrdenados;
    const start = this.pageIndex * this.pageSize;
    this.expedientesPaginados = ordenados.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  // ── Filtro ─────────────────────────────────────────────────
  filtrar(): void {
    const texto = (this.busqueda || '').toLowerCase().trim();
    const textoNorm = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    this.expedientes = this.expedientesOriginales.filter(exp => {
      const esSentencia =
        String(exp.estado || '').trim().toLowerCase() === 'sentencia';

      const tabOk =
        this.tabActiva === 'sentencia'
          ? esSentencia
          : !esSentencia;

      const tipoExp =
        exp.juzgadoModel?.tipo ||
        exp.tipo ||
        exp.juzgado_tipo ||
        '';

      const tipoOk =
        this.tipoSeleccionado
          ? String(tipoExp).trim().toUpperCase() ===
            String(this.tipoSeleccionado).trim().toUpperCase()
          : true;

      const juzgadoOk =
        this.juzgadoSeleccionado
          ? Number(exp.juzgado_id) === Number(this.juzgadoSeleccionado)
          : true;

      const abogadoOk =
        this.abogadoSeleccionado
          ? Number(exp.usuario_id) === Number(this.abogadoSeleccionado)
          : true;

      const procuradorOk =
        this.procuradorSeleccionado
          ? Number(exp.procurador_id) === Number(this.procuradorSeleccionado)
          : true;

      const juicioOk =
        this.juicioSeleccionado
          ? String(exp.juicio || '').toLowerCase() === this.juicioSeleccionado.toLowerCase()
          : true;

      const matchParte = (p: any) => {
        if (!p) return false;

        const textoParte = [
          p.nombre,
          p.apellido,
          p.razonSocial,
          p.razon_social
        ].join(' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

        return textoParte.includes(textoNorm);
      };

      const numeroOk = String(exp.numero || '').includes(texto);
      const anioOk = String(exp.anio || '').includes(texto);
      const actoraOk = exp.clientes?.some(matchParte) ?? false;
      const demandadoOk = exp.demandados?.some(matchParte) ?? false;
      const caratulaOk = String(exp.caratula || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(textoNorm);

      const busquedaOk =
        !texto ||
        numeroOk ||
        anioOk ||
        actoraOk ||
        demandadoOk ||
        caratulaOk;

      return (
        tabOk &&
        tipoOk &&

        juzgadoOk &&
        abogadoOk &&
        procuradorOk &&
        juicioOk &&
        busquedaOk
      );
    });

    this.pageIndex = 0;
    this.actualizarPagina();
  }

  // ── Ordenamiento ───────────────────────────────────────────
  /*get honorariosDiferidosOrdenados(): any[] {
    return [...this.expedientes].sort((a, b) => {
      const vA = this.obtenerValorOrden(a, this.ordenCampo);
      const vB = this.obtenerValorOrden(b, this.ordenCampo);
      if (vA < vB) return this.ordenAscendente ? -1 : 1;
      if (vA > vB) return this.ordenAscendente ? 1 : -1;
      return 0;
    });
  }*/


    get honorariosDiferidosOrdenados(): any[] {
      return [...this.expedientes].sort((a, b) => {

        // 🔴 1. PRIORIDAD: SENTENCIA ARRIBA
        if (a.estado === 'Sentencia' && b.estado !== 'Sentencia') return -1;
        if (a.estado !== 'Sentencia' && b.estado === 'Sentencia') return 1;

        // 🔵 2. ORDEN POR FECHA_REQUERIDO
        if (this.ordenCampo === 'fecha_requerido') {
          const fechaA = a.fecha_atencion ? new Date(a.fecha_atencion).getTime() : 0;
          const fechaB = b.fecha_atencion ? new Date(b.fecha_atencion).getTime() : 0;
          return this.ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
        }

        // 🟡 3. RESTO NORMAL
        const vA = this.obtenerValorOrden(a, this.ordenCampo);
        const vB = this.obtenerValorOrden(b, this.ordenCampo);

        if (vA < vB) return this.ordenAscendente ? -1 : 1;
        if (vA > vB) return this.ordenAscendente ? 1 : -1;
        return 0;
      });
    }

    obtenerValorOrden(item: any, campo: string): any {
      switch (campo) {
        case 'numero':
          return `${item.numero}/${item.anio}`;

        case 'caratula':
          return (item.caratula || '').toLowerCase();

        case 'ultimo_movimiento':
          return item.ultimo_movimiento;

        case 'fecha_requerido':
          return item.fecha_atencion
            ? new Date(item.fecha_atencion).getTime()
            : 0;

        case 'abogado':
          return this.listaUsuarios.find(u => u.id === item.usuario_id)?.nombre ?? '';

        case 'procurador':
          return this.listaUsuarios.find(u => u.id === item.procurador_id)?.nombre ?? '';

        case 'dias_ultimo_movimiento':
          return this.diasDesdeUltimoMovimiento(item.ultimo_movimiento);

        case 'estado':
          return item.estado;

        default:
          return '';
      }
    }

  ordenarPor(campo: string): void {
    if (this.ordenCampo === campo) {
      this.ordenAscendente = !this.ordenAscendente;
    } else {
      this.ordenCampo = campo;
      this.ordenAscendente = true;
    }
    this.actualizarPagina();
  }

  // ── Helpers ────────────────────────────────────────────────
  getNombreAbogado(usuario_id: any): string {
    if (!usuario_id || +usuario_id === 0) return 'Sin abogado';
    return this.listaUsuarios.find(u => +u.id === +usuario_id)?.nombre ?? 'Sin abogado';
  }

  diasDesdeUltimoMovimiento(fecha: string): number {
    return Math.floor((new Date().getTime() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
  }

  estadoVencimiento(exp: any): string {
    if (!exp.ultimo_movimiento || !exp.juicio) return 'Sin datos';
    const dias = this.diasDesdeUltimoMovimiento(exp.ultimo_movimiento);
    const juicio = exp.juicio.toLowerCase();
    if (juicio === 'sumarisimo') return dias > 70  ? `⚠️ ${dias} días` : `✅ ${dias} días`;
    if (juicio === 'ordinario')  return dias > 160 ? `⚠️ ${dias} días` : `✅ ${dias} días`;
    return `${dias} días`;
  }

  mostrarFecha(fecha: string | null | undefined): string {
    if (!fecha) return '';
    const partes = fecha.split(' ')[0].split('T')[0].split('-');
    if (partes.length !== 3) return '';
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  verificarRol(): boolean {
    return this.usuarioService.usuarioLogeado?.rol === 'admin';
  }

  goTo(ruta: string): void {
    this.router.navigate([ruta]);
  }

  // ── Tabs ────────────────────────────────────────────────
  get listaSentencia(): any[] {
    return this.expedientesOriginales.filter(exp =>
      String(exp.estado || '').toLowerCase() === 'sentencia'
    );
  }

  get listaSinSentencia(): any[] {
    return this.expedientesOriginales.filter(exp =>
      String(exp.estado || '').toLowerCase() !== 'sentencia'
    );
  }
}