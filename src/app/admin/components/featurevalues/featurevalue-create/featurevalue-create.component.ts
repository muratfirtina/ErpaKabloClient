import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { FeaturevalueService } from 'src/app/services/common/models/featurevalue.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { FeaturevalueCreate } from 'src/app/contracts/featurevalue/featurevalue-create';
import { Feature } from 'src/app/contracts/feature/feature';
import { FeatureService } from 'src/app/services/common/models/feature.service';
import { SpinnerService } from 'src/app/services/common/spinner.service';
import { FeaturevaluecreateconfrimDialogComponent } from 'src/app/dialogs/featurevalueDialogs/featurevaluecreateconfrim-dialog/featurevaluecreateconfrim-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-featurevalue-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './featurevalue-create.component.html',
  styleUrls: ['./featurevalue-create.component.scss','../../../../../styles.scss']
})
export class FeaturevalueCreateComponent extends BaseComponent implements OnInit {
  featurevalueForm: FormGroup;
  features: Feature[] = [];
  filteredFeatures: Feature[] = [];
  searchTerm: string = '';

  constructor(spinner: SpinnerService,
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
      this.filteredFeatures = [...this.features];
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

  searchFeatures(event: Event) {
    const value = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = value;
    this.filteredFeatures = this.features.filter(feature => 
      feature.name.toLowerCase().includes(value)
    );
  }
}