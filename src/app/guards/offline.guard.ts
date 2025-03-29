// offline.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { OnlineStatusService } from '../services/common/online-status.service';

export const offlineGuard: CanActivateFn = (route, state) => {
  const onlineStatusService = inject(OnlineStatusService);
  const router = inject(Router);
  
  // Eğer kullanıcı çevrimdışıysa, offline sayfasına yönlendir
  if (!onlineStatusService.isOnline()) {
    // Zaten offline sayfasındaysak, tekrar yönlendirme yapma
    if (router.url !== '/offline') {
      router.navigate(['/offline']);
    }
    return false;
  }
  
  return true;
};