import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, Subscription } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { JurisprudenciasService } from 'src/app/services/jurisprudencias.service';
import { JurisprudenciaModel } from 'src/app/models/jurisprudencia/jurisprudencia.component';
import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { JuezService } from 'src/app/services/juez.service';
import { JuezModel } from 'src/app/models/juez/juez.component';
import { CodigosService } from 'src/app/services/codigos.service';
import { CodigoModel } from 'src/app/models/codigo/codigo.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';

import { MotivosService } from 'src/app/services/motivos.service';
import { MotivoModel } from 'src/app/models/motivo/motivo.component';
import Swal from 'sweetalert2';
import { IonItem, IonList, IonLabel } from "@ionic/angular/standalone";

@Component({
  selector: 'app-jurisprudencia',
  templateUrl: './jurisprudencias.page.html',
  styleUrls: ['./jurisprudencias.page.scss'],
  standalone: true,
  imports: [IonLabel, IonList, IonItem, 
    CommonModule, FormsModule,
    MatIconModule, MatPaginatorModule, MatTooltipModule, MatDialogModule,
  ],
})
export class JurisprudenciasPage implements OnInit, OnDestroy {

  private normalizar = (s: any) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  jurisprudencias: JurisprudenciaModel[] = [];
  jurisprudenciasOriginales: JurisprudenciaModel[] = [];
  listaPaginada: JurisprudenciaModel[] = [];

  clientes: ClienteModel[] = [];
  demandados: DemandadoModel[] = [];
  juzgados: JuzgadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = [];
  jueces: JuezModel[] = [];
  codigos: CodigoModel[] = [];
  expedientes: ExpedienteModel[] = [];
  motivos: MotivoModel[] = [];
  motivosOriginales: MotivoModel[] = [];

  juzgadoSeleccionado = '';
  motivoSeleccionado = '';
  juezSeleccionado = '';
  camaraSeleccionada = '';

  listaJuzgadosFiltro: any[] = [];
  listaMotivosFiltro: any[] = [];
  listaJuecesFiltro: any[] = [];
  listaCamarasFiltro: string[] = [];

  cargando = true;
  busqueda = '';

  pageSize = 20;
  pageIndex = 0;
  skeletonRows = Array(this.pageSize).fill(0);

  private destroy$ = new Subject<void>();

  constructor(
    private jurisprudenciasService: JurisprudenciasService,
    private clientesService: ClientesService,
    private demandadosService: DemandadosService,
    private motivoService: MotivosService,
    private juzgadosService: JuzgadosService,
    private juezService: JuezService,
    private codigosService: CodigosService,
    private expepedientesService: ExpedientesService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargarJurisprudencias();
    this.clientesService.getClientes().subscribe(c => this.clientes = c || []);
    this.demandadosService.getDemandados().subscribe(d => this.demandados = d || []);
    this.juzgadosService.getJuzgados().subscribe(j => { this.juzgadosOriginales = j || []; this.juzgados = [...this.juzgadosOriginales]; });
    this.juezService.getJuez().subscribe(j => this.jueces = j || []);
    this.codigosService.getCodigos().subscribe(c => this.codigos = c || []);
    this.cargarMotivos();
    this.expepedientesService.getExpedientes().subscribe({
      next: (e) => {
        console.log('EXPEDIENTES CARGADOS:', e);
        this.expedientes = e || [];
      },
      error: (err) => {
        console.error('ERROR GET EXPEDIENTES:', err);
        this.expedientes = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  armarFiltrosDesdeJurisprudencias(): void {
    const mapJuzgados = new Map<string, any>();
    const mapMotivos = new Map<string, any>();
    const mapJueces = new Map<string, any>();
    const setCamaras = new Set<string>();

    for (const j of this.jurisprudenciasOriginales || []) {
      if ((j as any).juzgado_id && (j as any).juzgado_nombre) {
        mapJuzgados.set(String((j as any).juzgado_id), {
          id: (j as any).juzgado_id,
          nombre: (j as any).juzgado_nombre
        });
      }

      if ((j as any).juez_id && (j as any).juez_nombre) {
        mapJueces.set(String((j as any).juez_id), {
          id: (j as any).juez_id,
          nombre: (j as any).juez_nombre
        });
      }

      if (Array.isArray((j as any).motivos)) {
        for (const m of (j as any).motivos) {
          if (m?.id && m?.nombre) {
            mapMotivos.set(String(m.id), {
              id: m.id,
              nombre: m.nombre
            });
          }
        }
      }

      if ((j as any).camara) {
        setCamaras.add(String((j as any).camara).trim());
      }
    }

    this.listaJuzgadosFiltro = Array.from(mapJuzgados.values())
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));

    this.listaJuecesFiltro = Array.from(mapJueces.values())
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));

    this.listaMotivosFiltro = (this.motivos || [])
      .filter(m => m.estado !== 'eliminado')
      .map(m => ({
        id: m.id,
        nombre: m.nombre
      }))
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre)));

    this.listaCamarasFiltro = Array.from(setCamaras)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }

  cargarJurisprudencias(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.jurisprudenciasService.getJurisprudencias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (j) => {
        this.jurisprudencias = j ?? [];
        this.jurisprudenciasOriginales = [...this.jurisprudencias];
        this.armarFiltrosDesdeJurisprudencias();
        this.pageIndex = 0;
        this.actualizarPagina();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener jurisprudencias:', err);
        this.jurisprudencias = [];
        this.jurisprudenciasOriginales = [];
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarMotivos(): void {
    this.motivoService.getMotivos().subscribe({
      next: (motivos) => {
        this.motivosOriginales = (motivos ?? []).filter(m => m.estado !== 'eliminado');
        this.motivos = [...this.motivosOriginales];
      },
      error: (err) => {
        console.error('Error al obtener motivos:', err);
        this.motivos = [];
        this.motivosOriginales = [];
      }
    });
  }

  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.jurisprudencias.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.actualizarPagina();
  }

  buscar(): void {
    this.filtrar();
  }

  goTo(path: string): void { this.router.navigate([path]); }

  // ── Agregar ────────────────────────────────────────────────
 /* async agregarJurisprudencias(): Promise<void> {
    const norm = (s: any) =>
      (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const renderExpedientes = (select: HTMLSelectElement, lista: any[]) => {
      select.innerHTML = `<option value="">Seleccionar expediente</option>` +
        lista.map(e => `<option value="${e.id}">${e.numero}/${e.anio} - ${e.caratula || ''}</option>`).join('');
    };

    let demandadosAgregados: { id: number; tipo: 'empresa' | 'cliente'; nombre: string }[] = [];

    const renderDemandadosAgregados = () => {
      const contenedor = document.getElementById('demandadosAgregados');
      if (!contenedor) return;
      if (demandadosAgregados.length === 0) {
        contenedor.innerHTML = `<div style="font-size:13px;color:#666;padding:6px 0;">Sin demandados agregados</div>`;
        return;
      }
      contenedor.innerHTML = demandadosAgregados.map(d => `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;">
          <span>${d.nombre}</span>
          <button type="button" class="swal2-styled btn-quitar-demandado" data-id="${d.id}" style="background:#d33;padding:4px 10px;">Quitar</button>
        </div>`).join('');
      contenedor.querySelectorAll('.btn-quitar-demandado').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number((btn as HTMLButtonElement).dataset['id']);
          demandadosAgregados = demandadosAgregados.filter(d => Number(d.id) !== id);
          renderDemandadosAgregados();
        });
      });
    };

    const result = await Swal.fire({
      title: 'Agregar jurisprudencia',
      html: `
        <select id="tipoExpediente" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="propio">Expediente propio</option>
          <option value="ajeno">Expediente ajeno</option>
        </select>
        <div id="bloqueExpedientePropio">
          <input id="expSearch" class="swal2-input" placeholder="Buscar expediente...">
          <select id="expedienteId" class="swal2-select" style="width:90%;margin:6px 0;"><option value="">Seleccionar expediente</option></select>
        </div>
        <div id="bloqueExpedienteAjeno" style="display:none;">
          <input id="numeroExterno" class="swal2-input" type="number" placeholder="Número">
          <input id="anioExterno" class="swal2-input" type="number" placeholder="Año">
          <input id="objeto" class="swal2-input" placeholder="Objeto" disabled>
        </div>
        <select id="fuero" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar fuero</option>
          <option value="CCF">CCF</option><option value="COM">COM</option><option value="CIV">CIV</option><option value="CC">CC</option>
        </select>
        <div style="width:90%;margin:6px auto;text-align:left;">
          <select id="demandadoId" class="swal2-select" style="width:100%;margin:0 0 6px 0;">
            <option value="">Seleccionar demandado</option>
            ${(this.demandados || []).map(d => `<option value="${d.id}">${d.nombre}</option>`).join('')}
          </select>
          <button type="button" id="btnAgregarDemandado" class="swal2-styled" style="background:#3085d6;">Agregar demandado</button>
          <div id="demandadosAgregados" style="margin-top:10px;"></div>
        </div>
        <select id="juzgadoId" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar juzgado</option>
          ${(this.juzgados || []).map(j => `<option value="${j.id}">${j.nombre}</option>`).join('')}
        </select>
        <select id="juezId" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar juez</option>
          ${(this.jueces || []).map(j => `<option value="${j.id}">${j.nombre}</option>`).join('')}
        </select>
        <input id="sentencia" type="date" class="swal2-input">
        <input id="camara" class="swal2-input" placeholder="Cámara">
        <select id="codigoId" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar código</option>
          ${(this.codigos || []).map(c => `<option value="${c.id}">${c.codigo} - ${c.descripcion}</option>`).join('')}
        </select>`,
      showCancelButton: true, confirmButtonText: 'Agregar', focusConfirm: false,
      willOpen: () => {
        const tipoExpediente = document.getElementById('tipoExpediente') as HTMLSelectElement;
        const bloquePropio = document.getElementById('bloqueExpedientePropio') as HTMLDivElement;
        const bloqueAjeno = document.getElementById('bloqueExpedienteAjeno') as HTMLDivElement;
        const input = document.getElementById('expSearch') as HTMLInputElement;
        const select = document.getElementById('expedienteId') as HTMLSelectElement;
        const demandadoSelect = document.getElementById('demandadoId') as HTMLSelectElement;
        const btnAgregarDemandado = document.getElementById('btnAgregarDemandado') as HTMLButtonElement;
        const exps = this.expedientes || [];
        renderExpedientes(select, exps.slice(0, 30));
        renderDemandadosAgregados();
        tipoExpediente.addEventListener('change', () => {
          const esPropio = tipoExpediente.value === 'propio';
          bloquePropio.style.display = esPropio ? 'block' : 'none';
          bloqueAjeno.style.display = esPropio ? 'none' : 'block';
        });
        input.addEventListener('input', () => {
          const q = norm(input.value);
          renderExpedientes(select, (!q || q.length < 2) ? exps.slice(0, 30) : exps.filter(e => norm(e.busqueda).includes(q)).slice(0, 30));
        });
        btnAgregarDemandado.addEventListener('click', () => {
          const id = Number(demandadoSelect.value);
          if (!id) return;
          const demandado = (this.demandados || []).find(d => Number(d.id) === id);
          if (!demandado || demandadosAgregados.some(d => Number(d.id) === id)) { demandadoSelect.value = ''; return; }
          demandadosAgregados.push({ id, tipo: 'empresa', nombre: demandado.nombre || '' });
          demandadoSelect.value = '';
          renderDemandadosAgregados();
        });
      },
      preConfirm: () => {
        const tipoExpediente = (document.getElementById('tipoExpediente') as HTMLSelectElement).value;
        const expedienteId = (document.getElementById('expedienteId') as HTMLSelectElement).value;
        const numeroExterno = (document.getElementById('numeroExterno') as HTMLInputElement)?.value;
        const anioExterno = (document.getElementById('anioExterno') as HTMLInputElement)?.value;
        const objeto = (document.getElementById('objeto') as HTMLInputElement)?.value ?? '';
        const fuero = (document.getElementById('fuero') as HTMLSelectElement).value;
        const juzgadoId = (document.getElementById('juzgadoId') as HTMLSelectElement).value;
        const juezId = (document.getElementById('juezId') as HTMLSelectElement).value;
        const sentenciaVal = (document.getElementById('sentencia') as HTMLInputElement).value;
        const camara = (document.getElementById('camara') as HTMLInputElement).value.trim();
        const codigoId = (document.getElementById('codigoId') as HTMLSelectElement).value;
        if (!fuero || !juzgadoId || !juezId || !codigoId || !camara) { Swal.showValidationMessage('Debe completar todos los campos obligatorios'); return null; }
        if (demandadosAgregados.length === 0) { Swal.showValidationMessage('Debe agregar al menos un demandado'); return null; }
        if (tipoExpediente === 'propio' && !expedienteId) { Swal.showValidationMessage('Debe seleccionar expediente'); return null; }
        if (tipoExpediente === 'ajeno' && (!numeroExterno || !anioExterno)) { Swal.showValidationMessage('Debe completar número y año'); return null; }
        return {
          expediente_id: tipoExpediente === 'propio' ? Number(expedienteId) : null,
          tipo_expediente: tipoExpediente,
          numero: tipoExpediente === 'ajeno' ? Number(numeroExterno) : null,
          anio: tipoExpediente === 'ajeno' ? Number(anioExterno) : null,
          objeto: objeto || null, fuero,
          demandados: demandadosAgregados.map(d => ({ id: d.id, tipo: d.tipo })),
          juzgado_id: Number(juzgadoId), juez_id: Number(juezId),
          sentencia: sentenciaVal ? new Date(sentenciaVal) : null, camara,
          codigo_id: Number(codigoId)
        };
      }
    });

    if (!result.isConfirmed || !result.value) return;
    this.jurisprudenciasService.addJurisprudencia({ id: '', ...(result.value as any) }).subscribe({
      next: () => { this.cargarJurisprudencias(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Jurisprudencia agregada', showConfirmButton: false, timer: 2500 }); },
      error: () => Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se pudo agregar', showConfirmButton: false, timer: 2500 })
    });
  }*/

async agregarJurisprudencias(): Promise<void> {
  const norm = (s: any) =>
    (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const renderExpedientes = (select: HTMLSelectElement, lista: any[]) => {
    select.innerHTML =
      `<option value="">Seleccionar expediente</option>` +
      lista.map(e => `<option value="${e.id}">${e.numero}/${e.anio} - ${e.caratula || ''}</option>`).join('');
  };

  const renderJuzgadosFiltrados = (select: HTMLSelectElement, fuero: string, selectedId?: any) => {
    const juzgadosFiltrados = !fuero
      ? []
      : (this.juzgados || []).filter((j: any) =>
          String(j.tipo || '').toUpperCase() === String(fuero).toUpperCase()
        );

    select.innerHTML =
      `<option value="">Seleccionar juzgado</option>` +
      juzgadosFiltrados.map((j: any) =>
        `<option value="${j.id}" ${String(j.id) === String(selectedId) ? 'selected' : ''}>${j.nombre}</option>`
      ).join('');
  };

  let demandadosAjeno: { id: number; tipo: 'empresa' | 'cliente'; nombre: string }[] = [];
  let motivosAgregados: { id: number; nombre: string }[] = [];
  let expedientePropioActual: any = null;

  const renderDemandadosPropio = () => {
    const contenedor = document.getElementById('demandadosPropio');
    if (!contenedor) return;

    const demandadosExp = Array.isArray(expedientePropioActual?.demandados)
      ? expedientePropioActual.demandados
      : [];

    contenedor.innerHTML = demandadosExp.map((d: any) => `
      <div style="padding:6px 0;border-bottom:1px solid #eee;">
        ${d.nombre || ''}
      </div>
    `).join('');
  };

  const renderDemandadosAjeno = () => {
    const contenedor = document.getElementById('demandadosAjeno');
    if (!contenedor) return;

    if (demandadosAjeno.length === 0) {
      contenedor.innerHTML = `<div style="font-size:14px;color:#666;padding:6px 0;">Sin demandados agregados</div>`;
      return;
    }

    contenedor.innerHTML = demandadosAjeno.map(d => `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;">
        <span>${d.nombre}</span>
        <button type="button" class="swal2-styled btn-quitar-demandado-ajeno" data-id="${d.id}"
          style="background:#d33;padding:4px 10px;">Quitar</button>
      </div>
    `).join('');

    contenedor.querySelectorAll('.btn-quitar-demandado-ajeno').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number((btn as HTMLButtonElement).dataset['id']);
        demandadosAjeno = demandadosAjeno.filter(d => Number(d.id) !== id);
        renderDemandadosAjeno();
      });
    });
  };

  const renderMotivosAgregados = () => {
    ['motivosAgregadosPropio', 'motivosAgregadosAjeno'].forEach(idContenedor => {
      const contenedor = document.getElementById(idContenedor);
      if (!contenedor) return;

      if (motivosAgregados.length === 0) {
        contenedor.innerHTML = `<div style="font-size:14px;color:#666;padding:6px 0;">Sin motivos agregados</div>`;
        return;
      }

      contenedor.innerHTML = motivosAgregados.map(m => `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;">
          <span>${m.nombre}</span>
          <button type="button" class="swal2-styled btn-quitar-motivo" data-id="${m.id}"
            style="background:#d33;padding:4px 10px;">Quitar</button>
        </div>
      `).join('');

      contenedor.querySelectorAll('.btn-quitar-motivo').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number((btn as HTMLButtonElement).dataset['id']);
          motivosAgregados = motivosAgregados.filter(m => Number(m.id) !== id);
          renderMotivosAgregados();
        });
      });
    });
  };

  const actualizarDatosExpedientePropio = (expedienteId: number) => {
    const expediente = (this.expedientes || []).find(e => Number((e as any).id) === Number(expedienteId));
    expedientePropioActual = expediente || null;

    const bloqueJuezPropio = document.getElementById('bloqueJuezPropio') as HTMLDivElement | null;
    const juezSelect = document.getElementById('juezIdPropio') as HTMLSelectElement | null;

    if (!expediente) {
      if (bloqueJuezPropio) bloqueJuezPropio.style.display = 'none';
      if (juezSelect) juezSelect.value = '';
      renderDemandadosPropio();
      return;
    }

    const juezIdExp = (expediente as any).juez_id || null;

    if (bloqueJuezPropio) bloqueJuezPropio.style.display = juezIdExp ? 'none' : 'block';
    if (juezSelect) juezSelect.value = juezIdExp ? String(juezIdExp) : '';

    renderDemandadosPropio();
  };

  const result = await Swal.fire({
    title: 'Agregar jurisprudencia',
    width: 650,
    html: `
      <style>
        .campo-unificado {
          width: 90% !important;
          margin: 10px auto !important;
          display: block !important;
          box-sizing: border-box !important;
        }
        .grupo-campo-modal {
          width: 90%;
          margin: 10px auto;
          text-align: left;
        }
        .label-modal {
          display: block;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 6px 0;
          color: #4b3b2c;
        }
        .resultado-modal {
          display: flex;
          gap: 24px;
          align-items: center;
          flex-wrap: wrap;
        }
        .opcion-resultado {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          cursor: pointer;
        }
        input[type="date"].campo-unificado {
          font-family: inherit;
        }
      </style>

      <select id="tipoExpediente" class="swal2-select campo-unificado">
        <option value="propio">Expediente propio</option>
        <option value="ajeno">Expediente ajeno</option>
      </select>

      <div id="bloqueExpedientePropio">
        <input id="expSearch" class="swal2-input campo-unificado" placeholder="Buscar expediente...">

        <select id="expedienteId" class="swal2-select campo-unificado">
          <option value="">Seleccionar expediente</option>
        </select>

        <div class="grupo-campo-modal">
          <div id="demandadosPropio"></div>
        </div>

        <div id="bloqueJuezPropio" style="display:none;">
          <select id="juezIdPropio" class="swal2-select campo-unificado">
            <option value="">Seleccionar juez</option>
            ${(this.jueces || []).map(j => `<option value="${j.id}">${j.nombre}</option>`).join('')}
          </select>
        </div>

        <div class="grupo-campo-modal">
          <label class="label-modal">Resultado</label>
          <div class="resultado-modal">
            <label class="opcion-resultado">
              <input type="radio" id="resultadoFavorablePropio" name="resultado" value="favorable">
              <span>✅ Favorable</span>
            </label>
            <label class="opcion-resultado">
              <input type="radio" id="resultadoDesfavorablePropio" name="resultado" value="desfavorable">
              <span>❌ Desfavorable</span>
            </label>
          </div>
        </div>

        <div class="grupo-campo-modal">
          <select id="motivoIdPropio" class="swal2-select campo-unificado" style="width:100% !important;margin:0 0 10px 0 !important;">
            <option value="">Seleccionar motivo</option>
            ${(this.motivos || []).map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
          </select>

          <button type="button" id="btnAgregarMotivoPropio" class="swal2-styled" style="background:#3085d6;">
            Agregar motivo
          </button>

          <div id="motivosAgregadosPropio" style="margin-top:10px;"></div>
        </div>
      </div>

      <div id="bloqueExpedienteAjeno" style="display:none;">
        <input id="numeroExterno" class="swal2-input campo-unificado" type="number" placeholder="Número">
        <input id="anioExterno" class="swal2-input campo-unificado" type="number" placeholder="Año">

        <select id="fueroAjeno" class="swal2-select campo-unificado">
          <option value="">Seleccionar fuero</option>
          <option value="CCF">CCF</option>
          <option value="COM">COM</option>
          <option value="CIV">CIV</option>
          <option value="CC">CC</option>
        </select>

        <select id="juzgadoIdAjeno" class="swal2-select campo-unificado">
          <option value="">Seleccionar juzgado</option>
        </select>

        <input id="camaraAjeno" class="swal2-input campo-unificado" placeholder="Cámara">

        <select id="codigoIdAjeno" class="swal2-select campo-unificado">
          <option value="">Seleccionar código</option>
          ${(this.codigos || []).map(c => `<option value="${c.id}">${c.codigo} - ${c.descripcion}</option>`).join('')}
        </select>

        <div class="grupo-campo-modal">
          <label class="label-modal">Fecha de sentencia</label>
          <input id="sentenciaAjeno" type="date" class="swal2-input campo-unificado">
        </div>

        <div class="grupo-campo-modal">
          <select id="demandadoIdAjeno" class="swal2-select campo-unificado" style="width:100% !important;margin:0 0 10px 0 !important;">
            <option value="">Seleccionar demandado</option>
            ${(this.demandados || []).map(d => `<option value="${d.id}">${d.nombre}</option>`).join('')}
          </select>

          <button type="button" id="btnAgregarDemandadoAjeno" class="swal2-styled" style="background:#3085d6;">
            Agregar demandado
          </button>

          <div id="demandadosAjeno" style="margin-top:10px;"></div>
        </div>

        <div class="grupo-campo-modal">
          <label class="label-modal">Resultado</label>
          <div class="resultado-modal">
            <label class="opcion-resultado">
              <input type="radio" id="resultadoFavorableAjeno" name="resultado" value="favorable">
              <span>✅ Favorable</span>
            </label>
            <label class="opcion-resultado">
              <input type="radio" id="resultadoDesfavorableAjeno" name="resultado" value="desfavorable">
              <span>❌ Desfavorable</span>
            </label>
          </div>
        </div>

        <div class="grupo-campo-modal">
          <select id="motivoIdAjeno" class="swal2-select campo-unificado" style="width:100% !important;margin:0 0 10px 0 !important;">
            <option value="">Seleccionar motivo</option>
            ${(this.motivos || []).map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
          </select>

          <button type="button" id="btnAgregarMotivoAjeno" class="swal2-styled" style="background:#3085d6;">
            Agregar motivo
          </button>

          <div id="motivosAgregadosAjeno" style="margin-top:10px;"></div>
        </div>
      </div>
    `,

    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,

    willOpen: () => {
      const tipoExpediente = document.getElementById('tipoExpediente') as HTMLSelectElement;
      const bloquePropio = document.getElementById('bloqueExpedientePropio') as HTMLDivElement;
      const bloqueAjeno = document.getElementById('bloqueExpedienteAjeno') as HTMLDivElement;
      const input = document.getElementById('expSearch') as HTMLInputElement;
      const selectExp = document.getElementById('expedienteId') as HTMLSelectElement;

      const fueroAjeno = document.getElementById('fueroAjeno') as HTMLSelectElement;
      const juzgadoAjeno = document.getElementById('juzgadoIdAjeno') as HTMLSelectElement;
      const demandadoAjeno = document.getElementById('demandadoIdAjeno') as HTMLSelectElement;
      const btnAgregarDemandadoAjeno = document.getElementById('btnAgregarDemandadoAjeno') as HTMLButtonElement;

      const motivoPropio = document.getElementById('motivoIdPropio') as HTMLSelectElement;
      const motivoAjeno = document.getElementById('motivoIdAjeno') as HTMLSelectElement;
      const btnMotivoPropio = document.getElementById('btnAgregarMotivoPropio') as HTMLButtonElement;
      const btnMotivoAjeno = document.getElementById('btnAgregarMotivoAjeno') as HTMLButtonElement;

      const agregarMotivo = (select: HTMLSelectElement | null) => {
        const id = Number(select?.value);
        if (!id) return;

        const motivo = (this.motivos || []).find(m => Number(m.id) === id);
        if (!motivo || motivosAgregados.some(m => Number(m.id) === id)) {
          if (select) select.value = '';
          return;
        }

        motivosAgregados.push({ id, nombre: motivo.nombre || '' });
        if (select) select.value = '';
        renderMotivosAgregados();
      };

      const exps = this.expedientes || [];
      renderExpedientes(selectExp, exps.slice(0, 30));
      renderDemandadosPropio();
      renderDemandadosAjeno();
      renderMotivosAgregados();

      tipoExpediente.addEventListener('change', () => {
        const esPropio = tipoExpediente.value === 'propio';
        bloquePropio.style.display = esPropio ? 'block' : 'none';
        bloqueAjeno.style.display = esPropio ? 'none' : 'block';

        if (esPropio) {
          const expId = Number(selectExp.value);
          if (expId) {
            actualizarDatosExpedientePropio(expId);
          } else {
            expedientePropioActual = null;
            renderDemandadosPropio();
          }
        } else {
          expedientePropioActual = null;
          demandadosAjeno = [];
          renderDemandadosAjeno();
        }

        renderMotivosAgregados();
      });

      input.addEventListener('input', () => {
        const q = norm(input.value);
        renderExpedientes(
          selectExp,
          (!q || q.length < 2)
            ? exps.slice(0, 30)
            : exps.filter(e => norm((e as any).busqueda).includes(q)).slice(0, 30)
        );
      });

      selectExp.addEventListener('change', () => {
        const expId = Number(selectExp.value);
        if (!expId) {
          expedientePropioActual = null;
          renderDemandadosPropio();
          return;
        }

        if (tipoExpediente.value === 'propio') {
          actualizarDatosExpedientePropio(expId);
        }
      });

      fueroAjeno?.addEventListener('change', () => {
        renderJuzgadosFiltrados(juzgadoAjeno, fueroAjeno.value);
      });

      btnAgregarDemandadoAjeno?.addEventListener('click', () => {
        const id = Number(demandadoAjeno?.value);
        if (!id) return;

        const dem = (this.demandados || []).find(d => Number(d.id) === id);
        if (!dem || demandadosAjeno.some(d => Number(d.id) === id)) {
          if (demandadoAjeno) demandadoAjeno.value = '';
          return;
        }

        demandadosAjeno.push({ id, tipo: 'empresa', nombre: dem.nombre || '' });
        if (demandadoAjeno) demandadoAjeno.value = '';
        renderDemandadosAjeno();
      });

      btnMotivoPropio?.addEventListener('click', () => agregarMotivo(motivoPropio));
      btnMotivoAjeno?.addEventListener('click', () => agregarMotivo(motivoAjeno));
    },

    preConfirm: () => {
      const tipo = (document.getElementById('tipoExpediente') as HTMLSelectElement).value;

      const expedienteId = (document.getElementById('expedienteId') as HTMLSelectElement)?.value ?? '';
      const juezIdPropio = (document.getElementById('juezIdPropio') as HTMLSelectElement)?.value ?? '';
      const resultadoPropio = (document.querySelector('#bloqueExpedientePropio input[name="resultado"]:checked') as HTMLInputElement)?.value ?? '';

      const numeroExt = (document.getElementById('numeroExterno') as HTMLInputElement)?.value ?? '';
      const anioExt = (document.getElementById('anioExterno') as HTMLInputElement)?.value ?? '';
      const fueroAj = (document.getElementById('fueroAjeno') as HTMLSelectElement)?.value ?? '';
      const juzgadoIdAj = (document.getElementById('juzgadoIdAjeno') as HTMLSelectElement)?.value ?? '';
      const camaraAj = (document.getElementById('camaraAjeno') as HTMLInputElement)?.value.trim() ?? '';
      const codigoIdAj = (document.getElementById('codigoIdAjeno') as HTMLSelectElement)?.value ?? '';
      const sentenciaAj = (document.getElementById('sentenciaAjeno') as HTMLInputElement)?.value ?? '';
      const resultadoAj = (document.querySelector('#bloqueExpedienteAjeno input[name="resultado"]:checked') as HTMLInputElement)?.value ?? '';

      if (!tipo) {
        Swal.showValidationMessage('Seleccioná el tipo de expediente');
        return null;
      }

      if (motivosAgregados.length === 0) {
        Swal.showValidationMessage('Agregá al menos un motivo');
        return null;
      }

      const motivosPayload = motivosAgregados.map(m => ({ id: m.id }));
      const primerMotivoId = motivosAgregados[0]?.id ?? null;

      if (tipo === 'propio') {
        if (!expedienteId) {
          Swal.showValidationMessage('Seleccioná un expediente propio');
          return null;
        }

        const juezExp = expedientePropioActual?.juez_id || null;

        if (!juezExp && !juezIdPropio) {
          Swal.showValidationMessage('Seleccioná el juez');
          return null;
        }

        if (!resultadoPropio) {
          Swal.showValidationMessage('Seleccioná el resultado');
          return null;
        }

        return {
          tipo_expediente: 'propio',
          expediente_id: Number(expedienteId),
          numero: null,
          anio: null,
          objeto: null,
          fuero: null,
          demandados: [],
          juzgado_id: expedientePropioActual?.juzgado_id ? Number(expedientePropioActual.juzgado_id) : null,
          juez_id: juezExp ? Number(juezExp) : Number(juezIdPropio),
          sentencia: null,
          camara: null,
          codigo_id: null,
          fecha_alzada: null,
          resultado: resultadoPropio || null,
          motivo_id: primerMotivoId,
          motivos: motivosPayload,
        };
      }

      if (!numeroExt) {
        Swal.showValidationMessage('Completá el número del expediente ajeno');
        return null;
      }

      if (!anioExt) {
        Swal.showValidationMessage('Completá el año del expediente ajeno');
        return null;
      }

      if (!fueroAj) {
        Swal.showValidationMessage('Seleccioná el fuero');
        return null;
      }

      if (!juzgadoIdAj) {
        Swal.showValidationMessage('Seleccioná el juzgado');
        return null;
      }

      if (!camaraAj) {
        Swal.showValidationMessage('Completá la cámara');
        return null;
      }

      if (!codigoIdAj) {
        Swal.showValidationMessage('Seleccioná el código');
        return null;
      }

      if (demandadosAjeno.length === 0) {
        Swal.showValidationMessage('Agregá al menos un demandado');
        return null;
      }

      if (!resultadoAj) {
        Swal.showValidationMessage('Seleccioná el resultado');
        return null;
      }

      return {
        tipo_expediente: 'ajeno',
        expediente_id: null,
        numero: Number(numeroExt),
        anio: Number(anioExt),
        objeto: null,
        fuero: fueroAj,
        demandados: demandadosAjeno.map(d => ({ id: d.id, tipo: d.tipo })),
        juzgado_id: Number(juzgadoIdAj),
        juez_id: null,
        sentencia: sentenciaAj ? new Date(sentenciaAj) : null,
        camara: camaraAj,
        codigo_id: Number(codigoIdAj),
        fecha_alzada: null,
        resultado: resultadoAj || null,
        motivo_id: primerMotivoId,
        motivos: motivosPayload,
      };
    }
  });

  if (!result.isConfirmed || !result.value) return;

  this.jurisprudenciasService.addJurisprudencia({ id: '', ...(result.value as any) }).subscribe({
    next: () => {
      this.cargarJurisprudencias();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Jurisprudencia agregada',
        showConfirmButton: false,
        timer: 2500
      });
    },
    error: () => Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'No se pudo agregar',
      showConfirmButton: false,
      timer: 2500
    })
  });
}
  // ── Modificar ──────────────────────────────────────────────
async modificarJurisprudencia(j: any): Promise<void> {
  const norm = (s: any) =>
    (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const tipoActual = (j.tipo_expediente || (j.expediente_id ? 'propio' : 'ajeno')).toLowerCase();

  const renderExpedientes = (select: HTMLSelectElement, lista: any[], selectedId?: any) => {
    select.innerHTML =
      `<option value="">Seleccionar expediente</option>` +
      lista.map(e => `<option value="${e.id}" ${String(e.id) === String(selectedId) ? 'selected' : ''}>${e.numero}/${e.anio} - ${e.caratula || ''}</option>`).join('');
  };

  const renderJuzgadosFiltrados = (select: HTMLSelectElement, fuero: string, selectedId?: any) => {
    const juzgadosFiltrados = !fuero
      ? []
      : (this.juzgados || []).filter((x: any) =>
          String(x.tipo || '').toUpperCase() === String(fuero).toUpperCase()
        );

    select.innerHTML =
      `<option value="">Seleccionar juzgado</option>` +
      juzgadosFiltrados.map((x: any) =>
        `<option value="${x.id}" ${String(x.id) === String(selectedId) ? 'selected' : ''}>${x.nombre}</option>`
      ).join('');
  };

  let expedientePropioActual: any = null;

  let demandadosAjeno: { id: number; tipo: 'empresa' | 'cliente'; nombre: string }[] =
    tipoActual === 'ajeno' && Array.isArray(j.demandados)
      ? j.demandados.map((d: any) => ({
          id: Number(d.id),
          tipo: d.tipo === 'cliente' ? 'cliente' : 'empresa',
          nombre: d.nombre || ''
        })).filter((d: any) => !!d.id)
      : [];

  let motivosAgregados: { id: number; nombre: string }[] =
    Array.isArray(j.motivos)
      ? j.motivos.map((m: any) => ({
          id: Number(m.id),
          nombre: m.nombre || m.motivo_nombre || ''
        })).filter((m: any) => !!m.id)
      : (j.motivo_id
          ? [{ id: Number(j.motivo_id), nombre: j.motivo_nombre || '' }]
          : []);

  const renderDemandadosPropio = () => {
    const contenedor = document.getElementById('demandadosPropio');
    if (!contenedor) return;

    const demandadosExp = Array.isArray(expedientePropioActual?.demandados)
      ? expedientePropioActual.demandados
      : [];

    contenedor.innerHTML = demandadosExp.map((d: any) => `
      <div style="padding:6px 0;border-bottom:1px solid #eee;">
        ${d.nombre || ''}
      </div>
    `).join('');
  };

  const renderDemandadosAjeno = () => {
    const contenedor = document.getElementById('demandadosAjeno');
    if (!contenedor) return;

    if (demandadosAjeno.length === 0) {
      contenedor.innerHTML = `<div style="font-size:14px;color:#666;padding:6px 0;">Sin demandados agregados</div>`;
      return;
    }

    contenedor.innerHTML = demandadosAjeno.map(d => `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;">
        <span>${d.nombre}</span>
        <button type="button" class="swal2-styled btn-quitar-demandado-ajeno" data-id="${d.id}"
          style="background:#d33;padding:4px 10px;">Quitar</button>
      </div>
    `).join('');

    contenedor.querySelectorAll('.btn-quitar-demandado-ajeno').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number((btn as HTMLButtonElement).dataset['id']);
        demandadosAjeno = demandadosAjeno.filter(d => Number(d.id) !== id);
        renderDemandadosAjeno();
      });
    });
  };

  const renderMotivosAgregados = () => {
    ['motivosAgregadosPropio', 'motivosAgregadosAjeno'].forEach(idContenedor => {
      const contenedor = document.getElementById(idContenedor);
      if (!contenedor) return;

      if (motivosAgregados.length === 0) {
        contenedor.innerHTML = `<div style="font-size:14px;color:#666;padding:6px 0;">Sin motivos agregados</div>`;
        return;
      }

      contenedor.innerHTML = motivosAgregados.map(m => `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;">
          <span>${m.nombre}</span>
          <button type="button" class="swal2-styled btn-quitar-motivo" data-id="${m.id}"
            style="background:#d33;padding:4px 10px;">Quitar</button>
        </div>
      `).join('');

      contenedor.querySelectorAll('.btn-quitar-motivo').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = Number((btn as HTMLButtonElement).dataset['id']);
          motivosAgregados = motivosAgregados.filter(m => Number(m.id) !== id);
          renderMotivosAgregados();
        });
      });
    });
  };

  const actualizarDatosExpedientePropio = (expedienteId: number) => {
    const expediente = (this.expedientes || []).find(e => Number((e as any).id) === Number(expedienteId));
    expedientePropioActual = expediente || null;

    const bloqueJuezPropio = document.getElementById('bloqueJuezPropio') as HTMLDivElement | null;
    const juezSelect = document.getElementById('juezIdPropio') as HTMLSelectElement | null;

    if (!expediente) {
      if (bloqueJuezPropio) bloqueJuezPropio.style.display = 'none';
      if (juezSelect) juezSelect.value = '';
      renderDemandadosPropio();
      return;
    }

    const juezIdExp = (expediente as any).juez_id || null;

    if (bloqueJuezPropio) bloqueJuezPropio.style.display = juezIdExp ? 'none' : 'block';
    if (juezSelect) juezSelect.value = juezIdExp ? String(juezIdExp) : '';

    renderDemandadosPropio();
  };

  const { isConfirmed, value } = await Swal.fire({
    title: 'Modificar jurisprudencia',
    width: 650,
    html: `
      <style>
        .campo-unificado {
          width: 90% !important;
          margin: 10px auto !important;
          display: block !important;
          box-sizing: border-box !important;
        }
        .grupo-campo-modal {
          width: 90%;
          margin: 10px auto;
          text-align: left;
        }
        .label-modal {
          display: block;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 6px 0;
          color: #4b3b2c;
        }
        .resultado-modal {
          display: flex;
          gap: 24px;
          align-items: center;
          flex-wrap: wrap;
        }
        .opcion-resultado {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          cursor: pointer;
        }
        input[type="date"].campo-unificado {
          font-family: inherit;
        }
      </style>

      <select id="tipoExpediente" class="swal2-select campo-unificado">
        <option value="propio" ${tipoActual === 'propio' ? 'selected' : ''}>Expediente propio</option>
        <option value="ajeno" ${tipoActual === 'ajeno' ? 'selected' : ''}>Expediente ajeno</option>
      </select>

      <div id="bloqueExpedientePropio" ${tipoActual === 'ajeno' ? 'style="display:none;"' : ''}>
        <input id="expSearch" class="swal2-input campo-unificado" placeholder="Buscar expediente...">

        <select id="expedienteId" class="swal2-select campo-unificado">
          <option value="">Seleccionar expediente</option>
        </select>

        <div class="grupo-campo-modal">
          <div id="demandadosPropio"></div>
        </div>

        <div id="bloqueJuezPropio" style="display:none;">
          <select id="juezIdPropio" class="swal2-select campo-unificado">
            <option value="">Seleccionar juez</option>
            ${(this.jueces || []).map(x => `<option value="${x.id}" ${String(x.id) === String(j.juez_id) ? 'selected' : ''}>${x.nombre}</option>`).join('')}
          </select>
        </div>

        <div class="grupo-campo-modal">
          <label class="label-modal">Resultado</label>
          <div class="resultado-modal">
            <label class="opcion-resultado">
              <input type="radio" name="resultado" value="favorable" ${j.resultado === 'favorable' ? 'checked' : ''}>
              <span>✅ Favorable</span>
            </label>
            <label class="opcion-resultado">
              <input type="radio" name="resultado" value="desfavorable" ${j.resultado === 'desfavorable' ? 'checked' : ''}>
              <span>❌ Desfavorable</span>
            </label>
          </div>
        </div>

        <div class="grupo-campo-modal">
          <select id="motivoIdPropio" class="swal2-select campo-unificado" style="width:100% !important;margin:0 0 10px 0 !important;">
            <option value="">Seleccionar motivo</option>
            ${(this.motivos || []).map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
          </select>

          <button type="button" id="btnAgregarMotivoPropio" class="swal2-styled" style="background:#3085d6;">
            Agregar motivo
          </button>

          <div id="motivosAgregadosPropio" style="margin-top:10px;"></div>
        </div>
      </div>

      <div id="bloqueExpedienteAjeno" ${tipoActual === 'propio' ? 'style="display:none;"' : ''}>
        <input id="numeroExterno" class="swal2-input campo-unificado" type="number" placeholder="Número" value="${j.numero ?? ''}">
        <input id="anioExterno" class="swal2-input campo-unificado" type="number" placeholder="Año" value="${j.anio ?? ''}">

        <select id="fueroAjeno" class="swal2-select campo-unificado">
          <option value="">Seleccionar fuero</option>
          ${['CCF', 'COM', 'CIV', 'CC'].map(f => `<option value="${f}" ${j.fuero === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>

        <select id="juzgadoIdAjeno" class="swal2-select campo-unificado">
          <option value="">Seleccionar juzgado</option>
        </select>

        <input id="camaraAjeno" class="swal2-input campo-unificado" placeholder="Cámara" value="${(j.camara || '').toString().replace(/"/g, '&quot;')}">

        <select id="codigoIdAjeno" class="swal2-select campo-unificado">
          <option value="">Seleccionar código</option>
          ${(this.codigos || []).map(c => `<option value="${c.id}" ${String(c.id) === String(j.codigo_id) ? 'selected' : ''}>${c.codigo} - ${c.descripcion}</option>`).join('')}
        </select>

        <div class="grupo-campo-modal">
          <label class="label-modal">Fecha de sentencia</label>
          <input id="sentenciaAjeno" type="date" class="swal2-input campo-unificado" value="${j.sentencia ? new Date(j.sentencia).toISOString().slice(0, 10) : ''}">
        </div>

        <div class="grupo-campo-modal">
          <select id="demandadoIdAjeno" class="swal2-select campo-unificado" style="width:100% !important;margin:0 0 10px 0 !important;">
            <option value="">Seleccionar demandado</option>
            ${(this.demandados || []).map(d => `<option value="${d.id}">${d.nombre}</option>`).join('')}
          </select>

          <button type="button" id="btnAgregarDemandadoAjeno" class="swal2-styled" style="background:#3085d6;">
            Agregar demandado
          </button>

          <div id="demandadosAjeno" style="margin-top:10px;"></div>
        </div>

        <div class="grupo-campo-modal">
          <label class="label-modal">Resultado</label>
          <div class="resultado-modal">
            <label class="opcion-resultado">
              <input type="radio" name="resultado" value="favorable" ${j.resultado === 'favorable' ? 'checked' : ''}>
              <span>✅ Favorable</span>
            </label>
            <label class="opcion-resultado">
              <input type="radio" name="resultado" value="desfavorable" ${j.resultado === 'desfavorable' ? 'checked' : ''}>
              <span>❌ Desfavorable</span>
            </label>
          </div>
        </div>

        <div class="grupo-campo-modal">
          <select id="motivoIdAjeno" class="swal2-select campo-unificado" style="width:100% !important;margin:0 0 10px 0 !important;">
            <option value="">Seleccionar motivo</option>
            ${(this.motivos || []).map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
          </select>

          <button type="button" id="btnAgregarMotivoAjeno" class="swal2-styled" style="background:#3085d6;">
            Agregar motivo
          </button>

          <div id="motivosAgregadosAjeno" style="margin-top:10px;"></div>
        </div>
      </div>
    `,

    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,

    willOpen: () => {
      const tipoExpediente = document.getElementById('tipoExpediente') as HTMLSelectElement;
      const bloquePropio = document.getElementById('bloqueExpedientePropio') as HTMLDivElement;
      const bloqueAjeno = document.getElementById('bloqueExpedienteAjeno') as HTMLDivElement;

      const input = document.getElementById('expSearch') as HTMLInputElement;
      const selectExp = document.getElementById('expedienteId') as HTMLSelectElement;

      const fueroAjeno = document.getElementById('fueroAjeno') as HTMLSelectElement;
      const juzgadoAjeno = document.getElementById('juzgadoIdAjeno') as HTMLSelectElement;
      const demandadoAjeno = document.getElementById('demandadoIdAjeno') as HTMLSelectElement;
      const btnAgregarDemandadoAjeno = document.getElementById('btnAgregarDemandadoAjeno') as HTMLButtonElement;

      const motivoPropio = document.getElementById('motivoIdPropio') as HTMLSelectElement;
      const motivoAjeno = document.getElementById('motivoIdAjeno') as HTMLSelectElement;
      const btnMotivoPropio = document.getElementById('btnAgregarMotivoPropio') as HTMLButtonElement;
      const btnMotivoAjeno = document.getElementById('btnAgregarMotivoAjeno') as HTMLButtonElement;

      const agregarMotivo = (select: HTMLSelectElement | null) => {
        const id = Number(select?.value);
        if (!id) return;

        const motivo = (this.motivos || []).find(m => Number(m.id) === id);
        if (!motivo || motivosAgregados.some(m => Number(m.id) === id)) {
          if (select) select.value = '';
          return;
        }

        motivosAgregados.push({ id, nombre: motivo.nombre || '' });
        if (select) select.value = '';
        renderMotivosAgregados();
      };

      const exps = this.expedientes || [];
      const actual = exps.find(e => String((e as any).id) === String(j.expediente_id));
      expedientePropioActual = actual || null;

      renderExpedientes(selectExp, actual ? [actual] : exps.slice(0, 30), j.expediente_id);
      renderDemandadosPropio();
      renderDemandadosAjeno();
      renderMotivosAgregados();

      if (tipoActual === 'ajeno' && j.fuero) {
        renderJuzgadosFiltrados(juzgadoAjeno, j.fuero, j.juzgado_id);
      }

      if (tipoActual === 'propio' && j.expediente_id) {
        actualizarDatosExpedientePropio(Number(j.expediente_id));
      }

      tipoExpediente.addEventListener('change', () => {
        const esPropio = tipoExpediente.value === 'propio';
        bloquePropio.style.display = esPropio ? 'block' : 'none';
        bloqueAjeno.style.display = esPropio ? 'none' : 'block';

        if (esPropio) {
          const expId = Number(selectExp.value);
          if (expId) {
            actualizarDatosExpedientePropio(expId);
          } else {
            expedientePropioActual = null;
            renderDemandadosPropio();
          }
        } else {
          expedientePropioActual = null;
          if (tipoActual !== 'ajeno') demandadosAjeno = [];
          renderDemandadosAjeno();
        }

        renderMotivosAgregados();
      });

      input.addEventListener('input', () => {
        const q = norm(input.value);
        renderExpedientes(
          selectExp,
          (!q || q.length < 2)
            ? (actual ? [actual] : exps.slice(0, 30))
            : exps.filter(e => norm((e as any).busqueda).includes(q)).slice(0, 30),
          selectExp.value || j.expediente_id
        );
      });

      selectExp.addEventListener('change', () => {
        const expId = Number(selectExp.value);
        if (!expId) {
          expedientePropioActual = null;
          renderDemandadosPropio();
          return;
        }

        if (tipoExpediente.value === 'propio') {
          actualizarDatosExpedientePropio(expId);
        }
      });

      fueroAjeno?.addEventListener('change', () => {
        renderJuzgadosFiltrados(juzgadoAjeno, fueroAjeno.value);
      });

      btnAgregarDemandadoAjeno?.addEventListener('click', () => {
        const id = Number(demandadoAjeno?.value);
        if (!id) return;

        const dem = (this.demandados || []).find(d => Number(d.id) === id);
        if (!dem || demandadosAjeno.some(d => Number(d.id) === id)) {
          if (demandadoAjeno) demandadoAjeno.value = '';
          return;
        }

        demandadosAjeno.push({ id, tipo: 'empresa', nombre: dem.nombre || '' });
        if (demandadoAjeno) demandadoAjeno.value = '';
        renderDemandadosAjeno();
      });

      btnMotivoPropio?.addEventListener('click', () => agregarMotivo(motivoPropio));
      btnMotivoAjeno?.addEventListener('click', () => agregarMotivo(motivoAjeno));
    },

    preConfirm: () => {
      const tipo = (document.getElementById('tipoExpediente') as HTMLSelectElement).value;

      const expedienteId = (document.getElementById('expedienteId') as HTMLSelectElement)?.value ?? '';
      const juezIdPropio = (document.getElementById('juezIdPropio') as HTMLSelectElement)?.value ?? '';
      const resultadoPropio = tipo === 'propio'
        ? ((document.querySelector('#bloqueExpedientePropio input[name="resultado"]:checked') as HTMLInputElement)?.value ?? '')
        : '';

      const numeroExt = (document.getElementById('numeroExterno') as HTMLInputElement)?.value ?? '';
      const anioExt = (document.getElementById('anioExterno') as HTMLInputElement)?.value ?? '';
      const fueroAj = (document.getElementById('fueroAjeno') as HTMLSelectElement)?.value ?? '';
      const juzgadoIdAj = (document.getElementById('juzgadoIdAjeno') as HTMLSelectElement)?.value ?? '';
      const camaraAj = (document.getElementById('camaraAjeno') as HTMLInputElement)?.value.trim() ?? '';
      const codigoIdAj = (document.getElementById('codigoIdAjeno') as HTMLSelectElement)?.value ?? '';
      const sentenciaAj = (document.getElementById('sentenciaAjeno') as HTMLInputElement)?.value ?? '';
      const resultadoAj = tipo === 'ajeno'
        ? ((document.querySelector('#bloqueExpedienteAjeno input[name="resultado"]:checked') as HTMLInputElement)?.value ?? '')
        : '';

      if (!tipo) {
        Swal.showValidationMessage('Seleccioná el tipo de expediente');
        return null;
      }

      if (motivosAgregados.length === 0) {
        Swal.showValidationMessage('Agregá al menos un motivo');
        return null;
      }

      const motivosPayload = motivosAgregados.map(m => ({ id: m.id }));
      const primerMotivoId = motivosAgregados[0]?.id ?? null;

      if (tipo === 'propio') {
        if (!expedienteId) {
          Swal.showValidationMessage('Seleccioná un expediente propio');
          return null;
        }

        const juezExp = expedientePropioActual?.juez_id || null;

        if (!juezExp && !juezIdPropio) {
          Swal.showValidationMessage('Seleccioná el juez');
          return null;
        }

        if (!resultadoPropio) {
          Swal.showValidationMessage('Seleccioná el resultado');
          return null;
        }

        return {
          expediente_id: Number(expedienteId),
          tipo_expediente: 'propio',
          numero: null,
          anio: null,
          objeto: null,
          fuero: null,
          demandados: [],
          juzgado_id: null,
          juez_id: juezExp ? Number(juezExp) : Number(juezIdPropio),
          sentencia: null,
          camara: null,
          codigo_id: null,
          fecha_alzada: null,
          resultado: resultadoPropio || null,
          motivo_id: primerMotivoId,
          motivos: motivosPayload,
        };
      }

      if (!numeroExt) {
        Swal.showValidationMessage('Completá el número del expediente ajeno');
        return null;
      }

      if (!anioExt) {
        Swal.showValidationMessage('Completá el año del expediente ajeno');
        return null;
      }

      if (!fueroAj) {
        Swal.showValidationMessage('Seleccioná el fuero');
        return null;
      }

      if (!juzgadoIdAj) {
        Swal.showValidationMessage('Seleccioná el juzgado');
        return null;
      }

      if (!camaraAj) {
        Swal.showValidationMessage('Completá la cámara');
        return null;
      }

      if (!codigoIdAj) {
        Swal.showValidationMessage('Seleccioná el código');
        return null;
      }

      if (demandadosAjeno.length === 0) {
        Swal.showValidationMessage('Agregá al menos un demandado');
        return null;
      }

      if (!resultadoAj) {
        Swal.showValidationMessage('Seleccioná el resultado');
        return null;
      }

      return {
        expediente_id: null,
        tipo_expediente: 'ajeno',
        numero: Number(numeroExt),
        anio: Number(anioExt),
        objeto: null,
        fuero: fueroAj,
        demandados: demandadosAjeno.map(d => ({ id: d.id, tipo: d.tipo })),
        juzgado_id: Number(juzgadoIdAj),
        juez_id: null,
        sentencia: sentenciaAj ? new Date(sentenciaAj) : null,
        camara: camaraAj,
        codigo_id: Number(codigoIdAj),
        fecha_alzada: null,
        resultado: resultadoAj || null,
        motivo_id: primerMotivoId,
        motivos: motivosPayload,
      };
    }
  });

  if (!isConfirmed || !value) return;

  this.jurisprudenciasService.actualizarJurisprudencia(j.id, value).subscribe({
    next: () => {
      this.cargarJurisprudencias();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Jurisprudencia modificada',
        showConfirmButton: false,
        timer: 2500
      });
    },
    error: () => Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'No se pudo modificar',
      showConfirmButton: false,
      timer: 2500
    })
  });
}
  // ── Eliminar ───────────────────────────────────────────────
  async eliminarJurisprudencia(j: any, ev?: Event): Promise<void> {
    ev?.stopPropagation?.();
    const { isConfirmed } = await Swal.fire({
      title: '¿Eliminar jurisprudencia?', text: 'Se marcará como eliminada.',
      icon: 'warning', showCancelButton: true,
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) return;
    this.jurisprudenciasService.eliminarJurisprudencia(String(j.id)).subscribe({
      next: () => { this.cargarJurisprudencias(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Jurisprudencia eliminada', showConfirmButton: false, timer: 2500 }); },
      error: () => Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se pudo eliminar', showConfirmButton: false, timer: 2500 })
    });
  }

  filtrar(): void {
  const q = this.normalizar(this.busqueda);

  this.jurisprudencias = this.jurisprudenciasOriginales.filter((j: any) => {
    const textoDemandados = Array.isArray(j.demandados)
      ? j.demandados.map((d: any) => d.nombre || '').join(' ')
      : '';

    const textoMotivos = Array.isArray(j.motivos)
      ? j.motivos.map((m: any) => m.nombre || '').join(' ')
      : '';

    const textoCompleto = this.normalizar([
      j.numero,
      j.anio,
      j.caratula,
      j.fuero,
      j.juzgado_nombre,
      j.juez_nombre,
      j.camara,
      textoDemandados,
      textoMotivos
    ].join(' '));

    const cumpleBusqueda = !q || textoCompleto.includes(q);

    const cumpleJuzgado =
      !this.juzgadoSeleccionado ||
      String(j.juzgado_id) === String(this.juzgadoSeleccionado);

    const cumpleJuez =
      !this.juezSeleccionado ||
      String(j.juez_id) === String(this.juezSeleccionado);

    const cumpleCamara =
      !this.camaraSeleccionada ||
      String(j.camara || '') === String(this.camaraSeleccionada);

    const cumpleMotivo =
      !this.motivoSeleccionado ||
      (
        Array.isArray(j.motivos) &&
        j.motivos.some((m: any) => String(m.id) === String(this.motivoSeleccionado))
      );

    return cumpleBusqueda && cumpleJuzgado && cumpleJuez && cumpleCamara && cumpleMotivo;
  });

  this.pageIndex = 0;
  this.actualizarPagina();
}
}