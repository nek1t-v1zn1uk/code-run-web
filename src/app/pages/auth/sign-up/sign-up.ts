import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ApiErrorResponse } from '../../../models/error.models';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export class SignUp {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    first_name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(32)]],
    last_name: ['', [Validators.minLength(1), Validators.maxLength(32)]],
    email: ['', [Validators.required, Validators.email, Validators.minLength(1), Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]]
  });

  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    // Trim all form fields
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (typeof control?.value === 'string') {
        control.setValue(control.value.trim());
      }
    });

    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const requestData = { ...this.registerForm.value };
      // Ensure empty strings for optional fields are sent as null
      if (requestData.last_name === '') {
        requestData.last_name = null;
      }

      this.authService.register(requestData).subscribe({
        next: () => {
          // Auto login after successful registration
          this.authService.login({
            email: requestData.email,
            password: requestData.password
          }).subscribe({
            next: () => {
              this.router.navigate(['/']);
              this.isLoading.set(false);
            },
            error: () => {
              // If auto-login fails, still redirect to sign-in
              this.router.navigate(['/sign-in'], { queryParams: { registered: 'true' } });
              this.isLoading.set(false);
            }
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorResponse = err.error as ApiErrorResponse;
          this.errorMessage.set(errorResponse?.message || 'Registration failed. Please try again.');

          if (errorResponse?.errors) {
            Object.keys(errorResponse.errors).forEach(key => {
              const control = this.registerForm.get(key);
              if (control) {
                control.setErrors({ serverError: errorResponse.errors![key] });
              }
            });
          }
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }
}
