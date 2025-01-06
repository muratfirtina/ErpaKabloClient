import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BrandcreateconfrimDialogComponent } from 'src/app/dialogs/brandDialogs/brandcreateconfrim-dialog/brandcreateconfrim-dialog.component';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FileUploadDialogComponent } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';
import { Router } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-brand-create',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './brand-create.component.html',
  styleUrls: ['./brand-create.component.scss', '../../../../../styles.scss']
})
export class BrandCreateComponent extends BaseComponent implements OnInit {
  brandForm: FormGroup;
  selectedFile: File | null = null;

  constructor(
    spinner: SpinnerService,
    private brandService: BrandService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private router: Router,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.brandForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  async onSubmit() {
    if (this.brandForm.valid) {
      await this.openDialog(this.brandForm.value.name);
    }
  }

  async openDialog(formValue: any): Promise<void> {
    const dialogRef = this.dialog.open(BrandcreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result) {
        await this.createBrand(formValue);
      }
    });
  }

  async createBrand(name: string) {
    // Disable form and button interaction
    this.brandForm.disable();
    const dialogButtons = document.querySelectorAll('button');
    dialogButtons.forEach(button => button.disabled = true);
   
    // Show spinner before starting the operation
    this.showSpinner(SpinnerType.BallSpinClockwise);
   
    const formData = new FormData();
    formData.append('name', name);
    if (this.selectedFile) {
      formData.append('BrandImage', this.selectedFile, this.selectedFile.name);
    }
   
    try {
      await this.brandService.create(formData, 
        () => {
          // Success callback
          this.toastrService.message(
            `Marka Başarıyla Oluşturuldu`,
            `${name}`,
            {
              toastrMessageType: ToastrMessageType.Success,
              position: ToastrPosition.TopRight
            }
          );
        },
        errorMessage => {
          // Error callback
          this.toastrService.message(
            'Marka oluşturulurken bir hata oluştu',
            'Hata',
            {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight
            }
          );
        }
      );
    } finally {
      // Re-enable form and button interaction
      this.brandForm.enable();
      dialogButtons.forEach(button => button.disabled = false);
      // Hide spinner after operation completes
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  openFileUploadDialog(): void {
    const dialogRef = this.dialog.open(FileUploadDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.length > 0) {
        this.selectedFile = result[0];
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/brands/brand-list']);
  }
}