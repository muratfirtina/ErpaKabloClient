import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FileSystemFileEntry, NgxFileDropEntry, NgxFileDropModule } from 'ngx-file-drop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload-dialog',
  standalone: true,
  imports: [MatDialogModule, NgxFileDropModule, CommonModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrl: './file-upload-dialog.component.scss'
})
export class FileUploadDialogComponent {
  selectedFiles: File[] = [];
  previewUrls: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<FileUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  async onFileDropped(files: NgxFileDropEntry[]) {
    for (const droppedFile of files) {
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        
        fileEntry.file(async (file: File) => {
          if (this.isValidImageFile(file)) {
            this.selectedFiles.push(file);
            this.previewUrls.push(await this.createPreviewUrl(file));
          }
        });
      }
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  uploadFiles() {
    this.dialogRef.close(this.selectedFiles);
  }

  private isValidImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return allowedTypes.includes(file.type) && file.size <= maxSize;
  }

  private createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}
