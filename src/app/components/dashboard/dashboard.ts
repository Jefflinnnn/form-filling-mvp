import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  stats = [
    { label: 'Total Forms', value: 24, icon: 'clipboard-list', color: '#073C81', change: '+3 this week' },
    { label: 'Drafted', value: 5, icon: 'pencil', color: '#FFA632', change: '2 pending' },
    { label: 'In Review', value: 3, icon: 'eye', color: '#4299e1', change: 'Awaiting approval' },
    { label: 'Completed', value: 16, icon: 'check-circle-2', color: '#93b745', change: '+2 this week' }
  ];

  recentForms = [
    { id: 1, patient: 'Jane Smith', sin: '111-111-111', status: 'Completed', date: '2026-01-10', conditions: 3 },
    { id: 2, patient: 'John Doe', sin: '000-000-000', status: 'In Review', date: '2026-01-09', conditions: 2 },
    { id: 3, patient: 'Alice Johnson', sin: '222-222-222', status: 'Drafted', date: '2026-01-08', conditions: 1 },
  ];

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('');
  }
}
