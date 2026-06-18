import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store tokens on login and return true for isLoggedIn', () => {
    const loginData = { email: 'test@test.com', password: 'password' };
    const mockResponse = { access_token: 'fake-token', email: 'test@test.com', role: 'USER' };

    service.login(loginData).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/v1/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.getToken()).toBe('fake-token');
    expect(service.getUserEmail()).toBe('test@test.com');
    expect(service.isLoggedIn()).toBe(true);
    expect(service.isAdmin()).toBe(false);
  });

  it('should clear localStorage on logout', () => {
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('user_email', 'email');
    localStorage.setItem('user_role', 'USER');

    service.logout();

    expect(service.getToken()).toBeNull();
    expect(service.getUserEmail()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should identify admin users', () => {
    localStorage.setItem('user_role', 'ADMIN');
    expect(service.isAdmin()).toBe(true);
  });
});
