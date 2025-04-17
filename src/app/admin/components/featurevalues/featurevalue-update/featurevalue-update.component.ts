import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeaturevalueUpdate } from 'src/app/contracts/featurevalue/featurevalue-update';
import { Feature } from 'src/app/contracts/feature/feature';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { ActivatedRoute } from '@angular/router';
import { SpinnerService } from 'src/app/services/common/spinner.service';

@Component({
  selector: 'app-featurevalue-update',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './featurevalue-update.component.html',
  styleUrls: ['./featurevalue-update.component.scss','../../../../../styles.scss']
})
export class FeaturevalueUpdateComponent extends BaseComponent implements OnInit {
  featurevalueForm: FormGroup;
  features: Feature[] = [];
  filteredFeatures: Feature[] = [];
  featureValueId: string; // Güncellenecek featurevalue ID'si
  searchTerm: string = '';

  constructor(spinner: SpinnerService,
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
      this.filteredFeatures = [...this.features];
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

  searchFeatures(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = value;
    this.filteredFeatures = this.features.filter(feature => 
      feature.name.toLowerCase().includes(value)
    );
  }
}