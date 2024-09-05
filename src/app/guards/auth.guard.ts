import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from '../base/base/base.component';
import { _isAuthenticated } from '../services/common/auth.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot,state: RouterStateSnapshot) => {

  const jwtHelper = inject(JwtHelperService);
  const router = inject(Router);
  const toastrService = inject(CustomToastrService);

  const token = localStorage.getItem("accessToken");

  if (!token) {
    router.navigate(["login"], { queryParams: { returnUrl: state.url } });
    toastrService.message("Oturum açmanız gerekiyor.", "Yetkisiz Erişim", {
      toastrMessageType: ToastrMessageType.Warning,
      position: ToastrPosition.TopRight
    });
    return false;
  }

  if (jwtHelper.isTokenExpired(token)) {
    localStorage.removeItem("accessToken");
    router.navigate(["login"], { queryParams: { returnUrl: state.url } });
    toastrService.message("Oturumunuz süresi dolmuş.", "Yetkisiz Erişim", {
      toastrMessageType: ToastrMessageType.Warning,
      position: ToastrPosition.TopRight
    });
    return false;
  }

  return true;
};