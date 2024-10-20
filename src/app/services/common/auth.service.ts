import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { UserService } from "./models/user.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAdmin: boolean = false;

  constructor(
    private jwtHelper: JwtHelperService,
    private userService: UserService
  ) { }

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