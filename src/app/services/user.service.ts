import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfileDto, UpdateProfileRequest } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/v1/users`;

    getProfile(): Observable<UserProfileDto> {
        return this.http.get<UserProfileDto>(`${this.baseUrl}/me`);
    }

    updateProfile(data: UpdateProfileRequest): Observable<UserProfileDto> {
        return this.http.put<UserProfileDto>(`${this.baseUrl}/me`, data);
    }

    uploadAvatar(file: File): Observable<UserProfileDto> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<UserProfileDto>(`${this.baseUrl}/me/avatar`, formData);
    }

    deleteAvatar(): Observable<UserProfileDto> {
        return this.http.delete<UserProfileDto>(`${this.baseUrl}/me/avatar`);
    }

    getAvatarUrl(photoUrl: string | null): string {
        if (!photoUrl) {
            return '';
        }
        return `${environment.serverUrl}/uploads/${photoUrl}`;
    }
}
