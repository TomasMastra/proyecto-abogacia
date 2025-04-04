import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { Subscription, Observable  } from 'rxjs';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatDialog } from '@angular/material/dialog';
import { IonList, IonItemSliding, IonLabel, IonItem } from "@ionic/angular/standalone";

@Component({
  selector: 'app-honorario-diferido',
  templateUrl: './honorario-diferido.page.html',
  styleUrls: ['./honorario-diferido.page.scss'],
  standalone: true,
    imports: [IonItem, IonLabel, IonItemSliding, IonList, CommonModule, FormsModule,
      MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
      MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatMenuModule, MatProgressSpinnerModule
    ]
})
export class HonorarioDiferidoPage implements OnInit {

  cargando: boolean = false;
  honorariosDiferidos: any[] = [];
  hayHonorarios: boolean = true;
  private destroy$ = new Subject<void>();

  constructor(
    private expedienteService: ExpedientesService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarHonorariosDiferidos();
  }

  cargarHonorariosDiferidos() {
    this.cargando = true;
    this.expedienteService.getExpedientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (honorarios) => {
          this.honorariosDiferidos = honorarios;
          this.hayHonorarios = this.honorariosDiferidos.length > 0;
          this.cargando = false;
        },
        (error) => {
          console.error('Error al obtener expedientes:', error);
          this.cargando = false;
        }
      );
  }

  goTo(ruta: string) {
    this.router.navigate([ruta]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

}