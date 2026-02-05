import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(private user: UsuarioService, private router: Router) {}

canActivate(): boolean {
  const user = this.user.usuarioLogeado;

  if (!user) {
    this.router.navigate(['/lista-clientes']);
    return false;
  }

  if (user.rol === 'admin') {
    //alert(user.rol);
    return true;
  }

  return false;
}

}
