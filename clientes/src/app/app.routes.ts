import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LoginRedirectGuard } from './guards/login-redirect.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
    canActivate: [LoginRedirectGuard]

  },
  /*{
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },*/
  {
    path: 'error',
    loadComponent: () => import('./pages/error/error.page').then( m => m.ErrorPage)
  },
  {
    path: 'splash-screen',
    loadComponent: () => import('./pages/splash-screen/splash-screen.page').then( m => m.SplashScreenPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'lista-clientes',
    loadComponent: () => import('./pages/lista-clientes/lista-clientes.page').then( m => m.ListaClientesPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'home',
    canActivate: [AuthGuard],
    data: { midata: 'datos de ruta' },
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
    {
    path: 'lista-expedientes',
    canActivate: [AuthGuard],
    data: { midata: 'datos de ruta' },
    loadComponent: () => import('./pages/lista-expedientes/lista-expedientes.page').then((m) => m.ListaExpedientesPage),
  },
  {
    path: 'localidades',
    loadComponent: () => import('./pages/localidades/localidades.page').then( m => m.LocalidadesPage),
    canActivate: [LoginRedirectGuard, AdminGuard]
  },
  {
    path: 'juzgados',
    loadComponent: () => import('./pages/juzgados/juzgados.page').then( m => m.JuzgadosPage),
    canActivate: [LoginRedirectGuard, AdminGuard]
  },
  {
    path: 'demandado',
    loadComponent: () => import('./pages/demandado/demandado.page').then( m => m.DemandadoPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'estado',
    loadComponent: () => import('./pages/estado/estado.page').then( m => m.EstadoPage)
  },
  {
    path: 'honorario-diferido',
    loadComponent: () => import('./pages/honorario-diferido/honorario-diferido.page').then( m => m.HonorarioDiferidoPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'calendario',
    loadComponent: () => import('./pages/calendario/calendario.page').then( m => m.CalendarioPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'jueces',
    loadComponent: () => import('./pages/jueces/jueces.page').then( m => m.JuecesPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'consultas',
    loadComponent: () => import('./pages/consultas/consultas.page').then( m => m.ConsultasPage)
  },
    {
    path: 'requeridos',
    loadComponent: () => import('./pages/requeridos/requeridos.component').then( m => m.RequeridosPage)
  },
  {
    path: 'estados-honorarios',
    loadComponent: () => import('./pages/estados-honorarios/estados-honorarios.page').then( m => m.EstadosHonorariosPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'oficio',
    loadComponent: () => import('./pages/oficio/oficio.page').then( m => m.OficiosPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'consultas-oficio',
    loadComponent: () => import('./pages/consultas-oficio/consultas-oficio.page').then( m => m.ConsultasOficioPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'cobranzas',
    loadComponent: () => import('./pages/cobranzas/cobranzas.page').then( m => m.CobranzasPage)
  },
  {
    path: 'graficos',
    loadComponent: () => import('./pages/graficos/graficos.page').then( m => m.GraficosPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'datos-importantes',
    loadComponent: () => import('./pages/datos-importantes/datos-importantes.page').then( m => m.DatosImportantesPage)
  },
  {
    path: 'codigos',
    loadComponent: () => import('./pages/codigos/codigos.page').then( m => m.CodigosPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  },
  {
    path: 'jurisprudencias',
    loadComponent: () => import('./pages/jurisprudencias/jurisprudencias.page').then( m => m.JurisprudenciasPage),
    canActivate: [LoginRedirectGuard, AdminGuard]

  }
];
