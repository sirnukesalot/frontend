import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TagService, Tag } from '../../core/services/tag.service';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';

@Component({
  selector: 'app-tag-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSnackBarModule,
    SearchBarComponent,
  ],
  templateUrl: './tag-management.component.html',
  styleUrl: './tag-management.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagManagementComponent implements OnInit, OnDestroy {
  tags: Tag[] = [];
  columns = ['color', 'name', 'slug', 'actions'];
  showCreateForm = false;
  newTag = { name: '', color: '#6c757d' };
  private searchTerm = '';
  private destroy$ = new Subject<void>();

  constructor(
    private tagService: TagService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.tagService.list(this.searchTerm || undefined).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.tags = res.results;
      this.cdr.markForCheck();
    });
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.loadTags();
  }

  createTag(): void {
    if (!this.newTag.name.trim()) return;
    this.tagService.create(this.newTag.name.trim(), this.newTag.color).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Tag created', 'OK', { duration: 3000 });
        this.showCreateForm = false;
        this.newTag = { name: '', color: '#6c757d' };
        this.loadTags();
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err.error?.name?.[0] || err.error?.detail || 'Failed to create tag';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      },
    });
  }

  deleteTag(tag: Tag): void {
    this.tagService.delete(tag.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.snackBar.open('Tag deleted', 'OK', { duration: 3000 });
        this.loadTags();
      },
      error: (err) => {
        const msg = err.error?.detail || 'Failed to delete tag';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
