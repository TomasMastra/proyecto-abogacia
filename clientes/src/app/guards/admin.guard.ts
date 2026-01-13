import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {

  constructor(private user: UsuarioService, private router: Router) {}

  canActivate(): boolean {
    const user = this.user.usuarioLogeado; // o como vos guardes el usuario

    alert(user!.rol)
    if (user?.rol != 'admin') {
      //this.router.navigate(['/error']); // o donde quieras mandarlo
      return false;
    }
    return true;
  }
}
