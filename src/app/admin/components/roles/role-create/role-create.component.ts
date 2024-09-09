import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { RolecreateconfrimDialogComponent } from 'src/app/dialogs/roleDialogs/rolecreateconfrim-dialog/rolecreateconfrim-dialog.component';
import { RoleService } from 'src/app/services/common/models/role.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

@Component({
  selector: 'app-role-create',
  standalone: true,
  imports: [CommonModule,MatFormFieldModule,MatButtonModule,MatCardModule,ReactiveFormsModule,MatDialogModule,MatInputModule],
  templateUrl: './role-create.component.html',
  styleUrl: './role-create.component.scss'
})
export class RoleCreateComponent extends BaseComponent implements OnInit {

  roleForm: FormGroup;

  constructor(spinner:NgxSpinnerService,
    private toastrService: CustomToastrService,
    private roleService:RoleService,
    private dialog: MatDialog,
    private fb: FormBuilder,
    ) {
    super(spinner);
  }
  ngOnInit() {
    this.roleForm = this.fb.group({
      name: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.roleForm.valid) {
      this.openDialog(this.roleForm.value.name);
    }
  }
  createRole(name: string) {
    this.showSpinner(SpinnerType.BallSpinClockwise);

    const formData = new FormData();
    formData.append('name',name)
    this.roleService.create(formData, () => {
      this.hideSpinner(SpinnerType.BallSpinClockwise);
      this.toastrService.message("Role başarıyla eklenmiştir.", 'Başarılı', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
    }, errorMessage => {
      this.toastrService.message("Role eklenememiştir.", 'Hata', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    });
  }

  openDialog(formValue: any): void {
    const dialogRef = this.dialog.open(RolecreateconfrimDialogComponent, {
      width: '500px',
      data: { name: formValue }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createRole(formValue);
      }
    });
  }
}
