import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { adminGuard } from './admin.guard';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('adminGuard', () => {
  let authServiceMock: any;
  let routerMock: any;

  beforeEach(() => {
    authServiceMock = {
      isAdmin: vi.fn()
    };
    
    routerMock = {
      createUrlTree: vi.fn().mockReturnValue('mockUrlTree')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('should allow access for admin users', () => {
    authServiceMock.isAdmin.mockReturnValue(true);
    
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    
    expect(result).toBe(true);
    expect(authServiceMock.isAdmin).toHaveBeenCalled();
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect non-admin users to home', () => {
    authServiceMock.isAdmin.mockReturnValue(false);
    
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    
    expect(result).toBe('mockUrlTree');
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/']);
  });
});
