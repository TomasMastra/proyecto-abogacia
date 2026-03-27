import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
})
export class SidebarComponent implements OnInit, OnDestroy {

  @Input()  collapsed: boolean = false;
  @Input()  mobileOpen: boolean = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() mobileOpenChange = new EventEmitter<boolean>();

  activeRoute: string = '';
  nombreUsuario: string = '';
  esAdmin: boolean = false;

  groupOpen: { [key: string]: boolean } = {
    expedientes: false,
    general: false,
  };

  private groupRoutes: { [key: string]: string[] } = {
    expedientes: ['lista-expedientes','estado','honorario-diferido','consultas',
                  'consultas-oficio','requeridos','oficio','cobranzas',
                  'datos-importantes','jurisprudencias','lista-mediaciones','informes-enre'],
    general:     ['juzgados','localidades','demandado','jueces','codigos','graficos'],
  };

  private routerSub!: Subscription;
  private loginSub!: Subscription;

  constructor(private router: Router, private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    // Suscribirse al observable para detectar cuando el usuario esté disponible
    // Esto cubre tanto el login directo como la recarga de página (desde localStorage)
    this.loginSub = this.usuarioService.logeado$.subscribe(logeado => {
      if (logeado) {
        const u = this.usuarioService.usuarioLogeado;
        this.nombreUsuario = u?.nombre ?? 'Usuario';
        this.esAdmin = u?.rol === 'admin';
      } else {
        this.nombreUsuario = '';
        this.esAdmin = false;
      }
    });

    // También leer el valor actual por si ya estaba disponible antes de suscribirse
    const u = this.usuarioService.usuarioLogeado;
    if (u) {
      this.nombreUsuario = u.nombre ?? 'Usuario';
      this.esAdmin = u.rol === 'admin';
    }

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.activeRoute = e.urlAfterRedirects.replace('/', '').split('?')[0];
      this.openActiveGroup();
      if (this.mobileOpen) {
        this.mobileOpenChange.emit(false);
      }
    });

    this.activeRoute = this.router.url.replace('/', '').split('?')[0];
    this.openActiveGroup();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.loginSub?.unsubscribe();
  }

  private openActiveGroup(): void {
    for (const [group, routes] of Object.entries(this.groupRoutes)) {
      if (routes.includes(this.activeRoute)) {
        this.groupOpen[group] = true;
      }
    }
  }

  isActive(route: string): boolean {
    return this.activeRoute === route;
  }

  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  closeMobile(): void {
    this.mobileOpenChange.emit(false);
  }

  toggleGroup(group: string): void {
    if (this.collapsed) {
      this.collapsed = false;
      this.collapsedChange.emit(false);
      setTimeout(() => { this.groupOpen[group] = true; }, 50);
      return;
    }
    this.groupOpen[group] = !this.groupOpen[group];
  }

  goTo(path: string): void {
    this.router.navigate([path], { replaceUrl: true });
  }

  logout(): void {
    this.usuarioService.logout();
  }

  onOverlayClick(): void {
    this.mobileOpenChange.emit(false);
  }
}