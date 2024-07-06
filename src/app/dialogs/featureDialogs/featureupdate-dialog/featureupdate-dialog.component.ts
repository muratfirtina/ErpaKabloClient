import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BaseDialog } from '../../baseDialog';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-featureupdate-dialog',
  standalone: true,
  imports: [MatDialogModule,MatButton],
  templateUrl: './featureupdate-dialog.component.html',
  styleUrl: './featureupdate-dialog.component.scss'
})
export class FeatureupdateDialogComponent extends BaseDialog<FeatureupdateDialogComponent>{

  constructor(dialogRef: MatDialogRef<FeatureupdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string } ) {
    super(dialogRef);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

export enum FeatureUpdateConfrimDialogState {
  Yes,
  No
}
