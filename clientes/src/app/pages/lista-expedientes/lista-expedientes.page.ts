import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonCard, IonCardContent, IonText, IonItem, IonItemOption, IonItemOptions, IonLabel, IonItemSliding, IonList, IonIcon, IonButton, IonButtons, IonInput } from '@ionic/angular/standalone';
import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';

import { ClienteModel } from 'src/app/models/cliente/cliente.component';

import { DemandadosService } from 'src/app/services/demandado.service';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { Subscription, Observable  } from 'rxjs';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { MatDialog } from '@angular/material/dialog';
import { DialogExpedienteComponent } from '../../components/dialog-expediente/dialog-expediente.component'; 
import { DialogExpedienteModificarComponent } from '../../components/dialog-expediente-modificar/dialog-expediente-modificar.component'; 

import Swal from 'sweetalert2'

import { ViewWillEnter } from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';


@Component({
  selector: 'app-lista-expedientes',
  templateUrl: './lista-expedientes.page.html',
  styleUrls: ['./lista-expedientes.page.scss'],
  standalone: true,
  imports: [IonInput, 
    CommonModule,
    FormsModule,
    IonButtons, IonButton, IonIcon, IonList, IonItemSliding, IonLabel, IonItemOptions, IonItemOption, 
    IonItem, IonCardContent, IonCard, IonImg, IonContent, IonHeader, IonTitle, IonToolbar, IonText,
    MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatMenuModule, ScrollingModule
  ]
})
export class ListaExpedientesPage implements OnInit, OnDestroy {
  expedientes: ExpedienteModel[] = [];
  expedientesOriginales: ExpedienteModel[] = [];
  hayExpedientes: boolean = true;

  busqueda: string = "";
  private destroy$ = new Subject<void>(); // Subject para gestionar la destrucción
  getClientes$!: Subscription;
  texto: string = "";

  constructor(
    private expedienteService: ExpedientesService,
    private demandadoService: DemandadosService,
    private dialog: MatDialog,
    private router: Router
  ) {

    this.cargarExpedientes();
  }

  ngOnInit() {
    this.cargarExpedientes(); 
  }

    ngAfterViewInit() {
  // Forzar recarga tras render completo
  setTimeout(() => {
    //this.cargarExpedientes();
  }, 0);
}

  cargarExpedientes() {
    this.expedienteService.getExpedientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (expedientes) => {
          this.expedientes = expedientes!;
          this.expedientesOriginales = [...expedientes!];
          this.hayExpedientes = this.expedientes.length > 0;

        },
        (error) => {
          console.error('Error al obtener expedientes:', error);
        }
      );
  }

  ngOnDestroy() {
    this.destroy$.next(); // Emite un valor para cancelar las suscripciones
    this.destroy$.complete(); // Completa el subject
  }

  obtenerExpedientes() {
    this.getClientes$ = this.expedienteService.getExpedientes().subscribe(
      (expedientes) => {
        this.expedientes = expedientes!;
        this.expedientesOriginales = [...expedientes!]; 
        this.hayExpedientes = this.expedientes.length > 0;
      },
      (error) => {
        console.error('Error al obtener expedientes:', error);
      }
    );
  }
 
/*
        abrirModificar(expediente: ExpedienteModel) {
          const dialogRef = this.dialog.open(DialogExpedienteModificarComponent, {
            width: '500px',
            data: expediente,
            disableClose: true, // 🔹 Evita que se cierre al hacer clic afuera

          });
        
          dialogRef.afterClosed().subscribe((expedienteModificado: ExpedienteModel) => {
            if (expedienteModificado) {
              this.expedienteService.deleteClienteExpedientePorId(expediente.id).subscribe(response => {
                console.log('Respuesta del servidor:', response);
              }, error => {
                console.error('Error al eliminar clientes:', error);

              });
              
              this.expedienteService.actualizarExpediente(expedienteModificado.id, expedienteModificado)
                .subscribe(response => {
                  console.log('Expediente actualizado:', response);

                  Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Expediente modificado exitosamente",
                    showConfirmButton: false,
                    timer: 1500
                  });
                  
                  this.expedientes = this.expedientes.map(exp => 
                    exp.id === expedienteModificado.id ? expedienteModificado : exp
                  );

                  this.cargarExpedientes();
                  
                }, error => {
                  console.error('Error al actualizar expediente:', error);

                  Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "error",
                    title: "Error al actualizar expediente",
                    showConfirmButton: false,
                    timer: 1500
                  });
                });
            }
          });
        }
  */
 
  abrirModificar(expediente: ExpedienteModel) {
  const dialogRef = this.dialog.open(DialogExpedienteModificarComponent, {
    width: '900px',
    disableClose: true,
    data: { id: expediente.id }   // 🔹 SOLO LE PASÁS EL ID
  });

  dialogRef.afterClosed().subscribe((expedienteModificado: ExpedienteModel) => {
    if (expedienteModificado) {

      this.expedienteService
        .deleteClienteExpedientePorId(expedienteModificado.id)
        .subscribe({
          next: (response) => {
            console.log('Respuesta del servidor (delete cliente-expediente):', response);
          },
          error: (error) => {
            console.error('Error al eliminar clientes:', error);
          }
        });

      this.expedienteService
        .actualizarExpediente(expedienteModificado.id, expedienteModificado)
        .subscribe({
          next: (response) => {
            console.log('Expediente actualizado:', response);

            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Expediente modificado exitosamente',
              showConfirmButton: false,
              timer: 1500
            });

            // Actualizás en la lista local
            this.expedientes = this.expedientes.map(exp =>
              exp.id === expedienteModificado.id ? expedienteModificado : exp
            );

            // Y si querés, recargás todo de la API
            this.cargarExpedientes();
          },
          error: (error) => {
            console.error('Error al actualizar expediente:', error);

            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'error',
              title: 'Error al actualizar expediente',
              showConfirmButton: false,
              timer: 1500
            });
          }
        });
    }
  });
}


  goTo(path: string){
    this.router.navigate([path]); // Navega a la ruta deseada
  }


          abrirDialog(): void {
            const dialogRef = this.dialog.open(DialogExpedienteComponent, {
              width: '500px',
              disableClose: true, // 🔹 Evita que se cierre al hacer clic afuera

            });
          
            dialogRef.afterClosed().subscribe((expediente: ExpedienteModel) => {
              if (expediente) {
                // Primero, agregar el cliente a la base de datos
                this.expedienteService.addExpediente(expediente).subscribe(response => {
                  // El cliente agregado tendrá ahora el ID asignado
                  expediente.id = response.id; // Asignamos el ID devuelto desde la base de datos
          
                  console.log('expediente agregado:', response);
                  this.expedientes.push(expediente);

                  Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Expediente cargado exitosamente",
                    showConfirmButton: false,
                    timer: 1500
                  });
          
                  //this.agregarClientes(+expediente.id, expediente.clientes);
                  // Si la búsqueda está vacía, obtener todos los clientes
                  if (this.busqueda == '') {
                    this.obtenerExpedientes();
                  } /*else {
                    this.clienteService.searchClientes(this.busqueda);
                  }*/
          
  
                }, error => {
                   console.error('Error al agregar expediente:', error);

  let mensaje = 'Error al cargar expediente';
  
  if (error.status === 400 && error.error?.error === 'Ya existe un expediente con el mismo número, año y juzgado.') {
    mensaje = `
      Ya existe un expediente cargado con ese <strong>número</strong>, <strong>año</strong> y <strong>juzgado</strong>.<br>
      Verificá los datos antes de continuar.
    `;
  }

  Swal.fire({
    icon: 'error',
    title: 'Carga rechazada',
    html: mensaje,
    confirmButtonText: 'Entendido'
  });
                });
              }
            });
          }

      /*buscar() {
        const texto = this.busqueda.trim();
      
        // ✅ Si está vacío, restaurar todos los expedientes
        if (texto === '') {
          this.expedientes = [...this.expedientesOriginales];
          this.hayExpedientes = this.expedientes.length > 0;
          return;
        }
      
        // 🔎 Si hay texto, buscar
        this.expedienteService.buscarExpedientes(texto).subscribe(
          (expedientes) => {
            this.expedientes = expedientes;
            this.hayExpedientes = this.expedientes.length > 0;
          },
          (error) => {
            console.error('Error al obtener expedientes:', error);
          }
        );
      }*/
          
          
          


      async agregarClientes(expedienteId: number, clientes: ClienteModel[]): Promise<void> {
        try {
          if (!Array.isArray(clientes) || clientes.length === 0) {
            throw new Error('No se proporcionaron clientes válidos.');
          }

          // Aquí llamas al servicio para agregar cada cliente individualmente
          for (const cliente of clientes) {
            await this.expedienteService.agregarClientesAExpediente(expedienteId, +cliente.id); // Cambié 'clientes' por 'cliente' porque es uno solo
          }

          console.log('Clientes agregados exitosamente.');
        } catch (err) {
          console.error('Error al agregar los clientes:');
          throw err;
        }
      }

            // HACER SERVICIO PROPIO
            eliminarExpediente(expediente: ExpedienteModel) {
              Swal.fire({
                toast: true,
      
                title: "¿Estás seguro?",
                text: "No podrás revertir esto.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "No, cancelar",
                reverseButtons: true
              }).then((result) => {
                if (result.isConfirmed) {
                  // Cambiar estado a 'eliminado'
                  expediente.estado = 'eliminado';
            
                  // Verificar si el cliente tiene un ID válido
                  if (!expediente.id) {
                    Swal.fire({
                      toast: true,
      
                      icon: "error",
                      title: "Error",
                      text: "El expediente no tiene un ID válido."
                    });
                    return;
                  }
            
                  // Actualizar el cliente en la base de datos
                  this.expedienteService.actualizarExpediente(expediente.id, expediente).subscribe(
                    (response) => {
                      console.log('Expediente actualizado:', response);
                      this.cargarExpedientes();
                      // Actualiza solo el cliente en la lista sin recargar todo
                     // this.clientes = this.clientes.map(c => (c.id === cliente.id ? cliente : c));
            
                      // Mostrar notificación de éxito
                      Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: "Expediente eliminado correctamente.",
                        showConfirmButton: false,
                        timer: 3000
                      });
                    },
                    (error) => {
                      console.error('Error al actualizar expediente:', error);
            
                      // Mostrar error en SweetAlert
                      Swal.fire({
                        toast: true,
      
                        icon: "error",
                        title: "Error",
                        text: "No se pudo eliminar el expediente."
                      });
                    }
                  );
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                  Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "error",
                    title: "Cancelaste la eliminación.",
                    showConfirmButton: false,
                    timer: 3000
                  });
                }
              });
            }
            

trackByExpedientes(index: number, expediente: ExpedienteModel): string {
  return expediente.id;
}


filtrar() {
  const texto = this.busqueda.trim().toLowerCase();

  if (!texto) {
    this.expedientes = [...this.expedientesOriginales];
    this.hayExpedientes = this.expedientes.length > 0;
    return;
  }

  this.expedientes = this.expedientesOriginales.filter((exp) => {
    const t = texto;

    return (
      (exp.caratula        && exp.caratula.toLowerCase().includes(t))      ||
      (exp.numero          && exp.numero.toString().includes(t))           ||
      (exp.anio            && exp.anio.toString().includes(t))             ||
      (exp.busqueda   && exp.busqueda.toLowerCase().includes(t))
    );
  });

  this.hayExpedientes = this.expedientes.length > 0;
}


}
