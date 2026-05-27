import { Component, OnInit, signal, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProblemService } from '../../services/problem.service';
import { ProblemDto } from '../../models/problem.models';
import { SolutionService } from '../../services/solution.service';
import { SolutionDto, SendSolutionRequest } from '../../models/solution.models';
import { AuthService } from '../../services/auth.service';
import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare const monaco: any;
declare const require: any;

marked.use(markedKatex({ throwOnError: false, output: 'html' }));

import { ProblemComments } from './problem-comments/problem-comments';

@Component({
    selector: 'app-problem-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, ProblemComments],
    templateUrl: './problem-detail.html',
    styleUrl: './problem-detail.css'
})
export class ProblemDetail implements OnInit, AfterViewChecked, OnDestroy {
    protected readonly problem = signal<ProblemDto | null>(null);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly error = signal<string | null>(null);
    protected readonly statementHtml = signal<SafeHtml>('');

    @ViewChild('codeEditor') codeEditorContainer?: ElementRef;
    private editor?: any;
    private isEditorInitializing = false;

    @ViewChild('modalCodeEditor') modalCodeEditorContainer?: ElementRef;
    private modalEditor?: any;
    private isModalEditorInitializing = false;

    availableLangs = ['python', 'c', 'cpp', 'java', 'kotlin'];
    selectedLanguage = 'python';
    currentCode = '';
    contestId: number | null = null;

    isSubmitting = signal(false);
    solutionResult = signal<SolutionDto | null>(null);
    pollInterval: any;
    isSolvingStarted = signal(false);
    solutions = signal<SolutionDto[]>([]);
    activeLeftTab = signal<'description' | 'submissions' | 'discussions'>('description');
    viewingSolution = signal<SolutionDto | null>(null);

    copiedState: { [key: string]: boolean } = {};

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
            const contestId = Number(params['contestId']);
            if (contestId) {
                this.contestId = contestId;
            }
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

        if (this.viewingSolution() && this.modalCodeEditorContainer && !this.modalEditor && !this.isModalEditorInitializing) {
            this.isModalEditorInitializing = true;
            if (typeof monaco === 'undefined') {
                require(['vs/editor/editor.main'], () => {
                    this.initModalMonaco();
                    this.isModalEditorInitializing = false;
                });
            } else {
                this.initModalMonaco();
                this.isModalEditorInitializing = false;
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

    private initModalMonaco(): void {
        if (!this.modalCodeEditorContainer) return;
        const container = this.modalCodeEditorContainer.nativeElement;
        if (container.childElementCount > 0 && !this.modalEditor) {
            container.innerHTML = '';
        }
        if (this.modalEditor) return;

        const sol = this.viewingSolution();
        if (!sol) return;

        const lang = (typeof sol.language === 'string') ? sol.language : (sol.language?.language || 'plaintext');

        this.modalEditor = monaco.editor.create(container, {
            value: sol.code || '',
            language: lang,
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            readOnly: true,
            scrollBeyondLastLine: false
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

        this.problemService.getProblemById<ProblemDto>(id).subscribe({
            next: (problem) => {
                this.problem.set(problem);
                const htmlContent = marked.parse(problem.statement) as string;
                this.statementHtml.set(this.sanitizer.bypassSecurityTrustHtml(htmlContent));
                this.isLoading.set(false);
                if (this.authService.isLoggedIn()) {
                    this.loadSolutions();
                }
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
        this.loadSolutions();
    }

    private loadSolutions(): void {
        const p = this.problem();
        if (!p) return;
        this.solutionService.getSolutionsForProblem(p.id).subscribe({
            next: (res) => this.solutions.set(res),
            error: (err) => console.error('Error loading solutions:', err)
        });
    }

    viewSolution(sol: SolutionDto): void {
        this.viewingSolution.set(sol);
    }

    closeSolutionModal(): void {
        this.viewingSolution.set(null);
        if (this.modalEditor) {
            this.modalEditor.dispose();
            this.modalEditor = undefined;
        }
    }

    getModalTitle(sol: SolutionDto): string {
        const index = this.solutions().findIndex(s => s.id === sol.id);
        if (index === -1) {
            const firstName = sol.user_first_name || 'User';
            const lastName = sol.user_last_name || '';
            return `Solution by ${firstName} ${lastName}`.trim();
        }
        return `Solution #${this.solutions().length - index}`;
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

        if (this.contestId) {
            req.contest_id = this.contestId;
        }

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
                        this.loadSolutions();
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
        if (this.contestId) {
            this.router.navigate(['/contests', this.contestId, 'contesting']);
        } else {
            this.router.navigate(['/problems']);
        }
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

    copyToClipboard(text: string, type: 'input' | 'output', index: number): void {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            const key = `${type}-${index}`;
            this.copiedState[key] = true;
            setTimeout(() => {
                this.copiedState[key] = false;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }
}
