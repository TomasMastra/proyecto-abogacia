import { Component, OnInit, ViewChild, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';  // Necesario para usar firstValueFrom

import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonCard, IonCardContent, IonText, IonItem, IonItemOption, IonItemOptions, IonLabel, IonItemSliding, IonList, IonIcon, IonButton, IonButtons, IonInput } from '@ionic/angular/standalone';
import { CodigosService } from 'src/app/services/codigos.service';
import { CodigoModel } from 'src/app/models/codigo/codigo.component';
import { MatDialogModule } from '@angular/material/dialog';

/*
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
*/
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
  selector: 'app-codigos',
  templateUrl: './codigos.page.html',
  styleUrls: ['./codigos.page.scss'],
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
export class CodigosPage implements OnInit {

  //private expedientesService: ExpedientesService;

  private normalizar = (s: any) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  codigos: CodigoModel[] = [];
  codigosOriginales: CodigoModel[] = []; 

  getCodigos$!: Subscription;
  hayCodigos: boolean = true;
  busqueda: string = '';
  busquedaAnterior: string = ''; 
  texto: string = '';

  private destroy$ = new Subject<void>();

  private timeoutId: any;



  constructor(
    private codigosService: CodigosService,
    private dialog: MatDialog,
    private router: Router
  ) {}
  

  ngOnInit() {
    if(this.busqueda == ''){
      this.cargarCodigos(); 
    }
  }

  cargarCodigos() {
    this.codigosService.getCodigos().subscribe(
      (codigos) => {
        this.codigos = codigos;
        this.codigosOriginales = [...codigos];
        this.hayCodigos = this.codigos.length > 0;
      },
      (error) => {
        console.error('Error al obtener codigos:', error);
      },
      () => {
        this.timeoutId = setTimeout(() => {
          this.cargarCodigos();

        }, 5000);
      }
    );
  }


  goTo(path: string) {
    this.router.navigate([path]);
  }

  obtenerCodigos() {
    this.getCodigos$ = this.codigosService.getCodigos().subscribe(
      (codigos) => {
        this.codigos = codigos;
        this.codigosOriginales = [...codigos]; 
        this.hayCodigos = this.codigos.length > 0;
      },
      (error) => {
        console.error('Error al obtener codigos:', error);
      }
    );
  }


buscar() {
  const q = this.normalizar(this.busqueda);
  if (!q) { this.codigos = [...this.codigosOriginales]; return; }

  this.codigos = this.codigosOriginales.filter(j => {
    const desc   = this.normalizar(j.descripcion || '');
    const tipo   = this.normalizar(j.tipo || '');
    const codigo = this.normalizar(j.codigo);
    return desc.includes(q) || tipo.includes(q) || codigo.includes(q);
  });
}


async eliminarCodigos(j: CodigoModel) {
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

  this.codigosService.eliminarCodigo(j.id).subscribe({
    next: (r: any) => {
      this.cargarCodigos();
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

  
agregarCodigo() {
  Swal.fire({
    title: 'Agregar codigo',
    html: `
      <select id="tipo" class="swal2-select" style="width:80%;margin:10px 0;">
        <option value="">Seleccionar tipo</option>
        <option value="familia">Familia</option>
        <option value="patrimoniales">Patrimoniales</option>
        <option value="comercial">Comercial</option>
      </select>
      <input id="codigo" class="swal2-input" placeholder="Código (ej: JUR-001)">
      <textarea id="descripcion" class="swal2-textarea" placeholder="Descripción o resumen" style="height:120px;"></textarea>
    `,
    showCancelButton: true,
    confirmButtonText: 'Agregar',
    preConfirm: () => {
      const tipo = (document.getElementById('tipo') as HTMLSelectElement).value;
      const codigo = (document.getElementById('codigo') as HTMLInputElement).value.trim();
      const descripcion = (document.getElementById('descripcion') as HTMLTextAreaElement).value.trim();

      if (!tipo || !codigo || !descripcion) {
        Swal.showValidationMessage('Debe completar todos los campos');
        return null;
      }

      return { tipo, codigo, descripcion };
    }
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const codigo: CodigoModel = {
        id: '',
        tipo: result.value.tipo,
        codigo: result.value.codigo,
        descripcion: result.value.descripcion,
        estado: 'activo'
      };

      this.codigosService.addCodigo(codigo).subscribe({
        next: () => {
          this.cargarCodigos();
          Swal.fire({
            toast: true,
            icon: 'success',
            title: 'codigo agregada',
            text: `Se agregó correctamente (${codigo.tipo.toUpperCase()}) ${codigo.codigo}`,
            showConfirmButton: false,
            timer: 3000,
            position: 'top-end'
          });
        },
        error: (error) => {
          console.error('Error al agregar codigo:', error);
          Swal.fire({
            toast: true,
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al agregar el codigo. Intenta nuevamente.',
            showConfirmButton: false,
            timer: 3000,
            position: 'top-end'
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
