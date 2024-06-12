import { Component, Inject, OnInit } from '@angular/core';
import { BaseDialog } from '../../baseDialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { Feature } from 'src/app/contracts/feature/feature';

@Component({
  selector: 'app-featurecreateconfrim-dialog',
  standalone: true,
  imports: [MatDialogModule,MatButton],
  templateUrl: './featurecreateconfrim-dialog.component.html',
  styleUrl: './featurecreateconfrim-dialog.component.scss'
})
export class FeaturecreateconfrimDialogComponent extends BaseDialog<FeaturecreateconfrimDialogComponent>{

  constructor(dialogRef: MatDialogRef<FeaturecreateconfrimDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string } ) {
    super(dialogRef);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

export enum FeatureCreateConfrimDialogState {
  Yes,
  No
}
