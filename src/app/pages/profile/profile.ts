import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { UserProfileDto } from '../../models/user.models';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
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
  message = signal<{text: string, type: 'success' | 'error'} | null>(null);

  profileForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(32)]],
      lastName: ['', [Validators.maxLength(32)]]
    });
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
        this.showMessage('Failed to load profile', 'error');
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
    return (first + last).toUpperCase();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.showMessage('File is too large. Maximum size is 5MB', 'error');
        return;
      }

      this.isUploading.set(true);
      this.userService.uploadAvatar(file).subscribe({
        next: (data: UserProfileDto) => {
          this.profile.set(data);
          this.isUploading.set(false);
          this.showMessage('Avatar updated successfully', 'success');
        },
        error: (err: any) => {
          this.isUploading.set(false);
          this.showMessage('Failed to upload avatar', 'error');
        }
      });
    }
  }

  deleteAvatar(): void {
    if (confirm('Are you sure you want to delete your avatar?')) {
      this.userService.deleteAvatar().subscribe({
        next: (data: UserProfileDto) => {
          this.profile.set(data);
          this.showMessage('Avatar removed successfully', 'success');
        },
        error: (err: any) => {
          this.showMessage('Failed to remove avatar', 'error');
        }
      });
    }
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
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
        this.showMessage('Profile updated successfully', 'success');
      },
      error: (err: any) => {
        this.isSaving.set(false);
        this.showMessage('Failed to update profile', 'error');
      }
    });
  }

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message.set({ text, type });
    setTimeout(() => {
      this.message.set(null);
    }, 3000);
  }
}
