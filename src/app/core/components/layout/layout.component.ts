import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, UserInfo } from '../../services/auth.service';
import { NotificationService, Notification } from '../../services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: UserInfo | null = null;
  unreadCount = 0;
  notifications: Notification[] = [];
  filteredNavItems: NavItem[] = [];
  private destroy$ = new Subject<void>();

  private navItems: NavItem[] = [
    { label: 'Organizations', icon: 'corporate_fare', route: '/platform/organizations', roles: ['superadmin'] },
    { label: 'Board', icon: 'home', route: '/tasks', roles: ['manager', 'engineer'] },
    { label: 'Kanban', icon: 'view_kanban', route: '/kanban', roles: ['manager', 'engineer'] },
    { label: 'Clients', icon: 'business', route: '/clients', roles: ['manager'] },
    { label: 'Calendar', icon: 'calendar_today', route: '/calendar', roles: ['manager'] },
    { label: 'Reports', icon: 'assessment', route: '/reports', roles: ['manager', 'engineer'] },
    { label: 'Users', icon: 'people', route: '/admin/users', roles: ['manager'] },
    { label: 'Tags', icon: 'label', route: '/admin/tags', roles: ['manager'] },
    { label: 'My Tickets', icon: 'confirmation_number', route: '/portal', roles: ['client'] },
  ];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.currentUser = user;
      this.filteredNavItems = this.navItems.filter((item) =>
        user ? item.roles.includes(user.role) : false,
      );
      if (user) {
        this.notificationService.refreshUnreadCount();
      }
      this.cdr.markForCheck();
    });

    this.notificationService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe((count) => {
      this.unreadCount = count;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.notificationService.list(undefined, 1).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.notifications = res.results.slice(0, 10);
      this.cdr.markForCheck();
    });
  }

  onNotificationClick(notif: Notification): void {
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).pipe(takeUntil(this.destroy$)).subscribe();
    }

    if (notif.type === 'summary_ready' && notif.summary_id) {
      this.router.navigate(['/reports/summaries', notif.summary_id]);
    } else if (notif.task_id) {
      this.router.navigate(['/tasks', notif.task_id]);
    }
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.notifications = this.notifications.map((n) => ({ ...n, is_read: true }));
      this.cdr.markForCheck();
    });
  }

  getNotifIcon(notif: Notification): string {
    switch (notif.type) {
      case 'summary_ready': return 'auto_awesome';
      case 'task_assigned': return 'assignment_ind';
      case 'comment_added': return 'comment';
      case 'mention': return 'alternate_email';
      case 'status_changed': return 'sync_alt';
      case 'deadline_warning': return 'warning';
      default: return 'notifications';
    }
  }

  logout(): void {
    this.authService.logout();
  }

  get tasksItem() {
    return this.navItems.find(item => item.label === 'Board');
  }
}
