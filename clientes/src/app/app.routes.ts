import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
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
    path: 'lista-expedientes',
    loadComponent: () => import('./pages/lista-expedientes/lista-expedientes.page').then( m => m.ListaExpedientesPage)
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
  }
];
