import { Component, OnInit, ViewChild, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';  // Necesario para usar firstValueFrom

import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonCard, IonCardContent, IonText, IonItem, IonItemOption, IonItemOptions, IonLabel, IonItemSliding, IonList, IonIcon, IonButton, IonButtons, IonInput } from '@ionic/angular/standalone';
import { JurisprudenciasService } from 'src/app/services/jurisprudencias.service';
import { JurisprudenciaModel } from 'src/app/models/jurisprudencia/jurisprudencia.component';
import { MatDialogModule } from '@angular/material/dialog';

import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ClientesService } from 'src/app/services/clientes.service';
import { DemandadosService } from 'src/app/services/demandado.service';
import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuezService } from 'src/app/services/juez.service';
import { CodigosService } from 'src/app/services/codigos.service';

import { ClienteModel } from 'src/app/models/cliente/cliente.component';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { JuezModel } from 'src/app/models/juez/juez.component';
import { CodigoModel } from 'src/app/models/codigo/codigo.component';


import { Subscription, Observable  } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PageEvent } from '@angular/material/paginator';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';


import { MatDialog } from '@angular/material/dialog';
import { DialogJuzgadoComponent } from '../../components/dialog-juzgado/dialog-juzgado.component'; 
import { DialogJuzgadoModificarComponent } from '../../components/dialog-juzgado-modificar/dialog-juzgado-modificar.component'; 

import Swal from 'sweetalert2'

// src\app\components\dialog-cliente\dialog-cliente.component.ts
@Component({
  selector: 'app-jurisprudencia',
  templateUrl: './jurisprudencias.page.html',
  styleUrls: ['./jurisprudencias.page.scss'],
  standalone: true,
  imports: [IonInput, 
    CommonModule,
    FormsModule,
    IonButtons, IonButton, IonIcon, IonList, IonItemSliding, IonLabel, IonItemOptions, IonItemOption, 
    IonItem, IonCardContent, IonCard, IonImg, IonContent, IonHeader, IonTitle, IonToolbar, IonText,
    MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatPaginatorModule,
    MatMenuModule, MatButtonModule, MatIconModule, MatDialogModule

 
  ]
})
export class JurisprudenciasPage implements OnInit {

  private normalizar = (s: any) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  jurisprudencias: JurisprudenciaModel[] = [];
  jurisprudenciasOriginales: JurisprudenciaModel[] = []; 

  clientes: ClienteModel[] = [];
  demandados: DemandadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = [];
  juzgados: JuzgadoModel[] = [];
  jueces: JuezModel[] = [];
  codigos: CodigoModel[] = [];
  expedientes: ExpedienteModel[] = [];


  getJurisprudencias$!: Subscription;
  hayJurisprudencias: boolean = true;
  busqueda: string = '';
  busquedaAnterior: string = ''; 
  texto: string = '';

  private destroy$ = new Subject<void>();

  private timeoutId: any;



  constructor(
    private jurisprudenciasService: JurisprudenciasService,
    private clientesService: ClientesService,
    private demandadosService: DemandadosService,
    private juzgadosService: JuzgadosService,
    private juezService: JuezService,
    private codigosService: CodigosService,
    private expepedientesService: ExpedientesService,
    private dialog: MatDialog,
    private router: Router
  ) {}
  

  ngOnInit() {
    if(this.busqueda == ''){
      this.cargarJurisprudencias(); 

      this.clientesService.getClientes().subscribe(c => { this.clientes = c || []; });
      this.demandadosService.getDemandados().subscribe(d => { this.demandados = d || []; });
      this.juzgadosService.getJuzgados().subscribe(j => {
      this.juzgadosOriginales = j || [] 
      this.juzgados = [...this.juzgadosOriginales];});
      this.juezService.getJuez().subscribe(j => { this.jueces = j || []; });
      this.codigosService.getCodigos().subscribe(j => { this.codigos = j || []; });
      this.expepedientesService.getExpedientes().subscribe(j => { this.expedientes = j || []; });

    }
  }

cargarJurisprudencias() {
  this.jurisprudenciasService.getJurisprudencias().subscribe(
    (jurisprudencias) => {
      this.jurisprudencias = jurisprudencias ?? [];
      this.jurisprudenciasOriginales = [...this.jurisprudencias];
      this.hayJurisprudencias = this.jurisprudencias.length > 0;
    },
    (error) => {
      console.error('Error al obtener jurisprudencias:', error);
      this.jurisprudencias = [];
      this.jurisprudenciasOriginales = [];
      this.hayJurisprudencias = false;
    }
  );
}



  goTo(path: string) {
    this.router.navigate([path]);
  }




  buscar() {
    const q = this.normalizar(this.busqueda);
    if (!q) { this.jurisprudencias = [...this.jurisprudenciasOriginales]; return; }

    this.jurisprudencias = this.jurisprudenciasOriginales.filter(j => {
      const jurisprudencias   = this.normalizar(j.demandadoModel?.nombre || '');
      return jurisprudencias.includes(q);
    });
  }
async eliminarJurisprudencia(j: JurisprudenciaModel, ev?: Event) {
  ev?.stopPropagation?.(); // si está dentro de ion-item / sliding

  const { isConfirmed } = await Swal.fire({
    title: '¿Eliminar definitivamente?',
    text: 'Esto borra la jurisprudencia. No se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (!isConfirmed) return;

  this.jurisprudenciasService.eliminarJurisprudencia(String(j.id)).subscribe({
    next: (r) => {
      this.cargarJurisprudencias();
      const msg = (r?.detachedCount && r.detachedCount > 0)
        ? `Eliminada. Se desvincularon ${r.detachedCount} expediente(s).`
        : 'Jurisprudencia eliminada.';
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: msg, showConfirmButton: false, timer: 2500 });
    },
    error: (err) => {
      console.error(err);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se pudo eliminar', showConfirmButton: false, timer: 2500 });
    }
  });
}




async agregarJurisprudencias() {
  const norm = (s: any) =>
    (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const renderExpedientes = (select: HTMLSelectElement, lista: any[]) => {
    select.innerHTML =
      `<option value="">Seleccionar expediente</option>` +
      lista.map(e => `
        <option value="${e.id}">
          ${e.numero}/${e.anio} - ${e.caratula || ''}
        </option>
      `).join('');
  };

  const result = await Swal.fire({
    title: 'Agregar jurisprudencia',
    html: `
      <input id="expSearch" class="swal2-input" placeholder="Buscar expediente...">

      <select id="expedienteId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar expediente</option>
      </select>

      <select id="fuero" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar fuero</option>
        <option value="CCF">CCF</option>
        <option value="COM">COM</option>
        <option value="CIV">CIV</option>
        <option value="CC">CC</option>
      </select>

      <select id="demandadoId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar demandado</option>
        ${(this.demandados || []).map(d => `<option value="${d.id}">${d.nombre}</option>`).join('')}
      </select>

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
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    focusConfirm: false,

    willOpen: () => {
      const input  = document.getElementById('expSearch') as HTMLInputElement;
      const select = document.getElementById('expedienteId') as HTMLSelectElement;

      const exps = this.expedientes || [];
      console.log('expedientes cargados:', exps.length);

      renderExpedientes(select, exps.slice(0, 30));

      input.addEventListener('input', () => {
        const q = norm(input.value);
        if (!q || q.length < 2) {
          renderExpedientes(select, exps.slice(0, 30));
          return;
        }
        renderExpedientes(select, exps.filter(e => norm(e.busqueda).includes(q)).slice(0, 30));
      });
    },

    preConfirm: () => {
      const expedienteId = (document.getElementById('expedienteId') as HTMLSelectElement).value;
      const fuero        = (document.getElementById('fuero') as HTMLSelectElement).value;
      const demandadoId  = (document.getElementById('demandadoId') as HTMLSelectElement).value;
      const juzgadoId    = (document.getElementById('juzgadoId') as HTMLSelectElement).value;
      const juezId       = (document.getElementById('juezId') as HTMLSelectElement).value;
      const sentenciaVal = (document.getElementById('sentencia') as HTMLInputElement).value;
      const camara       = (document.getElementById('camara') as HTMLInputElement).value.trim();
      const codigoId     = (document.getElementById('codigoId') as HTMLSelectElement).value;

      if (!expedienteId || !fuero || !demandadoId || !juzgadoId || !juezId || !codigoId || !camara) {
        Swal.showValidationMessage('Debe completar todos los campos obligatorios');
        return null;
      }

      return {
        expediente_id: Number(expedienteId),
        fuero,
        demandado_id: Number(demandadoId),
        juzgado_id: Number(juzgadoId),
        juez_id: Number(juezId),
        sentencia: sentenciaVal ? new Date(sentenciaVal) : null,
        camara,
        codigo_id: Number(codigoId)
      };
    }
  });

  console.log('Swal result:', result);

  if (!result.isConfirmed || !result.value) return;

  // 🔥 ACÁ SE LLAMA AL SERVICE, sin dudas
  this.jurisprudenciasService.addJurisprudencia({ id: '', ...(result.value as any) }).subscribe({
    next: () => {
      this.cargarJurisprudencias();
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Jurisprudencia agregada', showConfirmButton: false, timer: 2500 });
    },
    error: (err) => {
      console.error('addJurisprudencia error:', err);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se pudo agregar', showConfirmButton: false, timer: 2500 });
    }
  });
}



async modificarJurisprudencia(j: JurisprudenciaModel) {
  const norm = (s: any) =>
    (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const fechaSent = j.sentencia ? new Date(j.sentencia as any).toISOString().slice(0, 10) : '';

  const renderExpedientes = (select: HTMLSelectElement, lista: any[], selectedId?: any) => {
    select.innerHTML =
      `<option value="">Seleccionar expediente</option>` +
      lista.map(e => `
        <option value="${e.id}" ${String(e.id) === String(selectedId) ? 'selected' : ''}>
          ${e.numero}/${e.anio} - ${e.caratula || ''}
        </option>
      `).join('');
  };

  const { isConfirmed, value } = await Swal.fire({
    title: 'Modificar jurisprudencia',
    html: `
      <input id="expSearch" class="swal2-input" placeholder="Buscar expediente...">

      <select id="expedienteId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar expediente</option>
      </select>

      <select id="fuero" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar fuero</option>
        <option value="CCF" ${j.fuero === 'CCF' ? 'selected' : ''}>CCF</option>
        <option value="COM" ${j.fuero === 'COM' ? 'selected' : ''}>COM</option>
        <option value="CIV" ${j.fuero === 'CIV' ? 'selected' : ''}>CIV</option>
        <option value="CC"  ${j.fuero === 'CC'  ? 'selected' : ''}>CC</option>
      </select>

      <select id="demandadoId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar demandado</option>
        ${(this.demandados || []).map(d => `
          <option value="${d.id}" ${String(d.id) === String(j.demandado_id) ? 'selected' : ''}>
            ${d.nombre}
          </option>`).join('')}
      </select>

      <select id="juzgadoId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar juzgado</option>
        ${(this.juzgados || []).map(x => `
          <option value="${x.id}" ${String(x.id) === String(j.juzgado_id) ? 'selected' : ''}>
            ${x.nombre}
          </option>`).join('')}
      </select>

      <select id="juezId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar juez</option>
        ${(this.jueces || []).map(x => `
          <option value="${x.id}" ${String(x.id) === String(j.juez_id) ? 'selected' : ''}>
            ${x.nombre}
          </option>`).join('')}
      </select>

      <input id="sentencia" type="date" class="swal2-input" value="${fechaSent}">
      <input id="camara" class="swal2-input" placeholder="Cámara"
        value="${(j.camara || '').toString().replace(/"/g, '&quot;')}">

      <select id="codigoId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar código</option>
        ${(this.codigos || []).map(c => `
          <option value="${c.id}" ${String(c.id) === String(j.codigo_id) ? 'selected' : ''}>
            ${c.codigo} - ${c.descripcion}
          </option>`).join('')}
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    focusConfirm: false,

    // ✅ acá se inicializa el select de expedientes y el buscador (sin setTimeout)
    willOpen: () => {
      const input  = document.getElementById('expSearch') as HTMLInputElement;
      const select = document.getElementById('expedienteId') as HTMLSelectElement;

      const actual = (this.expedientes || []).find(e => String(e.id) === String(j.expediente_id));

      // precarga: SOLO el actual (tu viejo no pierde tiempo)
      if (actual) {
        renderExpedientes(select, [actual], actual.id);
      } else {
        // si por algo no está en memoria, mostramos un top chico
        renderExpedientes(select, (this.expedientes || []).slice(0, 30), j.expediente_id);
      }

      input.addEventListener('input', () => {
        const q = norm(input.value);
        if (!q || q.length < 2) {
          if (actual) renderExpedientes(select, [actual], actual.id);
          else renderExpedientes(select, (this.expedientes || []).slice(0, 30), j.expediente_id);
          return;
        }
        const lista = (this.expedientes || [])
          .filter(e => norm(e.busqueda).includes(q))
          .slice(0, 30);

        renderExpedientes(select, lista, select.value || j.expediente_id);
      });
    },

    preConfirm: () => {
      const expedienteId = (document.getElementById('expedienteId') as HTMLSelectElement).value;
      const fuero        = (document.getElementById('fuero') as HTMLSelectElement).value;
      const demandadoId  = (document.getElementById('demandadoId') as HTMLSelectElement).value;
      const juzgadoId    = (document.getElementById('juzgadoId') as HTMLSelectElement).value;
      const juezId       = (document.getElementById('juezId') as HTMLSelectElement).value;
      const sentenciaVal = (document.getElementById('sentencia') as HTMLInputElement).value;
      const camara       = (document.getElementById('camara') as HTMLInputElement).value.trim();
      const codigoId     = (document.getElementById('codigoId') as HTMLSelectElement).value;

      if (!expedienteId || !fuero || !demandadoId || !juzgadoId || !juezId || !codigoId || !camara) {
        Swal.showValidationMessage('Debe completar todos los campos obligatorios');
        return null;
      }

      return {
        expediente_id: Number(expedienteId),
        fuero,
        demandado_id: Number(demandadoId),
        juzgado_id: Number(juzgadoId),
        juez_id: Number(juezId),
        sentencia: sentenciaVal ? new Date(sentenciaVal) : null,
        camara,
        codigo_id: Number(codigoId),
      };
    }
  });

  if (!isConfirmed || !value) return;

  this.jurisprudenciasService.actualizarJurisprudencia(j.id, value).subscribe({
    next: () => {
      this.cargarJurisprudencias();
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Jurisprudencia modificada', showConfirmButton: false, timer: 2500 });
    },
    error: (err) => {
      console.error('Error al modificar jurisprudencia:', err);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se pudo modificar', showConfirmButton: false, timer: 2500 });
    }
  });
}


        
        
}
