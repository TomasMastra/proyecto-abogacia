import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subscription, Observable, forkJoin, Subject } from 'rxjs';


import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';

import { IonList, IonItemSliding, IonLabel, IonItem, IonInput } from "@ionic/angular/standalone";

import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';

import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';
import { ExpedientesService } from 'src/app/services/expedientes.service';

import { UsuarioModel } from 'src/app/models/usuario/usuario.component';
import { UsuarioService } from 'src/app/services/usuario.service';

import Swal from 'sweetalert2'


@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.page.html',
  styleUrls: ['./consultas.page.scss'],
  standalone: true,
    imports: [IonInput, IonItem, IonLabel, IonItemSliding, IonList, CommonModule, FormsModule,
      MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
      MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatMenuModule, MatProgressSpinnerModule,
      MatSelectModule,
      MatOptionModule,
    ]
})
export class ConsultasPage implements OnInit {

  cargando: boolean = false;
  expedientes: any[] = [];
  expedientesOriginales: any[] = [];

  hayExpedientes: boolean = true;
  private destroy$ = new Subject<void>();
  busqueda: string = '';

  ordenCampo: string = '';
  ordenAscendente: boolean = true;

  estado: string = 'sentencia'; // o 'cobrado'
listaUsuarios: UsuarioModel[] = [];

tiposJuzgado: string[] = ['CCF', 'COM', 'CIV', 'CC']; // o los que vos tengas
listaJuzgados: any[] = []; // después la cargás desde tu servicio

tipoSeleccionado: string = '';
juzgadoSeleccionado: string = '';

abogadoSeleccionado: string = '';
procuradorSeleccionado: string = '';

tiposJuicio: string[] = ['sumarisimo', 'ordinario', 'a definir'];
juicioSeleccionado: any;

estados: any[] = [
  'Sorteado',
  'Inicio - Previo',
  'Inicio - Plantea Revocatoria',
  'Inicio - Da Cumplimiento',
  'Inicio - Solicita',
  'Inicio - Apela',
  'Inicio - Recusa',
  'Inicio - Plantea Nulidad',
  'Inicio - Se Eleve',
  'Traslado demanda - Se Ordena',

  'Traslado demanda - Cedula Confronte',
  'Traslado demanda - Cedula Liberada',
  'Traslado demanda - Cedula Notificada',
  'Traslado demanda - Cedula Sin Notificar',
  'Traslado demanda - Notificado',
  'Traslado demanda - Previo Rebeldia',

  'Contesta demanda - Traslado',
  'Contesta demanda - Cedula',
  'Contesta Traslado',

  'Se resuelva',

  'Apertura a Prueba - Solicita',
  'Apertura a Prueba - Cedula',
  'Apertura a Prueba - Audiencia 360',

  'Pruebas - Se provean',
  'Pruebas - Se provee',
  'Prueba - Cedula Perito',
  'Prueba - Cedula Parte',
  'Prueba - Oficio deox',
  'Prueba - Oficio acredita',
  'Prueba - Oficio solicita reiteratorio',
  'Prueba - Oficio solicita Astreinte',
  'Prueba - Testimonial hace saber',
  'Prueba - Acredita Testimonial',
  'Prueba - Desiste',
  'Prueba - Impugna',
  'Prueba - Se intime parte',
  'Prueba - Se intime perito',

  'Clausura periodo Prueba - Solicita',
  'Clausura periodo Prueba - Pase a certificar',

  'Alegatos - Solicita',
  'Alegatos - Cedula',
  'Alegatos - Presenta',

  'Fiscal - Solicita',
  'Fiscal - Cedula',

  'Defensor Oficial - Solicita',
  'Defensor Oficial - Cedula',
  'Defensor Oficial - Ratifica lo actuado',
  
  'Sentencia - Previo',
  'Sentencia - Solicita',
  'Sentencia - Pasen autos a Sentencia',
  'Sentencia'
];

estadoSeleccionado: string = '';

  constructor(
    private expedienteService: ExpedientesService,
    private juzgadoService: JuzgadosService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarUsuarios();
    this.cargarExpedientes();

        this.ordenCampo = 'dias_ultimo_movimiento';
    this.ordenAscendente = false;

    this.juzgadoService.getJuzgados().subscribe(juzgados => {
  this.listaJuzgados = juzgados;
});



  }

cargarExpedientes() {
  this.cargando = true;
  this.expedienteService.getExpedientes()
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (expedientes) => {
        // Filtrar acá: que NO sean 'Sentencia' ni 'Cobrado'
        const filtrados = expedientes!.filter(expediente => 
          expediente.estado !== 'Sentencia' && expediente.estado !== 'Cobrado' && expediente.estado !== 'eliminado'
        );

        this.expedientes = filtrados;
        this.expedientesOriginales = [...filtrados]; // Guarda copia original
        this.hayExpedientes = this.expedientes.length > 0;

        this.expedientes.forEach(expediente => {
          this.juzgadoService.getJuzgadoPorId(expediente.juzgado_id).subscribe(juzgado => {
            expediente.juzgadoModel = juzgado;
          });
        });

        this.cargando = false;


      },
      (error) => {
        console.error('Error al obtener expedientes:', error);
        this.cargando = false;
      }
    );
}

  
  cargarPorEstado(estado: string) {
    this.cargando = true;
    this.expedienteService.getExpedientesPorEstado(estado)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (honorarios) => {
          //this.honorariosDiferidos = honorarios;
          this.expedientes = honorarios!;
          this.hayExpedientes = this.expedientes.length > 0;
  
          this.expedientes.forEach(expediente => {
            this.juzgadoService.getJuzgadoPorId(expediente.juzgado_id).subscribe(juzgado => {
              expediente.juzgadoModel = juzgado;
            });
          });
  
          this.busqueda = '';
          this.cargando = false;
        },
        (error) => {
          console.error('Error al obtener expedientes:', error);
          this.cargando = false;
        }
      );
  }

  

  goTo(ruta: string) {
    this.router.navigate([ruta]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

cargarUsuarios() {
  this.usuarioService.getUsuarios()
    .pipe(takeUntil(this.destroy$))
    .subscribe(
      (usuarios) => {
        this.listaUsuarios = usuarios;
      },
      (error) => {
        console.error('Error al obtener usuarios:', error);
      }
    );
}
cambiarEstado(event: Event) {
  const selectedValue = (event.target as HTMLSelectElement).value;
  console.log('Estado seleccionado:', selectedValue);

  this.estado = selectedValue;

  if (selectedValue === 'todos') {
    this.cargarExpedientes();
  } else if (selectedValue === 'cobrado') {
    this.expedienteService.getExpedientesCobrados().subscribe(expedientes => {
      this.expedientes = expedientes!;
      //this.ordenar(); // si usás un ordenamiento custom
    });
            console.log(this.expedientes);

  } else if (selectedValue === 'sentencia') {
    this.cargarPorEstado('sentencia'); // o podés hacer otro método si querés separar lógica
  }
}

getNombreAbogado(usuario_id: number): string {
  const abogado = this.listaUsuarios.find(u => u.id === usuario_id);
  return abogado ? `${abogado.nombre} ` : 'Sin abogado';
}


get honorariosDiferidosOrdenados() {
  return [...this.expedientes].sort((a, b) => {
    const campo = this.ordenCampo;

    const valorA = this.obtenerValorOrden(a, campo);
    const valorB = this.obtenerValorOrden(b, campo);

    if (valorA < valorB) return this.ordenAscendente ? -1 : 1;
    if (valorA > valorB) return this.ordenAscendente ? 1 : -1;
    return 0;
  });
}

ordenarPor(campo: string) {
  if (this.ordenCampo === campo) {
    this.ordenAscendente = !this.ordenAscendente;
  } else {
    this.ordenCampo = campo;
    this.ordenAscendente = true;
  }
}

obtenerValorOrden(item: any, campo: string): any {
  switch (campo) {
    case 'numero':
      return `${item.numero}/${item.anio}`;
    
    case 'caratula':
      return item.clientes.length > 0
        ? `${item.clientes[0].nombre} ${item.clientes[0].apellido}`
        : '(sin actora)';
    
    case 'ultimo_movimiento':
      return item.ultimo_movimiento;
    
    case 'abogado':
      const abogado = this.listaUsuarios.find(u => u.id === item.usuario_id);
      return abogado ? abogado.nombre : 'Sin abogado';

    case 'procurador':
      const procurador = this.listaUsuarios.find(u => u.id === item.procurador_id);
      return procurador ? procurador.nombre : 'Sin procurador';

    case 'dias_ultimo_movimiento':
      return this.diasDesdeUltimoMovimiento(item.ultimo_movimiento);

    case 'estado':
      return item.estado;

    default:
      return '';
  }
}



// Muestra el renglón si el expediente corresponde al estado seleccionado
esVisible(item: any): boolean {
  if (this.estado === 'sentencia') {
    return !item.capitalCobrado || !item.honorarioCobrado;
  } else if (this.estado === 'cobrado') {
    return item.capitalCobrado || item.honorarioCobrado; // ✅ antes usabas &&
  }
  return true;
}
  

filtrarPorEstado(estado: string) {
  this.expedientes = this.expedientesOriginales.filter(expediente => expediente.estado !== 'Sentencia');
}
/*
filtrar() {
  this.expedientes = this.expedientesOriginales.filter(expediente => {
    const tipoOk = this.tipoSeleccionado ? expediente.juzgadoModel?.tipo === this.tipoSeleccionado : true;
    const juzgadoOk = this.juzgadoSeleccionado ? expediente.juzgado_id === +this.juzgadoSeleccionado : true;
    const abogadoOk = this.abogadoSeleccionado ? expediente.usuario_id === +this.abogadoSeleccionado : true;
    const procuradorOk = this.procuradorSeleccionado ? expediente.procurador_id === +this.procuradorSeleccionado : true;
    const juicioOk = this.juicioSeleccionado ? expediente.juicio?.toLowerCase() === this.juicioSeleccionado.toLowerCase() : true;

    return tipoOk && juzgadoOk && abogadoOk && procuradorOk && juicioOk;
  });
}*/
filtrar() {
  const texto = this.busqueda.toLowerCase();

  this.expedientes = this.expedientesOriginales.filter(expediente => {
    const tipoOk = this.tipoSeleccionado ? expediente.juzgadoModel?.tipo === this.tipoSeleccionado : true;
    const juzgadoOk = this.juzgadoSeleccionado ? expediente.juzgado_id === +this.juzgadoSeleccionado : true;
    const abogadoOk = this.abogadoSeleccionado ? expediente.usuario_id === +this.abogadoSeleccionado : true;
    const procuradorOk = this.procuradorSeleccionado ? expediente.procurador_id === +this.procuradorSeleccionado : true;
    const juicioOk = this.juicioSeleccionado ? expediente.juicio?.toLowerCase() === this.juicioSeleccionado.toLowerCase() : true;
    const estadoOk = this.estadoSeleccionado ? expediente.estado?.toLowerCase() === this.estadoSeleccionado.toLowerCase() : true;

    const numeroOk = expediente.numero?.toString().includes(texto);
    const anioOk = expediente.anio?.toString().includes(texto);

    const clienteOk = expediente.clientes?.some((cliente: any) =>
      (cliente.nombre && cliente.nombre.toLowerCase().includes(texto)) ||
      (cliente.apellido && cliente.apellido.toLowerCase().includes(texto))
    ) ?? false;


    const busquedaOk = texto === '' || numeroOk || anioOk || clienteOk;

    return tipoOk && juzgadoOk && abogadoOk && procuradorOk && juicioOk && estadoOk && busquedaOk;
  });
}




diasDesdeUltimoMovimiento(fecha: string): number {
  const hoy = new Date();
  const ultimo = new Date(fecha);
  const diff = Math.floor((hoy.getTime() - ultimo.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}


estadoVencimiento(expediente: any): string {
  if (!expediente.ultimo_movimiento || !expediente.juicio) return 'Sin datos';

  const dias = this.diasDesdeUltimoMovimiento(expediente.ultimo_movimiento);
  const juicio = expediente.juicio.toLowerCase();

  if (juicio === 'sumarisimo') {
    return dias > 70 ? `⚠️ ${dias} días` : `✅ ${dias} días`;
  }

  if (juicio === 'ordinario') {
    return dias > 160 ? `⚠️ ${dias} días` : `✅ ${dias} días`;
  }



  return `${dias} días`;
}



}