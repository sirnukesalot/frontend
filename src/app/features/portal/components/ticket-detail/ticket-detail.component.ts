import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatListModule, MatIconModule],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  ticket: any = null;
  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.http.get(`${environment.apiUrl}/portal/tickets/${id}/`).pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.ticket = data;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
