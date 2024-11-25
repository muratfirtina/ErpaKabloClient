import { Component, Inject } from '@angular/core';
import { BaseDialog } from '../baseDialog';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AngularEditorModule } from '@kolkov/angular-editor';

@Component({
  selector: 'app-description-editor-dialog',
  standalone: true,
  imports: [MatDialogModule,MatButton,AngularEditorModule, FormsModule],
  template: `
    <h2 mat-dialog-title>Açıklama Düzenle</h2>
    <mat-dialog-content>
      <angular-editor [(ngModel)]="data.description" [config]="editorConfig"></angular-editor>
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

  editorConfig = {
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
    ]
  };
  
    constructor(dialogRef: MatDialogRef<DescriptionEditorDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: {description: string}) {
      super(dialogRef);
    }
  
    onNoClick(): void {
      this.dialogRef.close();
    }

}
