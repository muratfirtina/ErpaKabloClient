import { Component, OnInit } from '@angular/core';

interface CompanyInfo {
  Logo: string;
  Name: string;
  Address: string;
  Phone: string;
  Email: string;
  SocialMedia: {
    Facebook: string;
    Twitter: string;
    LinkedIn: string;
    Whatsapp: string;
  };
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  
  companyInfo: CompanyInfo = {
    Logo: "assets/images/logo.png",
    Name: "TUMdex",
    Address: "Örnek Mahallesi, Örnek Sokak No:1, İstanbul",
    Phone: "+90 212 XXX XX XX",
    Email: "global@tumtrading.com",
    SocialMedia: {
      Facebook: "https://facebook.com/tumtrading",
      Twitter: "https://twitter.com/tumtrading",
      LinkedIn: "https://linkedin.com/company/tumtrading",
      Whatsapp: "" // Whatsapp linkinizi buraya ekleyin
    }
  };

  constructor() { }

  ngOnInit(): void { }
}