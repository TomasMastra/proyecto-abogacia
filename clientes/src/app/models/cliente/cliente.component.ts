import { ExpedienteModel } from '../expediente/expediente.component';

export interface ClienteModel {
id: string,
nombre: string | null,
apellido: string | null,
dni: number | null,
telefono: string | null,
direccion: string | null,
fecha_nacimiento: string | null,
fecha_creacion: string,
email: string,
expedientes: any[] | null;
estado: string;
usuario_id: string,
}
