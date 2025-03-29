import { Component } from '@angular/core';

@Component({
  selector: 'app-offline',
  standalone: true,
  imports: [],
  templateUrl: './offline.component.html',
  styleUrl: './offline.component.scss'
})
export class OfflineComponent {
  retryConnection() {
    window.location.reload();
  }
}
