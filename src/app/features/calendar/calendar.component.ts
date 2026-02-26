import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { TaskService, TaskListItem } from '../../core/services/task.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatListModule, MatButtonModule, MatIconModule],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent implements OnInit, OnDestroy {
  currentMonth = new Date();
  calendarDays: { date: Date; isCurrentMonth: boolean; isToday: boolean; tasks: TaskListItem[] }[] = [];
  private destroy$ = new Subject<void>();

  constructor(private taskService: TaskService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void { this.buildCalendar(); }

  prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.buildCalendar();
  }

  private buildCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    const today = new Date();

    this.calendarDays = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      this.calendarDays.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === today.toDateString(),
        tasks: [],
      });
      current.setDate(current.getDate() + 1);
    }

    this.taskService.list({
      deadline_from: startDate.toISOString(),
      deadline_to: endDate.toISOString(),
      page_size: 100,
    }).pipe(takeUntil(this.destroy$)).subscribe((res) => {
      for (const task of res.results) {
        const deadline = new Date(task.deadline);
        const day = this.calendarDays.find((d) => d.date.toDateString() === deadline.toDateString());
        if (day) day.tasks.push(task);
      }
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
