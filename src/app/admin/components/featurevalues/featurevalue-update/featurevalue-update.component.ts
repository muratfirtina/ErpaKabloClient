import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeaturevalueUpdate } from 'src/app/contracts/featurevalue/featurevalue-update';
import { MatSelectModule } from '@angular/material/select';
import { Feature } from 'src/app/contracts/feature/feature';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { MatRadioModule } from '@angular/material/radio';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-featurevalue-update',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule, MatDialogModule, MatSelectModule, MatRadioModule],
  templateUrl: './featurevalue-update.component.html',
  styleUrls: ['./featurevalue-update.component.scss','../../../../../styles.scss']
})
export class FeaturevalueUpdateComponent extends BaseComponent implements OnInit {
  featurevalueForm: FormGroup;
  features: Feature[] = [];
  featureValueId: string; // Güncellenecek featurevalue ID'si

  constructor(spinner: NgxSpinnerService,
    private featurevalueService: FeaturevalueService,
    private fb: FormBuilder,
    private featureService: FeatureService,
    private toastrService: CustomToastrService,
    private route: ActivatedRoute) {
    super(spinner);
  }

  ngOnInit() {
    this.featurevalueForm = this.fb.group({
      name: ['', Validators.required],
      featureId: ['', Validators.required]
    });
    
    this.route.paramMap.subscribe(params => {
      this.featureValueId = params.get('id'); // URL'den id parametresi alınıyor
      this.loadFeaturevalue();
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

  loadFeaturevalue() {
    // featureValueId kullanarak güncellenmekte olan featurevalue'yu yükleyin
    this.featurevalueService.getById(this.featureValueId).then(data => {
      this.featurevalueForm.patchValue({
        name: data.name,
        featureId: data.featureId
      });
    }).catch(error => {
      this.toastrService.message(error, 'Error', { toastrMessageType: ToastrMessageType.Error, position: ToastrPosition.TopRight });
    });
  }

  onSubmit() {
    if (this.featurevalueForm.valid) {
      this.updateFeatureValue(this.featurevalueForm.value.name, this.featurevalueForm.value.featureId);
    }
  }

  updateFeatureValue(name: string, featureId: string) {
    const update_featurevalue: FeaturevalueUpdate = {
      id: this.featureValueId,
      name,
      featureId
    };

    this.showSpinner(SpinnerType.BallSpinClockwise);
    this.featurevalueService.update(update_featurevalue, () => {
      this.toastrService.message('Feature Value Updated Successfully', 'Success', {
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
