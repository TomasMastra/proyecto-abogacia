import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { LocalidadesService } from 'src/app/services/localidades.service';
import { LocalidadModel } from 'src/app/models/localidad/localidad.component';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonCheckbox, IonItemSliding } from "@ionic/angular/standalone";



import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { takeUntil } from 'rxjs/operators';


import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

import { IonLabel, IonItem } from "@ionic/angular/standalone";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-localidad-modificar',
  templateUrl: './dialog-localidad-modificar.component.html',
  styleUrls: ['./dialog-localidad-modificar.component.scss'],
  standalone: true,
  imports: [IonItemSliding, IonCheckbox, 
    CommonModule, 
    FormsModule,
    MatButtonModule, 
    MatDialogModule, 
    MatFormFieldModule, 
    MatInputModule, 
    ReactiveFormsModule, MatSelectModule
  ]
})
export class DialogLocalidadModificarComponent {

  protected form: FormGroup;
  menu: number = 1;
  private destroy$ = new Subject<void>(); 


  constructor(
    private localidadService: LocalidadesService,
    public dialogRef: MatDialogRef<DialogLocalidadModificarComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LocalidadModel
  ) {
    this.form = new FormGroup({
      localidad: new FormControl(data?.localidad ?? '', [Validators.required]),
    });
  }




  closeDialog(): void {
    this.dialogRef.close();
  }

  acceptDialog(): void {
    if (this.form.valid) {
      const localidad: LocalidadModel = {
        id: this.data?.id ?? '0',  // Si tiene un ID, lo conserva; si no, asignamos "0"
        localidad: this.form.value.localidad ?? null,
        partido: null,
        provincia: null,
        estado: this.data.estado ?? '',

      };

      this.dialogRef.close(localidad);
    } else {
          const camposFaltantes = this.obtenerCamposFaltantes();
          if (camposFaltantes.length > 0) {
            Swal.fire({
              icon: 'warning',
              title: 'Faltan completar campos',
              html: `<strong>Por favor completá:</strong><br><ul style="text-align: left;">${camposFaltantes.map(campo => `<li>${campo}</li>`).join('')}</ul>`,
              confirmButtonText: 'Entendido',
            });
            return;
          }

    }
  }

    public obtenerCamposFaltantes(): string[] {
      const camposObligatorios = [
        { nombre: 'localidad', control: 'localidad' },

      ];
    
      const faltantes: string[] = [];
    
      camposObligatorios.forEach(campo => {
        const control = this.form.get(campo.control);
        if (control && control.validator && control.invalid) {
          faltantes.push(campo.nombre);
        }
      });
    
      return faltantes;
    } 

}
