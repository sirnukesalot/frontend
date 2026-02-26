import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Subject, takeUntil } from 'rxjs';
import { ClientService, Client } from '../../../../core/services/client.service';

@Component({
  selector: 'app-client-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule],
  templateUrl: './client-detail.component.html',
  styleUrl: './client-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailComponent implements OnInit, OnDestroy {
  client: Client | null = null;
  summaryItems: { label: string; value: number }[] = [];
  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private clientService: ClientService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const id = +this.route.snapshot.params['id'];
    this.clientService.get(id).pipe(takeUntil(this.destroy$)).subscribe((client) => {
      this.client = client;
      if (client.task_summary) {
        this.summaryItems = [
          { label: 'Total', value: client.task_summary.total },
          { label: 'Created', value: client.task_summary.created },
          { label: 'In Progress', value: client.task_summary.in_progress },
          { label: 'Waiting', value: client.task_summary.waiting },
          { label: 'Done', value: client.task_summary.done },
          { label: 'Archived', value: client.task_summary.archived },
        ];
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
