import { Component, Inject, OnInit } from '@angular/core';
import { BaseDialog } from '../../baseDialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton, MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-brandcreateconfrim-dialog',
  standalone: true,
  imports: [MatDialogModule,MatButton],
  templateUrl: './brandcreateconfrim-dialog.component.html',
  styleUrl: './brandcreateconfrim-dialog.component.scss'
})
export class BrandcreateconfrimDialogComponent extends BaseDialog<BrandcreateconfrimDialogComponent>{

  constructor(dialogRef: MatDialogRef<BrandcreateconfrimDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BrandCreateConfrimDialogState | string,) {
    super(dialogRef);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

export enum BrandCreateConfrimDialogState {
  Yes,
  No
}
