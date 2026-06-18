import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UserProfileDto } from '../../models/user.models';
import { LucideAngularModule, CheckCircle, AlertCircle, X, Camera, Trash2, Calendar, User, Shield, Mail, Lock, Eye, EyeOff, LUCIDE_ICONS, LucideIconProvider } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ CheckCircle, AlertCircle, X, Camera, Trash2, Calendar, User, Shield, Mail, Lock, Eye, EyeOff })
    }
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  profile = signal<UserProfileDto | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isUploading = signal(false);
  
  // Custom Toasts array
  toasts = signal<{id: number, text: string, type: 'success' | 'error'}[]>([]);
  private toastIdCounter = 0;

  profileForm: FormGroup;
  passwordForm: FormGroup;
  activeTab: 'general' | 'security' = 'general';
  isChangingPassword = signal(false);
  
  showOldPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(32)]],
      lastName: ['', [Validators.maxLength(32)]]
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(64)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    const newPass = g.get('newPassword')?.value;
    const confirmPass = g.get('confirmPassword')?.value;
    return newPass === confirmPass ? null : { mismatch: true };
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: (data: UserProfileDto) => {
        this.profile.set(data);
        this.profileForm.patchValue({
          firstName: data.first_name,
          lastName: data.last_name || ''
        });
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.showToast('Failed to load profile data.', 'error');
        this.isLoading.set(false);
      }
    });
  }

  getAvatarUrl(): string | null {
    const p = this.profile();
    if (p && p.photo_url) {
      return this.userService.getAvatarUrl(p.photo_url);
    }
    return null;
  }

  getUserInitials(): string {
    const p = this.profile();
    if (!p) return '';
    const first = p.first_name?.charAt(0) || '';
    const last = p.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('File is too large. Maximum size is 5MB.', 'error');
        return;
      }

      this.isUploading.set(true);
      this.userService.uploadAvatar(file).subscribe({
        next: (data: UserProfileDto) => {
          this.profile.set(data);
          this.isUploading.set(false);
          this.showToast('Avatar updated successfully!', 'success');
        },
        error: (err: any) => {
          this.isUploading.set(false);
          this.showToast('Failed to upload avatar.', 'error');
        }
      });
    }
  }

  deleteAvatar(): void {
    if (confirm('Are you sure you want to remove your avatar?')) {
      this.userService.deleteAvatar().subscribe({
        next: (data: UserProfileDto) => {
          this.profile.set(data);
          this.showToast('Avatar removed successfully.', 'success');
        },
        error: (err: any) => {
          this.showToast('Failed to remove avatar.', 'error');
        }
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const formValue = this.profileForm.value;
    
    this.userService.updateProfile({
      first_name: formValue.firstName,
      last_name: formValue.lastName || null
    }).subscribe({
      next: (data: UserProfileDto) => {
        this.profile.set(data);
        this.isSaving.set(false);
        this.showToast('Profile saved successfully.', 'success');
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.showToast('Failed to save profile.', 'error');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword.set(true);
    const formValue = this.passwordForm.value;

    this.userService.changePassword({
      old_password: formValue.oldPassword,
      new_password: formValue.newPassword
    }).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.showToast('Password changed successfully.', 'success');
        this.passwordForm.reset();
      },
      error: (err: any) => {
        this.isChangingPassword.set(false);
        // Display specific error message if applicable
        const msg = err?.error?.message || 'Failed to change password. Check your old password.';
        this.showToast(msg, 'error');
      }
    });
  }

  showToast(text: string, type: 'success' | 'error'): void {
    const id = this.toastIdCounter++;
    this.toasts.update(current => [...current, { id, text, type }]);
    
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: number): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}

