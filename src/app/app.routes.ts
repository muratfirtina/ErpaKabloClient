import { Routes } from '@angular/router';authGuard
import { LayoutComponent } from './admin/layout/layout.component';
import { DashboardComponent } from './admin/components/dashboard/dashboard.component';
import { HomeComponent } from './ui/components/home/home.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    {
        path: "admin", component:LayoutComponent, children:[
          { path: "", component: DashboardComponent, canActivate: [authGuard]},
          { path: "dashboard", component: DashboardComponent, canActivate: [authGuard]},
          { path: "products", loadComponent: () => import('./admin/components/products/products.component').then(m => m.ProductsComponent), canActivate: [authGuard]},
          { path: "categories", loadComponent: () => import('./admin/components/categories/categories.component').then(m => m.CategoriesComponent) },
          { path: "categories/category-create", loadComponent: () => import('./admin/components/categories/category-create/category-create.component').then(m => m.CategoryCreateComponent), canActivate: [authGuard]},
          { path: "categories/category-list", loadComponent: () => import('./admin/components/categories/category-list/category-list.component').then(m => m.CategoryListComponent), canActivate: [authGuard] },
          { path: "categories/category-update/:id", loadComponent: () => import('./admin/components/categories/category-update/category-update.component').then(m => m.CategoryUpdateComponent), canActivate: [authGuard] },
          //{ path: "categories/category-list/:pageNo",loadComponent:()=>import('./admin/components/categories/category-list/category-list.component').then(m=>m.CategoryListComponent) },
          { path: "brands", loadComponent: () => import('./admin/components/brands/brands.component').then(m => m.BrandsComponent), canActivate: [authGuard] },
          { path: "brands/brand-create", loadComponent: () => import('./admin/components/brands/brand-create/brand-create.component').then(m => m.BrandCreateComponent), canActivate: [authGuard] },
          { path: "brands/brand-list", loadComponent: () => import('./admin/components/brands/brand-list/brand-list.component').then(m => m.BrandListComponent), canActivate: [authGuard] },
          { path: "brands/brand-list/:pageNo",loadComponent:()=>import('./admin/components/brands/brand-list/brand-list.component').then(m=>m.BrandListComponent), canActivate: [authGuard] },
          { path: "features", loadComponent: () => import('./admin/components/features/features.component').then(m => m.FeaturesComponent), canActivate: [authGuard] },
          { path: "features/feature-create", loadComponent: () => import('./admin/components/features/feature-create/feature-create.component').then(m => m.FeatureCreateComponent), canActivate: [authGuard] },
          { path: "features/feature-list", loadComponent: () => import('./admin/components/features/feature-list/feature-list.component').then(m => m.FeatureListComponent), canActivate: [authGuard] },
          { path: "features/feature-update/:id", loadComponent: () => import('./admin/components/features/feature-update/feature-update.component').then(m => m.FeatureUpdateComponent), canActivate: [authGuard] },
          { path: "featurevalues", loadComponent: () => import('./admin/components/featurevalues/featurevalues.component').then(m => m.FeaturevaluesComponent), canActivate: [authGuard] },
          { path: "featurevalues/featurevalue-create", loadComponent: () => import('./admin/components/featurevalues/featurevalue-create/featurevalue-create.component').then(m => m.FeaturevalueCreateComponent), canActivate: [authGuard] },
          { path: "featurevalues/featurevalue-list", loadComponent: () => import('./admin/components/featurevalues/featurevalue-list/featurevalue-list.component').then(m => m.FeaturevalueListComponent), canActivate: [authGuard] },
          { path: "featurevalues/featurevalue-update/:id", loadComponent: () => import('./admin/components/featurevalues/featurevalue-update/featurevalue-update.component').then(m => m.FeaturevalueUpdateComponent), canActivate: [authGuard] },
          { path: "products/product-create", loadComponent: () => import('./admin/components/products/product-create/product-create.component').then(m => m.ProductCreateComponent), canActivate: [authGuard] },
          { path: "products/product-list",loadComponent:()=>import('./admin/components/products/product-list/product-list.component').then(m=>m.ProductListComponent), canActivate: [authGuard]},
          { path: "products/product-update/:id",loadComponent:()=>import('./admin/components/products/product-update/product-update.component').then(m=>m.ProductUpdateComponent), canActivate: [authGuard]},
          { path: "users",loadComponent:()=>import('./admin/components/users/users.component').then(m=>m.UsersComponent), canActivate: [authGuard]},
          { path: "users/user-list",loadComponent:()=>import('./admin/components/users/user-list/user-list.component').then(m=>m.UserListComponent), canActivate: [authGuard]},
          { path: "roles",loadComponent:()=>import('./admin/components/roles/roles.component').then(m=>m.RolesComponent), canActivate: [authGuard]},
          { path: "roles/role-create",loadComponent:()=>import('./admin/components/roles/role-create/role-create.component').then(m=>m.RoleCreateComponent), canActivate: [authGuard]},
          { path: "roles/role-list",loadComponent:()=>import('./admin/components/roles/role-list/role-list.component').then(m=>m.RoleListComponent), canActivate: [authGuard]},
          { path: "authorize-menu",loadComponent:()=>import('./admin/components/authorize-menu/authorize-menu.component').then(m=>m.AuthorizeMenuComponent), canActivate: [authGuard]},
        ],canActivate: [authGuard],
        data: { roles: ['Admin'] }

      },
       {path: "", component:HomeComponent},
       {path: "home", component:HomeComponent},
       {path: "login",loadComponent:()=>import('./ui/components/login/login.component').then(m=>m.LoginComponent)},
       {path: "register",loadComponent:()=>import('./ui/components/register/register.component').then(m=>m.RegisterComponent)},
       {path: "product",loadComponent:()=>import('./ui/components/product/product.component').then(m=>m.ProductComponent)},
       {path: "product/:id",loadComponent:()=>import('./ui/components/product/product-detail/product-detail.component').then(m=>m.ProductDetailComponent)},
       {path: "search", loadComponent: () => import('./ui/components/search-results/search-results.component').then(m => m.SearchResultsComponent) },

];
