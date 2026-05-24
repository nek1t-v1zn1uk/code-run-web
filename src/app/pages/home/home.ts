import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

        <div class="recommendations">
          <h3>Recommended for you</h3>
          <p class="placeholder-text">Personalized recommendations will appear here in the future.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 900px;
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
      margin-bottom: 3rem;
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
    .recommendations {
      text-align: left;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .recommendations h3 {
      color: white;
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
    .placeholder-text {
      color: #888;
      font-style: italic;
      font-size: 0.95rem;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class Home {}
