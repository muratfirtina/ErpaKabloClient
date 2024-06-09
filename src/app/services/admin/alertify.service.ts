import { Injectable } from '@angular/core';
import * as alertify from 'alertifyjs';

@Injectable({
  providedIn: 'root'
})
export class AlertifyService {

  constructor() { }

  message(message: string, options: Partial<AlertifyOptions>) {
    alertify.set("notifier", "delay", options.delay);
    alertify.set("notifier", "position", options.position);
    const msj = alertify[options.messageType](message);
    if(options.dismissOthers){
      msj.dismissOthers();
    }

  }
  dismissAll(){
    alertify.dismissAll();
  }

}
export class AlertifyOptions{
  messageType:MessageType = MessageType.Message;
  position:Position = Position.BottomRight;
  delay:number = 3;
  dismissOthers:boolean = false;
}

export enum MessageType{
  Success = "success",
  Error = "error",
  Warning = "warning",
  Message = "message",
  Notify = "notify"
}

export enum Position{
  TopLeft = "top-left",
  TopCenter = "top-center",
  TopRight = "top-right",
  BottomLeft = "bottom-left",
  BottomCenter = "bottom-center",
  BottomRight = "bottom-right"

}



