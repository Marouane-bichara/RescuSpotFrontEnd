import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { RegisterService } from '../../../core/services/register.service';
import { UserRegisterRequest } from '../../../core/models/register.model';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css'
})
export class RegisterUserComponent {
  private fb = inject(FormBuilder);
  private registerService = inject(RegisterService);
  private router = inject(Router);

  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid || this.isSubmitting) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();
    const payload: UserRegisterRequest = {
      account: {
        email: formValue.email,
        password: formValue.password,
        username: formValue.username
      },
      firstName: formValue.firstName,
      lastName: formValue.lastName
    };

    this.errorMessage = null;
    this.successMessage = null;
    this.isSubmitting = true;

    this.registerService.registerUser(payload)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.successMessage = 'Account created successfully. You can now sign in.';
          this.registerForm.reset();
          this.router.navigateByUrl('/login');
        },
        error: (err) => {
          const message = err?.error?.message || 'Unable to create user account.';
          this.errorMessage = message;
        }
      });
  }

  hasFieldError(field: 'username' | 'firstName' | 'lastName' | 'email' | 'password'): boolean {
    const control = this.registerForm.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }
}
