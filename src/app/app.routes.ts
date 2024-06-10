import { Routes } from '@angular/router';
import { LayoutComponent } from './admin/layout/layout.component';
import { DashboardComponent } from './admin/components/dashboard/dashboard.component';

export const routes: Routes = [
    {
        path: "admin", component:LayoutComponent, children:[
          { path: "", component: DashboardComponent},
          { path: "dashboard", component: DashboardComponent},
          { path: "products", loadComponent: () => import('./admin/components/products/products.component').then(m => m.ProductsComponent) },
          { path: "categories", loadComponent: () => import('./admin/components/categories/categories.component').then(m => m.CategoriesComponent) },
          { path: "categories/category-create", loadComponent: () => import('./admin/components/categories/category-create/category-create.component').then(m => m.CategoryCreateComponent) },
          { path: "categories/category-list", loadComponent: () => import('./admin/components/categories/category-list/category-list.component').then(m => m.CategoryListComponent) },
          //{ path: "categories/category-list/:pageNo",loadComponent:()=>import('./admin/components/categories/category-list/category-list.component').then(m=>m.CategoryListComponent) },
          { path: "brands", loadComponent: () => import('./admin/components/brands/brands.component').then(m => m.BrandsComponent) },
          { path: "brands/brand-create", loadComponent: () => import('./admin/components/brands/brand-create/brand-create.component').then(m => m.BrandCreateComponent) },
          { path: "brands/brand-list", loadComponent: () => import('./admin/components/brands/brand-list/brand-list.component').then(m => m.BrandListComponent) },
          { path: "brands/brand-list/:pageNo",loadComponent:()=>import('./admin/components/brands/brand-list/brand-list.component').then(m=>m.BrandListComponent) },
          { path: "features", loadComponent: () => import('./admin/components/features/features.component').then(m => m.FeaturesComponent) },
          { path: "features/feature-create", loadComponent: () => import('./admin/components/features/feature-create/feature-create.component').then(m => m.FeatureCreateComponent) },
          //{ path: "features/feature-list", loadComponent: () => import('./admin/components/features/feature-list/feature-list.component').then(m => m.FeatureListComponent) },
          { path: "feature-values", loadComponent: () => import('./admin/components/feature-values/feature-values.component').then(m => m.FeatureValuesComponent) },
          
        ]
      }
];
