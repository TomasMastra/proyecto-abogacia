// src/app/guards/auth.guard.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UsuarioService } from '../services/usuario.service';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(UsuarioService);
  const router = inject(Router);

  if (authService.usuarioLogeado) {
    return true;
  } else {
    router.navigate(['/login']);
    console.error('No hay usuario logeado!!!');
    return false;
  }
};
