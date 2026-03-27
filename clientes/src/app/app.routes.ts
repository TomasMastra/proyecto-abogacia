import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginRedirectGuard } from './guards/login-redirect.guard';
import { AdminGuard } from './guards/admin.guard';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';

export const routes: Routes = [

  // ── Rutas SIN layout (pantalla limpia) ──────────────────
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [LoginRedirectGuard],
  },
  {
    path: 'splash-screen',
    loadComponent: () => import('./pages/splash-screen/splash-screen.page').then(m => m.SplashScreenPage),
    canActivate: [LoginRedirectGuard, AdminGuard],
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/error/error.page').then(m => m.ErrorPage),
  },

  // ── Rutas CON layout (sidebar + topbar) ─────────────────
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '',               redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',           loadComponent: () => import('./home/home.page').then(m => m.HomePage) },
      { path: 'lista-clientes', loadComponent: () => import('./pages/lista-clientes/lista-clientes.page').then(m => m.ListaClientesPage), canActivate: [AdminGuard] },
      { path: 'lista-expedientes', loadComponent: () => import('./pages/lista-expedientes/lista-expedientes.page').then(m => m.ListaExpedientesPage) },
      { path: 'estado',         loadComponent: () => import('./pages/estado/estado.page').then(m => m.EstadoPage), canActivate: [AdminGuard] },
      { path: 'honorario-diferido', loadComponent: () => import('./pages/honorario-diferido/honorario-diferido.page').then(m => m.HonorarioDiferidoPage), canActivate: [AdminGuard] },
      { path: 'consultas',      loadComponent: () => import('./pages/consultas/consultas.page').then(m => m.ConsultasPage) },
      { path: 'consultas-oficio', loadComponent: () => import('./pages/consultas-oficio/consultas-oficio.page').then(m => m.ConsultasOficioPage), canActivate: [AdminGuard] },
      { path: 'requeridos',     loadComponent: () => import('./pages/requeridos/requeridos.component').then(m => m.RequeridosPage), canActivate: [AdminGuard] },
      { path: 'oficio',         loadComponent: () => import('./pages/oficio/oficio.page').then(m => m.OficiosPage), canActivate: [AdminGuard] },
      { path: 'cobranzas',      loadComponent: () => import('./pages/cobranzas/cobranzas.page').then(m => m.CobranzasPage) },
      { path: 'datos-importantes', loadComponent: () => import('./pages/datos-importantes/datos-importantes.page').then(m => m.DatosImportantesPage), canActivate: [AdminGuard] },
      { path: 'jurisprudencias', loadComponent: () => import('./pages/jurisprudencias/jurisprudencias.page').then(m => m.JurisprudenciasPage), canActivate: [AdminGuard] },
      { path: 'lista-mediaciones', loadComponent: () => import('./pages/lista-mediaciones/lista-mediaciones.page').then(m => m.ListaMediacionesPage), canActivate: [AdminGuard] },
      { path: 'informes-enre',  loadComponent: () => import('./pages/informes-enre/informes-enre.page').then(m => m.InformesEnrePage), canActivate: [AdminGuard] },
      { path: 'juzgados',       loadComponent: () => import('./pages/juzgados/juzgados.page').then(m => m.JuzgadosPage), canActivate: [AdminGuard] },
      { path: 'localidades',    loadComponent: () => import('./pages/localidades/localidades.page').then(m => m.LocalidadesPage), canActivate: [AdminGuard] },
      { path: 'demandado',      loadComponent: () => import('./pages/demandado/demandado.page').then(m => m.DemandadoPage), canActivate: [AdminGuard] },
      { path: 'jueces',         loadComponent: () => import('./pages/jueces/jueces.page').then(m => m.JuecesPage), canActivate: [AdminGuard] },
      { path: 'codigos',        loadComponent: () => import('./pages/codigos/codigos.page').then(m => m.CodigosPage), canActivate: [AdminGuard] },
      { path: 'graficos',       loadComponent: () => import('./pages/graficos/graficos.page').then(m => m.GraficosPage), canActivate: [AdminGuard] },
      { path: 'control-anio-expedientes', loadComponent: () => import('./pages/control-anio-expedientes/control-anio-expedientes.page').then(m => m.ControlAnioExpedientesPage), canActivate: [AdminGuard] },
      { path: 'calendario',     loadComponent: () => import('./pages/calendario/calendario.page').then(m => m.CalendarioPage), canActivate: [AdminGuard] },
    ],
  },

  // ── Wildcard ─────────────────────────────────────────────
  { path: '**', redirectTo: 'login' },
];