import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeFlattener, MatTreeFlatDataSource, MatTreeModule } from '@angular/material/tree';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { ApplicationService } from 'src/app/services/common/models/application.service';
import { BaseDialog } from '../../baseDialog';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { RoleDto } from 'src/app/contracts/user/roleDto';
import { MatListModule, MatSelectionList } from '@angular/material/list';
import { RoleService } from 'src/app/services/common/models/role.service';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { AuthorizationEndpointService } from 'src/app/services/common/authorization-endpoint.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-authorize-menu-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatCheckboxModule, FormsModule, MatButtonModule],
  templateUrl: './authorize-menu-dialog.component.html',
  styleUrl: './authorize-menu-dialog.component.scss'
})
export class AuthorizeMenuDialogComponent extends BaseDialog<AuthorizeMenuDialogComponent> implements OnInit {

  constructor(private roleService:RoleService,
    private authorizationEndpointService:AuthorizationEndpointService,
    private spinner:NgxSpinnerService,
    private toastrService:CustomToastrService,
    dialogRef: MatDialogRef<AuthorizeMenuDialogComponent>,
    @Inject (MAT_DIALOG_DATA) public data: any ) {
    super(dialogRef);
  }
  @ViewChild(MatSelectionList)
  roleComponent!: MatSelectionList
  @ViewChild(MatPaginator) paginator: MatPaginator;

  roleList: GetListResponse<RoleDto> = { index: 0, size: 0, count: 0, pages: 0, hasPrevious: false, hasNext: false, items: [] };
  roles: (RoleDto & { isAssigned: boolean })[] = [];
  totalRoleCount: number = 0;
  assignedRoleCount: number = 0;
  assignedRoles:RoleDto[]=[]

  async ngOnInit() {
    this.assignedRoles = await this.authorizationEndpointService.getRolesToEndpoint(this.data.code, this.data.menuName);
    const pageIndex = this.paginator ? this.paginator.pageIndex : 0;
    const pageSize = this.paginator ? this.paginator.pageSize : 10;
    this.roleList = await this.roleService.getRoles({ pageIndex, pageSize }, () => {}, error => {});
    
    this.roles = this.roleList.items.map(role => ({
      ...role,
      isAssigned: this.isRoleAssigned(role)
    }));
    
    this.totalRoleCount = this.roles.length;
    this.updateAssignedRoleCount();
  }

  assignRoles() {
    const rolesToAssign = this.roles.filter(role => role.isAssigned);
    this.spinner.show(SpinnerType.BallSpinClockwise);
    this.authorizationEndpointService.assignRoleEndpoint(rolesToAssign, this.data.code, this.data.menuName, () => {
      this.toastrService.message("Yetkilendirme başarılı", 'Başarılı', {
        toastrMessageType: ToastrMessageType.Success,
        position: ToastrPosition.TopRight
      });
      this.spinner.hide(SpinnerType.BallSpinClockwise);
    }, error => {
      // Hata işleme
    });
  }

  isRoleAssigned(role: RoleDto): boolean {
    return this.assignedRoles.some(assignedRole => assignedRole.id === role.id);
  }

  updateAssignedRoleCount() {
    this.assignedRoleCount = this.roles.filter(r => r.isAssigned).length;
  }

  onRoleChange() {
    this.updateAssignedRoleCount();
  }


}

export enum AuthorizeMenuDialogState {
  Yes,
  No
}
