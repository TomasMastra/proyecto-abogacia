import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';

import { ReintegrosService } from 'src/app/services/reintegros.service';
import { UsuarioService } from 'src/app/services/usuario.service';
import { ClientesService } from 'src/app/services/clientes.service';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ReintegroModel } from 'src/app/models/reintegro/reintegro.component';
import { IonHeader, IonToolbar, IonTitle } from "@ionic/angular/standalone";

@Component({
  selector: 'app-reintegros',
  standalone: true,
  imports: [IonTitle, IonToolbar, IonHeader, 
    CommonModule,
    FormsModule,
    MatIconModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './reintegros.page.html',
  styleUrls: ['./reintegros.page.scss']
})
export class ReintegrosPage implements OnInit {

  cargando = false;
  guardando = false;
  modalAbierto = false;
  modoEdicion = false;

  reintegros: ReintegroModel[] = [];
  reintegrosFiltrados: ReintegroModel[] = [];
  listaPaginada: ReintegroModel[] = [];

  usuarios: any[] = [];
  clientes: any[] = [];
  expedientes: any[] = [];

  busqueda = '';
  estadoSeleccionado = '';
  categoriaSeleccionada = '';

  pageIndex = 0;
  pageSize = 10;
  skeletonRows = Array(6);

  categorias = [
    'Facultad',
    'Transporte',
    'Comida',
    'Trámite',
    'Cliente',
    'Otro'
  ];

  estados = ['pendiente', 'pagado', 'anulado'];

  form: ReintegroModel = this.nuevoForm();

  constructor(
    private reintegrosService: ReintegrosService,
    private usuarioService: UsuarioService,
    private clientesService: ClientesService,
    private expedientesService: ExpedientesService
  ) {}

  ngOnInit(): void {
    this.cargarCombos();
    this.cargarReintegros();
  }

  nuevoForm(): ReintegroModel {
    return {
      fecha_gasto: new Date().toISOString().slice(0, 10),
      monto: 0,
      descripcion: '',
      categoria: null,
      estado: 'pendiente',
      pagado_por_usuario_id: null,
      debe_pagar_usuario_id: null,
      cliente_id: null,
      expediente_id: null,
      beneficiario_nombre: null,
      beneficiario_tipo: null,
      metodo_pago: null,
      comprobante_url: null,
      observaciones: null,
      fecha_pagado: null,
      creado_por_usuario_id: null
    };
  }

  cargarCombos(): void {
    this.usuarioService.getUsuarios().subscribe({
      next: r => this.usuarios = r || [],
      error: e => console.error(e)
    });

    this.clientesService.getClientes().subscribe({
      next: r => this.clientes = r || [],
      error: e => console.error(e)
    });

    this.expedientesService.getExpedientes().subscribe({
      next: r => this.expedientes = r || [],
      error: e => console.error(e)
    });
  }

  cargarReintegros(): void {
    this.cargando = true;

    this.reintegrosService.obtenerReintegros().subscribe({
      next: data => {
        this.reintegros = data || [];
        this.filtrar();
        this.cargando = false;
      },
      error: err => {
        console.error(err);
        this.cargando = false;
        Swal.fire('Error', 'No se pudieron cargar los reintegros', 'error');
      }
    });
  }

  filtrar(): void {
    const texto = this.busqueda.trim().toLowerCase();

    this.reintegrosFiltrados = this.reintegros.filter(r => {
      const textoOk =
        !texto ||
        r.descripcion?.toLowerCase().includes(texto) ||
        r.categoria?.toLowerCase().includes(texto) ||
        r.beneficiario_nombre?.toLowerCase().includes(texto) ||
        r.pagado_por_nombre?.toLowerCase().includes(texto) ||
        r.debe_pagar_nombre?.toLowerCase().includes(texto) ||
        r.cliente_nombre?.toLowerCase().includes(texto) ||
        r.cliente_apellido?.toLowerCase().includes(texto) ||
        r.expediente_caratula?.toLowerCase().includes(texto);

      const estadoOk = this.estadoSeleccionado
        ? r.estado === this.estadoSeleccionado
        : true;

      const categoriaOk = this.categoriaSeleccionada
        ? r.categoria === this.categoriaSeleccionada
        : true;

      return textoOk && estadoOk && categoriaOk;
    });

    this.pageIndex = 0;
    this.actualizarPagina();
  }

  actualizarPagina(): void {
    const start = this.pageIndex * this.pageSize;
    this.listaPaginada = this.reintegrosFiltrados.slice(start, start + this.pageSize);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.actualizarPagina();
  }

  abrirNuevo(): void {
    this.modoEdicion = false;
    this.form = this.nuevoForm();
    this.modalAbierto = true;
  }

  abrirEditar(item: ReintegroModel): void {
    this.modoEdicion = true;
    this.form = { ...item };
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.modoEdicion = false;
    this.form = this.nuevoForm();
  }

  guardar(): void {
    if (!this.form.fecha_gasto || !this.form.descripcion?.trim()) {
      Swal.fire('Atención', 'Completá fecha y descripción', 'warning');
      return;
    }

    if (!Number.isFinite(Number(this.form.monto)) || Number(this.form.monto) <= 0) {
      Swal.fire('Atención', 'El monto debe ser mayor a cero', 'warning');
      return;
    }

    this.guardando = true;

    const req = this.modoEdicion && this.form.id
      ? this.reintegrosService.actualizarReintegro(this.form.id, this.form)
      : this.reintegrosService.crearReintegro(this.form);

    req.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        this.cargarReintegros();
        Swal.fire('OK', 'Reintegro guardado', 'success');
      },
      error: err => {
        console.error(err);
        this.guardando = false;
        Swal.fire('Error', 'No se pudo guardar el reintegro', 'error');
      }
    });
  }

  async marcarPagado(item: ReintegroModel): Promise<void> {
    const result = await Swal.fire({
      title: 'Marcar como pagado',
      input: 'date',
      inputValue: new Date().toISOString().slice(0, 10),
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    this.reintegrosService.marcarPagado(item.id!, result.value).subscribe({
      next: () => this.cargarReintegros(),
      error: err => {
        console.error(err);
        Swal.fire('Error', 'No se pudo marcar como pagado', 'error');
      }
    });
  }

  async eliminar(item: ReintegroModel): Promise<void> {
    const result = await Swal.fire({
      title: '¿Eliminar reintegro?',
      text: item.descripcion,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    this.reintegrosService.eliminarReintegro(item.id!).subscribe({
      next: () => this.cargarReintegros(),
      error: err => {
        console.error(err);
        Swal.fire('Error', 'No se pudo eliminar', 'error');
      }
    });
  }

  totalPendiente(): number {
    return this.reintegros
      .filter(r => r.estado === 'pendiente')
      .reduce((acc, r) => acc + Number(r.monto || 0), 0);
  }

  totalPagado(): number {
    return this.reintegros
      .filter(r => r.estado === 'pagado')
      .reduce((acc, r) => acc + Number(r.monto || 0), 0);
  }

  mostrarFecha(fecha?: string | null): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-AR');
  }

  nombreCliente(item: ReintegroModel): string {
    const n = `${item.cliente_nombre || ''} ${item.cliente_apellido || ''}`.trim();
    return n || '—';
  }
}