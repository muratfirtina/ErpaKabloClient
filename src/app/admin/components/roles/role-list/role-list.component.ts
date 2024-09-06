import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { BaseComponent, SpinnerType } from 'src/app/base/base/base.component';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { RoleDto } from 'src/app/contracts/user/roleDto';
import { DeleteDialogComponent, DeleteDialogState } from 'src/app/dialogs/delete-dialog/delete-dialog.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { RoleService } from 'src/app/services/common/models/role.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';
import { DeleteDirectiveComponent } from "../../../../directives/admin/delete-directive/delete-directive.component";

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [CommonModule, MatPaginator, MatTableModule, MatCheckboxModule, MatIconModule, MatButtonModule, DeleteDirectiveComponent],
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss', '../../../../../styles.scss']
})
export class RoleListComponent extends BaseComponent implements OnInit {

  displayedColumns: string[] = ['select', 'name', 'edit', 'delete'];
  dataSource:MatTableDataSource<RoleDto> = null;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  selectedRoles: RoleDto[] = []

  constructor(
    private roleService: RoleService,
     private toastrService: CustomToastrService,
     private dialogService: DialogService,
     spinner: NgxSpinnerService) {
    super(spinner);
  }
 
  async getRoles() {

    this.showSpinner(SpinnerType.BallSpinClockwise);

    const pageIndex = this.paginator ? this.paginator.pageIndex : 0;
    const pageSize = this.paginator ? this.paginator.pageSize : 5;

    const allRoles: GetListResponse<RoleDto> = await this.roleService.getRoles({ pageIndex, pageSize },
      () => {
        this.hideSpinner(SpinnerType.BallSpinClockwise);
      },
      error => {
        this.toastrService.message('An unexpected error occurred while getting roles', 'Error', {
          toastrMessageType: ToastrMessageType.Error,
          position: ToastrPosition.TopRight
        });
      }
      );


    this.dataSource = new MatTableDataSource<RoleDto>(allRoles.items);
    this.paginator.length = allRoles.count;

    if (allRoles.items.length === 0 && pageIndex > 0) {
      this.paginator.pageIndex = pageIndex - 1;
      await this.getRoles();
    }
    
  }

  selectRole(role: RoleDto) {
    const index = this.selectedRoles.findIndex(r => r.id === role.id);
    if (index !== -1) {
      this.selectedRoles.splice(index, 1);
    } else {
      this.selectedRoles.push(role);
    }
  }

  selectAllRoles() {
    if (this.selectedRoles.length === this.dataSource.data.length) {
      this.selectedRoles = [];
    } else {
      this.selectedRoles = [...this.dataSource.data];
    }
  }

  async deleteSelectedRoles() {
    if (this.selectedRoles.length === 0) {
      return;
    }
    
    const dialogRef = this.dialogService.openDialog({
      componentType: DeleteDialogComponent,
      data: DeleteDialogState.Yes,
      afterClosed: async (result: DeleteDialogState) => {
        if (result === DeleteDialogState.Yes) {
          this.showSpinner(SpinnerType.BallSpinClockwise);
          try {
            for (const role of this.selectedRoles) {
              await this.roleService.deleteRole(role.id);
            }
  
            this.toastrService.message('Selected roles deleted', 'Deleted',{
              toastrMessageType: ToastrMessageType.Info,
              position: ToastrPosition.TopRight
            });
  
            this.selectedRoles = [];
            await this.getRoles();
          } catch (error) {
            this.toastrService.message('An unexpected error occurred while deleting roles', 'Error', {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight
            });
          }
        }
      }
    });
  
    // Burada dialog kapatılmasını bekliyoruz
    
    this.hideSpinner(SpinnerType.BallSpinClockwise);
  }
  
  
  
  
  async pageChanged(){
    await this.getRoles();
  }

  async ngOnInit(){
    await this.getRoles();
  }

  
  
}
