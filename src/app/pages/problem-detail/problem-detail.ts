import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ProblemService } from '../../services/problem.service';
import { Problem } from '../../models/problem.models';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// Configure marked with KaTeX extension
marked.use(markedKatex({
    throwOnError: false,
    output: 'html'
}));

@Component({
    selector: 'app-problem-detail',
    imports: [CommonModule],
    templateUrl: './problem-detail.html',
    styleUrl: './problem-detail.css'
})
export class ProblemDetail implements OnInit {
    protected readonly problem = signal<Problem | null>(null);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly error = signal<string | null>(null);
    protected readonly statementHtml = signal<SafeHtml>('');

    constructor(
        private problemService: ProblemService,
        private route: ActivatedRoute,
        private router: Router,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            const id = Number(params['id']);
            if (id) {
                this.loadProblem(id);
            }
        });
    }

    private loadProblem(id: number): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.problemService.getProblemById<Problem>(id).subscribe({
            next: (problem) => {
                this.problem.set(problem);
                // Parse markdown statement and sanitize HTML
                const htmlContent = marked.parse(problem.statement) as string;
                this.statementHtml.set(this.sanitizer.bypassSecurityTrustHtml(htmlContent));
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading problem:', error);
                this.error.set('Problem not found');
                this.isLoading.set(false);
            }
        });
    }

    protected goBack(): void {
        this.router.navigate(['/problems']);
    }

    protected getDifficultyClass(difficulty: string): string {
        const difficultyMap: { [key: string]: string } = {
            'VERY_EASY': 'very-easy',
            'EASY': 'easy',
            'MEDIUM': 'medium',
            'HARD': 'hard',
            'VERY_HARD': 'very-hard'
        };
        return difficultyMap[difficulty] || 'medium';
    }

    protected getDifficultyLabel(difficulty: string): string {
        const labelMap: { [key: string]: string } = {
            'VERY_EASY': 'Very Easy',
            'EASY': 'Easy',
            'MEDIUM': 'Medium',
            'HARD': 'Hard',
            'VERY_HARD': 'Very Hard'
        };
        return labelMap[difficulty] || difficulty;
    }

    protected formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
