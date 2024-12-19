import { Directive, ElementRef, Input } from "@angular/core";

@Directive({
    selector: '[fetchpriority]',
    standalone: true
  })
  export class FetchPriorityDirective {
    @Input() set fetchpriority(value: 'high' | 'low' | 'auto') {
      this.el.nativeElement.fetchPriority = value;
    }
  
    constructor(private el: ElementRef) {}
  }