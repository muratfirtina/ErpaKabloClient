import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { BaseDialog } from '../../baseDialog';

@Component({
  selector: 'app-featurevaluecreateconfrim-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
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