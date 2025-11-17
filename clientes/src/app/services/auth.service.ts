import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  // usuario que se logeó
  usuarioLogeado: any = null;

  // flag interno de login
  private logeado = false;

  constructor() {
    // Recuperar de localStorage si ya estaba logeado
    const flag = localStorage.getItem('logeado');
    const usuarioStr = localStorage.getItem('usuarioLogeado');

    if (flag === '1' && usuarioStr) {
      try {
        this.usuarioLogeado = JSON.parse(usuarioStr);
        this.logeado = true;
      } catch (e) {
        console.error('Error parseando usuarioLogeado de localStorage', e);
        localStorage.removeItem('logeado');
        localStorage.removeItem('usuarioLogeado');
      }
    }
  }

  // Para marcar login / logout
  setLogeado(valor: boolean) {
    this.logeado = valor;

    if (valor && this.usuarioLogeado) {
      localStorage.setItem('logeado', '1');
      localStorage.setItem('usuarioLogeado', JSON.stringify(this.usuarioLogeado));
    } else {
      localStorage.removeItem('logeado');
      localStorage.removeItem('usuarioLogeado');
      this.usuarioLogeado = null;
    }
  }

  // Método que usarán los guards
  estaLogeado(): boolean {
    if (this.logeado && this.usuarioLogeado) {
      return true;
    }

    const flag = localStorage.getItem('logeado');
    const usuarioStr = localStorage.getItem('usuarioLogeado');

    if (flag === '1' && usuarioStr) {
      try {
        this.usuarioLogeado = JSON.parse(usuarioStr);
        this.logeado = true;
        return true;
      } catch (e) {
        console.error('Error parseando usuarioLogeado de localStorage', e);
        localStorage.removeItem('logeado');
        localStorage.removeItem('usuarioLogeado');
        this.logeado = false;
        this.usuarioLogeado = null;
        return false;
      }
    }

    return false;
  }

  logout() {
    this.setLogeado(false);
  }
}
