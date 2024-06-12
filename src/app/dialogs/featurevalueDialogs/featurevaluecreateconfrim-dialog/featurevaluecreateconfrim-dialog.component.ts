import { Component, Inject, OnInit } from '@angular/core';
import { BaseDialog } from '../../baseDialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton, MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-featurevaluecreateconfrim-dialog',
  standalone: true,
  imports: [MatDialogModule,MatButton],
  templateUrl: './featurevaluecreateconfrim-dialog.component.html',
  styleUrl: './featurevaluecreateconfrim-dialog.component.scss'
})
export class FeaturevaluecreateconfrimDialogComponent extends BaseDialog<FeaturevaluecreateconfrimDialogComponent>{

  constructor(dialogRef: MatDialogRef<FeaturevaluecreateconfrimDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {name: string}) {
    super(dialogRef);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

export enum FeaturevalueCreateConfrimDialogState {
  Yes,
  No
}
