import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeService, HomeRecommendationsDto } from '../../services/home.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="home-container">
      <div class="glass-card welcome-card">
        <h1 class="gradient-text">Welcome to CodeRun</h1>
        <p>Your ultimate platform for coding challenges and contests.</p>
        
        <div class="quick-links">
          <a routerLink="/problems" class="glass-btn">
            <span class="icon">📚</span>
            Browse Problems
          </a>
          <a routerLink="/contests" class="glass-btn">
            <span class="icon">🏆</span>
            View Contests
          </a>
          <a routerLink="/code-runner" class="glass-btn">
            <span class="icon">💻</span>
            Online Compiler
          </a>
        </div>

        <div class="dashboard-area">
          <div *ngIf="loading" class="loading-spinner">Loading dashboard...</div>
          
          <div *ngIf="!loading && data" class="dashboard-content">
            
            <!-- Contests Banners -->
            <div class="contests-row" *ngIf="data.active_contest || data.upcoming_contest">
              <div *ngIf="data.active_contest" class="contest-banner live pulse-border">
                <div class="cb-info">
                  <span class="badge active-badge">🔴 LIVE NOW</span>
                  <h2>{{ data.active_contest.name }}</h2>
                  <p>Watch the competition unfold and track the live leaderboard.</p>
                </div>
                <div class="cb-action">
                  <a [routerLink]="['/contests', data.active_contest.id]" class="btn btn-primary">Watch Live</a>
                </div>
              </div>
              
              <div *ngIf="data.upcoming_contest" class="contest-banner upcoming">
                <div class="cb-info">
                  <span class="badge upcoming-badge">📅 UPCOMING</span>
                  <h2>{{ data.upcoming_contest.name }}</h2>
                  <p>Starts on {{ data.upcoming_contest.start_time | date:'medium' }}</p>
                </div>
                <div class="cb-action">
                  <a [routerLink]="['/contests', data.upcoming_contest.id]" class="btn btn-outline-warning">View Details</a>
                </div>
              </div>
            </div>

            <!-- Problems Dashboard -->
            <div class="problems-dashboard">
              
              <!-- Left Column: In Progress & Trending -->
              <div class="problems-column">
                <div *ngIf="data.in_progress_problems && data.in_progress_problems.length > 0" class="problem-card">
                  <h3><span class="icon-sm">⏱️</span> Resume Coding</h3>
                  <div class="problem-list">
                    <a *ngFor="let p of data.in_progress_problems" [routerLink]="['/problems', p.id]" class="problem-item">
                      <span class="p-title">{{ p.title }}</span>
                      <span class="badge diff-{{ p.difficulty.toLowerCase() }}">{{ p.difficulty }}</span>
                    </a>
                  </div>
                </div>

                <div *ngIf="data.trending_problems && data.trending_problems.length > 0" class="problem-card">
                  <h3><span class="icon-sm">🔥</span> Trending Now</h3>
                  <div class="problem-list">
                    <a *ngFor="let p of data.trending_problems" [routerLink]="['/problems', p.id]" class="problem-item">
                      <span class="p-title">{{ p.title }}</span>
                      <span class="badge diff-{{ p.difficulty.toLowerCase() }}">{{ p.difficulty }}</span>
                    </a>
                  </div>
                </div>
                
                <!-- Fallback if no problems in both lists -->
                <div *ngIf="(!data.in_progress_problems || data.in_progress_problems.length === 0) && (!data.trending_problems || data.trending_problems.length === 0)" class="empty-state-card">
                  <span class="empty-icon">🌱</span>
                  <h3>Start Your Journey</h3>
                  <p>Browse our problem set and start solving to see your progress here.</p>
                  <a routerLink="/problems" class="btn btn-primary mt-3">View All Problems</a>
                </div>
              </div>

              <!-- Right Column: Roulette -->
              <div class="side-column">
                <div *ngIf="data.random_problem" class="roulette-card">
                  <div class="roulette-content">
                    <lucide-icon name="dices" class="dice-icon"></lucide-icon>
                    <h3>Feeling Lucky?</h3>
                    <p>Challenge yourself with a randomly selected problem.</p>
                    <div class="selected-problem">
                      <strong>{{ data.random_problem.title }}</strong>
                      <span class="badge diff-{{ data.random_problem.difficulty.toLowerCase() }} mt-2">{{ data.random_problem.difficulty }}</span>
                    </div>
                    <a [routerLink]="['/problems', data.random_problem.id]" class="btn btn-primary mt-3 w-100">Solve Now</a>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
      animation: fadeIn 0.4s ease-out;
    }
    .welcome-card {
      padding: 3rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    .gradient-text {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #b8b8d1;
      font-size: 1.1rem;
      margin-bottom: 2.5rem;
    }
    .quick-links {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin-bottom: 4rem;
    }
    .glass-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem 2rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      color: white;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s;
      min-width: 160px;
    }
    .glass-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-5px);
      border-color: rgba(102, 126, 234, 0.5);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    }
    .icon {
      font-size: 2rem;
    }
    .icon-sm {
      font-size: 1.2rem;
    }
    
    /* Dashboard Layout */
    .dashboard-area {
      text-align: left;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 3rem;
    }
    .loading-spinner {
      text-align: center;
      color: #888;
      padding: 2rem;
    }
    
    /* Contests Banners */
    .contests-row {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .contest-banner {
      flex: 1;
      border-radius: 16px;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: transform 0.2s;
    }
    .contest-banner:hover {
      transform: translateY(-2px);
    }
    .contest-banner.live {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .contest-banner.upcoming {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(180, 83, 9, 0.05) 100%);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .cb-info h2 {
      font-size: 1.5rem;
      color: white;
      margin-bottom: 0.5rem;
      font-weight: 700;
    }
    .cb-info p {
      font-size: 0.95rem;
      margin-bottom: 0;
      color: #e2e8f0;
    }
    .pulse-border {
      animation: pulse-live 2s infinite;
    }
    @keyframes pulse-live {
      0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(139, 92, 246, 0); }
      100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
    }
    
    /* Problems Dashboard */
    .problems-dashboard {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }
    .problems-column {
      flex: 2;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .side-column {
      flex: 1;
    }
    
    .problem-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.5rem;
    }
    .problem-card h3 {
      font-size: 1.2rem;
      color: white;
      margin-bottom: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 0.75rem;
    }
    
    .empty-state-card {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      padding: 3rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.7;
    }
    .empty-state-card h3 {
      color: white;
      margin-bottom: 0.5rem;
    }
    .empty-state-card p {
      font-size: 0.95rem;
      margin-bottom: 0;
      max-width: 300px;
    }
    
    .roulette-card {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%);
      border: 1px solid rgba(102, 126, 234, 0.3);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
    }
    .dice-icon {
      width: 3rem;
      height: 3rem;
      margin-bottom: 0.5rem;
      color: #667eea;
      display: inline-block;
    }
    .roulette-content h3 {
      font-size: 1.3rem;
      color: white;
      margin-bottom: 0.5rem;
    }
    .roulette-content p {
      font-size: 0.9rem;
      margin-bottom: 0;
    }
    .selected-problem {
      margin-top: 1.5rem;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .selected-problem strong {
      color: #e2e8f0;
      font-size: 1.05rem;
    }
    
    /* Shared Elements */
    .badge {
      font-size: 0.7rem;
      padding: 0.25rem 0.6rem;
      border-radius: 4px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .active-badge { background: #ef4444; color: white; display: inline-block; margin-bottom: 0.75rem; }
    .upcoming-badge { background: #f59e0b; color: white; display: inline-block; margin-bottom: 0.75rem; }
    
    .diff-easy { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    .diff-medium { background: rgba(234, 179, 8, 0.2); color: #facc15; }
    .diff-hard { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    .diff-very_easy { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .diff-very_hard { background: rgba(153, 27, 27, 0.3); color: #fca5a5; }
    
    .problem-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .problem-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      text-decoration: none;
      transition: background 0.2s;
    }
    .problem-item:hover {
      background: rgba(255, 255, 255, 0.09);
    }
    .p-title {
      color: #e2e8f0;
      font-size: 0.95rem;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
    }
    
    /* Buttons */
    .mt-2 { margin-top: 0.5rem; }
    .mt-3 { margin-top: 1rem; }
    .w-100 { width: 100%; box-sizing: border-box; }
    .btn {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s;
      cursor: pointer;
      display: inline-block;
      text-align: center;
    }
    .btn-primary { background: #667eea; color: white; border: none; }
    .btn-primary:hover { background: #764ba2; }
    .btn-danger { background: #ef4444; color: white; border: none; }
    .btn-danger:hover { background: #dc2626; }
    .btn-outline-warning { background: transparent; border: 1px solid #f59e0b; color: #fcd34d; }
    .btn-outline-warning:hover { background: rgba(245, 158, 11, 0.1); color: white; }
    
    @media (max-width: 768px) {
      .contests-row { flex-direction: column; }
      .contest-banner { flex-direction: column; text-align: center; gap: 1.5rem; }
      .problems-dashboard { flex-direction: column; }
      .problems-column, .side-column { width: 100%; }
      .quick-links { flex-direction: column; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class Home implements OnInit {
  private homeService = inject(HomeService);
  private cdr = inject(ChangeDetectorRef);
  
  data: HomeRecommendationsDto | null = null;
  loading = true;

  ngOnInit() {
    this.homeService.getRecommendations().subscribe({
      next: (res) => {
        console.log('API Response:', res);
        this.data = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch recommendations', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
