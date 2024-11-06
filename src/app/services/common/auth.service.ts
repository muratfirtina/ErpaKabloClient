import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { UserService } from "./models/user.service";
import { UserAuthService } from "./models/user-auth.service";
import { Router } from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAdmin: boolean = false;

  constructor(
    private jwtHelper: JwtHelperService,
    private userService: UserService,
    private userAuthService: UserAuthService,
    private router: Router
  ) { }

  /* async login(userNameOrEmail: string, password: string): Promise<void> {
    const tokenResponse = await this.userAuthService.login(userNameOrEmail, password);

    if (tokenResponse) {
      localStorage.setItem("accessToken", tokenResponse.accessToken);
      localStorage.setItem("refreshToken", tokenResponse.refreshToken);
    }
  } */

   async logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    _isAuthenticated = false;
    this._isAdmin = false;
    return new Promise<void>((resolve) => {
      this.router.navigate(['/'])
        .then(() => {
          window.location.href = '/'; // Tam sayfa yenileme
          resolve();
        });
    });
  }

  getUserNameSurname(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken ? decodedToken['NameSurname'] : null;  // NameSurname'i token'dan alıyoruz
  }

  async identityCheck(): Promise<void> {
    const token: string | null = localStorage.getItem("accessToken");

    let isExpired: boolean;
    try {
      isExpired = this.jwtHelper.isTokenExpired(token);
    } catch {
      isExpired = true;
    }

    _isAuthenticated = token != null && !isExpired;

    if (_isAuthenticated) {
      // Kullanıcının admin olup olmadığını kontrol et
      this._isAdmin = await this.userService.isAdmin(); // Asenkron admin kontrolü
    }
  }

  get isAuthenticated(): boolean {
    return _isAuthenticated;
  }

  get isAdmin(): boolean {
    return this._isAdmin;
  }
}

export let _isAuthenticated: boolean = false;