import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { BaseDialog } from '../baseDialog';
import { NgxFileDropEntry, NgxFileDropModule } from 'ngx-file-drop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload-dialog',
  standalone: true,
  imports: [MatDialogModule, NgxFileDropModule, CommonModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrl: './file-upload-dialog.component.scss'
})
export class FileUploadDialogComponent extends BaseDialog<FileUploadDialogComponent> {

  files: File[] = [];

  constructor(
    dialogRef: MatDialogRef<FileUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    ) {
    super(dialogRef);
  
   }
   dropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this.files.push(file);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUpload(): void {
    this.dialogRef.close(this.files);
  }
}
export enum FileUploadDialogState {
  Yes,
  No
}
