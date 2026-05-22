import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProblemService } from '../../services/problem.service';
import { Problem } from '../../models/problem.models';
import { SolutionService } from '../../services/solution.service';
import { SolutionDto, SendSolutionRequest } from '../../models/solution.models';
import { AuthService } from '../../services/auth.service';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare const monaco: any;
declare const require: any;

marked.use(markedKatex({ throwOnError: false, output: 'html' }));

@Component({
    selector: 'app-problem-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './problem-detail.html',
    styleUrl: './problem-detail.css'
})
export class ProblemDetail implements OnInit, AfterViewChecked, OnDestroy {
    protected readonly problem = signal<Problem | null>(null);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly error = signal<string | null>(null);
    protected readonly statementHtml = signal<SafeHtml>('');

    @ViewChild('codeEditor') codeEditorContainer?: ElementRef;
    private editor?: any;
    private isEditorInitializing = false;

    availableLangs = ['python', 'c', 'cpp', 'java', 'kotlin'];
    selectedLanguage = 'python';
    currentCode = '';

    isSubmitting = signal(false);
    solutionResult = signal<SolutionDto | null>(null);
    pollInterval: any;
    isSolvingStarted = signal(false);

    constructor(
        private problemService: ProblemService,
        private solutionService: SolutionService,
        private authService: AuthService,
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

    ngAfterViewChecked(): void {
        if (this.problem() && this.codeEditorContainer && !this.editor && !this.isEditorInitializing) {
            this.isEditorInitializing = true;
            if (typeof monaco === 'undefined') {
                require(['vs/editor/editor.main'], () => {
                    this.initMonaco();
                    this.isEditorInitializing = false;
                });
            } else {
                this.initMonaco();
                this.isEditorInitializing = false;
            }
        }
    }

    ngOnDestroy(): void {
        if (this.editor) {
            this.editor.dispose();
        }
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    private initMonaco(): void {
        if (!this.codeEditorContainer) return;
        const container = this.codeEditorContainer.nativeElement;
        if (container.childElementCount > 0 && !this.editor) {
            container.innerHTML = '';
        }
        if (this.editor) return;

        this.editor = monaco.editor.create(container, {
            value: this.currentCode || '# Write your solution here\n',
            language: this.selectedLanguage,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false }
        });

        this.editor.onDidChangeModelContent(() => {
            this.currentCode = this.editor?.getValue() || '';
        });
    }

    onLanguageChange(): void {
        if (this.editor) {
            monaco.editor.setModelLanguage(this.editor.getModel(), this.selectedLanguage);
        }
    }

    private loadProblem(id: number): void {
        this.isLoading.set(true);
        this.error.set(null);

        this.problemService.getProblemById<Problem>(id).subscribe({
            next: (problem) => {
                this.problem.set(problem);
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

    startSolving(): void {
        if (!this.authService.isLoggedIn()) {
            this.router.navigate(['/sign-in']);
            return;
        }
        this.isSolvingStarted.set(true);
    }

    submitSolution(): void {
        const p = this.problem();
        if (!p) return;
        if (this.editor) {
            this.currentCode = this.editor.getValue();
        }
        if (!this.currentCode.trim()) return;

        this.isSubmitting.set(true);
        this.solutionResult.set(null);

        const req: SendSolutionRequest = {
            code: this.currentCode,
            language: this.selectedLanguage,
            language_version: null
        };

        this.solutionService.sendSolution(p.id, req).subscribe({
            next: (res) => {
                this.solutionResult.set(res);
                this.pollResult(res.id);
            },
            error: (err) => {
                console.error('Submit error:', err);
                this.isSubmitting.set(false);
                alert('Error submitting solution');
            }
        });
    }

    private pollResult(solutionId: number): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        this.pollInterval = setInterval(() => {
            this.solutionService.getSolution(solutionId).subscribe({
                next: (res) => {
                    this.solutionResult.set(res);
                    if (res.status !== 'IN_QUEUE' && res.status !== 'RUNNING') {
                        clearInterval(this.pollInterval);
                        this.isSubmitting.set(false);
                    }
                },
                error: (err) => {
                    console.error('Poll error:', err);
                    clearInterval(this.pollInterval);
                    this.isSubmitting.set(false);
                }
            });
        }, 2000);
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
