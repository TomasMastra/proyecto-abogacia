import { Component, OnInit, ViewChild, OnDestroy  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom, of, forkJoin } from 'rxjs';  // Necesario para usar firstValueFrom
import { map, catchError } from 'rxjs/operators';

import { IonContent, IonHeader, IonTitle, IonToolbar, IonImg, IonCard, IonCardContent, IonText, IonItem, IonItemOption, IonItemOptions, IonLabel, IonItemSliding, IonList, IonIcon, IonButton, IonButtons, IonInput } from '@ionic/angular/standalone';
import { ClientesService } from 'src/app/services/clientes.service';
import { ClienteModel } from 'src/app/models/cliente/cliente.component';

import { JuzgadosService } from 'src/app/services/juzgados.service';
//import { JuzgadoModel } from 'src/app/models/juzgado/juzagdo.component';

import { ClientesExpedientesService } from 'src/app/services/clientes-expedientes.service';

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

import { ScrollingModule } from '@angular/cdk/scrolling';

import { MatDialog } from '@angular/material/dialog';
import { DialogClienteComponent } from '../../components/dialog-cliente/dialog-cliente.component'; 
import { DialogClienteModificarComponent } from '../../components/dialog-cliente-modificar/dialog-cliente-modificar.component'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import Swal from 'sweetalert2'
// src\app\components\dialog-cliente\dialog-cliente.component.ts
@Component({
  selector: 'app-lista-clientes',
  templateUrl: './lista-clientes.page.html',
  styleUrls: ['./lista-clientes.page.scss'],
  standalone: true,
  imports: [IonInput, 
    CommonModule,
    FormsModule,
    IonButtons, IonButton, IonIcon, IonList, IonItemSliding, IonLabel, IonItemOptions, IonItemOption, 
    IonItem, IonCardContent, IonCard, IonImg, IonContent, IonHeader, IonTitle, IonToolbar, IonText,
    MatSidenavModule, MatButtonModule, MatDatepickerModule, MatNativeDateModule,
    MatFormFieldModule, MatToolbarModule, MatIconModule, MatDividerModule, MatPaginatorModule,
    MatMenuModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, ScrollingModule

 
  ]
})
export class ListaClientesPage implements OnInit, OnDestroy {

  private clienteService: ClientesService;
  private cliExpServ: ClientesExpedientesService;
  private juzgadoService: JuzgadosService;


  clientes: ClienteModel[] = [];
  clientesOriginales: ClienteModel[] = []; 

  getClientes$!: Subscription;
  hayClientes: boolean = true;
  busqueda: string = '';
  busquedaAnterior: string = ''; 
  texto: string = '';
  cargandoClientes: boolean = false;



  private destroy$ = new Subject<void>();

  private timeoutId: any;

  //getClientes$: Subscription | null = null; // Asignar null

  cargando: boolean = false;

  expandido: string | null = null;

  expedientesPorCliente: { [clienteId: string]: any[] } = {};


  constructor(clientesService: ClientesService, private dialog: MatDialog,
    private router: Router, cliExpServ: ClientesExpedientesService, juzgadoService: JuzgadosService) {
    this.clienteService = clientesService;
    this.cliExpServ = cliExpServ;
    this.juzgadoService = juzgadoService;

  }


          ngOnInit() {
            if(this.busqueda == ''){
              this.cargarClientes();
            }
          }

            ngOnDestroy(): void {
            this.clientes = [];
            this.clientesOriginales = [];
            this.busqueda = '';
            this.texto = '';
          }
        
          cargarClientes() {
              this.cargandoClientes = true;

            this.clienteService.getClientes().subscribe(
              (clientes) => {
                this.clientes = clientes!;
                this.clientesOriginales = [...clientes!];
                this.hayClientes = this.clientes.length > 0;
              },
              (error) => {
                console.error('Error al obtener clientes:', error);
              },
              () => {
                // Programar la próxima ejecución después de 5 segundos
               /* this.timeoutId = setTimeout(() => {
                  this.cargarClientes();

                }, 5000);*/
                      this.cargandoClientes = false;

              }
            );
          }
        


      obtenerLista(){
        this.clienteService.getClientes()
          .pipe(takeUntil(this.destroy$)) 
          .subscribe(
            (clientes) => {
              this.clientes = clientes!;
              this.clientesOriginales = [...clientes!];
              this.hayClientes = this.clientes.length > 0;
            },
            (error) => {
              console.error('Error al obtener clientes:', error);
            }
          );
        
      }
/*
      abrirDialog(): void {
        const dialogRef = this.dialog.open(DialogClienteComponent, {
          width: '500px',
          disableClose: true, // 🔹 Evita que se cierre al hacer clic afuera
          data: {  datos opcionales  }
        });
      
        dialogRef.afterClosed().subscribe((cliente: ClienteModel) => {
          if (cliente) {
            // Primero, agregar el cliente a la base de datos
            this.clienteService.addCliente(cliente).subscribe(response => {
              // El cliente agregado tendrá ahora el ID asignado
              cliente.id = response.id; // Asignamos el ID devuelto desde la base de datos
      
              console.log('Cliente agregado:', response);
              this.clientes.push(cliente);

              const cache = this.clienteService.clientesSubject.value || [];
              this.clienteService.clientesSubject.next([...cache, cliente]);

      
              // Si la búsqueda está vacía, obtener todos los clientes
              if (this.busqueda == '') {
                this.obtenerClientes();
              } else {
                this.clienteService.searchClientes(this.busqueda);
              }
      
              // Ahora, agregar la relación cliente-expediente
              if (cliente.expedientes != null && cliente.expedientes.length > 0) {
                cliente.expedientes.forEach((expediente: any) => {
                  if (cliente.id) {  // Solo agregar la relación si el cliente tiene un ID válido
                    this.cliExpServ.addClienteExpediente(cliente.id, expediente.id).subscribe(response => {
                      console.log('Relación cliente-expediente agregada:', response);
                    }, error => {
                      console.error('Error al agregar relación cliente-expediente:', error);
                    });
                  }
                });
              }
      
            }, error => {
              console.error('Error al agregar cliente:', error);
            });
          }
        });
      }*/
      
        abrirDialog(): void {
  const dialogRef = this.dialog.open(DialogClienteComponent, {
    width: '500px',
    disableClose: true
  });

  dialogRef.afterClosed().subscribe((cliente: ClienteModel) => {
    if (!cliente) return;

    this.clienteService.addCliente(cliente).subscribe(response => {
      // Asignar ID al cliente
      cliente.id = response.id;
      console.log('Cliente agregado:', response);

      // Actualizar cache del servicio
      const cache = this.clienteService.clientesSubject.value || [];
      this.clienteService.clientesSubject.next([...cache, cliente]);

      // Agregarlo a la lista actual visible
      this.clientes.push(cliente);

      // Si hay búsqueda, actualizá resultados
      if (this.busqueda !== '') {
        this.buscar(); // llamá directamente a la búsqueda
      }

      // Agregar relaciones cliente-expediente
      if (cliente.expedientes!.length > 0) {
        cliente.expedientes!.forEach((expediente: any) => {
          if (cliente.id) {
            this.cliExpServ.addClienteExpediente(cliente.id, expediente.id).subscribe({
              next: res => console.log('Relación cliente-expediente agregada:', res),
              error: err => console.error('Error al agregar relación cliente-expediente:', err)
            });
          }
        });
      }

    }, error => {
      console.error('Error al agregar cliente:', error);
    });
  });
}

      
trackByCliente(index: number, cliente: ClienteModel): string {
  return cliente.id;
}

      goTo(path: string) {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate([path]); // Esto forzará la recarga del componente
        });
      }
      

      obtenerClientes() {
        this.getClientes$ = this.clienteService.getClientes().subscribe(
          (clientes) => {
            this.clientes = clientes!;
            this.clientesOriginales = [...clientes!]; 
            this.hayClientes = this.clientes.length > 0;
          },
          (error) => {
            console.error('Error al obtener clientes:', error);
          }
        );
      }

        abrirModificar(cliente: ClienteModel) {
          const dialogRef = this.dialog.open(DialogClienteModificarComponent, {
            width: '500px',
            data: cliente,
            disableClose: true, // 🔹 Evita que se cierre al hacer clic afuera

          });
        
          dialogRef.afterClosed().subscribe((clienteModificado: ClienteModel) => {
            if (clienteModificado) {
              this.clienteService.actualizarCliente(clienteModificado.id, clienteModificado).subscribe(response => {
                console.log('Cliente actualizado:', response);
        
                // Actualiza solo el cliente en la lista sin recargar todo
                this.clientes = this.clientes.map(c => 
                  c.id === clienteModificado.id ? clienteModificado : c
                );

                this.clienteService.limpiarClientes();
                this.cargarClientes();

        
              }, error => {
                console.error('Error al actualizar cliente:', error);
              });
        
              if (this.busqueda == '') {
                //this.obtenerClientes();
              } else {
                //this.clienteService.searchClientes(this.busqueda);
              }
            }
          });
        }


      async buscar() {

          this.clienteService.searchClientes(this.busqueda).subscribe(
            (clientes) => {
              this.clientes = clientes;
              this.clientesOriginales = [...clientes];
              this.hayClientes = this.clientes.length > 0;
              this.texto = 'No se encontraron clientes';
            },
            (error) => {
              console.error('Error al obtener clientes:', error);
            },
            
          );
      }




      // HACER SERVICIO PROPIO
      eliminarCliente(cliente: ClienteModel) {
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

            this.clienteService.getExpedientesPorCliente(cliente.id).subscribe(
              (clientes) => {
                console.log("Clientes:", clientes); // Verifica la respuesta
            
                if (clientes.length > 0) {
                  // Si hay expedientes en gestión, mostrar error y cancelar eliminación
                  Swal.fire({
                    toast: true,
                    icon: "error",
                    title: "No puedes eliminar este cliente",
                    text: "Tiene expedientes en gestión.",
                    showConfirmButton: true
                  });
                  return;
                }else{
                  console.error('Error al actualizar cliente:');
                      Swal.fire({
                        toast: true,
                        icon: "error",
                        title: "Error",
                        text: "No se pudo eliminar el cliente debido a problemas internos."
                      });
                    

                }
          
                  // Si no hay expedientes activos, proceder con la eliminación
                  cliente.estado = 'eliminado';
          
                  this.clienteService.actualizarCliente(cliente.id, cliente).subscribe(
                    (response) => {
                      console.log('Cliente actualizado:', response);

                      this.clienteService.limpiarClientes();
                      this.cargarClientes();

                      Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: "Cliente eliminado correctamente.",
                        showConfirmButton: false,
                        timer: 3000
                      });
                    },
                    (error) => {
                      console.error('Error al actualizar cliente:', error);
                      Swal.fire({
                        toast: true,
                        icon: "error",
                        title: "Error",
                        text: "No se pudo eliminar el cliente."
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

toggleExpandirCliente(cliente: ClienteModel) {
  console.log('cliente.id:', cliente.id, 'tipo:', typeof cliente.id);

  if (this.expandido === cliente.id) {
    this.expandido = null;
    return;
  }

  this.expandido = cliente.id;

  // Placeholder para que NUNCA quede undefined (y puedas mostrar "Cargando..." si querés)
  if (!this.expedientesPorCliente[cliente.id]) {
    this.expedientesPorCliente[cliente.id] = [];
  }

  // Si ya cargaste (o ya intentaste), no repitas request
  // Si querés permitir reintentar, sacá este return y manejalo con un flag "cargando"
  if (this.expedientesPorCliente[cliente.id].length > 0) return;

  this.clienteService.ObtenerExpedientesPorCliente(cliente.id).subscribe({
    next: (expedientes) => {
      // si backend devuelve null/obj raro, lo normalizamos
      const exps = Array.isArray(expedientes) ? expedientes : [];

      if (exps.length === 0) {
        this.expedientesPorCliente[cliente.id] = [];
        return;
      }

      const requests = exps.map(exp =>
        this.juzgadoService.getJuzgadoPorId(exp.juzgado_id).pipe(
          map(juzgado => ({ ...exp, juzgadoModel: juzgado })),
          catchError(err => {
            console.error('Error juzgado id', exp.juzgado_id, err);
            return of({ ...exp, juzgadoModel: null });
          })
        )
      );

      forkJoin(requests).subscribe({
        next: (expedientesConJuzgado) => {
          this.expedientesPorCliente[cliente.id] = expedientesConJuzgado;
        },
        error: (err) => {
          console.error('Error en forkJoin:', err);
          this.expedientesPorCliente[cliente.id] = exps; // al menos mostrás expedientes sin juzgado
        }
      });
    },
    error: (error) => {
      console.error('Error al obtener expedientes del cliente:', error);
      this.expedientesPorCliente[cliente.id] = [];
    }
  });
}

}
