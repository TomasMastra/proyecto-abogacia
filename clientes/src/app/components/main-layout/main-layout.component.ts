import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatIconModule, SidebarComponent],
})
export class MainLayoutComponent implements OnInit, OnDestroy {

  sidebarCollapsed: boolean = false; // desktop: visible por defecto
  mobileOpen: boolean = false;       // móvil: oculto por defecto
  isMobile: boolean = false;
  nombreUsuario: string = '';
  paginaActual: string = 'Inicio';

  private routeNames: { [key: string]: string } = {
    'home':                     'Inicio',
    'lista-clientes':           'Clientes',
    'lista-expedientes':        'Expedientes',
    'estado':                   'Estados',
    'honorario-diferido':       'Honorarios',
    'consultas':                'Consultas',
    'consultas-oficio':         'Consultas pruebas',
    'requeridos':               'Requieren atención',
    'oficio':                   'Pruebas',
    'cobranzas':                'Cobranzas',
    'datos-importantes':        'Datos importantes',
    'jurisprudencias':          'Jurisprudencias',
    'lista-mediaciones':        'Mediaciones',
    'informes-enre':            'Informes ENRE',
    'juzgados':                 'Juzgados',
    'localidades':              'Localidades',
    'demandado':                'Demandados',
    'jueces':                   'Jueces',
    'codigos':                  'Códigos',
    'graficos':                 'Estadísticas',
    'control-anio-expedientes': 'Correcciones ENRE',
  };

  private routerSub!: Subscription;

  constructor(private router: Router, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.nombreUsuario = this.usuarioService.usuarioLogeado?.nombre ?? 'Usuario';
    this.checkScreenSize();

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const route = e.urlAfterRedirects.replace('/', '').split('?')[0];
      this.paginaActual = this.routeNames[route] ?? route;
      // En móvil cerrar sidebar al navegar
      if (this.isMobile) this.mobileOpen = false;
    });

    const current = this.router.url.replace('/', '').split('?')[0];
    this.paginaActual = this.routeNames[current] ?? current;
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
    // Al pasar de móvil a desktop, cerrar el overlay
    if (!this.isMobile) this.mobileOpen = false;
  }

  // Un solo toggle: en móvil maneja mobileOpen, en desktop maneja collapsed
  toggleSidebar(): void {
    if (this.isMobile) {
      this.mobileOpen = !this.mobileOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }
}