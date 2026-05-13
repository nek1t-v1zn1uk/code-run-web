import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'sign-in',
        loadComponent: () => import('./pages/auth/sign-in/sign-in').then(m => m.SignIn)
    },
    {
        path: 'sign-up',
        loadComponent: () => import('./pages/auth/sign-up/sign-up').then(m => m.SignUp)
    },
    {
        path: 'code-runner',
        loadComponent: () => import('./pages/code-runner/code-runner').then(m => m.CodeRunner)
    },
    {
        path: 'problems',
        loadComponent: () => import('./pages/problems-list/problems-list').then(m => m.ProblemsList)
    },
    {
        path: 'problems/:id',
        loadComponent: () => import('./pages/problem-detail/problem-detail').then(m => m.ProblemDetail)
    },
    {
        path: '',
        redirectTo: 'code-runner',
        pathMatch: 'full'
    }
];

