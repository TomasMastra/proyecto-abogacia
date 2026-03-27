import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { UsuarioService } from 'src/app/services/usuario.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, HttpClientModule],
})
export class LoginPage implements OnInit {

  email: string = '';
  password: string = '';
  cargando: boolean = false;
  showPass: boolean = false;
  emailFocused: boolean = false;
  passFocused: boolean = false;

  private apiUrl = `${environment.apiBase}/login`;

  constructor(
    private http: HttpClient,
    private usuarioService: UsuarioService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  login(): void {
    if (!this.email || !this.password) {
      Swal.fire({ icon: 'warning', title: 'Campos vacíos', text: 'Completá email y contraseña.', timer: 2000, showConfirmButton: false });
      return;
    }

    this.cargando = true;

    this.http.post(this.apiUrl, { email: this.email, contraseña: this.password }).subscribe({
      next: (res: any) => {
        this.usuarioService.usuarioLogeado = res.usuario;
        this.usuarioService.setLogeado(true);
        this.cargando = false;
        this.router.navigate(['home']);
      },
      error: (err) => {
        this.cargando = false;
        const mensaje = err?.error?.error || 'Error al iniciar sesión';
        Swal.fire({ icon: 'error', title: 'Error', text: mensaje });
      }
    });
  }
}