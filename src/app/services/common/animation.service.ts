import { Injectable } from '@angular/core';
import { AnimationBuilder, AnimationFactory, style, animate } from '@angular/animations';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  constructor(private builder: AnimationBuilder) {}

  createDrawerAnimation(isOpen: boolean): AnimationFactory {
    return this.builder.build([
      style({ transform: isOpen ? 'translateX(100%)' : 'translateX(0)' }),
      animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', 
        style({ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' })
      )
    ]);
  }

  createFadeAnimation(isVisible: boolean): AnimationFactory {
    return this.builder.build([
      style({ opacity: isVisible ? 0 : 1 }),
      animate('200ms ease-in-out', 
        style({ opacity: isVisible ? 1 : 0 })
      )
    ]);
  }

  createRippleEffect(event: MouseEvent, element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('div');
    
    ripple.className = 'ripple';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 1000);
  }
}