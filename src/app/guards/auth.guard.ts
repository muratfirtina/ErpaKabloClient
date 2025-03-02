import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { TokenService } from '../services/common/token.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from '../services/ui/custom-toastr.service';
import { Roles } from '../contracts/user/roles';
import { RouteData } from '../contracts/route-data';

export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot & { data: RouteData }, 
  state: RouterStateSnapshot
) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);
  const toastrService = inject(CustomToastrService);

  try {
    // Token varlığını ve geçerliliğini kontrol et
    const isValid = await tokenService.ensureValidToken();
    
    if (!isValid) {
      router.navigate(["login"], { queryParams: { returnUrl: state.url } });
      toastrService.message(
        "You need to login to access this page.", 
        "Authentication Required",
        {
          toastrMessageType: ToastrMessageType.Warning,
          position: ToastrPosition.TopRight
        }
      );
      return false;
    }

    // Rol tabanlı yetkilendirme
    if (route.data && route.data[Roles.ADMIN]) {
      const isAdmin = tokenService.hasRole('Admin');
      if (!isAdmin) {
        toastrService.message(
          "Admin privileges required to access this page.", 
          "Access Denied",
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
  } catch (error) {
    console.error('Auth guard error:', error);
    
    toastrService.message(
      "An error occurred while checking your access permissions.", 
      "Error",
      {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      }
    );
    
    return false;
  }
};