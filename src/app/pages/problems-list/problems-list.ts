import { Component, OnInit, OnDestroy, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProblemService } from '../../services/problem.service';
import { Problem, Topic } from '../../models/problem.models';

@Component({
    selector: 'app-problems-list',
    imports: [CommonModule],
    templateUrl: './problems-list.html',
    styleUrl: './problems-list.css'
})
export class ProblemsList implements OnInit, OnDestroy {
    protected readonly problems = signal<Problem[]>([]);
    protected readonly topics = signal<Topic[]>([]);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly isLoadingMore = signal<boolean>(false);
    protected readonly selectedTopic = signal<string>('');
    protected readonly selectedDifficulty = signal<string>('');

    private nextCursor: string | null = null;
    private hasNext = true;
    private readonly pageSize = 20;

    constructor(
        private problemService: ProblemService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadProblems(true);
        this.loadTopics();
    }

    ngOnDestroy(): void {
        // Cleanup if needed
    }

    private loadProblems(reset: boolean = false): void {
        if (reset) {
            this.isLoading.set(true);
            this.problems.set([]);
            this.nextCursor = null;
            this.hasNext = true;
        } else {
            this.isLoadingMore.set(true);
        }

        const request: any = {
            limit: this.pageSize
        };

        // Add filters
        if (this.selectedDifficulty()) {
            request.difficulty = this.selectedDifficulty();
        }
        if (this.selectedTopic()) {
            request.topicName = this.selectedTopic();
        }
        if (this.nextCursor) {
            request.cursor = this.nextCursor;
        }

        this.problemService.getProblems(request).subscribe({
            next: (response) => {
                if (reset) {
                    this.problems.set(response.content);
                } else {
                    this.problems.set([...this.problems(), ...response.content]);
                }
                this.hasNext = response.hasNext;
                this.nextCursor = response.nextCursor;
                this.isLoading.set(false);
                this.isLoadingMore.set(false);
            },
            error: (error) => {
                console.error('Error loading problems:', error);
                this.isLoading.set(false);
                this.isLoadingMore.set(false);
            }
        });
    }

    private loadTopics(): void {
        this.problemService.getTopics().subscribe({
            next: (topics) => {
                this.topics.set(topics);
            },
            error: (error) => {
                console.error('Error loading topics:', error);
            }
        });
    }

    protected onTopicChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.selectedTopic.set(select.value);
        this.loadProblems(true);
    }

    protected onDifficultyChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.selectedDifficulty.set(select.value);
        this.loadProblems(true);
    }

    @HostListener('window:scroll')
    onScroll(): void {
        const scrollPosition = window.innerHeight + window.scrollY;
        const documentHeight = document.documentElement.scrollHeight;

        // Load more when user is 200px from bottom
        if (scrollPosition >= documentHeight - 200) {
            this.loadMoreProblems();
        }
    }

    private loadMoreProblems(): void {
        if (!this.isLoading() && !this.isLoadingMore() && this.hasNext) {
            this.loadProblems(false);
        }
    }

    protected navigateToProblem(id: number): void {
        this.router.navigate(['/problems', id]);
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
            month: 'short',
            day: 'numeric'
        });
    }
}
