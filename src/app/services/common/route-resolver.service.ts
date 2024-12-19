import { inject } from '@angular/core';
import { ResolveFn, Router } from '@angular/router';

export interface RouteTypeData {
  type: 'product' | 'category' | 'brand';
}

export const routeTypeResolver: ResolveFn<RouteTypeData> = (route) => {
  const id = route.paramMap.get('id');
  const router = inject(Router);

  if (!id) {
    router.navigate(['/']);
    return { type: null };
  }

  if (id.includes('-p-')) {
    return { type: 'product' };
  } else if (id.includes('-c-')) {
    return { type: 'category' };
  } else {
    return { type: 'brand' };
  }
};