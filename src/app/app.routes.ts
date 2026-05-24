import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';
import { adminGuard } from './services/admin.guard';

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
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/layout/layout').then(m => m.Layout),
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/home/home').then(m => m.Home)
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
                path: 'contests',
                loadComponent: () => import('./pages/contests-list/contests-list').then(m => m.ContestsList)
            },
            {
                path: 'contests/:id',
                loadComponent: () => import('./pages/contest-detail/contest-detail').then(m => m.ContestDetail)
            },
            {
                path: 'admin',
                canActivate: [adminGuard],
                children: [
                    {
                        path: 'problems',
                        loadComponent: () => import('./pages/admin/problems-list/problems-list').then(m => m.AdminProblemsList)
                    },
                    {
                        path: 'problems/new',
                        loadComponent: () => import('./pages/admin/problem-editor/problem-editor').then(m => m.ProblemEditor)
                    },
                    {
                        path: 'problems/:id',
                        loadComponent: () => import('./pages/admin/problem-editor/problem-editor').then(m => m.ProblemEditor)
                    },
                    {
                        path: 'contests',
                        loadComponent: () => import('./pages/admin/contests-list/contests-list').then(m => m.AdminContestsList)
                    },
                    {
                        path: 'contests/new',
                        loadComponent: () => import('./pages/admin/contest-editor/contest-editor').then(m => m.AdminContestEditor)
                    },
                    {
                        path: 'contests/:id',
                        loadComponent: () => import('./pages/admin/contest-editor/contest-editor').then(m => m.AdminContestEditor)
                    }
                ]
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];

