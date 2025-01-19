import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';
import { Roles } from '../constants/roles';
import { RouteData } from '../contracts/route-data';
import { SecurityService } from '../services/common/security.service';
import { JwtHelperService } from "@auth0/angular-jwt";

export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot & { data: RouteData }, 
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastrService = inject(CustomToastrService);
  const jwtHelper = inject(JwtHelperService);

  try {
    // Token kontrolü
    const token = authService.getToken();

    if (!token) {
      router.navigate(["login"], { queryParams: { returnUrl: state.url } });
      toastrService.message(
        "Oturum açmanız gerekiyor.", 
        "Yetkisiz Erişim",
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
      return false;
    }

    // Token süresi kontrolü
    if (jwtHelper.isTokenExpired(token)) {
      // Token yenileme denemesi
      const refreshSuccess = await authService.refreshToken();
      if (!refreshSuccess) {
        await authService.logout(); // AuthService'deki logout metodunu kullan
        return false;
      }
    }

    // Kullanıcı giriş kontrolü
    await authService.identityCheck();

    if (authService.isAuthenticated) {
      // Admin sayfası için yetki kontrolü
      if (route.data && route.data[Roles.ADMIN]) {
        const isAdmin = authService.isAdmin;
        if (!isAdmin) {
          toastrService.message(
            "Yalnızca admin yetkisine sahip kullanıcılar erişebilir.", 
            "Yetkisiz Erişim",
            {
              toastrMessageType: ToastrMessageType.Warning,
              position: ToastrPosition.TopRight
            }
          );
          router.navigate(['/unauthorized']);
          return false;
        }
      }

      return true;
    } else {
      router.navigate(["login"], { queryParams: { returnUrl: state.url } });
      toastrService.message(
        "Oturum açmanız gerekiyor.", 
        "Yetkisiz Erişim",
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
      return false;
    }
  } catch (error) {
    console.error('Auth guard error:', error);
    toastrService.message(
      "Bir hata oluştu.", 
      "Hata",
      {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      }
    );
    return false;
  }
};