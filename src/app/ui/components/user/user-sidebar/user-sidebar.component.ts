import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserService } from 'src/app/services/common/models/user.service';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-sidebar.component.html',
  styleUrl: './user-sidebar.component.scss'
})
export class UserSidebarComponent implements OnInit {

  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  userNameSurname: string | undefined;

  constructor(
    private router: Router,
    private userService: UserService,
    public authService: AuthService // public yapıldı ki template'de kullanabilelim
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated) {
      this.userService.getCurrentUser().then(user => {
        this.userNameSurname = user.nameSurname.toUpperCase();
      }).catch(error => {
        console.error('Error getting current user:', error);
      });
    }
  }

  close() {
    this.closeSidebar.emit();
  }

  navigateTo(path: string): void {
    this.router.navigate([`/${path}`]);
    this.close(); // Yönlendirme sonrası sidebar'ı kapat
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
    this.close();
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
    this.close();
  }

  logout(): void {
    this.authService.logout();
    this.close(); // Çıkış yapınca sidebar'ı kapat
    this.router.navigate(['/']); // Ana sayfaya yönlendir
  }
}