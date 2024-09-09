import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BaseDialog } from '../../baseDialog';

@Component({
  selector: 'app-rolecreateconfrim-dialog',
  standalone: true,
  imports: [MatDialogModule,MatButtonModule],
  templateUrl: './rolecreateconfrim-dialog.component.html',
  styleUrl: './rolecreateconfrim-dialog.component.scss'
})
export class RolecreateconfrimDialogComponent extends BaseDialog<RolecreateconfrimDialogComponent>{

  constructor(dialogRef: MatDialogRef<RolecreateconfrimDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {name: string}) {
    super(dialogRef);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

export enum RoleCreateConfrimDialogState {
  Yes,
  No
}
