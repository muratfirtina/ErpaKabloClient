import { Component, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NgxSpinnerService } from 'ngx-spinner';
import { firstValueFrom } from 'rxjs';
import { SpinnerType } from 'src/app/base/base/base.component';
import { DeletedResponse } from 'src/app/contracts/deletedResponse';
import { DeleteDialogComponent, DeleteDialogState } from 'src/app/dialogs/delete-dialog/delete-dialog.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { HttpClientService } from 'src/app/services/common/http-client.service';
import { CustomToastrService, ToastrMessageType, ToastrPosition } from 'src/app/services/ui/custom-toastr.service';

declare var $: any;

@Component({
  selector: 'app-delete-directive',
  standalone: true,
  imports: [MatIconModule,MatButtonModule],
  templateUrl: './delete-directive.component.html',
  styleUrl: './delete-directive.component.scss'
})
export class DeleteDirectiveComponent {
  constructor(
    private element: ElementRef,
    private httpClientService: HttpClientService,
    private spinner: NgxSpinnerService,
    public dialog: MatDialog,
    private dialogService: DialogService,
    private toastrService: CustomToastrService
  ) {}

  @Input() id: string;
  @Input() controller: string;
  @Input() action: string;
  @Input() itemName: string;
  @Output() refresh: EventEmitter<any> = new EventEmitter();

  @HostListener('click')
  onClick() {
    this.dialogService.openDialog({
      componentType: DeleteDialogComponent,
      data: DeleteDialogState.Yes,
      afterClosed: async (result: DeleteDialogState) => {
        if (result === DeleteDialogState.Yes) {  // Kullanıcı silmeyi onaylarsa
          this.spinner.show(SpinnerType.BallSpinClockwise);
          const td: HTMLTableCellElement = this.element.nativeElement;
          
          try {
            const response: DeletedResponse = await firstValueFrom(this.httpClientService.delete({ controller: this.controller, action: this.action }, this.id));
            if (response.success) {
              
                this.refresh.emit();
                this.toastrService.message(`${this.itemName} Deleted`, 'Success', {
                  toastrMessageType: ToastrMessageType.Success,
                  position: ToastrPosition.TopRight
                },);
                this.dialogService.closeDialog();  // Dialog'u kapat
              }
            else {
              this.toastrService.message( 'Failed to delete the item', 'Error', {
                toastrMessageType: ToastrMessageType.Error,
                position: ToastrPosition.TopRight
              });
              // Dialog'u kapatmıyoruz, çünkü kullanıcı hatayı görmeli
            }
          }
           catch (error) {
            this.toastrService.message('An unexpected error was encountered when deleting', 'Error', {
              toastrMessageType: ToastrMessageType.Error,
              position: ToastrPosition.TopRight
            });
          } finally {
            this.spinner.hide(SpinnerType.BallSpinClockwise);
          }
        }
      }
    });
  }
}