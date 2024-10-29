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

  async logout() {
    try {
      const result = await this.userAuthService.logout();
      if (result) {
        this._isAdmin = false;
        _isAuthenticated = false;
        await this.router.navigate(["/"]);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
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