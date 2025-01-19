import { Directive, ElementRef, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LanguageService } from '../services/ui/language.service';

@Directive({
  selector: '[translate]',
  standalone: true
})
export class TranslateDirective implements OnInit, OnDestroy {
  @Input('translate') key: string;
  @Input('translateParams') params?: { [key: string]: string };
  
  private destroy$ = new Subject<void>();

  constructor(
    private el: ElementRef,
    private languageService: LanguageService
  ) {}

  ngOnInit() {
    this.updateTranslation();
    
    this.languageService.getCurrentLanguage()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateTranslation();
      });
  }

  private updateTranslation() {
    const translation = this.languageService.translate(this.key, this.params);
    this.el.nativeElement.textContent = translation;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}