import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  // private apiUrl = 'http://localhost:3000/usuario';
  private apiUrl = 'http://192.168.1.36:3000/usuario';

  private logeadoSubject = new BehaviorSubject<boolean>(false);
  logeado$ = this.logeadoSubject.asObservable();

  private usuarioSubject = new BehaviorSubject<UsuarioModel[]>([]);
  usuario$ = this.usuarioSubject.asObservable();

  // usuario actual logeado
  usuarioLogeado: UsuarioModel | null = null;

  constructor(private http: HttpClient) {
    // Recuperar estado de login desde localStorage al iniciar la app
    const flag = localStorage.getItem('logeado');
    const usuarioStr = localStorage.getItem('usuarioLogeado');

    if (flag === '1' && usuarioStr) {
      try {
        this.usuarioLogeado = JSON.parse(usuarioStr) as UsuarioModel;
        this.logeadoSubject.next(true);
      } catch (e) {
        console.error('Error parseando usuarioLogeado de localStorage', e);
        localStorage.removeItem('logeado');
        localStorage.removeItem('usuarioLogeado');
        this.usuarioLogeado = null;
        this.logeadoSubject.next(false);
      }
    } else {
      this.logeadoSubject.next(false);
      this.usuarioLogeado = null;
    }
  }

  // Marca login / logout y sincroniza con localStorage
  setLogeado(valor: boolean) {
    this.logeadoSubject.next(valor);

    if (valor && this.usuarioLogeado) {
      localStorage.setItem('logeado', '1');
      localStorage.setItem('usuarioLogeado', JSON.stringify(this.usuarioLogeado));
    } else {
      localStorage.removeItem('logeado');
      localStorage.removeItem('usuarioLogeado');
      this.usuarioLogeado = null;
    }
  }

  // Devuelve true si hay sesión activa (en memoria o en localStorage)
  estaLogeado(): boolean {
    // Primero miro el BehaviorSubject
    const actual = this.logeadoSubject.getValue();
    if (actual && this.usuarioLogeado) {
      return true;
    }

    // Si se recargó la página, intento recuperar de localStorage
    const flag = localStorage.getItem('logeado');
    const usuarioStr = localStorage.getItem('usuarioLogeado');

    if (flag === '1' && usuarioStr) {
      try {
        this.usuarioLogeado = JSON.parse(usuarioStr) as UsuarioModel;
        this.logeadoSubject.next(true);
        return true;
      } catch (e) {
        console.error('Error parseando usuarioLogeado de localStorage', e);
        localStorage.removeItem('logeado');
        localStorage.removeItem('usuarioLogeado');
        this.usuarioLogeado = null;
        this.logeadoSubject.next(false);
        return false;
      }
    }

    return false;
  }

  // Para cerrar sesión
  logout() {
    this.setLogeado(false);
  }

  // Si querés setear explícitamente el usuario desde el login
  setUsuarioLogeado(usuario: UsuarioModel | null) {
    this.usuarioLogeado = usuario;
    this.setLogeado(!!usuario);
  }

  getUsuarios(): Observable<UsuarioModel[]> {
    console.log('Obteniendo usuarios');
    return this.http.get<UsuarioModel[]>(this.apiUrl, this.httpOptions).pipe(
      tap((usuarios) => this.usuarioSubject.next(usuarios)),
      catchError(this.handleError<UsuarioModel[]>('getUsuarios', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return throwError(() => new Error('Error en la solicitud HTTP'));
    };
  }
}
