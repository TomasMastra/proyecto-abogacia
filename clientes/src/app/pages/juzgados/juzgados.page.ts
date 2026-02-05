import { Component, OnInit, ViewChild, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';  // Necesario para usar firstValueFrom

import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonCard, IonCardContent, IonText, IonItem, IonItemOption, IonItemOptions, IonLabel, IonItemSliding, IonList, IonIcon, IonButton, IonButtons, IonInput } from '@ionic/angular/standalone';
import { JuzgadosService } from 'src/app/services/juzgados.service';
import { JuzgadoModel } from 'src/app/models/juzgado/juzgado.component';
import { MatDialogModule } from '@angular/material/dialog';

import { ExpedientesService } from 'src/app/services/expedientes.service';
import { ExpedienteModel } from 'src/app/models/expediente/expediente.component';

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
import { DialogJuzgadoComponent } from '../../components/dialog-juzgado/dialog-juzgado.component'; 
import { DialogJuzgadoModificarComponent } from '../../components/dialog-juzgado-modificar/dialog-juzgado-modificar.component'; 

import Swal from 'sweetalert2'

// src\app\components\dialog-cliente\dialog-cliente.component.ts
@Component({
  selector: 'app-juzgados',
  templateUrl: './juzgados.page.html',
  styleUrls: ['./juzgados.page.scss'],
  standalone: true,
  imports: [IonInput, 
    CommonModule,
    FormsModule,
    IonButtons, IonButton, IonIcon, IonList, IonItemSliding, IonLabel, IonItemOptions, IonItemOption, 
    IonItem, IonCardContent, IonCard, IonImg, IonContent, IonHeader, IonTitle, IonToolbar, IonText,
    MatSidenavModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatDividerModule, MatPaginatorModule,
    MatMenuModule, MatButtonModule, MatIconModule, MatDialogModule

 
  ]
})
export class JuzgadosPage implements OnInit {

  private juzgadosService: JuzgadosService;
  private expedientesService: ExpedientesService;

  juzgados: JuzgadoModel[] = [];
  juzgadosOriginales: JuzgadoModel[] = []; 

  getJuzgados$!: Subscription;
  hayJuzgados: boolean = true;
  busqueda: string = '';
  busquedaAnterior: string = ''; 
  texto: string = '';

  private destroy$ = new Subject<void>(); // Subject para gestionar la destrucción

  private timeoutId: any; // Almacenar el ID del timeout



  constructor(juzgadosService: JuzgadosService, expedientesService: ExpedientesService, private dialog: MatDialog,
    private router: Router) {
    this.juzgadosService = juzgadosService;
    this.expedientesService = expedientesService;

  }

/*
  ngOnInit() {
    this.getClientes$ = this.clienteService.getClientes().subscribe(
      (clientes) => {
        this.clientes = Array.isArray(clientes) ? clientes : []; // Asegurarse de que es un arreglo
        this.clientesOriginales = Array.isArray(clientes) ? [...clientes] : Object.values(clientes);
        this.hayClientes = this.clientes.length > 0;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
      }
    );
  }*/


          ngOnInit() {
            if(this.busqueda == ''){
              this.cargarJuzgados(); 
            }
          }
        
          cargarJuzgados() {
            this.juzgadosService.getJuzgados().subscribe(
              (juzgados) => {
                this.juzgados = juzgados;
                this.juzgadosOriginales = [...juzgados];
                this.hayJuzgados = this.juzgados.length > 0;
              },
              (error) => {
                console.error('Error al obtener juzgados:', error);
              },
              () => {
                this.timeoutId = setTimeout(() => {
                  this.cargarJuzgados();

                }, 5000);
              }
            );
          }
        


      obtenerLista(){
        this.juzgadosService.getJuzgados()
          .pipe(takeUntil(this.destroy$)) 
          .subscribe(
            (juzgados) => {
              this.juzgados = juzgados;
              this.juzgadosOriginales = [...juzgados];
              this.hayJuzgados = this.juzgados.length > 0;
            },
            (error) => {
              console.error('Error al obtener localidades:', error);
            }
          );
        
      }

      abrirDialog(): void {
        const dialogRef = this.dialog.open(DialogJuzgadoComponent, {
          width: '500px',
          disableClose: true,

        });
  
        dialogRef.afterClosed().subscribe((juzgado: JuzgadoModel) => {
          if (juzgado) {
            // Primero, agregar el cliente a la base de datos
            console.log('localidadElegida.id', juzgado.localidad_id);
            console.log('Tipo de localidadElegida.id', typeof juzgado.localidad_id);

            this.juzgadosService.addJuzgado(juzgado).subscribe(juzgado => {
              // El cliente agregado tendrá ahora el ID asignado     
              this.juzgados.push(juzgado);
      
              // Si la búsqueda está vacía, obtener todos los clientes
              if (this.busqueda == '') {
                this.obtenerJuzgados();
              } else {
                //this.localidadesService.sea(this.busqueda);
              }
      
      
            }, error => {
              console.error('Error al agregar juzgado:', error);
            });
          }
        });
      }

      

      goTo(path: string) {
        this.router.navigate([path]);
      }

      obtenerJuzgados() {
        this.getJuzgados$ = this.juzgadosService.getJuzgados().subscribe(
          (juzgados) => {
            this.juzgados = juzgados;
            this.juzgadosOriginales = [...juzgados]; 
            this.hayJuzgados = this.juzgados.length > 0;
          },
          (error) => {
            console.error('Error al obtener clientes:', error);
          }
        );
      }



      abrirModificar(juzgado: JuzgadoModel) {
        const dialogRef = this.dialog.open(DialogJuzgadoModificarComponent, {
          width: '500px',
          data: juzgado,
          disableClose: true, // 🔹 Evita que se cierre al hacer clic afuera

        });
            
        dialogRef.afterClosed().subscribe((juzgadoModificado: JuzgadoModel) => {
          if (juzgadoModificado) {
                  // Si se ha modificado la localidad, actualizamos
            this.juzgadosService.actualizarJuzgado(juzgadoModificado.id, juzgadoModificado).subscribe(response => {
            console.log('Juzgado actualizado:', response);
            
                    // Actualiza solo la localidad modificada en la lista sin recargar todo
              this.juzgados = this.juzgados.map(l => 
                l.id === juzgadoModificado.id ? juzgadoModificado : l
              );
            }, error => {
              console.error('Error al actualizar localidad:', error);
            });
            
                  // Si la búsqueda está vacía, se obtiene la lista completa
            if (this.busqueda == '') {
              this.obtenerJuzgados();
            } else {
                    // Si hay búsqueda, puedes aplicar el filtro o llamada a servicio de búsqueda
                    // this.localidadesService.searchLocalidades(this.busqueda);
            }
          } else {
                  // Si el usuario cancela, no hacemos nada pero podemos hacer algo si se desea (como loguear o simplemente no hacer nada)
            console.log('Modificación cancelada');
            this.obtenerJuzgados();
      
          }
        });
      }


        // HACER SERVICIO PROPIO
        eliminarJuzgado(juzgado: JuzgadoModel) {
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
        
              this.juzgadosService.getExpedientesPorJuzgado(juzgado.id).subscribe(expedientes => {
                if (expedientes.length > 0) {
                  // Si hay expedientes en gestión, mostrar error y cancelar eliminación
                  Swal.fire({
                    toast: true,
                    icon: "error",
                    title: "No puedes eliminar este juzgado",
                    text: "Tiene expedientes en gestión.",
                    showConfirmButton: true
                  });
                  return;
                }
        
                // Si no hay expedientes activos, proceder con la eliminación
                juzgado.estado = 'eliminado';
        
                this.juzgadosService.actualizarJuzgado(juzgado.id, juzgado).subscribe(
                  (response) => {
                    console.log('Juzgado actualizado:', response);
                    this.cargarJuzgados();
        
                    Swal.fire({
                      toast: true,
                      position: "top-end",
                      icon: "success",
                      title: "Juzgado eliminado correctamente.",
                      showConfirmButton: false,
                      timer: 3000
                    });
                  },
                  (error) => {
                    console.error('Error al actualizar juzgado:', error);
                    Swal.fire({
                      toast: true,
                      icon: "error",
                      title: "Error",
                      text: "No se pudo eliminar el juzgado."
                    });
                  }
                );
              });
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

        async buscar() {

          this.juzgadosService.searchJuzgados(this.busqueda).subscribe(
            (juzgados) => {
              this.juzgados = juzgados;
              this.juzgadosOriginales = [...juzgados];
              this.hayJuzgados = this.juzgados.length > 0;
              this.texto = 'No se encontraron juzgados';
            },
            (error) => {
              console.error('Error al obtener juzgados:', error);
            },
            
          );
      }
        
}
