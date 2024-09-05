import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base/base.component';
import { RoleDto } from 'src/app/contracts/user/roleDto';
import { RoleService } from 'src/app/services/common/models/role.service';
import { UserService } from 'src/app/services/common/models/user.service';
import { BaseDialog } from '../baseDialog';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-authorize-user-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatCheckboxModule, FormsModule, MatButtonModule],
  templateUrl: './authorize-user-dialog.component.html',
  styleUrl: './authorize-user-dialog.component.scss'
})
export class AuthorizeUserDialogComponent extends BaseDialog<AuthorizeUserDialogComponent> implements OnInit {

  constructor(
    private roleService: RoleService,
    private userService: UserService,
    private toastrService: CustomToastrService,
    private spinner: NgxSpinnerService,
    dialogRef: MatDialogRef<AuthorizeUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    super(dialogRef);
  }

  roleList: GetListResponse<RoleDto> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  roles: (RoleDto & { isAssigned: boolean })[] = [];
  totalRoleCount: number = 0;
  assignedRoleCount: number = 0;

  async ngOnInit() {
    this.spinner.show(SpinnerType.BallSpinClockwise);
    
    try {
      const assignedRoles = await this.userService.getRolesToUser(this.data);
      
      this.roleList = await this.roleService.getRoles({ pageIndex: -1, pageSize: -1 },
        () => {},
        error => {
          this.toastrService.message("Rol listesi alınamadı", 'Hata', {
            toastrMessageType: ToastrMessageType.Error,
            position: ToastrPosition.TopRight
            });
        }
      );
      this.roles = this.roleList.items.map(role => ({
        ...role,
        isAssigned: assignedRoles.some(assignedRole => assignedRole.id === role.id)
      }));
      
      this.totalRoleCount = this.roles.length;
      this.updateAssignedRoleCount();
    } catch (error) {
      this.toastrService.message("Rol listesi alınamadı", 'Hata', {
        toastrMessageType: ToastrMessageType.Error,
        position: ToastrPosition.TopRight
      });
    } finally {
      this.spinner.hide(SpinnerType.BallSpinClockwise);
    }
  }

  assignRoles() {
    const rolesToAssign = this.roles.filter(r => r.isAssigned).map(r => ({ id: r.id, name: r.name }));
    this.spinner.show(SpinnerType.BallSpinClockwise);
    
    this.userService.assignRoleToUser(this.data, rolesToAssign).then(
      () => {
        this.toastrService.message("Yetkilendirme başarılı", 'Başarılı', {
          toastrMessageType: ToastrMessageType.Success,
          position: ToastrPosition.TopRight
        });
        this.close();
      }
    ).catch(
      error => {
        this.toastrService.message("Yetkilendirme sırasında bir hata oluştu", 'Hata', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
    ).finally(() => {
      this.spinner.hide(SpinnerType.BallSpinClockwise);
    });
  }

  updateAssignedRoleCount() {
    this.assignedRoleCount = this.roles.filter(r => r.isAssigned).length;
  }

  onRoleChange() {
    this.updateAssignedRoleCount();
  }
}