import { Component, OnInit, OnDestroy, AfterViewInit, signal, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProblemService } from '../../services/problem.service';
import { ProblemDto, Topic } from '../../models/problem.models';

@Component({
    selector: 'app-problems-list',
    imports: [CommonModule],
    templateUrl: './problems-list.html',
    styleUrl: './problems-list.css'
})
export class ProblemsList implements OnInit, OnDestroy, AfterViewInit {
    protected readonly problems = signal<ProblemDto[]>([]);
    protected readonly topics = signal<Topic[]>([]);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly isLoadingMore = signal<boolean>(false);
    protected readonly selectedTopic = signal<string>('');
    protected readonly selectedDifficulty = signal<string>('');
    protected readonly searchQuery = signal<string>('');
    protected readonly hasMore = signal<boolean>(true);

    private searchSubject = new Subject<string>();
    private el = inject(ElementRef);
    private nextCursor: string | null = null;
    private readonly pageSize = 20;
    private scrollContainer: Element | null = null;
    private boundScrollHandler = this.onScroll.bind(this);

    constructor(
        private problemService: ProblemService,
        private router: Router
    ) { 
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchQuery.set(query);
            this.loadProblems(true);
        });
    }

    ngOnInit(): void {
        this.loadProblems(true);
        this.loadTopics();
    }

    ngAfterViewInit(): void {
        // Walk up the DOM to find the actual scrolling ancestor
        this.scrollContainer = this.findScrollParent(this.el.nativeElement);
        if (this.scrollContainer) {
            this.scrollContainer.addEventListener('scroll', this.boundScrollHandler, { passive: true });
        }
    }

    ngOnDestroy(): void {
        if (this.scrollContainer) {
            this.scrollContainer.removeEventListener('scroll', this.boundScrollHandler);
        }
        this.searchSubject.complete();
    }

    private findScrollParent(node: HTMLElement): Element | null {
        let current: HTMLElement | null = node.parentElement;
        while (current) {
            const style = window.getComputedStyle(current);
            const overflowY = style.overflowY;
            if (overflowY === 'auto' || overflowY === 'scroll') {
                return current;
            }
            current = current.parentElement;
        }
        return null;
    }

    private onScroll(): void {
        if (!this.scrollContainer) return;
        const { scrollTop, scrollHeight, clientHeight } = this.scrollContainer;
        if (scrollTop + clientHeight >= scrollHeight - 300) {
            this.loadMoreProblems();
        }
    }

    private loadProblems(reset: boolean = false): void {
        if (reset) {
            this.isLoading.set(true);
            this.problems.set([]);
            this.nextCursor = null;
            this.hasMore.set(true);
        } else {
            if (this.isLoadingMore()) return; // prevent duplicate calls
            this.isLoadingMore.set(true);
        }

        const request: any = {
            limit: this.pageSize
        };

        if (this.selectedDifficulty()) {
            request.difficulty = this.selectedDifficulty();
        }
        if (this.selectedTopic()) {
            request.topicName = this.selectedTopic();
        }
        if (this.searchQuery()) {
            request.searchQuery = this.searchQuery();
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
                this.hasMore.set(response.has_next);
                this.nextCursor = response.next_cursor || null;
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

    protected onSearchInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchSubject.next(input.value);
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

    protected loadMoreProblems(): void {
        if (!this.isLoading() && !this.isLoadingMore() && this.hasMore()) {
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
