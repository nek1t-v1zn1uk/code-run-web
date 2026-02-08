import { Routes } from '@angular/router';

export const routes: Routes = [
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

