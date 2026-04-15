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
    this.expepedientesService.getExpedientes().subscribe(e => this.expedientes = e || []);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarJurisprudencias(): void {
    this.cargando = true;
    this.cdr.detectChanges();

    this.jurisprudenciasService.getJurisprudencias().pipe(takeUntil(this.destroy$)).subscribe({
      next: (j) => {
        this.jurisprudencias = j ?? [];
        this.jurisprudenciasOriginales = [...this.jurisprudencias];
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
    const q = this.normalizar(this.busqueda);
    if (!q) {
      this.jurisprudencias = [...this.jurisprudenciasOriginales];
    } else {
      this.jurisprudencias = this.jurisprudenciasOriginales.filter(j => {
        const dem = this.normalizar(j.demandadoModel?.nombre || '');
        const car = this.normalizar((j as any).caratula || '');
        const num = ((j as any).numero || '').toString();
        return dem.includes(q) || car.includes(q) || num.includes(q);
      });
    }
    this.pageIndex = 0;
    this.actualizarPagina();
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

  const motivosDisponibles = ['Firma falsificada'];

  const renderExpedientes = (select: HTMLSelectElement, lista: any[]) => {
    select.innerHTML =
      `<option value="">Seleccionar expediente</option>` +
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
        <button type="button" class="swal2-styled btn-quitar-demandado" data-id="${d.id}"
          style="background:#d33;padding:4px 10px;">Quitar</button>
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
    width: 600,
    html: `
      <!-- Tipo de expediente -->
      <select id="tipoExpediente" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="propio">Expediente propio</option>
        <option value="ajeno">Expediente ajeno</option>
      </select>

      <!-- ── BLOQUE PROPIO ── -->
      <div id="bloqueExpedientePropio">
        <input id="expSearch" class="swal2-input" placeholder="Buscar expediente...">
        <select id="expedienteId" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar expediente</option>
        </select>
      </div>

      <!-- ── BLOQUE AJENO ── -->
      <div id="bloqueExpedienteAjeno" style="display:none;">
        <input id="numeroExterno" class="swal2-input" type="number" placeholder="Número">
        <input id="anioExterno"   class="swal2-input" type="number" placeholder="Año">

        <select id="fuero" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar fuero</option>
          <option value="CCF">CCF</option>
          <option value="COM">COM</option>
          <option value="CIV">CIV</option>
          <option value="CC">CC</option>
        </select>

        <div style="width:90%;margin:6px auto;text-align:left;">
          <select id="demandadoId" class="swal2-select" style="width:100%;margin:0 0 6px 0;">
            <option value="">Seleccionar demandado</option>
            ${(this.demandados || []).map(d => `<option value="${d.id}">${d.nombre}</option>`).join('')}
          </select>
          <button type="button" id="btnAgregarDemandado" class="swal2-styled"
            style="background:#3085d6;">Agregar demandado</button>
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
      </div>

      <!-- ── CAMPOS COMUNES ── -->
      <input id="sentencia" type="date" class="swal2-input">
      <input id="camara" class="swal2-input" placeholder="Cámara">

      <select id="codigoId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar código</option>
        ${(this.codigos || []).map(c => `<option value="${c.id}">${c.codigo} - ${c.descripcion}</option>`).join('')}
      </select>

      <!-- Fecha alzada -->
      <label style="display:block;width:90%;margin:10px auto 4px;text-align:left;font-size:13px;font-weight:600;">
        Fecha alzada
      </label>
      <input id="fechaAlzada" type="date" class="swal2-input">

      <!-- Favorable / Desfavorable -->
      <div style="width:90%;margin:10px auto 4px;text-align:left;">
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Resultado</label>
        <div style="display:flex;gap:20px;">
          <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;">
            <input type="radio" id="resultadoFavorable" name="resultado" value="favorable">
            ✅ Favorable
          </label>
          <label style="display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer;">
            <input type="radio" id="resultadoDesfavorable" name="resultado" value="desfavorable">
            ❌ Desfavorable
          </label>
        </div>
      </div>

      <!-- Motivo -->
      <select id="motivoId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar motivo</option>
        ${motivosDisponibles.map(m => `<option value="${m}">${m}</option>`).join('')}
      </select>
    `,

    showCancelButton: true,
    confirmButtonText: 'Agregar',
    cancelButtonText: 'Cancelar',
    focusConfirm: false,

    willOpen: () => {
      const tipoExpediente  = document.getElementById('tipoExpediente') as HTMLSelectElement;
      const bloquePropio    = document.getElementById('bloqueExpedientePropio') as HTMLDivElement;
      const bloqueAjeno     = document.getElementById('bloqueExpedienteAjeno') as HTMLDivElement;
      const input           = document.getElementById('expSearch') as HTMLInputElement;
      const selectExp       = document.getElementById('expedienteId') as HTMLSelectElement;
      const demandadoSelect = document.getElementById('demandadoId') as HTMLSelectElement;
      const btnAgregar      = document.getElementById('btnAgregarDemandado') as HTMLButtonElement;

      const exps = this.expedientes || [];
      renderExpedientes(selectExp, exps.slice(0, 30));
      renderDemandadosAgregados();

      tipoExpediente.addEventListener('change', () => {
        const esPropio = tipoExpediente.value === 'propio';
        bloquePropio.style.display = esPropio ? 'block' : 'none';
        bloqueAjeno.style.display = esPropio ? 'none' : 'block';
      });

      input.addEventListener('input', () => {
        const q = norm(input.value);
        renderExpedientes(
          selectExp,
          (!q || q.length < 2)
            ? exps.slice(0, 30)
            : exps.filter(e => norm(e.busqueda).includes(q)).slice(0, 30)
        );
      });

      btnAgregar?.addEventListener('click', () => {
        const id = Number(demandadoSelect?.value);
        if (!id) return;

        const dem = (this.demandados || []).find(d => Number(d.id) === id);
        if (!dem || demandadosAgregados.some(d => Number(d.id) === id)) {
          if (demandadoSelect) demandadoSelect.value = '';
          return;
        }

        demandadosAgregados.push({ id, tipo: 'empresa', nombre: dem.nombre || '' });
        if (demandadoSelect) demandadoSelect.value = '';
        renderDemandadosAgregados();
      });
    },

    preConfirm: () => {
      const tipo         = (document.getElementById('tipoExpediente') as HTMLSelectElement).value;
      const expedienteId = (document.getElementById('expedienteId') as HTMLSelectElement)?.value ?? '';
      const numeroExt    = (document.getElementById('numeroExterno') as HTMLInputElement)?.value ?? '';
      const anioExt      = (document.getElementById('anioExterno') as HTMLInputElement)?.value ?? '';
      const fuero        = (document.getElementById('fuero') as HTMLSelectElement)?.value ?? '';
      const juzgadoId    = (document.getElementById('juzgadoId') as HTMLSelectElement)?.value ?? '';
      const juezId       = (document.getElementById('juezId') as HTMLSelectElement)?.value ?? '';
      const sentenciaVal = (document.getElementById('sentencia') as HTMLInputElement).value;
      const camara       = (document.getElementById('camara') as HTMLInputElement).value.trim();
      const codigoId     = (document.getElementById('codigoId') as HTMLSelectElement).value;
      const fechaAlzada  = (document.getElementById('fechaAlzada') as HTMLInputElement).value;
      const resultado    = (document.querySelector('input[name="resultado"]:checked') as HTMLInputElement)?.value ?? '';
      const motivo       = (document.getElementById('motivoId') as HTMLSelectElement).value;

      if (tipo === 'propio') {
        if (!expedienteId) {
          Swal.showValidationMessage('Seleccioná un expediente propio');
          return null;
        }
      } else {
        if (!numeroExt || !anioExt) {
          Swal.showValidationMessage('Completá número y año del expediente ajeno');
          return null;
        }
        if (!fuero) {
          Swal.showValidationMessage('Seleccioná el fuero');
          return null;
        }
        if (demandadosAgregados.length === 0) {
          Swal.showValidationMessage('Agregá al menos un demandado');
          return null;
        }
        if (!juzgadoId) {
          Swal.showValidationMessage('Seleccioná el juzgado');
          return null;
        }
        if (!juezId) {
          Swal.showValidationMessage('Seleccioná el juez');
          return null;
        }
      }

      if (!camara) {
        Swal.showValidationMessage('Completá el campo Cámara');
        return null;
      }

      return {
        tipo_expediente: tipo,

        expediente_id: tipo === 'propio' ? Number(expedienteId) : null,

        numero: tipo === 'ajeno' ? Number(numeroExt) : null,
        anio: tipo === 'ajeno' ? Number(anioExt) : null,
        fuero: tipo === 'ajeno' ? fuero : null,
        demandados: tipo === 'ajeno'
          ? demandadosAgregados.map(d => ({ id: d.id, tipo: d.tipo }))
          : [],
        juzgado_id: tipo === 'ajeno' ? Number(juzgadoId) : null,
        juez_id: tipo === 'ajeno' ? Number(juezId) : null,

        sentencia: sentenciaVal ? new Date(sentenciaVal) : null,
        camara,
        codigo_id: codigoId ? Number(codigoId) : null,
        fecha_alzada: fechaAlzada || null,
        resultado: resultado || null,
        motivo: motivo || null,
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

    const fechaSent = j.sentencia ? new Date(j.sentencia as any).toISOString().slice(0, 10) : '';
    const tipoActual = (j.tipo_expediente || (j.expediente_id ? 'propio' : 'ajeno')).toLowerCase();

    const renderExpedientes = (select: HTMLSelectElement, lista: any[], selectedId?: any) => {
      select.innerHTML = `<option value="">Seleccionar expediente</option>` +
        lista.map(e => `<option value="${e.id}" ${String(e.id) === String(selectedId) ? 'selected' : ''}>${e.numero}/${e.anio} - ${e.caratula || ''}</option>`).join('');
    };

    let demandadosAgregados: { id: number; tipo: 'empresa' | 'cliente'; nombre: string }[] = (Array.isArray(j.demandados) ? j.demandados : [])
      .map((d: any) => ({ id: Number(d.id), tipo: d.tipo, nombre: d.nombre || '' }));

    const renderDemandadosAgregados = () => {
      const contenedor = document.getElementById('demandadosAgregados');
      if (!contenedor) return;
      if (demandadosAgregados.length === 0) { contenedor.innerHTML = `<div style="font-size:13px;color:#666;padding:6px 0;">Sin demandados agregados</div>`; return; }
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

    const { isConfirmed, value } = await Swal.fire({
      title: 'Modificar jurisprudencia',
      html: `
        <select id="tipoExpediente" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="propio" ${tipoActual === 'propio' ? 'selected' : ''}>Expediente propio</option>
          <option value="ajeno" ${tipoActual === 'ajeno' ? 'selected' : ''}>Expediente ajeno</option>
        </select>
        <div id="bloqueExpedientePropio" ${tipoActual === 'ajeno' ? 'style="display:none;"' : ''}>
          <input id="expSearch" class="swal2-input" placeholder="Buscar expediente...">
          <select id="expedienteId" class="swal2-select" style="width:90%;margin:6px 0;"><option value="">Seleccionar expediente</option></select>
        </div>
        <div id="bloqueExpedienteAjeno" ${tipoActual === 'propio' ? 'style="display:none;"' : ''}>
          <input id="numeroExterno" class="swal2-input" type="number" placeholder="Número" value="${j.numero ?? ''}">
          <input id="anioExterno" class="swal2-input" type="number" placeholder="Año" value="${j.anio ?? ''}">
          <input id="objeto" class="swal2-input" placeholder="Objeto" value="${(j.objeto || '').toString().replace(/"/g, '&quot;')}" disabled>
        </div>
        <select id="fuero" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar fuero</option>
          ${['CCF','COM','CIV','CC'].map(f => `<option value="${f}" ${j.fuero === f ? 'selected' : ''}>${f}</option>`).join('')}
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
          ${(this.juzgados || []).map(x => `<option value="${x.id}" ${String(x.id) === String(j.juzgado_id) ? 'selected' : ''}>${x.nombre}</option>`).join('')}
        </select>
        <select id="juezId" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar juez</option>
          ${(this.jueces || []).map(x => `<option value="${x.id}" ${String(x.id) === String(j.juez_id) ? 'selected' : ''}>${x.nombre}</option>`).join('')}
        </select>
        <input id="sentencia" type="date" class="swal2-input" value="${fechaSent}">
        <input id="camara" class="swal2-input" placeholder="Cámara" value="${(j.camara || '').toString().replace(/"/g, '&quot;')}">
        <select id="codigoId" class="swal2-select" style="width:90%;margin:6px 0;">
          <option value="">Seleccionar código</option>
          ${(this.codigos || []).map(c => `<option value="${c.id}" ${String(c.id) === String(j.codigo_id) ? 'selected' : ''}>${c.codigo} - ${c.descripcion}</option>`).join('')}
        </select>`,
      showCancelButton: true, confirmButtonText: 'Guardar', focusConfirm: false,
      willOpen: () => {
        const tipoExpediente = document.getElementById('tipoExpediente') as HTMLSelectElement;
        const bloquePropio = document.getElementById('bloqueExpedientePropio') as HTMLDivElement;
        const bloqueAjeno = document.getElementById('bloqueExpedienteAjeno') as HTMLDivElement;
        const input = document.getElementById('expSearch') as HTMLInputElement;
        const select = document.getElementById('expedienteId') as HTMLSelectElement;
        const demandadoSelect = document.getElementById('demandadoId') as HTMLSelectElement;
        const btnAgregarDemandado = document.getElementById('btnAgregarDemandado') as HTMLButtonElement;
        const exps = this.expedientes || [];
        const actual = exps.find(e => String(e.id) === String(j.expediente_id));
        renderExpedientes(select, actual ? [actual] : exps.slice(0, 30), j.expediente_id);
        renderDemandadosAgregados();
        tipoExpediente.addEventListener('change', () => {
          const esPropio = tipoExpediente.value === 'propio';
          bloquePropio.style.display = esPropio ? 'block' : 'none';
          bloqueAjeno.style.display = esPropio ? 'none' : 'block';
        });
        input.addEventListener('input', () => {
          const q = norm(input.value);
          renderExpedientes(select, (!q || q.length < 2) ? (actual ? [actual] : exps.slice(0, 30)) : exps.filter(e => norm(e.busqueda).includes(q)).slice(0, 30), select.value || j.expediente_id);
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

    if (!isConfirmed || !value) return;
    this.jurisprudenciasService.actualizarJurisprudencia(j.id, value).subscribe({
      next: () => { this.cargarJurisprudencias(); Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Jurisprudencia modificada', showConfirmButton: false, timer: 2500 }); },
      error: () => Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se pudo modificar', showConfirmButton: false, timer: 2500 })
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
}