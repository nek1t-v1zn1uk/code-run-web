import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProblemService } from '../../services/problem.service';
import { ProblemDto, Topic, ProblemPageResponse } from '../../models/problem.models';

@Component({
  selector: 'app-problem-picker-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './problem-picker-modal.html',
  styleUrl: './problem-picker-modal.css'
})
export class ProblemPickerModal implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Output() close = new EventEmitter<void>();
  @Output() selectProblem = new EventEmitter<ProblemDto>();

  protected readonly problems = signal<ProblemDto[]>([]);
  protected readonly topics = signal<Topic[]>([]);
  protected readonly isLoading = signal<boolean>(true);
  protected readonly isLoadingMore = signal<boolean>(false);
  protected readonly selectedTopic = signal<string>('');
  protected readonly selectedDifficulty = signal<string>('');
  protected readonly searchQuery = signal<string>('');
  protected readonly hasMore = signal<boolean>(true);

  private searchSubject = new Subject<string>();
  private nextCursor: string | null = null;
  private readonly pageSize = 15;

  constructor(private problemService: ProblemService) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.loadProblems(true);
    });
  }

  ngOnInit(): void {
    if (this.isVisible) {
      this.loadProblems(true);
      this.loadTopics();
    }
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
  }

  // Detect when modal becomes visible
  ngOnChanges(changes: any): void {
    if (changes.isVisible && changes.isVisible.currentValue === true) {
      if (this.topics().length === 0) {
        this.loadTopics();
      }
      // Reload problems to reset state on open
      this.loadProblems(true);
    }
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
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
      if (this.isLoadingMore()) return;
      this.isLoadingMore.set(true);
    }

    const request: any = { limit: this.pageSize };

    if (this.selectedDifficulty()) request.difficulty = this.selectedDifficulty();
    if (this.selectedTopic()) request.topicName = this.selectedTopic();
    if (this.searchQuery()) request.searchQuery = this.searchQuery();
    if (this.nextCursor) request.cursor = this.nextCursor;

    this.problemService.getAdminProblems(request).subscribe({
      next: (response: ProblemPageResponse) => {
        if (reset) {
          this.problems.set(response.content as ProblemDto[]);
        } else {
          this.problems.set([...this.problems(), ...(response.content as ProblemDto[])]);
        }
        this.hasMore.set(response.has_next);
        this.nextCursor = response.next_cursor || null;
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (error: any) => {
        console.error('Error loading problems:', error);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  private loadTopics(): void {
    this.problemService.getTopics().subscribe({
      next: (topics: Topic[]) => this.topics.set(topics),
      error: (err: any) => console.error('Error loading topics:', err)
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

  protected onSelect(problem: ProblemDto): void {
    this.selectProblem.emit(problem);
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected getDifficultyClass(difficulty: string): string {
    const map: { [key: string]: string } = {
      'VERY_EASY': 'very-easy', 'EASY': 'easy', 'MEDIUM': 'medium',
      'HARD': 'hard', 'VERY_HARD': 'very-hard'
    };
    return map[difficulty] || 'medium';
  }

  protected getDifficultyLabel(difficulty: string): string {
    const map: { [key: string]: string } = {
      'VERY_EASY': 'Very Easy', 'EASY': 'Easy', 'MEDIUM': 'Medium',
      'HARD': 'Hard', 'VERY_HARD': 'Very Hard'
    };
    return map[difficulty] || difficulty;
  }
}
