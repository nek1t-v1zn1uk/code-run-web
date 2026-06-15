import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { UserProfileDto } from '../../models/user.models';
import { filter, Subscription } from 'rxjs';
import { LucideAngularModule, Home, Terminal, BookOpen, Trophy, Settings, LayoutDashboard, BarChart2, Activity } from 'lucide-angular';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  activeContestId = signal<number | null>(null);
  activeContestTab = signal<'overview' | 'contesting' | 'scoreboard' | null>(null);
  userProfile = signal<UserProfileDto | null>(null);
  private routerSub!: Subscription;
  private profileSub!: Subscription;

  ngOnInit() {
    this.checkUrl(this.router.url);
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.checkUrl(event.urlAfterRedirects);
    });
    
    // Listen to profile updates globally
    this.profileSub = this.userService.profileUpdated$.subscribe(profile => {
      this.userProfile.set(profile);
    });

    this.userService.getProfile().subscribe({
      next: (profile) => this.userProfile.set(profile),
      error: (err) => console.error('Failed to load user profile', err)
    });
  }

  ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
    if (this.profileSub) this.profileSub.unsubscribe();
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

  getAvatarUrl(): string | null {
    const p = this.userProfile();
    if (p && p.photo_url) {
      return this.userService.getAvatarUrl(p.photo_url);
    }
    return null;
  }

  getUserInitials(): string {
    const p = this.userProfile();
    if (!p) return 'U';
    const first = p.first_name?.charAt(0) || '';
    const last = p.last_name?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  }
}
