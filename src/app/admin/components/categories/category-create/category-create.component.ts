import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { CategoryService } from 'src/app/services/common/models/category.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategorycreateconfrimDialogComponent } from 'src/app/dialogs/categoryDialogs/categorycreateconfrim-dialog/categorycreateconfrim-dialog.component';
import { AlertifyService, MessageType, Position } from 'src/app/services/admin/alertify.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { CategoryCreate } from 'src/app/contracts/category/category-create';

@Component({
  selector: 'app-category-create',
  standalone: true,
  imports: [CommonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatButtonModule,ReactiveFormsModule,MatDialogModule,CategorycreateconfrimDialogComponent],
  templateUrl: './category-create.component.html',
  styleUrls: ['./category-create.component.scss']
})
export class CategoryCreateComponent extends BaseComponent implements OnInit {
  categoryForm: FormGroup;

  constructor(spinner: NgxSpinnerService,
              private categoryService: CategoryService,
              private fb: FormBuilder,
              public dialog: MatDialog,
              private alertifyService: AlertifyService,
              private toastrService: CustomToastrService) {
    super(spinner);
  }

  ngOnInit() {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      parentCategoryId: [''],
      featureIds: ['']
    });
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      this.openDialog(this.categoryForm.value);
    }
  }

  openDialog(formValue: any): void {
    const dialogRef = this.dialog.open(CategorycreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createCategory(formValue);
      }
    });
  }

  createCategory(formValue: any) {
    const create_category: CategoryCreate = {
      name: formValue.name,
      parentCategoryId: formValue.parentCategoryId ? formValue.parentCategoryId : null,
      featureIds: formValue.featureIds ? formValue.featureIds.split(',').map(id => id.trim()) : []
    };
  
    this.categoryService.create(create_category, () => {
      this.toastrService.message('Category created successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
    }, (error) => {
      this.toastrService.message(error, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    });
  }
}
