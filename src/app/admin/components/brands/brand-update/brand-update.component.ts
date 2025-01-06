import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { Brand } from 'src/app/contracts/brand/brand';
import { FileUploadDialogComponent } from 'src/app/dialogs/file-upload-dialog/file-upload-dialog.component';
import { BrandService } from 'src/app/services/common/models/brand.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-brand-update',
  standalone: true,
  imports: [CommonModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    ReactiveFormsModule, 
    MatDialogModule],
  templateUrl: './brand-update.component.html',
  styleUrl: './brand-update.component.scss'
})
export class BrandUpdateComponent extends BaseComponent implements OnInit {
  brandForm: FormGroup;
  selectedFile: File | null = null;
  brandId: string;
  isSubmitting: boolean = false;
  currentBrand: Brand;

  constructor(
    spinner: SpinnerService,
    private brandService: BrandService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastrService: CustomToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super(spinner);
    this.brandForm = this.fb.group({
      name: ['', Validators.required],
    });
  }

  async ngOnInit() {
    this.showSpinner(SpinnerType.BallSpinClockwise);
    
    this.brandId = this.route.snapshot.paramMap.get('id');
    if (!this.brandId) {
      this.toastrService.message(
        'Brand ID not found',
        'Error',
        { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight }
      );
      this.router.navigate(['/admin/brands/brand-list']);
      return;
    }

    try {
      this.currentBrand = await this.brandService.getById(this.brandId);
      this.brandForm.patchValue({
        name: this.currentBrand.name
      });
    } catch (error) {
      this.toastrService.message(
        'Error loading brand',
        'Error',
        { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight }
      );
      this.router.navigate(['/admin/brands/brand-list']);
    } finally {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    }
  }

  async onSubmit() {
    if (this.brandForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.showSpinner(SpinnerType.BallSpinClockwise);

      const formData = new FormData();
      formData.append('id', this.brandId);
      formData.append('name', this.brandForm.get('name').value);
      
      // Sadece yeni bir resim seçildiyse eklenir
      if (this.selectedFile) {
        formData.append('BrandImage', this.selectedFile);
      }

      try {
        await this.brandService.update(formData, 
          () => {
            this.toastrService.message(
              'Brand updated successfully',
              'Success',
              { toastrMessageType: ToastrMessageType.Success, position: ToastrPosition.TopRight }
            );
            this.router.navigate(['/admin/brands']);
          },
          errorMessage => {
            this.toastrService.message(
              errorMessage,
              'Error',
              { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight }
            );
          }
        );
      } finally {
        this.isSubmitting = false;
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      }
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
    this.router.navigate(['/admin/brands']);
  }
}