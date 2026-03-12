import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { IonHeader, IonToolbar } from "@ionic/angular/standalone";
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { DialogExpedienteModificarComponent } from '../../components/dialog-expediente-modificar/dialog-expediente-modificar.component'; 
import Swal from 'sweetalert2'

// importá acá tu dialog real
// import { ModificarExpedienteComponent } from 'src/app/components/modificar-expediente/modificar-expediente.component';

@Component({
  selector: 'app-control-anio-expedientes',
  standalone: true,
  templateUrl: './control-anio-expedientes.page.html',
  styleUrls: ['./control-anio-expedientes.page.scss'],
  imports: [IonToolbar, IonHeader, 
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule
  ]
})
export class ControlAnioExpedientesPage {
  cargando = false;

  expedientes: any[] = [];
  expedientesOriginales: any[] = [];

  busqueda = '';

  constructor(
    private expedientesService: ExpedientesService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;

    this.expedientesService.getControlAnioExpedientes().subscribe({
      next: (data: any[]) => {
        this.expedientesOriginales = data || [];
        this.expedientes = data || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('ERROR CONTROL ANIO:', err);
        this.cargando = false;
      }
    });
  }

  filtrar() {
    const texto = (this.busqueda || '').toLowerCase().trim();

    this.expedientes = this.expedientesOriginales.filter(item => {
      const numeroOk = item.numero?.toString().includes(texto);
      const anioOk = item.anio?.toString().includes(texto);
      const anioRealOk = item.anio_real?.toString().includes(texto);
      const clientesOk = (item.clientes || '').toLowerCase().includes(texto);

      return !texto || numeroOk || anioOk || anioRealOk || clientesOk;
    });
  }

abrirModificar(expediente: ExpedienteModel) {
  const dialogRef = this.dialog.open(DialogExpedienteModificarComponent, {
    width: '900px',
    disableClose: true,
        data: {
      id: expediente.id,
      tipo_registro: expediente.tipo_registro ?? null,
    }
  });

  dialogRef.afterClosed().subscribe((payload: any) => {
    if (!payload?.id) return;

    this.expedientesService.actualizarExpediente(payload.id, payload).subscribe({
      next: () => {
        Swal.fire({ toast:true, position:'top-end', icon:'success', title:'Expediente modificado', showConfirmButton:false, timer:1500 });
        this.cargar();
      },
      error: () => {
        Swal.fire({ toast:true, position:'top-end', icon:'error', title:'Error al actualizar', showConfirmButton:false, timer:1500 });
      }
    });
  });
}

}