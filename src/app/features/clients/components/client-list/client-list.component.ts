import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { ClientService, Client } from '../../../../core/services/client.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';

@Component({
    selector: 'app-client-list',
    imports: [CommonModule, RouterModule, MatTableModule, MatButtonModule, MatIconModule, MatPaginatorModule, SearchBarComponent],
    templateUrl: './client-list.component.html',
    styleUrl: './client-list.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientListComponent implements OnInit, OnDestroy {
  clients: Client[] = [];
  totalCount = 0;
  columns = ['name', 'client_type', 'email', 'phone', 'tasks_count'];
  private page = 1;
  private searchTerm = '';
  private destroy$ = new Subject<void>();

  constructor(private clientService: ClientService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.clientService.list({ page: this.page, search: this.searchTerm } as any).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.clients = res.results;
      this.totalCount = res.count;
      this.cdr.markForCheck();
    });
  }

  onSearch(term: string): void { this.searchTerm = term; this.page = 1; this.load(); }
  onPage(event: PageEvent): void { this.page = event.pageIndex + 1; this.load(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
