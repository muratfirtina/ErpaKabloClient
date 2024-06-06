import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, RouterModule } from '@angular/router';
import { PageRequest } from 'src/app/contracts/pageRequest';
import { Product } from 'src/app/contracts/product/product';
import { GetListResponse } from 'src/app/contracts/getListResponse';
import { ProductService } from 'src/app/services/common/models/product.service';
import { ProductCreate } from 'src/app/contracts/product/product-create';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [CommonModule,RouterModule,FormsModule,RouterLink,ReactiveFormsModule],
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit{

  pageRequest: PageRequest = { pageIndex: -1, pageSize: -1 };

  listProduct: GetListResponse<Product>[] = [];
  items: Product[] = [];
  productForm: FormGroup;

  
  constructor(private productService:ProductService,private fB: FormBuilder) {

    this.productForm = this.fB.group({
    
      name: [''],
      stock: [''],
      price: [''],
      description: [''],
    });
   
  }
  ngOnInit(): void {
    
  }

  addProduct(formValue: any){
    
    
    const product_create : ProductCreate = {
      name: formValue.name,
      description: formValue.description,
      categoryId: '',
      brandId: '',
      sku: '',
      variants: [
        {
          price: formValue.price,
          stock: formValue.stock,
          features: [
            {
              featureId: '',
              featureName: '',
              featureValueId: '',
              featureValueName: ''
            }
          ]
        }
      ]
    };
    this.productService.create(product_create, (data) => {
      console.log(data);
    }, (error) => {
      console.log(error);
    });
  }

}
