import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule, HttpClient } from '@angular/common/http';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { UsuarioService } from 'src/app/services/usuario.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    HttpClientModule
  ]
})

export class LoginPage implements OnInit {

  email: string = '';
  password: string = '';

  constructor(private http: HttpClient,
        private usuarioService: UsuarioService,
          private router: Router 


  ) { }

  ngOnInit() {
  }

login() {
    this.http.post('http://192.168.1.36:3000/login', {
      email: this.email,
      contraseña: this.password
    }).subscribe({
      next: (res: any) => {
        console.log('Login OK:', res);
        this.usuarioService.usuarioLogeado = res.usuario;
        this.usuarioService.setLogeado(true);
        this.router.navigate(['home']);
      },
      error: (err) => {
        console.error('Error al loguear:', err);
      }
    });
  }

}
