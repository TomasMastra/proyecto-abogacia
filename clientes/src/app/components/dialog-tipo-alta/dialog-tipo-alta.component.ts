import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export type AltaMode = 'expediente' | 'mediacion';

@Component({
  selector: 'app-dialog-tipo-alta',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './dialog-tipo-alta.component.html',
  styleUrls: ['./dialog-tipo-alta.component.scss']
})
export class DialogTipoAltaComponent {
  constructor(private dialogRef: MatDialogRef<DialogTipoAltaComponent>) {}

  cancelar() {
    this.dialogRef.close(null);
  }

  elegir(mode: AltaMode) {
    this.dialogRef.close(mode);
  }
}