import { Component, Inject, OnInit } from '@angular/core';
import { BaseDialog } from '../../baseDialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton, MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-categorycreateconfrim-dialog',
  standalone: true,
  imports: [MatDialogModule,MatButton],
  templateUrl: './categorycreateconfrim-dialog.component.html',
  styleUrl: './categorycreateconfrim-dialog.component.scss'
})
export class CategorycreateconfrimDialogComponent extends BaseDialog<CategorycreateconfrimDialogComponent>{

  constructor(dialogRef: MatDialogRef<CategorycreateconfrimDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryCreateConfrimDialogState | string,) {
    super(dialogRef);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

export enum CategoryCreateConfrimDialogState {
  Yes,
  No
}
