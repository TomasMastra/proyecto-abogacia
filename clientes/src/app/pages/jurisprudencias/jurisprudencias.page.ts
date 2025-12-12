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


async eliminarJurisprudencia(j: JurisprudenciaModel) {
  const { isConfirmed, dismiss } = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Esto elimina el codigo definitivamente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'No, cancelar',
    reverseButtons: true
  });

  if (!isConfirmed) {
    if (dismiss === Swal.DismissReason.cancel) {
      Swal.fire({ toast: true, position: 'top-end', icon: 'info', title: 'Cancelaste la eliminación.', showConfirmButton: false, timer: 2500 });
    }
    return;
  }

  this.jurisprudenciasService.eliminarJurisprudencia(j.id).subscribe({
    next: (r: any) => {
      this.cargarJurisprudencias();
      const msg = r?.detachedCount > 0
        ? `Eliminada. Se desvincularon ${r.detachedCount} expediente(s).`
        : 'codigo eliminado correctamente.';
      Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: msg, showConfirmButton: false, timer: 3000 });
    },
    error: (err) => {
      console.error(err);
      Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: 'No se pudo eliminar.' });
    }
  });
}

  
agregarJurisprudencias() {
  // armamos las opciones de los selects con las listas que ya tenés cargadas
  const optsExpedientes = (this.expedientes || [])
    .map(e => `<option value="${e.id}">${e.numero}/${e.anio} - ${e.caratula || ''}</option>`)
    .join('');

  const optsDemandados = (this.demandados || [])
    .map(d => `<option value="${d.id}">${d.nombre}</option>`)
    .join('');

  const optsJuzgados = (this.juzgados || [])
    .map(j => `<option value="${j.id}">${j.nombre}</option>`)
    .join('');

  const optsJueces = (this.jueces || [])
    .map(j => `<option value="${j.id}">${j.nombre}</option>`)
    .join('');

  const optsCodigos = (this.codigos || [])
    .map(c => `<option value="${c.id}">${c.codigo} - ${c.descripcion}</option>`)
    .join('');

  Swal.fire({
    title: 'Agregar jurisprudencia',
    html: `
      <select id="expedienteId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar expediente</option>
        ${optsExpedientes}
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
        ${optsDemandados}
      </select>

      <select id="juzgadoId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar juzgado</option>
        ${optsJuzgados}
      </select>

      <select id="juezId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar juez</option>
        ${optsJueces}
      </select>

      <input id="sentencia" type="date" class="swal2-input" placeholder="Fecha sentencia (opcional)">
      <input id="camara" class="swal2-input" placeholder="Cámara">

      <select id="codigoId" class="swal2-select" style="width:90%;margin:6px 0;">
        <option value="">Seleccionar código</option>
        ${optsCodigos}
      </select>
    `,
    showCancelButton: true,
    focusConfirm: false,
    confirmButtonText: 'Agregar',
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
        sentencia: sentenciaVal ? new Date(sentenciaVal) : null,
        juez_id: Number(juezId),
        camara,
        codigo_id: Number(codigoId)
      };
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      const jurisprudencia: JurisprudenciaModel = {
        id: '',
        ...result.value
      };

      this.jurisprudenciasService.addJurisprudencia(jurisprudencia).subscribe({
        next: () => {
          this.cargarJurisprudencias();
          Swal.fire({
            toast: true,
            icon: 'success',
            title: 'Jurisprudencia agregada',
            showConfirmButton: false,
            timer: 3000,
            position: 'top-end'
          });
        },
        error: (error) => {
          console.error('Error al agregar jurisprudencia:', error);
          Swal.fire({
            toast: true,
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al agregar la jurisprudencia. Intenta nuevamente.',
            showConfirmButton: false,
            timer: 3000
          });
        }
      });
    }
  });
}


        
/*
modificarJuez(juez: JuezModel) {
  Swal.fire({
    title: 'Modificar Juez',
    html: `
      <input id="nombre" class="swal2-input" placeholder="Nombre" value="${juez.nombre}">
      <input id="apellido" class="swal2-input" placeholder="Apellido" value="${juez.apellido}">
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    preConfirm: () => {
      const nombre = (document.getElementById('nombre') as HTMLInputElement).value;
      const apellido = (document.getElementById('apellido') as HTMLInputElement).value;

      if (!nombre || !apellido) {
        Swal.showValidationMessage('Debe completar ambos campos');
        return null;
      }

      return { nombre, apellido };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const juezModificado: JuezModel = {
        ...juez, // mantiene id y estado
        nombre: result.value.nombre,
        apellido: result.value.apellido,
      };

      this.juezService.actualizarJuez(juezModificado.id, juezModificado).subscribe({
        next: () => {
          this.cargarJueces();
          Swal.fire({
            toast: true,
            icon: 'success',
            title: 'Juez modificado',
            text: `Se actualizó correctamente a ${juezModificado.nombre} ${juezModificado.apellido}`,
            showConfirmButton: false,
            timer: 3000,
            position: 'top-end'
          });
        },
        error: (error) => {
          console.error('Error al modificar juez:', error);
          Swal.fire({
            toast: true,
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al modificar al juez.',
            showConfirmButton: false,
            timer: 3000,
            position: 'top-end'
          });
        }
      });
    }
  });
}
*/
        
        
}
