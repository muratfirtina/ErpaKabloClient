import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDynamicLoadComponent]',
  standalone: true
})
export class DynamicLoadComponentDirective {

  constructor(public viewContainerRef:ViewContainerRef) { }

}
