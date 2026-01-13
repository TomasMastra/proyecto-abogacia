
import { Component, OnInit, ViewChild, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UsuarioService } from 'src/app/services/usuario.service';
import { BackupService } from 'src/app/services/backup.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, IonApp, IonRouterOutlet, MatDatepickerModule, MatNativeDateModule,
      MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule,
      MatMenuModule, MatIconModule, MatSidenavModule, CommonModule],
})
export class AppComponent {

    private usuarioService: UsuarioService;
    logeado: boolean = false;

  activeRoute: string = '';

  constructor(private router: Router, usuarioService: UsuarioService,
              private backupService: BackupService) {
          this.usuarioService = usuarioService;    
          this.usuarioService.logeado$.subscribe(valor => {
          this.logeado = valor;

              if (!valor) {
      this.router.navigate(['login']);
    }
         });

  }  
  
    

  goTo(path: string) {
    //this.router.navigate([path]);
    this.router.navigate([path], { replaceUrl: true });

  }

  isActive(route: string): boolean {
    return this.activeRoute.includes(route);
  }

    descargar() {
    this.backupService.descargarBackup().subscribe((data: Blob) => {

      const blob = new Blob([data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${Date.now()}.zip`;
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }

  logout(){
    this.usuarioService.logout();
  }

  verificarRol(): boolean{
    if(this.usuarioService.usuarioLogeado!.rol == 'admin'){
      return true;
    }
    return false;   
  }
}
