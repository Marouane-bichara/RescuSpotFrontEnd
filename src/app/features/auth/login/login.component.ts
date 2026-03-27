import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSubmitting = false;
  errorMessage: string | null = null;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  onSubmit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.getRawValue();
    this.errorMessage = null;
    this.isSubmitting = true;

    this.authService.login(email, password)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          const user = this.authService.getCurrentUser();
          const roles = user?.roles ?? [];

          if (this.hasRole(roles, 'ADMIN')) {
            this.router.navigateByUrl('/admin');
            return;
          }

          if (this.hasRole(roles, 'SHELTER')) {
            this.router.navigateByUrl('/shelter/animals');
            return;
          }

          this.router.navigateByUrl('/user/animals');
        },
        error: (err) => {
          const message = err?.error?.message || 'Invalid email or password.';
          this.errorMessage = message;
        }
      });
  }

  hasFieldError(field: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }

  private hasRole(roles: string[], expectedRole: string): boolean {
    for (const role of roles) {
      if (role === expectedRole) {
        return true;
      }
    }

    return false;
  }

}
