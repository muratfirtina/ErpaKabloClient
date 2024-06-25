import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeaturevalueCreate } from 'src/app/contracts/featurevalue/featurevalue-create';
import { MatSelectModule } from '@angular/material/select';
import { Feature } from 'src/app/contracts/feature/feature';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { MatRadioModule } from '@angular/material/radio';
import { FeaturevaluecreateconfrimDialogComponent } from 'src/app/dialogs/featureValueDialogs/featurevaluecreateconfrim-dialog/featurevaluecreateconfrim-dialog.component';

@Component({
  selector: 'app-featurevalue-create',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatDialogModule, MatSelectModule, MatRadioModule],
  templateUrl: './featurevalue-create.component.html',
  styleUrls: ['./featurevalue-create.component.scss']
})
export class FeaturevalueCreateComponent extends BaseComponent implements OnInit {
  featurevalueForm: FormGroup;
  features: Feature[] = [];

  constructor(spinner: NgxSpinnerService,
    private featurevalueService: FeaturevalueService,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private featureService: FeatureService,
    private toastrService: CustomToastrService) {
    super(spinner);
  }

  ngOnInit() {
    this.featurevalueForm = this.fb.group({
      name: ['', Validators.required],
      featureId: ['', Validators.required]
    });

    this.loadFeatures();
  }

  loadFeatures() {
    this.featureService.list({ pageIndex: -1, pageSize: -1 }).then(data => {
      this.features = data.items;
    }).catch(error => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    });
  }

  onSubmit() {
    if (this.featurevalueForm.valid) {
      this.openDialog(this.featurevalueForm.value.name, this.featurevalueForm.value.featureId);
    }
  }

  openDialog(name: string, featureId: string): void {
    const dialogRef = this.dialog.open(FeaturevaluecreateconfrimDialogComponent, {
      width: '500px',
      data: { featurevalueName: name }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createFeatureValue(name, featureId);
      }
    });
  }

  createFeatureValue(name: string, featureId: string) {
    const create_featurevalue: FeaturevalueCreate = {
      name,
      featureId
    };

    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.featurevalueService.create(create_featurevalue, () => {
      this.toastrService.message('Feature Value Created Successfully', 'Success', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      this.featurevalueForm.reset();
    }, (errorMessage: string) => {
      this.toastrService.message(errorMessage, 'Error', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    }).finally(() => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
    });
  }
}
