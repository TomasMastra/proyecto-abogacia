import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

import { IonList, IonItemSliding, IonLabel, IonItem, IonInput, IonHeader, IonToolbar } from "@ionic/angular/standalone";

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { UsuarioService } from 'src/app/services/usuario.service';

import { UsuarioModel } from 'src/app/models/usuario/usuario.component';

@Component({
  selector: 'app-lista-mediaciones',
  templateUrl: './lista-mediaciones.page.html',
  styleUrls: ['./lista-mediaciones.page.scss'],
  standalone: true,
  imports: [IonToolbar, IonHeader, 
    IonInput, IonItem, IonLabel, IonItemSliding, IonList,
    CommonModule, FormsModule,
    MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule,
    MatMenuModule, MatProgressSpinnerModule, MatSelectModule, MatOptionModule
  ]
})
export class ListaMediacionesPage implements OnInit, OnDestroy {

  cargando: boolean = false;
  mediaciones: any[] = [];
  mediacionesOriginales: any[] = [];
  hayMediaciones: boolean = true;

  private destroy$ = new Subject<void>();

  busqueda: string = '';

  ordenCampo: string = '';
  ordenAscendente: boolean = true;

  listaUsuarios: UsuarioModel[] = [];
  listaJuzgados: any[] = [];

  tiposJuzgado: string[] = ['CCF', 'COM', 'CIV', 'CC'];
  tipoSeleccionado: string = '';
  juzgadoSeleccionado: string = '';

  abogadoSeleccionado: string = '';
  procuradorSeleccionado: string = '';

  estadosMediacion: string[] = [
    'Pendiente',
    'Continua',
    'Cerrado sin acuerdo'
  ];
  estadoSeleccionado: string = '';

  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarMediaciones();

    this.juzgadoService.getJuzgados()
      .pipe(takeUntil(this.destroy$))
      .subscribe(juzgados => {
        this.listaJuzgados = juzgados || [];
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goTo(ruta: string) {
    this.router.navigate([ruta]);
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios) => {
          this.listaUsuarios = usuarios || [];
        },
        error: (error) => {
          console.error('Error al obtener usuarios:', error);
        }
      });
  }

  cargarMediaciones() {
    this.cargando = true;

    this.expedienteService.getExpedientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expedientes) => {
          const filtradas = (expedientes || []).filter((expediente: any) => {
            const esMediacion =
              (expediente.tipo_registro ?? '').toString().toLowerCase() === 'mediacion';

            const estado = (expediente.estado ?? '').toString().toLowerCase();

            return esMediacion &&
                   estado !== 'cerrado con acuerdo' &&
                   estado !== 'cobrado';
          });

          this.mediaciones = filtradas;
          this.mediacionesOriginales = [...filtradas];
          this.hayMediaciones = this.mediaciones.length > 0;

          this.mediaciones.forEach(mediacion => {
            if (mediacion.juzgado_id) {
              this.juzgadoService.getJuzgadoPorId(mediacion.juzgado_id).subscribe(juzgado => {
                mediacion.juzgadoModel = juzgado;
              });
            }
          });

          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al obtener mediaciones:', error);
          this.cargando = false;
        }
      });
  }

  getNombreAbogado(usuario_id: any): string {
    if (usuario_id === null || usuario_id === undefined || usuario_id === '' || +usuario_id === 0) {
      return 'Sin abogado';
    }

    const id = +usuario_id;
    const abogado = this.listaUsuarios.find(u => +u.id === id);
    return abogado ? `${abogado.nombre}` : 'Sin abogado';
  }

  getNombreProcurador(usuario_id: any): string {
    if (usuario_id === null || usuario_id === undefined || usuario_id === '' || +usuario_id === 0) {
      return 'Sin procurador';
    }

    const id = +usuario_id;
    const procurador = this.listaUsuarios.find(u => +u.id === id);
    return procurador ? `${procurador.nombre}` : 'Sin procurador';
  }

  get mediacionesOrdenadas() {
    return [...this.mediaciones].sort((a, b) => {
      const valorA = this.obtenerValorOrden(a, this.ordenCampo);
      const valorB = this.obtenerValorOrden(b, this.ordenCampo);

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
      case 'numero':
        return `${item.numero || ''}/${item.anio || ''}`;

      case 'caratula':
        return (item.caratula || '').toLowerCase();

      case 'estado':
        return (item.estado || '').toLowerCase();

      case 'abogado': {
        const abogado = this.listaUsuarios.find(u => u.id === item.usuario_id);
        return abogado ? abogado.nombre.toLowerCase() : 'sin abogado';
      }

      case 'procurador': {
        const procurador = this.listaUsuarios.find(u => u.id === item.procurador_id);
        return procurador ? procurador.nombre.toLowerCase() : 'sin procurador';
      }

      default:
        return '';
    }
  }

  filtrar() {
    const texto = (this.busqueda || '').toLowerCase().trim();
    const textoNorm = texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    this.mediaciones = this.mediacionesOriginales.filter((mediacion: any) => {
      const tipoOk = this.tipoSeleccionado
        ? mediacion.juzgadoModel?.tipo === this.tipoSeleccionado
        : true;

      const juzgadoOk = this.juzgadoSeleccionado
        ? mediacion.juzgado_id === +this.juzgadoSeleccionado
        : true;

      const abogadoOk = this.abogadoSeleccionado
        ? +mediacion.usuario_id === +this.abogadoSeleccionado
        : true;

      const procuradorOk = this.procuradorSeleccionado
        ? +mediacion.procurador_id === +this.procuradorSeleccionado
        : true;

      const estadoOk = this.estadoSeleccionado
        ? (mediacion.estado || '').toLowerCase() === this.estadoSeleccionado.toLowerCase()
        : true;

      const numeroOk = mediacion.numero?.toString().includes(texto);
      const anioOk = mediacion.anio?.toString().includes(texto);

      const matchParte = (p: any) => {
        if (!p) return false;

        const n = p?.nombre?.toLowerCase() || '';
        const a = p?.apellido?.toLowerCase() || '';
        const rs = (p?.razonSocial ?? p?.razon_social ?? '').toLowerCase();
        const nf = (p?.nombreFantasia ?? p?.nombre_fantasia ?? '').toLowerCase();

        return (
          n.includes(texto) ||
          a.includes(texto) ||
          rs.includes(texto) ||
          nf.includes(texto) ||
          `${n} ${a}`.trim().includes(texto)
        );
      };

      const actoraOk =
        (mediacion.clientes?.some(matchParte) ?? false) ||
        ((mediacion as any).actoras?.some(matchParte) ?? false) ||
        ((mediacion as any).actorasEmpresas?.some(matchParte) ?? false) ||
        matchParte((mediacion as any).actora) ||
        matchParte((mediacion as any).actoraEmpresa);

      const demandadoOk =
        (mediacion.demandados?.some(matchParte) ?? false) ||
        ((mediacion as any).demandadosClientes?.some(matchParte) ?? false) ||
        matchParte((mediacion as any).demandado);

      const caratulaStr = (mediacion.caratula || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      const caratulaOk = textoNorm === '' || caratulaStr.includes(textoNorm);

      const busquedaOk = texto === '' || numeroOk || anioOk || actoraOk || demandadoOk || caratulaOk;

      return tipoOk && juzgadoOk && abogadoOk && procuradorOk && estadoOk && busquedaOk;
    });
  }
}