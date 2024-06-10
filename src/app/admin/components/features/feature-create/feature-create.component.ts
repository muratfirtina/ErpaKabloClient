import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FeaturecreateconfrimDialogComponent } from 'src/app/dialogs/featureDialogs/featurecreateconfrim-dialog/featurecreateconfrim-dialog.component';
import { AlertifyService, MessageType, Position } from 'src/app/services/admin/alertify.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeatureCreate } from 'src/app/contracts/feature/feature-create';

@Component({
  selector: 'app-feature-create',
  standalone: true,
  imports: [CommonModule,MatCardModule,MatFormFieldModule,MatInputModule,MatButtonModule,ReactiveFormsModule,MatDialogModule,FeaturecreateconfrimDialogComponent],
  templateUrl: './feature-create.component.html',
  styleUrls: ['./feature-create.component.scss']
})
export class FeatureCreateComponent extends BaseComponent implements OnInit {
  featureForm: FormGroup;

  constructor(spinner: NgxSpinnerService,
              private featureService: FeatureService,
              private fb: FormBuilder,
              public dialog: MatDialog,
              private alertifyService: AlertifyService,
              private toastrService: CustomToastrService) {
    super(spinner);
  }

  ngOnInit() {
    this.featureForm = this.fb.group({
      name: ['', Validators.required],
      categoryIds: ['']
    });
  }

  onSubmit() {
    if (this.featureForm.valid) {
      this.openDialog(this.featureForm.value);
    }
  }

  openDialog(formValue: any): void {
    const dialogRef = this.dialog.open(FeaturecreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createFeature(formValue);
      }
    });
  }

  createFeature(formValue: any) {
    const create_feature: FeatureCreate = {
      name: formValue.name,
      categoryIds: formValue.categoryIds ? formValue.categoryIds.split(',').map(id => id.trim()) : [],
    };
  
    this.featureService.create(create_feature, () => {
      this.toastrService.message('Feature created successfully', 'Success', {
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
