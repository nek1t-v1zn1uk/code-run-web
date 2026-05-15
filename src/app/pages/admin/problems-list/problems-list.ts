import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProblemService } from '../../../services/problem.service';
import { ProblemDto, ProblemDifficulty, ProblemTopic, ProblemsRequest } from '../../../models/problem.models';

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
  topics = signal<ProblemTopic[]>([]);
  
  selectedDifficulty: ProblemDifficulty | null = null;
  selectedTopic: string | null = null;

  ngOnInit(): void {
    this.loadTopics();
    this.loadProblems();
  }

  loadTopics(): void {
    this.problemService.getTopics().subscribe({
      next: (topics) => this.topics.set(topics),
      error: () => { }
    });
  }

  loadProblems(cursor: string | null = null): void {
    this.isLoading.set(true);
    const request: ProblemsRequest = {
      limit: 10,
      ...(cursor ? { cursor } : {}),
      ...(this.selectedDifficulty ? { difficulty: this.selectedDifficulty } : {}),
      ...(this.selectedTopic ? { topicName: this.selectedTopic } : {})
    };

    this.problemService.getProblems(request).subscribe({
      next: (res) => {
        if (cursor) {
          this.problems.update(prev => [...prev, ...res.content as any[]]);
        } else {
          this.problems.set(res.content as any[]);
        }
        this.hasNext.set(res.hasNext);
        this.nextCursor.set(res.nextCursor ?? null);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }


  onSearchChange(): void {
    this.loadProblems();
  }

  loadMore(): void {
    if (this.nextCursor()) {
      this.loadProblems(this.nextCursor());
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
