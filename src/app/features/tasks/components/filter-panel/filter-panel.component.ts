import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Subject, takeUntil } from 'rxjs';
import { TagService, Tag } from '../../../../core/services/tag.service';
import { ClientService, Client } from '../../../../core/services/client.service';

export interface FilterState {
  status?: string;
  priority?: string;
  deadline_from?: string;
  deadline_to?: string;
  client?: number;
  tags?: string;
  assignee?: number;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatSelectModule, MatFormFieldModule,
    MatDatepickerModule, MatNativeDateModule, MatInputModule,
    MatButtonModule, MatSlideToggleModule,
  ],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterPanelComponent implements OnInit, OnDestroy {
  @Output() filtersChange = new EventEmitter<FilterState>();
  filters: FilterState = {};
  tags: Tag[] = [];
  clients: Client[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private tagService: TagService,
    private clientService: ClientService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.tagService.list().pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.tags = res.results;
      this.cdr.markForCheck();
    });
    this.clientService.list().pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.clients = res.results;
      this.cdr.markForCheck();
    });
  }

  emitFilters(): void {
    const clean: any = {};
    Object.entries(this.filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') clean[k] = v;
    });
    this.filtersChange.emit(clean);
  }

  clearFilters(): void {
    this.filters = {};
    this.filtersChange.emit({});
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
