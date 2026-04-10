import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfiguracionService } from '../../src/app/services/configuracion.service';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  standalone: true,
  imports: [RouterOutlet],
})
export class AppComponent {

  constructor(private config: ConfiguracionService) {
  const current = this.config.getCurrent();
  this.config.apply(current);
}


}