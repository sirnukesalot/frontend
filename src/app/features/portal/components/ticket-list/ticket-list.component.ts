import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-ticket-list',
    imports: [CommonModule, RouterModule, MatTableModule, MatChipsModule, MatPaginatorModule],
    templateUrl: './ticket-list.component.html',
    styleUrl: './ticket-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketListComponent implements OnInit, OnDestroy {
  tickets: any[] = [];
  total = 0;
  columns = ['title', 'status', 'priority', 'deadline'];
  private page = 1;
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    const params = new HttpParams().set('page', String(this.page));
    this.http.get<any>(`${environment.apiUrl}/portal/tickets/`, { params }).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.tickets = res.results;
      this.total = res.count;
      this.cdr.markForCheck();
    });
  }

  onPage(event: PageEvent): void { this.page = event.pageIndex + 1; this.load(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
