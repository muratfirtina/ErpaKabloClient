import { Injectable } from "@angular/core";
import { JwtHelperService } from "@auth0/angular-jwt";
import { UserService } from "./models/user.service";
import { UserAuthService } from "./models/user-auth.service";
import { Router } from "@angular/router";
import { BehaviorSubject } from 'rxjs';
import { StoreService } from './store.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private _isAdmin: boolean = false;
  private authStateSubject = new BehaviorSubject<boolean>(false);
  authState$ = this.authStateSubject.asObservable();

  constructor(
    private jwtHelper: JwtHelperService,
    private userService: UserService,
    private userAuthService: UserAuthService,
    private router: Router,
    private store: StoreService
  ) {
    // Constructor'da initial auth check
    this.checkAuthState();
  }

  private async checkAuthState() {
    await this.identityCheck();
    this.authStateSubject.next(_isAuthenticated);
    
    if (_isAuthenticated) {
      // Kullanıcı bilgilerini yükle
      try {
        const user = await this.userService.getCurrentUser();
        this.store.update('user', {
          isAuthenticated: true,
          data: user
        });
      } catch (error) {
        console.error('Error loading user data:', error);
        this.logout();
      }
    }
  }

  async getUserRoles(): Promise<string[]> {
    const token = localStorage.getItem('accessToken');
    if (!token) return [];

    try {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken ? decodedToken['Roles'] : [];
    } catch {
      return [];
    }
  }

  async identityCheck(): Promise<boolean> {
    const token: string | null = localStorage.getItem("accessToken");

    if (!token) {
      _isAuthenticated = false;
      return false;
    }

    try {
      const isExpired = this.jwtHelper.isTokenExpired(token);
      _isAuthenticated = !isExpired;

      if (_isAuthenticated) {
        this._isAdmin = await this.userService.isAdmin();
      }

      return _isAuthenticated;
    } catch (error) {
      console.error('Token validation error:', error);
      _isAuthenticated = false;
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) return false;

    try {
      const response = await this.userAuthService.refreshTokenLogin(refreshToken);
      if (response && response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        if (response.refreshToken) {
          localStorage.setItem("refreshToken", response.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    _isAuthenticated = false;
    this._isAdmin = false;
    
    this.authStateSubject.next(false);
    this.store.update('user', {
      isAuthenticated: false,
      data: null
    });
    await this.router.navigate(['/']);
    if(this.router.url === '/') {
      window.location.reload();
    }
  }

  getUserNameSurname(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const decodedToken = this.jwtHelper.decodeToken(token);
      return decodedToken ? decodedToken['NameSurname'] : null;
    } catch {
      return null;
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