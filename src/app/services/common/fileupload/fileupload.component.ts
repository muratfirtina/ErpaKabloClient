import { HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base/base.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../../ui/custom-toastr.service';
import { DialogService } from '../dialog.service';
import { HttpClientService } from '../http-client.service';
import { FileUploadDialogComponent, FileUploadDialogState } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';
import { NgxFileDropEntry, NgxFileDropModule } from 'ngx-file-drop';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fileupload',
  standalone: true,
  imports: [CommonModule,NgxFileDropModule],
  templateUrl: './fileupload.component.html',
  styleUrl: './fileupload.component.scss'
})
export class FileuploadComponent {
  constructor(
    private httpClientService:HttpClientService,
    private customToastrService: CustomToastrService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private spinner:NgxSpinnerService
    ) {}

  public files: NgxFileDropEntry[];
  
  @Input() options: Partial<FileUploadOptions>

  public selectedFiles(files: NgxFileDropEntry[]) {

    this.files = files;
    const fileData: FormData = new FormData();
    for (const file of files) {
      (file.fileEntry as FileSystemFileEntry).file((_file: File) => {
        fileData.append(_file.name, _file, file.relativePath);
      });
    }

    this.dialogService.openDialog({
      componentType: FileUploadDialogComponent,
      data: FileUploadDialogState.Yes,
      afterClosed:() => {
          this.spinner.show(SpinnerType.BallSpinClockwise);
          this.httpClientService.post({
    
            controller: this.options.controller,
            action: this.options.action,
            queryString: this.options.queryString,
            headers: new HttpHeaders({"responseType": "blob"})
            
          }, fileData).subscribe({
    
            next: (data) =>{
      
            const message :string = "File uploaded successfully"
            this.spinner.hide(SpinnerType.BallSpinClockwise);
      
              /* if(this.options.isAdminPage){
                this.alertifyService.message(message,{
                  dismissOthers: true,
                  messageType: MessageType.Success,
                  position: Position.TopRight
                })
                
              } else{
                this.customToastrService.message(message, "Success" ,{
                  toastrMessageType: ToastrMessageType.Success,
                  position:ToastrPosition.TopRight
                })
                
              } */
              
            }, error: (error: HttpErrorResponse) => {
      
            const message :string = "File upload failed"
      
            this.spinner.hide(SpinnerType.BallSpinClockwise);
            /* if(this.options.isAdminPage){
                this.customToastrService.message(message, "Failed" ,{
                  toastrMessageType: ToastrMessageType.Error,
                  position:ToastrPosition.TopRight
                })
                
              } else{
      
                this.customToastrService.message(message, "Failed" ,{
                  toastrMessageType: ToastrMessageType.Error,
                  position:ToastrPosition.TopRight
                })
                
              } */
          }});
        }

    });
    
  }

  // openDialog(afterClosed: any): void {
  //   const dialogRef = this.dialog.open(FileUploadDialogComponent, {
  //     data: FileUploadDialogState.Yes,
  //   });

  //   dialogRef.afterClosed().subscribe((result) => {
  //     if (result == FileUploadDialogState.Yes) afterClosed();
  //   });
  // }

  
}
export class FileUploadOptions {
  controller?: string;
  action?: string;
  queryString?: string;
  explanation?: string;
  acceptedFileTypes?: string;
  //isAdminPage?: boolean = false;

}
