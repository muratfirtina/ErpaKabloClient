import { Component, Inject } from '@angular/core';
import { BaseDialog } from '../baseDialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AngularEditorConfig, AngularEditorModule, UploadResponse } from '@kolkov/angular-editor';
import { ProductService } from 'src/app/services/common/models/product.service';
import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-description-editor-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButton, AngularEditorModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Açıklama Düzenle</h2>
  <mat-dialog-content>
    <angular-editor
      [(ngModel)]="data.description"
      [config]="editorConfig"
      (ngModelChange)="onContentChange($event)">
    </angular-editor>
  </mat-dialog-content>
  <mat-dialog-actions align="end">
    <button mat-button (click)="onNoClick()">İptal</button>
    <button mat-button [mat-dialog-close]="data.description" cdkFocusInitial>Kaydet</button>
  </mat-dialog-actions>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
  `,
  styleUrls: [`./description-editor-dialog.component.scss`]
})
export class DescriptionEditorDialogComponent extends BaseDialog<DescriptionEditorDialogComponent> {

  editorConfig: AngularEditorConfig = {
    editable: true,
    spellcheck: true,
    height: '300px',
    minHeight: '200px',
    placeholder: 'Açıklama girin',
    translate: 'no',
    defaultParagraphSeparator: 'p',
    defaultFontName: 'Arial',
    toolbarHiddenButtons: [
      ['bold']
    ],
    customClasses: [
      {
        name: "quote",
        class: "quote",
      },
      {
        name: 'redText',
        class: 'redText'
      },
      {
        name: "titleText",
        class: "titleText",
        tag: "h1",
      },
    ],
    uploadWithCredentials: false,
    upload: (file: File): Observable<HttpEvent<UploadResponse>> => {
      const formData = new FormData();
      formData.append('image', file);
    
      return from(this.productService.uploadDescriptionImage(formData)).pipe(
        map(response => {
          if (response && response.url) {  // response.length > 0 yerine response.url kontrolü yapıyoruz
            const imageUrl = response.url;  // response[0].url yerine response.url kullanıyoruz
            
            // HTML içeriğini editöre ekleme yaklaşımını değiştiriyoruz
            const imgHtml = `<img src="${imageUrl}" alt="Uploaded Image">`;
            
            // Angular Editor'ün kendi mekanizmasını kullanıyoruz
            return new HttpResponse({
              body: {
                imageUrl: imageUrl
              },
              status: 200,
              statusText: 'OK'
            });
          }
          throw new Error('Upload failed');
        })
      );
    }
  }
  
  constructor(
    dialogRef: MatDialogRef<DescriptionEditorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {description: string},
    private productService: ProductService,
    private toastr: CustomToastrService
  ) {
    super(dialogRef);
  }
  onContentChange(content: string) {
    this.data.description = content;
  }
  
  onNoClick(): void {
    this.dialogRef.close();
  }
}