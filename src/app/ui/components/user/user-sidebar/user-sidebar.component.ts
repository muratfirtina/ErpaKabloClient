import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/common/models/user.service';

@Component({
  selector: 'app-user-sidebar',
  standalone: true,
  imports: [],
  templateUrl: './user-sidebar.component.html',
  styleUrl: './user-sidebar.component.scss'
})
export class UserSidebarComponent implements OnInit {
  constructor(private router: Router,
    private userService: UserService ) {}

  userNameSurname: string | undefined;

  ngOnInit(): void {
    // Kullanıcı bilgilerini API'den al ve NameSurname'i ayarla
    this.userService.getCurrentUser().then(user => {
      this.userNameSurname = user.nameSurname.toUpperCase();
    }
    ).catch(error => {
      console.error('Error getting current user:', error);
    });

  }

  // Yönlendirme fonksiyonu
  navigateTo(path: string): void {
    this.router.navigate([`/${path}`]);
  }

  // Çıkış yapma işlemi
  logout(): void {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }
}