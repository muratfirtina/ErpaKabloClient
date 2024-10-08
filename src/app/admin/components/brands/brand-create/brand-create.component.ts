import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
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

@Component({
  selector: 'app-brand-create',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatDialogModule, BrandcreateconfrimDialogComponent],
  templateUrl: './brand-create.component.html',
  styleUrls: ['./brand-create.component.scss', '../../../../../styles.scss']
})
export class BrandCreateComponent extends BaseComponent implements OnInit {
  brandForm: FormGroup;
  selectedFile: File | null = null;

  constructor(
    spinner: NgxSpinnerService,
    private brandService: BrandService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private toastrService: CustomToastrService
  ) {
    super(spinner);
  }

  ngOnInit() {
    this.brandForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.brandForm.valid) {
      this.openDialog(this.brandForm.value.name);
    }
  }

  openDialog(formValue: any): void {
    const dialogRef = this.dialog.open(BrandcreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createBrand(formValue);
      }
    });
  }

  createBrand(name: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formData = new FormData();
    formData.append('name', name);
    if (this.selectedFile) {
      formData.append('BrandImage', this.selectedFile, this.selectedFile.name);
    }

    this.brandService.create(formData, () => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.toastrService.message(`Marka Başarıyla Oluşturuldu`, `${name}`, { toastrMessageType: ToastrMessageType.Success, position: ToastrPosition.TopRight });
    }, (error) => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.toastrService.message('Marka oluşturulurken bir hata oluştu', 'Hata', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    });
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
}