import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./pages/problems-list/problems-list').then(m => m.ProblemsList)
    },
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
        path: 'admin/problems',
        loadComponent: () => import('./pages/admin/problems-list/problems-list').then(m => m.AdminProblemsList)
    },
    {
        path: 'admin/problems/new',
        loadComponent: () => import('./pages/admin/problem-editor/problem-editor').then(m => m.ProblemEditor)
    },
    {
        path: 'admin/problems/:id',
        loadComponent: () => import('./pages/admin/problem-editor/problem-editor').then(m => m.ProblemEditor)
    },
    {
        path: 'problems/:id',
        loadComponent: () => import('./pages/problem-detail/problem-detail').then(m => m.ProblemDetail)
    },
    {
        path: '**',
        redirectTo: ''
    }
];

