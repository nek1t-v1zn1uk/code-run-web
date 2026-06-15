import { Component, OnInit, OnDestroy, AfterViewInit, signal, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProblemService } from '../../../services/problem.service';
import { ProblemDto, ProblemDifficulty, ProblemTopic, ProblemsRequest } from '../../../models/problem.models';

@Component({
  selector: 'app-admin-problems-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './problems-list.html',
  styleUrl: './problems-list.css'
})
export class AdminProblemsList implements OnInit, OnDestroy, AfterViewInit {
  private problemService = inject(ProblemService);
  private router = inject(Router);
  private el = inject(ElementRef);

  problems = signal<ProblemDto[]>([]);
  isLoading = signal(false);
  isLoadingMore = signal(false);
  hasNext = signal(false);
  nextCursor = signal<string | null>(null);

  difficulties = Object.values(ProblemDifficulty);
  topics = signal<ProblemTopic[]>([]);
  
  selectedDifficulty: ProblemDifficulty | null = null;
  selectedTopic: string | null = null;
  searchQuery = signal<string>('');

  private searchSubject = new Subject<string>();
  private readonly pageSize = 20;
  private scrollContainer: Element | null = null;
  private boundScrollHandler = this.onScroll.bind(this);

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.searchQuery.set(query);
      this.loadProblems(true);
    });
  }

  ngOnInit(): void {
    this.loadTopics();
    this.loadProblems(true);
  }

  ngAfterViewInit(): void {
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
      this.loadMore();
    }
  }

  loadTopics(): void {
    this.problemService.getTopics().subscribe({
      next: (topics) => this.topics.set(topics),
      error: () => { }
    });
  }

  loadProblems(reset: boolean = false): void {
    if (reset) {
      this.isLoading.set(true);
      this.problems.set([]);
      this.nextCursor.set(null);
      this.hasNext.set(true);
    } else {
      if (this.isLoadingMore()) return;
      this.isLoadingMore.set(true);
    }

    const request: any = {
      limit: this.pageSize
    };

    if (this.nextCursor()) request.cursor = this.nextCursor();
    if (this.selectedDifficulty) request.difficulty = this.selectedDifficulty;
    if (this.selectedTopic) request.topicName = this.selectedTopic;
    if (this.searchQuery()) request.searchQuery = this.searchQuery();

    this.problemService.getAdminProblems(request).subscribe({
      next: (res) => {
        if (reset) {
          this.problems.set(res.content as any[]);
        } else {
          this.problems.update(prev => [...prev, ...res.content as any[]]);
        }
        this.hasNext.set(res.has_next);
        this.nextCursor.set(res.next_cursor ?? null);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      }
    });
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchSubject.next(input.value);
  }

  onSearchChange(): void {
    this.loadProblems(true);
  }

  loadMore(): void {
    if (!this.isLoading() && !this.isLoadingMore() && this.hasNext()) {
      this.loadProblems(false);
    }
  }

  onCreateProblem(): void {
    this.router.navigate(['/admin/problems/new']);
  }

  onEditProblem(id: number): void {
    this.router.navigate([`/admin/problems/${id}`]);
  }

  onDeleteProblem(id: number): void {
    if (confirm('Are you sure you want to delete this problem?')) {
      this.problemService.deleteProblem(id).subscribe({
        next: () => {
          this.problems.update(prev => prev.filter(p => p.id !== id));
        },
        error: (err) => alert('Failed to delete problem: ' + (err.error?.message || 'Unknown error'))
      });
    }
  }
}
