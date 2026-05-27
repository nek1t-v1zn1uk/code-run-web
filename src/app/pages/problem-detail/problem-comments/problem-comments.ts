import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommentService } from '../../../services/comment.service';
import { CommentDto, CreateCommentDto } from '../../../models/comment.models';
import { SolutionDto } from '../../../models/solution.models';
import { SolutionService } from '../../../services/solution.service';
import { AuthService } from '../../../services/auth.service';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-problem-comments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './problem-comments.html',
  styleUrl: './problem-comments.css'
})
export class ProblemComments implements OnInit {
  @Input() problemId!: number;
  @Input() solutions: SolutionDto[] = []; // Used for pinning accepted solutions
  @Output() solutionClick = new EventEmitter<SolutionDto>();

  comments = signal<CommentDto[]>([]);
  newCommentText = '';
  selectedSolutionId: number | null = null;
  
  replyingTo: number | null = null;
  replyText = '';
  replySelectedSolutionId: number | null = null;

  constructor(
    private commentService: CommentService,
    private solutionService: SolutionService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    if (this.problemId) {
      this.loadComments();
    }
  }

  loadComments(): void {
    this.commentService.getComments(this.problemId).subscribe({
      next: (data) => this.comments.set(data),
      error: (err) => console.error('Error loading comments', err)
    });
  }

  addComment(): void {
    if (!this.newCommentText.trim()) return;
    
    const dto: CreateCommentDto = {
      text: this.newCommentText,
      pinned_solution_id: this.selectedSolutionId || undefined
    };

    this.commentService.addComment(this.problemId, dto).subscribe({
      next: (comment) => {
        this.comments.set([comment, ...this.comments()]);
        this.newCommentText = '';
        this.selectedSolutionId = null;
      },
      error: (err) => alert('Failed to post comment')
    });
  }

  setReplyingTo(commentId: number): void {
    this.replyingTo = commentId;
    this.replyText = '';
    this.replySelectedSolutionId = null;
  }

  cancelReply(): void {
    this.replyingTo = null;
  }

  addReply(parentId: number): void {
    if (!this.replyText.trim()) return;

    const dto: CreateCommentDto = {
      text: this.replyText,
      parent_id: parentId,
      pinned_solution_id: this.replySelectedSolutionId || undefined
    };

    this.commentService.addComment(this.problemId, dto).subscribe({
      next: () => {
        this.loadComments(); // reload all comments to update nested structure
        this.replyingTo = null;
      },
      error: (err) => alert('Failed to post reply')
    });
  }

  getSolutionDisplayInfo(id: number): string {
    const index = this.solutions.findIndex(s => s.id === id);
    if (index === -1) return `Solution`;
    const sol = this.solutions[index];
    return `Solution (${sol.status.replace('_', ' ')})`;
  }

  openSolution(id: number): void {
    const sol = this.solutions.find(s => s.id === id);
    if (sol) {
      this.solutionClick.emit(sol);
    } else {
      this.solutionService.getSolution(id).subscribe({
        next: (fetchedSol) => this.solutionClick.emit(fetchedSol),
        error: (err) => alert('Cannot load this solution')
      });
    }
  }
}
