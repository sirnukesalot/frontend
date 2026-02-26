import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { CommentService, Comment as TaskComment } from '../../../../core/services/comment.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatListModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatSlideToggleModule, MatIconModule,
  ],
    templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommentSectionComponent implements OnInit, OnDestroy {
  @Input() taskId!: number;
  comments: TaskComment[] = [];
  newComment = '';
  isPublic = true;
  canComment = false;
  isManager = false;
  private destroy$ = new Subject<void>();

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.canComment = user?.role !== 'client';
    this.isManager = user?.role === 'manager';
    this.loadComments();
  }

  loadComments(): void {
    this.commentService.list(this.taskId).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      this.comments = res.results;
      this.cdr.markForCheck();
    });
  }

  submitComment(): void {
    if (!this.newComment.trim()) return;
    this.commentService.create(this.taskId, this.newComment, this.isPublic).pipe(takeUntil(this.destroy$)).subscribe((comment) => {
      this.comments.push(comment);
      this.newComment = '';
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
