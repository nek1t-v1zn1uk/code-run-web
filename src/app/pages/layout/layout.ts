import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { filter, Subscription } from 'rxjs';
import { LucideAngularModule, Home, Terminal, BookOpen, Trophy, Settings, LayoutDashboard, BarChart2, Activity } from 'lucide-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  private authService = inject(AuthService);
  private router = inject(Router);

  activeContestId = signal<number | null>(null);
  activeContestTab = signal<'overview' | 'contesting' | 'scoreboard' | null>(null);
  private routerSub!: Subscription;

  ngOnInit() {
    this.checkUrl(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkUrl(event.urlAfterRedirects);
    });
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
  }

  private checkUrl(url: string) {
    const cleanUrl = url.split('?')[0];
    const match = cleanUrl.match(/^\/contests\/(\d+)\/(overview|contesting|scoreboard|problems(?:\/\d+)?)$/);
    if (match) {
      this.activeContestId.set(Number(match[1]));
      let tab = match[2];
      if (tab.startsWith('problems')) {
        tab = 'contesting';
      }
      this.activeContestTab.set(tab as any);
    } else {
      this.activeContestId.set(null);
      this.activeContestTab.set(null);
    }
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/sign-in']);
  }
}
