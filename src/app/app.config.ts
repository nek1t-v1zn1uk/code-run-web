import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule, Home, Terminal, BookOpen, Trophy, Settings, LayoutDashboard, BarChart2, Activity, CheckCircle, XCircle, Clock, HardDrive } from 'lucide-angular';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({ Home, Terminal, BookOpen, Trophy, Settings, LayoutDashboard, BarChart2, Activity, CheckCircle, XCircle, Clock, HardDrive }))
  ]
};
