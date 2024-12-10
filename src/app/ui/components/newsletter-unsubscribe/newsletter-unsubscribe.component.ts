import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NewsletterService } from 'src/app/services/common/models/newsletter.service';
import {
  CustomToastrService,
  ToastrMessageType,
  ToastrPosition,
} from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-newsletter-unsubscribe',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './newsletter-unsubscribe.component.html',
  styleUrl: './newsletter-unsubscribe.component.scss',
})
export class NewsletterUnsubscribeComponent implements OnInit {
  email: string = '';
  loading: boolean = false;
  success: boolean = false;
  error: string = '';
  token: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newsletterService: NewsletterService,
    private toastrService: CustomToastrService
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.router.navigate(['/']);
      return;
    }
    this.token = token;
  }

  unsubscribe() {
    if (!this.email) return;

    this.loading = true;
    this.newsletterService.unsubscribe(this.email).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        this.toastrService.message(
          'Successfully unsubscribed from newsletter',
          'Success',
          {
            position: ToastrPosition.TopRight,
            toastrMessageType: ToastrMessageType.Success,
          }
        );
        setTimeout(() => this.router.navigate(['/']));
      },
      error: (err) => {
        this.toastrService.message('An error occurred', 'Error', {
          position: ToastrPosition.TopRight,
          toastrMessageType: ToastrMessageType.Error,
        });
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
