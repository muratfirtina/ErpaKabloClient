// route-resolver.service.ts
import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../ui/custom-toastr.service';
import { SecurityService } from './security.service';


export interface RouteTypeData {
  type: 'product' | 'category' | 'brand' | null;
  expectedId?: string;
}

export const routeTypeResolver: ResolveFn<RouteTypeData> = (route) => {
  const id = route.paramMap.get('id');
  const router = inject(Router);
  const securityService = inject(SecurityService);
  const toastrService = inject(CustomToastrService);

  if (!id) {
    router.navigate(['/']);
    return { type: null };
  }

  const validation = securityService.validateRouteParam(id);

  if (!validation.isValid) {
    toastrService.message(
      "Geçersiz URL formatı.", 
      "Hata",
      {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      }
    );
    router.navigate(['/404']);
    return { type: null };
  }

  // URL'deki ID ile olması gereken ID eşleşmiyorsa
  if (id !== validation.expectedId) {
    // Doğru URL'ye yönlendir
    router.navigate([`/${validation.expectedId}`], {
      replaceUrl: true // Tarayıcı geçmişini kirletmemek için
    });
    return { type: null };
  }

  return { 
    type: validation.type,
    expectedId: validation.expectedId
  };
};