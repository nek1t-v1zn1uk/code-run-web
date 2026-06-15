import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfileDto, UpdateProfileRequest, ChangePasswordRequest } from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserService {
    private http = inject(HttpClient);
    private baseUrl = `${environment.apiUrl}/v1/users`;
    public profileUpdated$ = new Subject<UserProfileDto>();

    getProfile(): Observable<UserProfileDto> {
        return this.http.get<UserProfileDto>(`${this.baseUrl}/me`).pipe(
            tap(profile => this.profileUpdated$.next(profile))
        );
    }

    updateProfile(data: UpdateProfileRequest): Observable<UserProfileDto> {
        return this.http.put<UserProfileDto>(`${this.baseUrl}/me`, data).pipe(
            tap(profile => this.profileUpdated$.next(profile))
        );
    }

    uploadAvatar(file: File): Observable<UserProfileDto> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<UserProfileDto>(`${this.baseUrl}/me/avatar`, formData).pipe(
            tap(profile => this.profileUpdated$.next(profile))
        );
    }

    deleteAvatar(): Observable<UserProfileDto> {
        return this.http.delete<UserProfileDto>(`${this.baseUrl}/me/avatar`).pipe(
            tap(profile => this.profileUpdated$.next(profile))
        );
    }

    getAvatarUrl(photoUrl: string | null): string {
        if (!photoUrl) {
            return '';
        }
        return `${environment.serverUrl}/uploads/${photoUrl}`;
    }

    changePassword(data: ChangePasswordRequest): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/me/password`, data);
    }
}
