import { Component, Inject, OnInit, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NgxSpinnerService } from 'ngx-spinner';
import { SpinnerType } from 'src/app/base/base/base.component';
import { DialogService } from 'src/app/services/common/dialog.service';
import { ProductService } from 'src/app/services/common/models/product.service';
import { BaseDialog } from '../baseDialog';
import { DeleteDialogComponent, DeleteDialogState } from '../delete-dialog/delete-dialog.component';
import { ProductImageList } from 'src/app/contracts/product/product-image-list';
import { FileUploadOptions, FileuploadComponent } from 'src/app/services/common/fileupload/fileupload.component';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

declare var $: any;

@Component({
  selector: 'app-product-image-dialog',
  standalone: true,
  imports: [CommonModule,MatDialogModule,MatCardModule,FileuploadComponent],
  templateUrl: './product-image-dialog.component.html',
  styleUrl: './product-image-dialog.component.scss'
})
export class ProductImageDialogComponent extends BaseDialog<ProductImageDialogComponent> implements OnInit{

  constructor(
    dialogRef: MatDialogRef<ProductImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductImageDialogState | string,
    private productService: ProductService,
    private spinner:NgxSpinnerService,
    private dialogService: DialogService) {
    super(dialogRef);
  }

  productImages: ProductImageList[] = [];

  

 @Output() options: Partial<FileUploadOptions> = {
    acceptedFileTypes: ".png, .jpg, .jpeg, .gif, .webp",
    action: "multiple",
    controller: "products",
    explanation: "Drag and drop your images here or click here to select images",
    //isAdminPage: true,
    queryString: "Id=" + this.data

  };

  async ngOnInit() {
    this.spinner.show(SpinnerType.BallSpinClockwise);
    this.productImages = await this.productService.readImages(this.data as string,() =>this.spinner.hide(SpinnerType.BallSpinClockwise));
    
    
  }

  async deleteImage(imageId: string, event: any) {
    this.dialogService.openDialog({
      componentType: DeleteDialogComponent,
      data: DeleteDialogState.Yes,
      
      afterClosed: async () => {
        this.spinner.show(SpinnerType.BallSpinClockwise);
        const card = $(event.target).closest('.product-image-card');
        card.fadeOut(900, async () => {
          await this.productService.deleteImage(this.data as string, imageId, () => {
            card.remove();
          this.spinner.hide(SpinnerType.BallSpinClockwise);
          

        });
      })
    }
    });
  }

}
export enum ProductImageDialogState {
  Close
}