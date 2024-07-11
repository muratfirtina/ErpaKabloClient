import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaseDialog } from '../baseDialog';

@Component({
  selector: 'app-file-upload-dialog',
  standalone: true,
  imports: [],
  templateUrl: './file-upload-dialog.component.html',
  styleUrl: './file-upload-dialog.component.scss'
})
export class FileUploadDialogComponent extends BaseDialog<FileUploadDialogComponent> {

  constructor(
    dialogRef: MatDialogRef<FileUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FileUploadDialogState,
    ) {
    super(dialogRef);
  
   }

}
export enum FileUploadDialogState {
  Yes,
  No
}
