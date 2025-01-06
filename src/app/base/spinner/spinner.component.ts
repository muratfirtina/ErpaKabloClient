import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss'
})
export class SpinnerComponent implements OnInit {
  @Input() spinnerType: string = 's1';
  @Input() showOverlay: boolean = true;  // Yeni input ekleyelim
  loading$!: Observable<boolean>;

  constructor(private spinner: SpinnerService) {}

  ngOnInit() {
    this.loading$ = this.spinner.getSpinner(this.spinnerType);
  }
}
