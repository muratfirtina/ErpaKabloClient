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
          { path: "brands", loadComponent: () => import('./admin/components/brands/brands.component').then(m => m.BrandsComponent) },
          { path: "features", loadComponent: () => import('./admin/components/features/features.component').then(m => m.FeaturesComponent) },
          { path: "feature-values", loadComponent: () => import('./admin/components/feature-values/feature-values.component').then(m => m.FeatureValuesComponent) },
          
        ]
      }
];
