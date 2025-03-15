import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/common/auth.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

// Import Bootstrap Modal
declare var bootstrap: any;

@Component({
  selector: 'app-desktop-user-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './desktop-user-sidebar.component.html',
  styleUrl: './desktop-user-sidebar.component.scss'
})
export class DesktopUserSidebarComponent implements OnInit, AfterViewInit {
  userNameSurname: string | undefined;
  isLoading: boolean = true;
  isLoggingOut: boolean = false;

  // Modal references
  private logoutModal: any;
  private logoutAllDevicesModal: any;

  constructor(
    private router: Router,
    private userService: UserService,
    public authService: AuthService,
    private toastrService: CustomToastrService
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

  ngAfterViewInit(): void {
    // Initialize Bootstrap modals after view init
    this.initModals();
  }

  // Initialize Bootstrap modals
  initModals(): void {
    // Get modal elements
    const logoutModalEl = document.getElementById('desktopLogoutModal');
    const logoutAllDevicesModalEl = document.getElementById('desktopLogoutAllDevicesModal');

    // Create Bootstrap modal instances if elements exist
    if (logoutModalEl) {
      this.logoutModal = new bootstrap.Modal(logoutModalEl);
    }

    if (logoutAllDevicesModalEl) {
      this.logoutAllDevicesModal = new bootstrap.Modal(logoutAllDevicesModalEl);
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

  // Show the logout confirmation modal
  showLogoutModal(): void {
    if (this.logoutModal) {
      this.logoutModal.show();
    }
  }

  // Show the logout from all devices confirmation modal
  showLogoutAllDevicesModal(): void {
    if (this.logoutAllDevicesModal) {
      this.logoutAllDevicesModal.show();
    }
  }

  // Confirm regular logout
  confirmLogout(): void {
    this.authService.logout();
    if (this.logoutModal) {
      this.logoutModal.hide();
    }
    this.router.navigate(['/']); // Navigate to home page
  }

  // Confirm logout from all devices
  async confirmLogoutFromAllDevices(): Promise<void> {
    try {
      // Show loading state
      this.isLoggingOut = true;
      
      // Show process message
      this.toastrService.message('Logging out from all devices...', 'Process in Progress', {
        toastrMessageType: ToastrMessageType.Info,
        position: ToastrPosition.TopRight,
      });
      
      // Perform logout operation
      console.log("Initiating logout from all devices...");
      const success = await this.authService.logoutFromAllDevices();
      
      if (success) {
        console.log("Logout from all devices successful, redirecting to login page...");
        
        // Hide the modal
        if (this.logoutAllDevicesModal) {
          this.logoutAllDevicesModal.hide();
        }
        
        this.router.navigate(['/login']);
      } else {
        console.error("Logout from all devices failed");
        this.toastrService.message('Could not log out from all devices. Please try again.', 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight,
        });
      }
    } catch (error) {
      console.error('An error occurred while logging out from all devices:', error);
      this.toastrService.message('An error occurred while logging out from all devices', 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight,
      });
    } finally {
      // Close loading state
      this.isLoggingOut = false;
    }
  }
}