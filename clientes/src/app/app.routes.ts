import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
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
    loadComponent: () => import('./pages/splash-screen/splash-screen.page').then( m => m.SplashScreenPage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'lista-clientes',
    loadComponent: () => import('./pages/lista-clientes/lista-clientes.page').then( m => m.ListaClientesPage)
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
    loadComponent: () => import('./pages/localidades/localidades.page').then( m => m.LocalidadesPage)
  },
  {
    path: 'juzgados',
    loadComponent: () => import('./pages/juzgados/juzgados.page').then( m => m.JuzgadosPage)
  },
  {
    path: 'demandado',
    loadComponent: () => import('./pages/demandado/demandado.page').then( m => m.DemandadoPage)
  },
  {
    path: 'estado',
    loadComponent: () => import('./pages/estado/estado.page').then( m => m.EstadoPage)
  },
  {
    path: 'honorario-diferido',
    loadComponent: () => import('./pages/honorario-diferido/honorario-diferido.page').then( m => m.HonorarioDiferidoPage)
  },
  {
    path: 'calendario',
    loadComponent: () => import('./pages/calendario/calendario.page').then( m => m.CalendarioPage)
  },
  {
    path: 'jueces',
    loadComponent: () => import('./pages/jueces/jueces.page').then( m => m.JuecesPage)
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
    loadComponent: () => import('./pages/estados-honorarios/estados-honorarios.page').then( m => m.EstadosHonorariosPage)
  },
  {
    path: 'oficio',
    loadComponent: () => import('./pages/oficio/oficio.page').then( m => m.OficiosPage)
  },
  {
    path: 'consultas-oficio',
    loadComponent: () => import('./pages/consultas-oficio/consultas-oficio.page').then( m => m.ConsultasOficioPage)
  },
  {
    path: 'cobranzas',
    loadComponent: () => import('./pages/cobranzas/cobranzas.page').then( m => m.CobranzasPage)
  },
  {
    path: 'graficos',
    loadComponent: () => import('./pages/graficos/graficos.page').then( m => m.GraficosPage)
  }
];
