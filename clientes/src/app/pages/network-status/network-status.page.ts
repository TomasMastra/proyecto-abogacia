import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import { NetworkStatusService, ConectionState } from 'src/app/services/network-status.service';

@Component({
  selector: 'app-network-status',
  templateUrl: './network-status.page.html',
  styleUrls: ['./network-status.page.scss'],
  standalone: true,
  imports: [CommonModule, MatIconModule],
})
export class NetworkStatusPage implements OnInit, OnDestroy {

  state: ConectionState = 'online';
  visible = false;
  retrying = false;

  private sub!: Subscription;

  constructor(private networkService: NetworkStatusService) {}

  ngOnInit(): void {
    this.sub = this.networkService.status$.subscribe(state => {
      this.state   = state;
      this.visible = state !== 'online';
      this.retrying = false;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  retry(): void {
    this.retrying = true;
    this.networkService.pingServer();
    // Si sigue sin responder tras 4s, quitamos el spinner
    setTimeout(() => { this.retrying = false; }, 4000);
  }

  get icon(): string {
    return this.state === 'offline' ? 'wifi_off' : 'cloud_off';
  }

  get title(): string {
    return this.state === 'offline'
      ? 'Sin conexión a Internet'
      : 'Servidor no disponible';
  }

  get subtitle(): string {
    return this.state === 'offline'
      ? 'Revisá tu red Wi-Fi o datos móviles.'
      : 'El servidor no responde. Intentá de nuevo en unos momentos.';
  }
}