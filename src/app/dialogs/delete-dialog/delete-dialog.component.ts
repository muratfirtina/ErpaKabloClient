import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseDialog } from '../baseDialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-delete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './delete-dialog.component.html',
  styleUrls: ['./delete-dialog.component.scss']
})
export class DeleteDialogComponent extends BaseDialog<DeleteDialogComponent> {

  constructor(
    dialogRef: MatDialogRef<DeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteDialogState,
  ) {
    super(dialogRef);
  }


}

export enum DeleteDialogState {
  Yes,
  No
}