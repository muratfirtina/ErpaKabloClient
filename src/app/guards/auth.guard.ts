import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';

export const authGuard: CanActivateFn = async (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastrService = inject(CustomToastrService);

  // Token kontrolü
  const token = localStorage.getItem("accessToken");

  // Token yoksa, login sayfasına yönlendir
  if (!token) {
    router.navigate(["login"], { queryParams: { returnUrl: state.url } });
    toastrService.message("Oturum açmanız gerekiyor.", "Yetkisiz Erişim", {
      toastrMessageType: ToastrMessageType.Warning,
      position: ToastrPosition.TopRight
    });
    return false;
  }

  // Kullanıcı giriş kontrolü ve admin kontrolü
  await authService.identityCheck();

  // Kullanıcı giriş yapmışsa ve admin kontrolü gerekiyorsa
  if (authService.isAuthenticated) {
    if (route.data && route.data['Admin'] && !authService.isAdmin) {
      toastrService.message("Yalnızca admin yetkisine sahip kullanıcılar erişebilir.", "Yetkisiz Erişim", {
        toastrMessageType: ToastrMessageType.Warning,
        position: ToastrPosition.TopRight
      });
      router.navigate(['/unauthorized']);  // Yetkisiz erişim sayfasına yönlendir
      return false;
    }

    return true;  // Yetki varsa sayfaya erişim izni ver
  } else {
    // Eğer giriş yapılmamışsa login sayfasına yönlendir
    router.navigate(["login"], { queryParams: { returnUrl: state.url } });
    toastrService.message("Oturum açmanız gerekiyor.", "Yetkisiz Erişim", {
      toastrMessageType: ToastrMessageType.Warning,
      position: ToastrPosition.TopRight
    });
    return false;
  }
};