import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UsuarioService } from '../services/usuario.service';

export const LoginRedirectGuard: CanActivateFn = () => {
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);

  const logeado = usuarioService.estaLogeado();

  if (logeado) {
    // si ya está logeado, no puede ver el login
    router.navigate(['/home']);
    return false;
  }

  // no está logueado, puede entrar a /login
  return true;
};
