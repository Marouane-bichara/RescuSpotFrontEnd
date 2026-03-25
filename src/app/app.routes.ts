import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UnauthorizedComponent } from './shared/unauthorized/unauthorized.component';
import { UserDashboardComponent } from './features/user/user-dashboard';
import { AdminDashboardComponent } from './features/admin/admin-dashboard';
import { ShelterDashboardComponent } from './features/shelter/shelter-dashboard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'register/user',
    loadComponent: () =>
      import('./features/auth/register-user/register-user.component').then((m) => m.RegisterUserComponent)
  },
  {
    path: 'register/shelter',
    loadComponent: () =>
      import('./features/auth/register-shelter/register-shelter.component').then((m) => m.RegisterShelterComponent)
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  {
    path: 'user',
    redirectTo: 'user/animals',
    pathMatch: 'full'
  },
  {
    path: 'user/:section',
    canActivate: [authGuard, roleGuard(['USER'])],
    component: UserDashboardComponent
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    component: AdminDashboardComponent
  },
  {
    path: 'shelter',
    redirectTo: 'shelter/animals',
    pathMatch: 'full'
  },
  {
    path: 'shelter/:section',
    canActivate: [authGuard, roleGuard(['SHELTER'])],
    component: ShelterDashboardComponent
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
