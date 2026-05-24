import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContestService } from '../../services/contest.service';
import { ContestDto } from '../../models/contest.models';

@Component({
    selector: 'app-contests-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './contests-list.html',
    styleUrl: './contests-list.css'
})
export class ContestsList implements OnInit {
    protected readonly contests = signal<ContestDto[]>([]);
    protected readonly isLoading = signal<boolean>(true);

    constructor(
        private contestService: ContestService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadContests();
    }

    private loadContests(): void {
        this.isLoading.set(true);
        this.contestService.getAllContests().subscribe({
            next: (response) => {
                this.contests.set(response);
                this.isLoading.set(false);
            },
            error: (error) => {
                console.error('Error loading contests:', error);
                this.isLoading.set(false);
            }
        });
    }

    protected navigateToContest(id: number): void {
        this.router.navigate(['/contests', id]);
    }

    protected formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

  protected getStatus(contest: ContestDto): string {
        const now = new Date();
        const start = new Date(contest.start_time);
        const end = new Date(contest.end_time);

        if (now < start) {
            return 'Upcoming';
        } else if (now > end) {
            return 'Ended';
        } else {
            return 'Running';
        }
    }

    protected getStatusClass(status: string): string {
        switch (status) {
            case 'Upcoming': return 'status-upcoming';
            case 'Running': return 'status-running';
            case 'Ended': return 'status-ended';
            default: return '';
        }
    }
}
