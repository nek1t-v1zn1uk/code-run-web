import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'code-runner',
        loadComponent: () => import('./pages/code-runner/code-runner').then(m => m.CodeRunner)
    },
    {
        path: '',
        redirectTo: 'code-runner',
        pathMatch: 'full'
    }
];

