import { Routes } from '@angular/router';authGuard
import { LayoutComponent } from './admin/layout/layout.component';
import { DashboardComponent } from './admin/components/dashboard/dashboard.component';
import { HomeComponent } from './ui/components/home/home.component';
import { authGuard } from './guards/auth.guard';
import { Roles } from './constants/roles';
import { routeTypeResolver } from './services/common/route-resolver.service';

export const routes: Routes = [
    {
        path: "admin", component:LayoutComponent,canActivate: [authGuard],data: { [Roles.ADMIN]: true } ,children:[
          { path: "", component: DashboardComponent, canActivate: [authGuard], data: { [Roles.ADMIN]: true } },
          { path: "dashboard", component: DashboardComponent, canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "carousel", loadComponent: () => import('./admin/components/carousel/carousel.component').then(m => m.CarouselComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "carousel/carousel-create", loadComponent: () => import('./admin/components/carousel/carousel-create/carousel-create.component').then(m => m.CarouselCreateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "carousel/carousel-update", loadComponent: () => import('./admin/components/carousel/carousel-update/carousel-update.component').then(m => m.CarouselUpdateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "products", loadComponent: () => import('./admin/components/products/products.component').then(m => m.ProductsComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "categories", loadComponent: () => import('./admin/components/categories/categories.component').then(m => m.CategoriesComponent),canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "categories/category-create", loadComponent: () => import('./admin/components/categories/category-create/category-create.component').then(m => m.CategoryCreateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "categories/category-list", loadComponent: () => import('./admin/components/categories/category-list/category-list.component').then(m => m.CategoryListComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }   },
          { path: "categories/category-update/:id", loadComponent: () => import('./admin/components/categories/category-update/category-update.component').then(m => m.CategoryUpdateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          //{ path: "categories/category-list/:pageNo",loadComponent:()=>import('./admin/components/categories/category-list/category-list.component').then(m=>m.CategoryListComponent) },
          { path: "brands", loadComponent: () => import('./admin/components/brands/brands.component').then(m => m.BrandsComponent),canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "brands/brand-create", loadComponent: () => import('./admin/components/brands/brand-create/brand-create.component').then(m => m.BrandCreateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "brands/brand-list", loadComponent: () => import('./admin/components/brands/brand-list/brand-list.component').then(m => m.BrandListComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "brands/brand-list/:pageNo",loadComponent:()=>import('./admin/components/brands/brand-list/brand-list.component').then(m=>m.BrandListComponent),canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: 'brands/brand-update/:id',loadComponent:()=>import('./admin/components/brands/brand-update/brand-update.component').then(m=>m.BrandUpdateComponent),canActivate: [authGuard],data: {[Roles.ADMIN]: true} },
          { path: "features", loadComponent: () => import('./admin/components/features/features.component').then(m => m.FeaturesComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "features/feature-create", loadComponent: () => import('./admin/components/features/feature-create/feature-create.component').then(m => m.FeatureCreateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "features/feature-list", loadComponent: () => import('./admin/components/features/feature-list/feature-list.component').then(m => m.FeatureListComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "features/feature-update/:id", loadComponent: () => import('./admin/components/features/feature-update/feature-update.component').then(m => m.FeatureUpdateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "featurevalues", loadComponent: () => import('./admin/components/featurevalues/featurevalues.component').then(m => m.FeaturevaluesComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "featurevalues/featurevalue-create", loadComponent: () => import('./admin/components/featurevalues/featurevalue-create/featurevalue-create.component').then(m => m.FeaturevalueCreateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "featurevalues/featurevalue-list", loadComponent: () => import('./admin/components/featurevalues/featurevalue-list/featurevalue-list.component').then(m => m.FeaturevalueListComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "featurevalues/featurevalue-update/:id", loadComponent: () => import('./admin/components/featurevalues/featurevalue-update/featurevalue-update.component').then(m => m.FeaturevalueUpdateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "products", loadComponent: () => import('./admin/components/products/products.component').then(m => m.ProductsComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "products/product-create", loadComponent: () => import('./admin/components/products/product-create/product-create.component').then(m => m.ProductCreateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "products/product-list",loadComponent:()=>import('./admin/components/products/product-list/product-list.component').then(m=>m.ProductListComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "products/product-update/:id",loadComponent:()=>import('./admin/components/products/product-update/product-update.component').then(m=>m.ProductUpdateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "users",loadComponent:()=>import('./admin/components/users/users.component').then(m=>m.UsersComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "users/user-list",loadComponent:()=>import('./admin/components/users/user-list/user-list.component').then(m=>m.UserListComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "roles",loadComponent:()=>import('./admin/components/roles/roles.component').then(m=>m.RolesComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "roles/role-create",loadComponent:()=>import('./admin/components/roles/role-create/role-create.component').then(m=>m.RoleCreateComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "roles/role-list",loadComponent:()=>import('./admin/components/roles/role-list/role-list.component').then(m=>m.RoleListComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "authorize-menu",loadComponent:()=>import('./admin/components/authorize-menu/authorize-menu.component').then(m=>m.AuthorizeMenuComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "orders",loadComponent:()=>import('./admin/components/orders/orders.component').then(m=>m.OrdersComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "orders/:id",loadComponent:()=>import('./admin/components/orders/orders.component').then(m=>m.OrdersComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "unauthorized",loadComponent:()=>import('./admin/components/unauthorized/unauthorized.component').then(m=>m.UnauthorizedComponent), canActivate: [authGuard],data: { [Roles.ADMIN]: true }  },
          { path: "logos", loadComponent:()=>import('./admin/components/logos/logos.component').then(m=>m.LogosComponent), canActivate:[authGuard],data:{[Roles.ADMIN]:true}},
          { path: "logos/company-logo",loadComponent:()=>import('./admin/components/logos/company-logo/company-logo.component').then(m=>m.CompanyLogoComponent), canActivate:[authGuard],data:{[Roles.ADMIN]:true}},
          { path: "monitoring",loadComponent: () => import('./admin/components/performance-monitoring/performance-monitoring.component').then(m => m.PerformanceMonitoringComponent),canActivate: [authGuard],data: { [Roles.ADMIN]: true }}
        ]

      },
      { path: "", component: HomeComponent },
      { path: "home", component: HomeComponent },
      { path: "404", loadComponent: () => import('./ui/components/not-found/not-found.component').then(m => m.NotFoundComponent)},
      { path: "login", loadComponent: () => import('./ui/components/login/login.component').then(m => m.LoginComponent) },
      { path: "register", loadComponent: () => import('./ui/components/register/register.component').then(m => m.RegisterComponent) },
      { path: "search", loadComponent: () => import('./ui/components/search-results/search-results.component').then(m => m.SearchResultsComponent) },
      { path: 'about-us',loadComponent: () => import('./ui/components/about-us/about-us.component').then(m => m.AboutUsComponent)},
      { path: 'contact',loadComponent: () => import('./ui/components/contact/contact.component').then(m => m.ContactComponent)},
      { path: 'brand',loadComponent: () => import('./ui/components/brand/brand.component').then(m => m.BrandComponent)},
      { path: "categories-page",loadComponent: () => import('./ui/components/category/categories-page/categories-page.component').then(m => m.CategoriesPageComponent) },
      { path: "unauthorized", loadComponent: () => import('./ui/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },
      { path: "order", loadComponent: () => import('./ui/components/order/order.component').then(m => m.OrderComponent), canActivate: [authGuard] },
      { path: "order-summary/:orderId", loadComponent: () => import('./ui/components/order/order-summary/order-summary.component').then(m => m.OrderSummaryComponent), canActivate: [authGuard] },
      { path: "cart-page", loadComponent: () => import('./ui/components/cart/cart-page/cart-page.component').then(m => m.CartPageComponent), canActivate: [authGuard] },
      { path: "user", loadComponent: () => import('./ui/components/user/user.component').then(m => m.UserComponent), canActivate: [authGuard] },
      { path: "my-favorites", loadComponent: () => import('./ui/components/user/my-favorites/my-favorites.component').then(m => m.MyFavoritesComponent), canActivate: [authGuard] },
      { path: "cookie-policy", loadComponent: () => import('./ui/components/cookie/cookie-policy/cookie-policy.component').then(m => m.CookiePolicyComponent) },
      { path: "password-reset", loadComponent: () => import('./ui/components/password-reset/password-reset.component').then(m => m.PasswordResetComponent) },
      { path: "update-password/:userId/:resetToken", loadComponent: () => import('./ui/components/update-password/update-password.component').then(m => m.UpdatePasswordComponent) },
      { path: "newsletter/unsubscribe", loadComponent: () => import('./ui/components/newsletter-unsubscribe/newsletter-unsubscribe.component').then(m => m.NewsletterUnsubscribeComponent) },
      { path: "activation-info", loadComponent: () => import('./ui/components/activation/activation-info/activation-info.component').then(m => m.ActivationInfoComponent) },
      { path: 'confirm-email/:userId/:token',loadComponent: () => import('./ui/components/activation/confirmed-email/confirmed-email.component').then(m => m.ConfirmedEmailComponent)},
      { path: "resend-activation", loadComponent: () => import('./ui/components/activation/resend-activation/resend-activation.component').then(m => m.ResendActivationComponent) },
      
      // New wildcard route for handling SEO-friendly URLs
    
      {
        path: ":id",
        resolve: {
          routeType: routeTypeResolver
        },
        loadComponent: () => import('./common/dynamic-router/dynamic-router.component').then(m => m.DynamicRouterComponent)
      }
];
