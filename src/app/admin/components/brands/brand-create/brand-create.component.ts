import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { BrandService } from 'src/app/services/common/models/brand.service';

@Component({
  selector: 'app-brand-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './brand-create.component.html',
  styleUrls: ['./brand-create.component.scss']
})
export class BrandCreateComponent extends BaseComponent implements OnInit{

  constructor(spinner:NgxSpinnerService, private brandService: BrandService) {
    super(spinner);
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  createBrand(name: string){
    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.brandService.create({name: name}, (data) => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }, (error) => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }

}
