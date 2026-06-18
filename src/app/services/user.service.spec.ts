import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { environment } from '../../environments/environment';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch user profile and emit event', () => {
    const mockProfile = { id: 1, email: 'user@test.com', first_name: 'John', last_name: 'Doe', role: 'USER', photo_url: null, created_at: '2023-01-01' };
    const spy = vi.fn();
    service.profileUpdated$.subscribe(spy);

    service.getProfile().subscribe(profile => {
      expect(profile).toEqual(mockProfile);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/users/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);

    expect(spy).toHaveBeenCalledWith(mockProfile);
  });

  it('should format avatar URL correctly', () => {
    const noAvatar = service.getAvatarUrl(null);
    expect(noAvatar).toBe('');

    const withAvatar = service.getAvatarUrl('avatars/123.jpg');
    expect(withAvatar).toBe(`${environment.serverUrl}/uploads/avatars/123.jpg`);
  });

  it('should upload avatar and emit updated profile', () => {
    const mockFile = new File([''], 'avatar.jpg', { type: 'image/jpeg' });
    const mockProfile = { id: 1, email: 'user@test.com', first_name: 'John', last_name: 'Doe', role: 'USER', photo_url: 'avatars/123.jpg', created_at: '2023-01-01' };
    
    const spy = vi.fn();
    service.profileUpdated$.subscribe(spy);

    service.uploadAvatar(mockFile).subscribe(profile => {
      expect(profile.photo_url).toBe('avatars/123.jpg');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/users/me/avatar`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockProfile);

    expect(spy).toHaveBeenCalledWith(mockProfile);
  });
});
