import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appA11y]',
  standalone: true
})
export class A11yDirective implements OnInit {
  @Input() role?: string;
  @Input() label?: string;
  @Input() description?: string;
  @Input() keyboardShortcut?: string;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    const element = this.el.nativeElement;

    // ARIA roller ve etiketler
    if (this.role) {
      element.setAttribute('role', this.role);
    }
    if (this.label) {
      element.setAttribute('aria-label', this.label);
    }
    if (this.description) {
      element.setAttribute('aria-description', this.description);
    }

    // Klavye kısayolları
    if (this.keyboardShortcut) {
      element.setAttribute('accesskey', this.keyboardShortcut);
    }

    // Temel erişilebilirlik özellikleri
    if (element.tagName === 'BUTTON' && !element.getAttribute('type')) {
      element.setAttribute('type', 'button');
    }

    // Etkileşimli elementler için focus ring
    if (
      element.tagName === 'BUTTON' ||
      element.tagName === 'A' ||
      element.tagName === 'INPUT'
    ) {
      element.classList.add('focus-visible');
    }
  }
}