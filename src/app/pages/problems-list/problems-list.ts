import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProblemsService } from '../../services/problems.service';
import { Problem, Topic } from '../../models/problem.model';

@Component({
    selector: 'app-problems-list',
    imports: [CommonModule],
    templateUrl: './problems-list.html',
    styleUrl: './problems-list.css'
})
export class ProblemsList implements OnInit {
    protected readonly problems = signal<Problem[]>([]);
    protected readonly topics = signal<Topic[]>([]);
    protected readonly isLoading = signal<boolean>(true);
    protected readonly selectedTopic = signal<string>('');
    protected readonly selectedDifficulty = signal<string>('');
    protected readonly selectedSort = signal<string>('newest');
    protected readonly searchQuery = signal<string>('');

    constructor(
        private problemsService: ProblemsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadProblems();
        this.loadTopics();
    }

    private loadProblems(): void {
        this.isLoading.set(true);
        this.problemsService.getProblems().subscribe({
            next: (problems) => {
                this.problems.set(problems);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading problems:', error);
                this.isLoading.set(false);
            }
        });
    }

    private loadTopics(): void {
        this.problemsService.getTopics().subscribe({
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
        this.searchQuery.set(input.value);
    }

    protected onTopicChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.selectedTopic.set(select.value);
    }

    protected onDifficultyChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.selectedDifficulty.set(select.value);
    }

    protected onSortChange(event: Event): void {
        const select = event.target as HTMLSelectElement;
        this.selectedSort.set(select.value);
    }

    protected get filteredProblems(): Problem[] {
        let filtered = [...this.problems()];

        // Apply search filter
        const search = this.searchQuery().toLowerCase().trim();
        if (search) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(search)
            );
        }

        // Apply topic filter
        const selectedTopic = this.selectedTopic();
        if (selectedTopic) {
            filtered = filtered.filter(p => p.topic.name === selectedTopic);
        }

        // Apply difficulty filter
        const selectedDifficulty = this.selectedDifficulty();
        if (selectedDifficulty) {
            filtered = filtered.filter(p => p.difficulty === selectedDifficulty);
        }

        // Apply sorting
        const sort = this.selectedSort();
        filtered.sort((a, b) => {
            switch (sort) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'difficulty':
                    const difficultyOrder = {
                        'VERY_EASY': 1,
                        'EASY': 2,
                        'MEDIUM': 3,
                        'HARD': 4,
                        'VERY_HARD': 5
                    };
                    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        return filtered;
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
