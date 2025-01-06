import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { CompanyAssetService } from 'src/app/services/admin/company-asset.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-company-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-logo.component.html',
  styleUrl: './company-logo.component.scss'
})
export class CompanyLogoComponent extends BaseComponent implements OnInit {
  currentLogoUrl: string = '';
  selectedFile: File | null = null;

  constructor(
    private companyAssetService: CompanyAssetService,
    private customToastrService: CustomToastrService,
    spinner: SpinnerService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.loadCurrentLogo();
  }

  async loadCurrentLogo() {
    try {
      const response = await this.companyAssetService.getLogo();
      this.currentLogoUrl = response.url;
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async uploadLogo() {
    if (!this.selectedFile) return;

    this.showSpinner(SpinnerType.BallSpinClockwise);

    try {
      const uploadMethod = this.currentLogoUrl ? 
        this.companyAssetService.updateLogo.bind(this.companyAssetService) : 
        this.companyAssetService.uploadLogo.bind(this.companyAssetService);

      await uploadMethod(
        this.selectedFile,
        () => {
          this.hideSpinner(SpinnerType.BallSpinClockwise);
          this.customToastrService.message(
            "Logo successfully " + (this.currentLogoUrl ? "updated" : "uploaded"), 
            "Success",
            {
              toastrMessageType: ToastrMessageType.Success,
              position: ToastrPosition.TopRight
            }
          );
          this.loadCurrentLogo();
          this.selectedFile = null;
        },
        (error) => {
          this.hideSpinner(SpinnerType.BallSpinClockwise);
          this.customToastrService.message(
            "An error occurred while " + (this.currentLogoUrl ? "updating" : "uploading") + " the logo",
            "Error",
            {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight
            }
          );
        }
      );
    } catch (error) {
      console.error('Error uploading logo:', error);
    }
  }
}