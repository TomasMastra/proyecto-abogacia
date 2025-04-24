import { Component, OnInit, ViewChild, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';  // Necesario para usar firstValueFrom

import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonCard, IonCardContent, IonText, IonItem, IonItemOption, IonItemOptions, IonLabel, IonItemSliding, IonList, IonIcon, IonButton, IonButtons, IonInput } from '@ionic/angular/standalone';
import { DemandadosService } from 'src/app/services/demandado.service';
import { DemandadoModel } from 'src/app/models/demandado/demandado.component';

import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';

import { LocalidadesService } from 'src/app/services/localidades.service';
import { LocalidadModel } from 'src/app/models/localidad/localidad.component';

import { Subscription, Observable  } from 'rxjs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PageEvent } from '@angular/material/paginator';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';


import { MatDialog } from '@angular/material/dialog';
import { DialogLocalidadComponent } from '../../components/dialog-localidad/dialog-localidad.component'; 
import { DialogClienteModificarComponent } from '../../components/dialog-cliente-modificar/dialog-cliente-modificar.component'; 

import Swal from 'sweetalert2'

// src\app\components\dialog-cliente\dialog-cliente.component.ts
@Component({
  selector: 'app-demandado',
  templateUrl: './demandado.page.html',
  styleUrls: ['./demandado.page.scss'],
  standalone: true,
  imports: [IonInput, 
    CommonModule,
    FormsModule,
    IonButtons, IonButton, IonIcon, IonList, IonItemSliding, IonLabel, IonItemOptions, IonItemOption, 
    IonItem, IonCardContent, IonCard, IonImg, IonContent, IonHeader, IonTitle, IonToolbar, IonText,
    MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatPaginatorModule,
    MatMenuModule, MatButtonModule, MatIconModule

 
  ]
})
export class DemandadoPage implements OnInit {

  private demandadosService: DemandadosService;
  private expedientesService: ExpedientesService;
  private LocalidadesService: LocalidadesService;


  demandados: DemandadoModel[] = [];
  demandadosOriginales: DemandadoModel[] = []; 

  localidades: LocalidadModel[] = [];


  getDemandados$!: Subscription;
  getLocalidades$!: Subscription;

  hayDemandados: boolean = true;
  busqueda: string = '';
  busquedaAnterior: string = ''; 
  texto: string = '';

  private destroy$ = new Subject<void>(); // Subject para gestionar la destrucción

  private timeoutId: any; // Almacenar el ID del timeout



  constructor(demandadoService: DemandadosService, expedientesService: ExpedientesService, 
    localidadesService: LocalidadesService, private dialog: MatDialog,
    private router: Router) {
    this.demandadosService = demandadoService;
    this.expedientesService = expedientesService;
    this.LocalidadesService = localidadesService;


  }



          ngOnInit() {
            if(this.busqueda == ''){
              this.cargarDemandados(); 
              this.obtenerLocalidades(); 

            }
          }
        
          cargarDemandados() {
            this.demandadosService.getDemandados().subscribe(
              (demandados) => {
                this.demandados = demandados;
                this.demandadosOriginales = [...demandados];
                this.hayDemandados = this.demandados.length > 0;
              },
              (error) => {
                console.error('Error al obtener demandados:', error);
              },
              () => {
                this.timeoutId = setTimeout(() => {
                  this.cargarDemandados();

                }, 5000);
              }
            );
          }
        


      obtenerLista(){
        this.demandadosService.getDemandados()
          .pipe(takeUntil(this.destroy$)) 
          .subscribe(
            (demandados) => {
              this.demandados = demandados;
              this.demandadosOriginales = [...demandados];
              this.hayDemandados = this.demandados.length > 0;
            },
            (error) => {
              console.error('Error al obtener demandados:', error);
            }
          );
        
      }
/*
      abrirDialog(): void {
        const dialogRef = this.dialog.open(DialogLocalidadComponent, {
          width: '500px',
        });
      
        dialogRef.afterClosed().subscribe((demandado: DemandadoModel) => {
          this.obtenerDemandados();

          if (localidad) {
            // Primero, agregar el cliente a la base de datos
            this.demandadosService.addDeman(localidad).subscribe(response => {
              // El cliente agregado tendrá ahora el ID asignado
              localidad.id = response.id; // Asignamos el ID devuelto desde la base de datos
      
              console.log('Demandado agregado:', response);
              this.demandados.push(this.demandados);
      
              // Si la búsqueda está vacía, obtener todos los clientes
              if (this.busqueda == '') {
                this.obtenerDemandados();
              } else {
                //this.localidadesService.sea(this.busqueda);
              }
      
      
            }, error => {
              console.error('Error al agregar demandado:', error);
            });
          }
        });
      }*/
      
      

      goTo(path: string) {
        this.router.navigate([path]);
      }

      obtenerDemandados() {
        this.getDemandados$ = this.demandadosService.getDemandados().subscribe(
          (demandados) => {
            this.demandados = demandados;
            this.demandadosOriginales = [...demandados]; 
            this.hayDemandados = this.demandados.length > 0;
          },
          (error) => {
            console.error('Error al obtener demandados:', error);
          }
        );
      }

      obtenerLocalidades() {
        this.getLocalidades$ = this.LocalidadesService.getLocalidades().subscribe(
          (localidades) => {
            this.localidades = localidades;
            //this.localidadesOriginales = [...localidades]; 
            //this.hayLocalidades = this.localidades.length > 0;
          },
          (error) => {
            console.error('Error al obtener clientes:', error);
          }
        );
      }


      async buscar() {

        this.demandadosService.searchDemandados(this.busqueda).subscribe(
          (demandados) => {
            this.demandados = demandados;
            this.demandadosOriginales = [...demandados];
            this.hayDemandados = this.demandados.length > 0;
            this.texto = 'No se encontraron demandados';
          },
          (error) => {
            console.error('Error al obtener demandados:', error);
          },
          
        );
    }
/*
      agregarDemandado() {
        Swal.fire({
          title: "Agregar Demandado",
          input: "text",
          inputLabel: "Ingrese el nombre del demandado",
          inputPlaceholder: "nombre del demandado",
          showCancelButton: true,
          confirmButtonText: "Agregar",
          toast: true,
          preConfirm: (nombre) => {
            if (!nombre) {
              Swal.showValidationMessage("Debe ingresar un nombre válido");
              return null;  // Si no hay nombre, se detiene el proceso
            }
            return nombre;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const demandado: DemandadoModel = {
              nombre: result.value,
              id: '', 
              estado: 'en gestión',
              direccion: '',
              localidad_id: 1
            };
      
            // Intentar agregar el demandado
            this.demandadosService.addDemandado(demandado).subscribe({
              next: (response) => {
                // Si la adición es exitosa, recargamos los demandados y mostramos el mensaje
                this.cargarDemandados();
                console.log("Demandado agregado:", demandado);
                Swal.fire({
                  toast: true,
                  title: "Demandado agregado",
                  text: `Se agregó a ${demandado.nombre} correctamente.`,
                  icon: "success"
                });
              },
              error: (error) => {
                // Si ocurre un error, mostramos un mensaje de error
                console.error("Error al agregar el demandado:", error);
                Swal.fire({
                  toast: true,
                  title: "Error",
                  text: "Hubo un problema al agregar al demandado. Intenta nuevamente.",
                  icon: "error"
                });
              }
            });
          }
        });
      }*/

        agregarDemandado() {
          const opcionesLocalidades = this.localidades.map(loc => `<option value="${loc.id}">${loc.localidad}</option>`).join('');
        
          Swal.fire({
            title: 'Agregar Demandado',
            html:
              `<input id="nombre" class="swal2-input" placeholder="Nombre del demandado">` +
              `<input id="direccion" class="swal2-input" placeholder="Dirección">` +
              `<select id="localidad_id" class="swal2-input">
                <option value="">Seleccione localidad</option>
                ${opcionesLocalidades}
              </select>`,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Agregar',
            preConfirm: () => {
              const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
              const direccion = (document.getElementById('direccion') as HTMLInputElement).value.trim();
              const localidad_id = +(document.getElementById('localidad_id') as HTMLSelectElement).value;
        
              if (!nombre || !direccion || !localidad_id) {
                Swal.showValidationMessage('Todos los campos son obligatorios');
                return null;
              }
        
              return { nombre, direccion, localidad_id };
            }
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const { nombre, direccion, localidad_id } = result.value;
        
              const demandado: DemandadoModel = {
                id: '',
                nombre,
                direccion,
                localidad_id,
                estado: 'en gestión'
              };
        
              this.demandadosService.addDemandado(demandado).subscribe({
                next: () => {
                  this.cargarDemandados();
                  Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Demandado agregado correctamente',
                    showConfirmButton: false,
                    timer: 2000
                  });
                },
                error: (error) => {
                  console.error('Error al agregar el demandado:', error);
                  Swal.fire({
                    toast: true,
                    title: 'Error',
                    text: 'Hubo un problema al agregar al demandado. Intenta nuevamente.',
                    icon: 'error'
                  });
                }
              });
            }
          });
        }
        
        
        

/*
      modificarDemandado(demandado: DemandadoModel) { 
        Swal.fire({
          title: "Modificar Demandado",
          input: "text",
          inputLabel: "Ingrese el nombre del demandado",
          inputPlaceholder: "nombre del demandado",
          inputValue: demandado.nombre, // Aquí agregamos el nombre del demandado existente
          showCancelButton: true,
          confirmButtonText: "Modificar",
          toast: true,
          preConfirm: (nombre) => {
            if (!nombre) {
              Swal.showValidationMessage("Debe ingresar un nombre válido");
              return null;  // Si no hay nombre, se detiene el proceso
            }
            return nombre;
          }
        }).then((result) => {
          if (result.isConfirmed) {
            const demandadoModificado: DemandadoModel = {
              ...demandado,
              nombre: result.value, // Modificamos el nombre del demandado con el nuevo valor
              estado: demandado.estado  // Conservamos el estado del demandado actual
            };
      
            // Intentar modificar el demandado
            this.demandadosService.actualizarDemandado(demandado.id, demandadoModificado).subscribe({
              next: (response) => {
                // Si la modificación es exitosa, recargamos los demandados y mostramos el mensaje
                this.cargarDemandados();
                console.log("Demandado modificado:", demandadoModificado);
                Swal.fire({
                  toast: true,
                  title: "Demandado modificado",
                  text: `Se modificó a ${demandadoModificado.nombre} correctamente.`,
                  icon: "success"
                });
              },
              error: (error) => {
                // Si ocurre un error, mostramos un mensaje de error
                console.error("Error al modificar el demandado:", error);
                Swal.fire({
                  toast: true,
                  title: "Error",
                  text: "Hubo un problema al modificar al demandado. Intenta nuevamente.",
                  icon: "error"
                });
              }
            });
          }
        });
      }*/

        modificarDemandado(demandado: DemandadoModel) {
          const opcionesLocalidades = this.localidades
          .map(loc => `
            <option value="${loc.id}" ${loc.id.toString() === String(demandado.localidad_id) ? 'selected' : ''}>
              ${loc.localidad}
            </option>
          `)
          .join('');
        
        
          Swal.fire({
            title: 'Modificar Demandado',
            html: `
              <input id="nombre" class="swal2-input" placeholder="Nombre" value="${demandado.nombre ?? ''}">
              <input id="direccion" class="swal2-input" placeholder="Dirección" value="${demandado.direccion ?? ''}">
              <select id="localidad" class="swal2-input">
                <option value="">Seleccione localidad</option>
                ${opcionesLocalidades}
              </select>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Modificar',
            preConfirm: () => {
              const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
              const direccion = (document.getElementById('direccion') as HTMLInputElement).value.trim();
              const localidad_id = +(document.getElementById('localidad') as HTMLSelectElement).value;
        
              if (!nombre || !direccion || !localidad_id) {
                Swal.showValidationMessage('Todos los campos son obligatorios');
                return null;
              }
        
              return { nombre, direccion, localidad_id };
            }
          }).then((result) => {
            if (result.isConfirmed && result.value) {
              const { nombre, direccion, localidad_id } = result.value;
        
              const demandadoModificado: DemandadoModel = {
                ...demandado,
                nombre,
                direccion,
                localidad_id
              };
        
              this.demandadosService.actualizarDemandado(demandado.id, demandadoModificado).subscribe({
                next: () => {
                  this.cargarDemandados();
                  Swal.fire({
                    toast: true,
                    title: 'Demandado modificado',
                    text: `Se modificó a ${demandadoModificado.nombre} correctamente.`,
                    icon: 'success'
                  });
                },
                error: (error) => {
                  console.error('Error al modificar el demandado:', error);
                  Swal.fire({
                    toast: true,
                    title: 'Error',
                    text: 'Hubo un problema al modificar al demandado. Intenta nuevamente.',
                    icon: 'error'
                  });
                }
              });
            }
          });
        }
        
      
      
      
      
      eliminarDemandado(demandado: DemandadoModel) {
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
            if (!demandado.id) {
              Swal.fire({
                toast: true,
                icon: "error",
                title: "Error",
                text: "El demandado no tiene un ID válido."
              });
              return;
            }
      
            // Verificar si el demandado está en algún expediente en gestión
            this.expedientesService.getExpedientesPorDemandado(demandado.id).subscribe(
              (expedientes) => {
                if (expedientes.length > 0) {
                  // Mostrar mensaje y cancelar eliminación si hay expedientes en gestión
                  Swal.fire({
                    toast: true,
                    icon: "error",
                    title: "No se puede eliminar",
                    text: "Este demandado está asociado a un expediente en gestión."
                  });
                  return;
                }
      
                // Si no tiene expedientes en gestión, cambiar estado a 'eliminado'
                demandado.estado = 'eliminado';
      
                // Actualizar el demandado en la base de datos
                this.demandadosService.actualizarDemandado(demandado.id, demandado).subscribe(
                  (response) => {
                    console.log("Demandado actualizado:", response);
                    this.cargarDemandados();
      
                    // Mostrar notificación de éxito
                    Swal.fire({
                      toast: true,
                      position: "top-end",
                      icon: "success",
                      title: "Demandado eliminado correctamente.",
                      showConfirmButton: false,
                      timer: 3000
                    });
                  },
                  (error) => {
                    console.error("Error al actualizar demandado:", error);
      
                    // Mostrar error en SweetAlert
                    Swal.fire({
                      toast: true,
                      icon: "error",
                      title: "Error",
                      text: "No se pudo eliminar el demandado."
                    });
                  }
                );
              },
              (error) => {
                console.error("Error al verificar expedientes:", error);
                // En este caso no es un error, sino que no hay expedientes
                Swal.fire({
                  toast: true,
                  icon: "info",
                  title: "No hay expedientes en gestión",
                  text: "El demandado no está asociado a ningún expediente en gestión."
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
      
}
