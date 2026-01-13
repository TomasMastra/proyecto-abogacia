import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UsuarioService } from '../services/usuario.service';

export const AuthGuard: CanActivateFn = () => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);

  const logeado = usuarioService.estaLogeado();

  if (logeado) {
    return true;
  } else {
    console.error('No hay usuario logeado, redirigiendo a /login');
    router.navigate(['/login']);
    return false;
  }
};
