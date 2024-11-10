// base-drawer.component.ts
import { Component, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent } from 'src/app/base/base/base.component';
import { AnimationService } from 'src/app/services/common/animation.service';
import { ThemeService } from 'src/app/services/common/theme.service';

@Component({
  template: ''
})
export abstract class BaseDrawerComponent extends BaseComponent{
  @Input() isOpen = false;
  @Output() closeDrawer = new EventEmitter<void>();
  @Input() closeOnEscape = true;
  @Input() closeOnOutsideClick = true;

  protected constructor(
    spinner: NgxSpinnerService,
    protected elementRef: ElementRef,
    protected animationService: AnimationService,
    protected themeService: ThemeService
  ) {
    super(spinner);
    this.themeService.getCurrentTheme().subscribe(theme => {
      this.updateThemeClasses(theme.isDark);
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent) {
    if (this.closeOnEscape && this.isOpen) {
      event.preventDefault();
      this.close();
    }
  }

  @HostListener('click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    if (this.closeOnOutsideClick && 
        this.isOpen && 
        clickedElement.classList.contains('drawer-backdrop')) {
      this.close();
    }
  }

  protected close() {
    const drawerElement = this.elementRef.nativeElement.querySelector('.drawer');
    if (drawerElement) {
      // Kapanma animasyonunu başlat
      const animation = this.animationService.createDrawerAnimation(false);
      const player = animation.create(drawerElement);
      
      player.onDone(() => {
        this.closeDrawer.emit();
        player.destroy();
      });
      
      player.play();
    } else {
      this.closeDrawer.emit();
    }
  }

  protected open() {
    const drawerElement = this.elementRef.nativeElement.querySelector('.drawer');
    if (drawerElement) {
      // Açılma animasyonunu başlat
      const animation = this.animationService.createDrawerAnimation(true);
      const player = animation.create(drawerElement);
      player.play();
    }
  }

  protected updateThemeClasses(isDark: boolean) {
    const drawerElement = this.elementRef.nativeElement.querySelector('.drawer');
    const backdropElement = this.elementRef.nativeElement.querySelector('.drawer-backdrop');

    if (drawerElement) {
      if (isDark) {
        drawerElement.classList.add('dark-theme');
      } else {
        drawerElement.classList.remove('dark-theme');
      }
    }

    if (backdropElement) {
      if (isDark) {
        backdropElement.classList.add('dark-theme');
      } else {
        backdropElement.classList.remove('dark-theme');
      }
    }
  }

  protected addRippleEffect(event: MouseEvent) {
    const element = event.currentTarget as HTMLElement;
    if (element) {
      this.animationService.createRippleEffect(event, element);
    }
  }
}