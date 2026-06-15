import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { LucideAngularModule, Home, Terminal, BookOpen, Trophy, Settings, LayoutDashboard, BarChart2, Activity, CheckCircle, XCircle, Clock, HardDrive, Camera, Trash2, Calendar, User, Shield, AlertCircle, X, Mail, Lock, Eye, EyeOff } from 'lucide-angular';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(LucideAngularModule.pick({ Home, Terminal, BookOpen, Trophy, Settings, LayoutDashboard, BarChart2, Activity, CheckCircle, XCircle, Clock, HardDrive, Camera, Trash2, Calendar, User, Shield, AlertCircle, X, Mail, Lock, Eye, EyeOff }))
  ]
};
