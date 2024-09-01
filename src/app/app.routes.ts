import { Routes } from '@angular/router';
import { LayoutComponent } from './admin/layout/layout.component';
import { DashboardComponent } from './admin/components/dashboard/dashboard.component';
import { HomeComponent } from './ui/components/home/home.component';

export const routes: Routes = [
    {
        path: "admin", component:LayoutComponent, children:[
          { path: "", component: DashboardComponent},
          { path: "dashboard", component: DashboardComponent},
          { path: "products", loadComponent: () => import('./admin/components/products/products.component').then(m => m.ProductsComponent) },
          { path: "categories", loadComponent: () => import('./admin/components/categories/categories.component').then(m => m.CategoriesComponent) },
          { path: "categories/category-create", loadComponent: () => import('./admin/components/categories/category-create/category-create.component').then(m => m.CategoryCreateComponent) },
          { path: "categories/category-list", loadComponent: () => import('./admin/components/categories/category-list/category-list.component').then(m => m.CategoryListComponent) },
          { path: "categories/category-update/:id", loadComponent: () => import('./admin/components/categories/category-update/category-update.component').then(m => m.CategoryUpdateComponent) },
          //{ path: "categories/category-list/:pageNo",loadComponent:()=>import('./admin/components/categories/category-list/category-list.component').then(m=>m.CategoryListComponent) },
          { path: "brands", loadComponent: () => import('./admin/components/brands/brands.component').then(m => m.BrandsComponent) },
          { path: "brands/brand-create", loadComponent: () => import('./admin/components/brands/brand-create/brand-create.component').then(m => m.BrandCreateComponent) },
          { path: "brands/brand-list", loadComponent: () => import('./admin/components/brands/brand-list/brand-list.component').then(m => m.BrandListComponent) },
          { path: "brands/brand-list/:pageNo",loadComponent:()=>import('./admin/components/brands/brand-list/brand-list.component').then(m=>m.BrandListComponent) },
          { path: "features", loadComponent: () => import('./admin/components/features/features.component').then(m => m.FeaturesComponent) },
          { path: "features/feature-create", loadComponent: () => import('./admin/components/features/feature-create/feature-create.component').then(m => m.FeatureCreateComponent) },
          { path: "features/feature-list", loadComponent: () => import('./admin/components/features/feature-list/feature-list.component').then(m => m.FeatureListComponent) },
          { path: "features/feature-update/:id", loadComponent: () => import('./admin/components/features/feature-update/feature-update.component').then(m => m.FeatureUpdateComponent) },
          { path: "featurevalues", loadComponent: () => import('./admin/components/featurevalues/featurevalues.component').then(m => m.FeaturevaluesComponent) },
          { path: "featurevalues/featurevalue-create", loadComponent: () => import('./admin/components/featurevalues/featurevalue-create/featurevalue-create.component').then(m => m.FeaturevalueCreateComponent) },
          { path: "featurevalues/featurevalue-list", loadComponent: () => import('./admin/components/featurevalues/featurevalue-list/featurevalue-list.component').then(m => m.FeaturevalueListComponent) },
          { path: "featurevalues/featurevalue-update/:id", loadComponent: () => import('./admin/components/featurevalues/featurevalue-update/featurevalue-update.component').then(m => m.FeaturevalueUpdateComponent) },
          { path: "products/product-create", loadComponent: () => import('./admin/components/products/product-create/product-create.component').then(m => m.ProductCreateComponent) },
          { path: "products/product-list",loadComponent:()=>import('./admin/components/products/product-list/product-list.component').then(m=>m.ProductListComponent)},
          { path: "products/product-update/:id",loadComponent:()=>import('./admin/components/products/product-update/product-update.component').then(m=>m.ProductUpdateComponent)},
        ],

      },
       {path: "", component:HomeComponent},
       {path: "home", component:HomeComponent},
       {path: "login",loadComponent:()=>import('./ui/components/login/login.component').then(m=>m.LoginComponent)},
       {path: "register",loadComponent:()=>import('./ui/components/register/register.component').then(m=>m.RegisterComponent)},
       {path: "product",loadComponent:()=>import('./ui/components/product/product.component').then(m=>m.ProductComponent)},
       {path: "product/:id",loadComponent:()=>import('./ui/components/product/product-detail/product-detail.component').then(m=>m.ProductDetailComponent)},

];
