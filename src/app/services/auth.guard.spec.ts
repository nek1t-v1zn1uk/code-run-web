import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('authGuard', () => {
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      isLoggedIn: vi.fn()
    };
    
    routerMock = {
      createUrlTree: vi.fn().mockReturnValue('mockSignInUrlTree')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access for logged-in users', () => {
    authServiceMock.isLoggedIn.mockReturnValue(true);
    
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    
    expect(result).toBe(true);
    expect(authServiceMock.isLoggedIn).toHaveBeenCalled();
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect guest users to sign-in page', () => {
    authServiceMock.isLoggedIn.mockReturnValue(false);
    
    const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    
    expect(result).toBe('mockSignInUrlTree');
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/sign-in']);
  });
});
