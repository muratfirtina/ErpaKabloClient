import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { UserService } from './models/user.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAdmin: boolean = false;

  constructor(
    private jwtHelper: JwtHelperService,
    private userService: UserService
  ) { }

  async identityCheck() {
    const token: string = localStorage.getItem("accessToken");

    let isExpired: boolean;
    try {
      isExpired = this.jwtHelper.isTokenExpired(token);
    } catch {
      isExpired = true;
    }

    _isAuthenticated = token != null && !isExpired;

    if (_isAuthenticated) {
      await this.checkAdminRole();
    }
  }

  

  private async checkAdminRole() {
    const userId = this.getUserId();
    console.log(userId);
    if (userId) {
      const roles = await this.userService.getRolesToUser(userId);
      this._isAdmin = roles.some(role => role.name === 'admin');
    }
  }

  private getUserId(): string | null {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken?.sub; // JWT'deki user id claim'i
    }
    return null;
  }

  get isAuthenticated(): boolean {
    return _isAuthenticated;
  }

  get isAdmin(): boolean {
    return this._isAdmin;
  }
}

export let _isAuthenticated: boolean;