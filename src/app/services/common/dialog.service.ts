import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { DialogPosition, MatDialog } from '@angular/material/dialog';
import { DeleteDialogState } from 'src/app/dialogs/delete-dialog/delete-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  private isDialogOpen = false;

  constructor(private dialog:MatDialog) { }


  openDialog(dialogParameters: Partial<DialogParameters>): void {
    const dialogRef = this.dialog.open(dialogParameters.componentType, {
      width: dialogParameters.options?.width,
      height: dialogParameters.options?.height,
      position: dialogParameters.options?.position,
      data: dialogParameters.data,
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (dialogParameters.afterClosed) {
        dialogParameters.afterClosed(result);
      }
    });
  }

  closeDialog(): void {
    this.dialog.closeAll();
    this.isDialogOpen = false;
  }
}

export class DialogParameters {
  componentType: ComponentType<any>;
  data?: any;
  afterClosed?: (result: any) => void;
  options?: Partial<DialogOptions>;
}

export class DialogOptions {
  width?: string;
  height?: string;
  position?: any;
}


