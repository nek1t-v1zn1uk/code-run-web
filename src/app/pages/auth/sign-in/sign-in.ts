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
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css'
})
export class SignIn {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email, Validators.minLength(1), Validators.maxLength(255)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]]
  });

  isLoading = signal(false);
  errorMessage = signal('');

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    // Trim all form fields
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      if (typeof control?.value === 'string') {
        control.setValue(control.value.trim());
      }
    });

    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/']);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorResponse = err.error as ApiErrorResponse;
          this.errorMessage.set(errorResponse?.message || 'Invalid email or password');

          if (errorResponse?.errors) {
            // Mapping field-specific errors if available
            Object.keys(errorResponse.errors).forEach(key => {
              const control = this.loginForm.get(key);
              if (control) {
                control.setErrors({ serverError: errorResponse.errors![key] });
              }
            });
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
