import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

import { ChartComponent } from 'src/app/components/chart/chart.component'; // Asegurate de que la ruta sea correcta
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
@Component({
  selector: 'app-graficos',
  templateUrl: './graficos.page.html',
  styleUrls: ['./graficos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, 
    ChartComponent, MatIconModule, MatPaginatorModule]
})
export class GraficosPage implements OnInit {

  // =======================
  // Filtros
  // =======================

  tipoEstadistica: 'demandados' | 'iniciados' = 'demandados';

  anioSeleccionado: number | null  | string = "todos";
  mesSeleccionado: number | null | string = "todos";

  aniosDisponibles: number[] = [];

  readonly mesesDisponibles = [
    { numero: 1, nombre: 'Enero' },
    { numero: 2, nombre: 'Febrero' },
    { numero: 3, nombre: 'Marzo' },
    { numero: 4, nombre: 'Abril' },
    { numero: 5, nombre: 'Mayo' },
    { numero: 6, nombre: 'Junio' },
    { numero: 7, nombre: 'Julio' },
    { numero: 8, nombre: 'Agosto' },
    { numero: 9, nombre: 'Septiembre' },
    { numero: 10, nombre: 'Octubre' },
    { numero: 11, nombre: 'Noviembre' },
    { numero: 12, nombre: 'Diciembre' }
  ];

  // =======================
  // Datos
  // =======================

  expedientes: ExpedienteModel[] = [];

  resultado: any[] = [];
  resultadoFiltrado: any[] = [];

  cargando = false;

  // =======================
  // Buscador
  // =======================

  busqueda = '';

  // =======================
  // Paginador
  // =======================

  pageSize = 20;
  pageIndex = 0;
  listaPaginada: any[] = [];

  skeletonRows = Array(this.pageSize).fill(0);

  // =======================
  // Total
  // =======================

  total = 0;

  constructor(private expedienteService: ExpedientesService) {}

  ngOnInit() {
    this.obtenerExpedientes();
  }


obtenerExpedientes(): void {
  this.cargando = true;

  this.expedienteService.getExpedientes().subscribe({
    next: data => {
      this.expedientes = data ?? [];

      this.cargarAniosDisponibles();
      this.generarEstadisticas();

      this.cargando = false;
    },
    error: error => {
      console.error('Error al obtener expedientes:', error);

      this.expedientes = [];
      this.resultado = [];
      this.resultadoFiltrado = [];
      this.listaPaginada = [];
      this.total = 0;
      this.cargando = false;
    }
  });
}

  cargarAniosDisponibles(): void {

    const set = new Set<number>();

    this.expedientes.forEach(exp => {

      if (!exp.fecha_inicio) {
        return;
      }

      const anio = new Date(exp.fecha_inicio).getFullYear();

      if (!isNaN(anio)) {
        set.add(anio);
      }

    });

    this.aniosDisponibles = [...set].sort((a, b) => b - a);

  }




  onTipoChange() {

    this.generarEstadisticas();

  }

  onAnioChange() {

    if (this.anioSeleccionado === "todos") {
      this.mesSeleccionado = "todos";
    }

    this.generarEstadisticas();

  }

  onMesChange() {

    this.generarEstadisticas();

  }

  get mesDeshabilitado(): boolean {

      return this.anioSeleccionado === "todos";

  }


generarEstadisticas(): void {
  this.pageIndex = 0;
  this.busqueda = '';

  const expedientesFiltrados = this.filtrarExpedientesPorFecha();

  if (this.tipoEstadistica === 'demandados') {
    this.generarEstadisticaDemandados(expedientesFiltrados);
  } else {
    this.generarEstadisticaExpedientesIniciados(expedientesFiltrados);
  }

  this.resultadoFiltrado = [...this.resultado];
  this.actualizarPagina();
}

filtrarExpedientesPorFecha(): ExpedienteModel[] {
  return this.expedientes.filter(expediente => {
    if (!expediente.fecha_inicio) {
      return false;
    }

    const fecha = new Date(expediente.fecha_inicio);

    if (isNaN(fecha.getTime())) {
      return false;
    }

    const coincideAnio =
      this.anioSeleccionado === "todos" ||
      fecha.getFullYear() === this.anioSeleccionado;

    const coincideMes =
      this.mesSeleccionado === "todos" ||
      fecha.getMonth() + 1 === this.mesSeleccionado;

    return coincideAnio && coincideMes;
  });
}

generarEstadisticaDemandados(
  expedientesFiltrados: ExpedienteModel[]
): void {
  const conteo = new Map<string, number>();

  expedientesFiltrados.forEach(expediente => {
    if (!expediente.demandados?.length) {
      return;
    }

    const demandadosContadosEnExpediente = new Set<string>();

    expediente.demandados.forEach(demandado => {
      const nombre = demandado.nombre?.trim() || 'Sin nombre';

      const claveNormalizada = nombre.toLocaleLowerCase();

      /*
       * Evita contar dos veces al mismo demandado dentro del mismo
       * expediente si por algún motivo aparece repetido.
       */
      if (demandadosContadosEnExpediente.has(claveNormalizada)) {
        return;
      }

      demandadosContadosEnExpediente.add(claveNormalizada);

      const registroExistente = [...conteo.keys()].find(
        clave => clave.toLocaleLowerCase() === claveNormalizada
      );

      if (registroExistente) {
        conteo.set(
          registroExistente,
          (conteo.get(registroExistente) ?? 0) + 1
        );
      } else {
        conteo.set(nombre, 1);
      }
    });
  });

  this.resultado = Array.from(conteo.entries())
    .map(([nombre, cantidad]) => ({
      nombre,
      cantidad
    }))
    .sort((a, b) => {
      if (b.cantidad !== a.cantidad) {
        return b.cantidad - a.cantidad;
      }

      return a.nombre.localeCompare(b.nombre);
    });

  /*
   * En demandados, el total representa la suma de las apariciones
   * de demandados en expedientes.
   */
  this.total = this.resultado.reduce(
    (acumulado, fila) => acumulado + Number(fila.cantidad || 0),
    0
  );
}

generarEstadisticaExpedientesIniciados(
  expedientesFiltrados: ExpedienteModel[]
): void {
  if (this.anioSeleccionado === "todos") {
    this.agruparExpedientesPorAnio(expedientesFiltrados);
    return;
  }

  if (this.mesSeleccionado === "todos") {
    this.agruparExpedientesPorMes(expedientesFiltrados);
    return;
  }

  this.agruparExpedientesPorDia(expedientesFiltrados);
}

agruparExpedientesPorAnio(
  expedientesFiltrados: ExpedienteModel[]
): void {
  const conteo = new Map<number, number>();

  expedientesFiltrados.forEach(expediente => {
    if (!expediente.fecha_inicio) {
      return;
    }

    const fecha = new Date(expediente.fecha_inicio);

    if (isNaN(fecha.getTime())) {
      return;
    }

    const anio = fecha.getFullYear();

    conteo.set(anio, (conteo.get(anio) ?? 0) + 1);
  });

  this.resultado = Array.from(conteo.entries())
    .map(([periodo, cantidad]) => ({
      periodo,
      etiqueta: String(periodo),
      cantidad
    }))
    .sort((a, b) => b.periodo - a.periodo);

  this.total = expedientesFiltrados.length;
}

agruparExpedientesPorMes(
  expedientesFiltrados: ExpedienteModel[]
): void {
  const conteo = new Map<number, number>();

  expedientesFiltrados.forEach(expediente => {
    if (!expediente.fecha_inicio) {
      return;
    }

    const fecha = new Date(expediente.fecha_inicio);

    if (isNaN(fecha.getTime())) {
      return;
    }

    const mes = fecha.getMonth() + 1;

    conteo.set(mes, (conteo.get(mes) ?? 0) + 1);
  });

  this.resultado = Array.from(conteo.entries())
    .map(([periodo, cantidad]) => ({
      periodo,
      etiqueta:
        this.mesesDisponibles.find(mes => mes.numero === periodo)?.nombre ??
        String(periodo),
      cantidad
    }))
    .sort((a, b) => a.periodo - b.periodo);

  this.total = expedientesFiltrados.length;
}

agruparExpedientesPorDia(
  expedientesFiltrados: ExpedienteModel[]
): void {
  const conteo = new Map<string, number>();

  expedientesFiltrados.forEach(expediente => {
    if (!expediente.fecha_inicio) {
      return;
    }

    const fecha = new Date(expediente.fecha_inicio);

    if (isNaN(fecha.getTime())) {
      return;
    }

    const clave = this.obtenerClaveFechaLocal(fecha);

    conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
  });

  this.resultado = Array.from(conteo.entries())
    .map(([fecha, cantidad]) => ({
      fecha,
      etiqueta: this.formatearFecha(fecha),
      cantidad
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  this.total = expedientesFiltrados.length;
}

obtenerClaveFechaLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-');

  return `${dia}/${mes}/${anio}`;
}

buscar(): void {
  this.pageIndex = 0;

  const texto = this.normalizarTexto(this.busqueda);

  if (!texto) {
    this.resultadoFiltrado = [...this.resultado];
    this.actualizarPagina();
    return;
  }

  this.resultadoFiltrado = this.resultado.filter(fila => {
    const nombre = this.normalizarTexto(fila.nombre);
    const etiqueta = this.normalizarTexto(fila.etiqueta);
    const cantidad = String(fila.cantidad ?? '');

    return (
      nombre.includes(texto) ||
      etiqueta.includes(texto) ||
      cantidad.includes(texto)
    );
  });

  this.actualizarPagina();
}

normalizarTexto(valor: unknown): string {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim();
}

actualizarPagina(): void {
  const inicio = this.pageIndex * this.pageSize;
  const fin = inicio + this.pageSize;

  this.listaPaginada = this.resultadoFiltrado.slice(inicio, fin);
}

onPageChange(evento: PageEvent): void {
  this.pageIndex = evento.pageIndex;
  this.pageSize = evento.pageSize;

  this.actualizarPagina();
}

get tituloEstadistica(): string {
  const tipo =
    this.tipoEstadistica === 'demandados'
      ? 'Demandados'
      : 'Expedientes iniciados';

  if (this.anioSeleccionado === "todos") {
    return `${tipo} — todos los períodos`;
  }

  if (this.mesSeleccionado === "todos") {
    return `${tipo} — año ${this.anioSeleccionado}`;
  }

  const mes = this.mesesDisponibles.find(
    item => item.numero === this.mesSeleccionado
  )?.nombre;

  return `${tipo} — ${mes?.toLocaleLowerCase()} de ${this.anioSeleccionado}`;
}

get primeraColumna(): string {
  if (this.tipoEstadistica === 'demandados') {
    return 'Demandado';
  }

  if (this.anioSeleccionado === "todos") {
    return 'Año';
  }

  if (this.mesSeleccionado === "todos") {
    return 'Mes';
  }

  return 'Fecha';
}

get segundaColumna(): string {
  return this.tipoEstadistica === 'demandados'
    ? 'Cantidad de expedientes'
    : 'Expedientes iniciados';
}

obtenerEtiquetaFila(fila: any): string {
  if (this.tipoEstadistica === 'demandados') {
    return fila.nombre || 'Sin nombre';
  }

  return fila.etiqueta || '—';
}

get columnaPeriodo(): string {

  if (this.tipoEstadistica === 'demandados') {
    return 'Demandado';
  }

  if (this.anioSeleccionado === 'todos') {
    return 'Año';
  }

  if (this.mesSeleccionado === 'todos') {
    return 'Mes';
  }

  return 'Fecha';

}

get columnaValor(): string {

  return this.tipoEstadistica === 'demandados'
    ? 'Cantidad de expedientes'
    : 'Expedientes iniciados';

}
}
