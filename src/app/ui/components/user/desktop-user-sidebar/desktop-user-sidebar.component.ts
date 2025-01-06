import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserService } from 'src/app/services/common/models/user.service';

@Component({
  selector: 'app-desktop-user-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './desktop-user-sidebar.component.html',
  styleUrl: './desktop-user-sidebar.component.scss'
})
export class DesktopUserSidebarComponent implements OnInit {
  userNameSurname: string | undefined;
  isLoading: boolean = true; 

  constructor(
    private router: Router,
    private userService: UserService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.isLoading = true;
      this.userService.getCurrentUser().then(user => {
        this.userNameSurname = user.nameSurname.toUpperCase();
        this.isLoading = false;
      }).catch(error => {
        console.error('Error getting current user:', error);
        this.isLoading = false;
      });
    } else {
      this.isLoading = false;
    }
  }

  navigateTo(path: string): void {
    this.router.navigate([`/${path}`]);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']); // Ana sayfaya yönlendir
  }
}