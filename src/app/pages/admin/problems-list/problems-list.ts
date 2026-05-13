import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProblemService } from '../../../services/problem.service';
import { ProblemDto, ProblemDifficulty } from '../../../models/problem.models';

@Component({
  selector: 'app-admin-problems-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './problems-list.html',
  styleUrl: './problems-list.css'
})
export class AdminProblemsList implements OnInit {
  private problemService = inject(ProblemService);
  private router = inject(Router);

  problems = signal<ProblemDto[]>([]);
  isLoading = signal(false);
  hasNext = signal(false);
  nextCursor = signal<string | null>(null);

  difficulties = Object.values(ProblemDifficulty);
  filters = {
    difficulty: null as ProblemDifficulty | null,
    topicName: ''
  };

  ngOnInit(): void {
    this.loadProblems();
  }

  loadProblems(cursor: string | null = null): void {
    this.isLoading.set(true);
    const params: any = {
      limit: 10,
      cursor: cursor
    };
    if (this.filters.difficulty) params.difficulty = this.filters.difficulty;
    if (this.filters.topicName) params.topicName = this.filters.topicName;

    this.problemService.getProblems(params).subscribe({
      next: (res) => {
        if (cursor) {
          this.problems.update(prev => [...prev, ...res.content]);
        } else {
          this.problems.set(res.content);
        }
        this.hasNext.set(res.has_next);
        this.nextCursor.set(res.next_cursor ?? null);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadMore(): void {
    if (this.nextCursor()) {
      this.loadProblems(this.nextCursor());
    }
  }

  onCreateProblem(): void {
    this.router.navigate(['/admin/problems/new']);
  }

  onEdit(id: number): void {
    this.router.navigate([`/admin/problems/${id}`]);
  }

  onDelete(id: number): void {
    if (confirm('Are you sure you want to delete this problem?')) {
      this.problemService.deleteProblem(id).subscribe({
        next: () => {
          this.problems.update(prev => prev.filter(p => p.id !== id));
        },
        error: (err) => alert('Failed to delete problem: ' + (err.error?.message || 'Unknown error'))
      });
    }
  }

  formatDifficulty(diff: string): string {
    return diff.replace('_', ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }
}
