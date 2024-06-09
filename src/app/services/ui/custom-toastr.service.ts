import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class CustomToastrService {

  constructor(private toastr: ToastrService) { }

  message(message: string, title: string, toastrOption: Partial<ToastrOptions>) {
    this.toastr[toastrOption.toastrMessageType](message, title, {
      enableHtml: true,
      positionClass: toastrOption.position
    });
  }
}
export class ToastrOptions {
  toastrMessageType: ToastrMessageType;
  position: ToastrPosition;
}

export enum ToastrMessageType {
  Success= "success",
  Error = "error",
  Warning = "warning",
  Info = "info"
}

export enum ToastrPosition {
  TopRight = "toast-top-right",
  TopLeft = "toast-top-left",
  TopCenter = "toast-top-center",
  TopFullWidth = "toast-top-full-width",
  TopFullWidthCenter = "toast-top-full-width-center",
  BottomRight = "toast-bottom-right",
  BottomLeft = "toast-bottom-left",
  BottomCenter = "toast-bottom-center",
  BottomFullWidth = "toast-bottom-full-width",
  BottomFullWidthCenter = "toast-bottom-full-width-center"
}