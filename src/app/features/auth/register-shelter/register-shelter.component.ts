import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { RegisterService } from '../../../core/services/register.service';
import { ShelterRegisterRequest } from '../../../core/models/register.model';

@Component({
  selector: 'app-register-shelter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-shelter.component.html',
  styleUrl: './register-shelter.component.css'
})
export class RegisterShelterComponent {
  private fb = inject(FormBuilder);
  private registerService = inject(RegisterService);
  private router = inject(Router);

  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  registerForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    name: ['', [Validators.required]]
  });

  onSubmit(): void {
    if (this.registerForm.invalid || this.isSubmitting) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const formValue = this.registerForm.getRawValue();
    const payload: ShelterRegisterRequest = {
      account: {
        email: formValue.email,
        password: formValue.password,
        username: formValue.username
      },
      name: formValue.name,
      description: '',
      location: '',
      phone: '',
      address: ''
    };

    this.errorMessage = null;
    this.successMessage = null;
    this.isSubmitting = true;

    this.registerService.registerShelter(payload)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.successMessage = 'Shelter account created successfully. You can now sign in.';
          this.registerForm.reset();
          this.router.navigateByUrl('/login');
        },
        error: (err) => {
          const message = err?.error?.message || 'Unable to create shelter account.';
          this.errorMessage = message;
        }
      });
  }

  hasFieldError(field: 'username' | 'email' | 'password' | 'name'): boolean {
    const control = this.registerForm.controls[field];
    return control.invalid && (control.touched || control.dirty);
  }
}
