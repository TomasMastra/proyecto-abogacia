import { Component } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { UmaService } from 'src/app/services/uma.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../services/usuario.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, CommonModule, 
          MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
          MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule,
          MatMenuModule, MatButtonModule, MatIconModule, MatSelectModule,     
          MatFormFieldModule, MatInputModule, MatCardModule],
})
export class HomePage {
  
  expedientesActivos: number = 0;
  clientesRegistrados: number = 0;
  sentenciasEmitidas: number = 0;
  honorariosPendientes: number = 0;

  constructor(private router: Router, private umaService: UmaService, 
    private expedienteService: ExpedientesService, public usuarioService: UsuarioService
  ) {}

  goTo(path: string) {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([path]); // Esto forzará la recarga del componente
    });
  }

  ngOnInit() {
  this.expedienteService.obtenerCantidadExpedientesActivos().subscribe(d => this.expedientesActivos = d);
  this.expedienteService.obtenerCantidadClientesRegistrados().subscribe(d => this.clientesRegistrados = d);
  this.expedienteService.obtenerCantidadSentenciasEmitidas().subscribe(d => this.sentenciasEmitidas = d);
  this.expedienteService.obtenerCantidadHonorariosPendientes().subscribe(d => this.honorariosPendientes = d);
}

  verificarRol(): boolean{
    if(this.usuarioService.usuarioLogeado!.rol == 'admin'){
      return true;
    }
    return false;   
  }

}
