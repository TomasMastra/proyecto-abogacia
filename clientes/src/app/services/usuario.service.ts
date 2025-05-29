import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private logeadoSubject = new BehaviorSubject<boolean>(false);
  logeado$ = this.logeadoSubject.asObservable();

  usuarioLogeado: any = null;

  constructor() { }
    setLogeado(valor: boolean) {
    this.logeadoSubject.next(valor);
  }
}
