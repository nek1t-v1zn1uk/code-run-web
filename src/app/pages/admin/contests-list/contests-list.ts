import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContestService } from '../../../services/contest.service';
import { ContestDto } from '../../../models/contest.models';

@Component({
  selector: 'app-admin-contests-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contests-list.html',
  styleUrl: './contests-list.css'
})
export class AdminContestsList implements OnInit {
  private contestService = inject(ContestService);
  private router = inject(Router);

  contests = signal<ContestDto[]>([]);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadContests();
  }

  loadContests(): void {
    this.isLoading.set(true);
    this.contestService.getAllContests().subscribe({
      next: (res) => {
        this.contests.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onCreateContest(): void {
    this.router.navigate(['/admin/contests/new']);
  }

  onEditContest(id: number): void {
    this.router.navigate([`/admin/contests/${id}`]);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getStatus(contest: ContestDto): string {
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);
    if (now < start) return 'Upcoming';
    if (now > end) return 'Ended';
    return 'Running';
  }
}
