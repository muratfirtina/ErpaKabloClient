import { Component } from '@angular/core';
import { MainHeaderComponent } from '../main-header/main-header.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MainHeaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

}
