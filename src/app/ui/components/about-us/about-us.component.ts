import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { DownbarComponent } from '../downbar/downbar.component';
import { MainHeaderComponent } from '../main-header/main-header.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, MainHeaderComponent, NavbarComponent, DownbarComponent, FooterComponent],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.scss'
})
export class AboutUsComponent implements OnInit {

  ngOnInit(): void {
    
  }
}
