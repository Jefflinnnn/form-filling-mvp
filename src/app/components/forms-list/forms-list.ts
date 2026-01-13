import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Form {
  id: number;
  patient: string;
  sin: string;
  status: 'Drafted' | 'In Review' | 'Completed';
  date: string;
  conditions: number;
  provider: string;
}

@Component({
  selector: 'app-forms-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './forms-list.html',
  styleUrl: './forms-list.css',
})
export class FormsList {
  activeTab: 'all' | 'drafted' | 'review' | 'completed' = 'all';

  allForms: Form[] = [
    { id: 1, patient: 'Jane Smith', sin: '111-111-111', status: 'Completed', date: '2026-01-10', conditions: 3, provider: 'Dr. Sarah Johnson' },
    { id: 2, patient: 'John Doe', sin: '000-000-000', status: 'In Review', date: '2026-01-09', conditions: 2, provider: 'Dr. Sarah Johnson' },
    { id: 3, patient: 'Alice Johnson', sin: '222-222-222', status: 'Drafted', date: '2026-01-08', conditions: 1, provider: 'Emily Chen' },
    { id: 4, patient: 'Bob Wilson', sin: '333-333-333', status: 'Completed', date: '2026-01-07', conditions: 2, provider: 'Dr. Michael Brown' },
    { id: 5, patient: 'Carol Davis', sin: '444-444-444', status: 'Drafted', date: '2026-01-06', conditions: 3, provider: 'Dr. Sarah Johnson' },
    { id: 6, patient: 'David Lee', sin: '555-555-555', status: 'In Review', date: '2026-01-05', conditions: 1, provider: 'Emily Chen' },
  ];

  get filteredForms(): Form[] {
    switch (this.activeTab) {
      case 'drafted':
        return this.allForms.filter(f => f.status === 'Drafted');
      case 'review':
        return this.allForms.filter(f => f.status === 'In Review');
      case 'completed':
        return this.allForms.filter(f => f.status === 'Completed');
      default:
        return this.allForms;
    }
  }

  get stats() {
    return {
      all: this.allForms.length,
      drafted: this.allForms.filter(f => f.status === 'Drafted').length,
      review: this.allForms.filter(f => f.status === 'In Review').length,
      completed: this.allForms.filter(f => f.status === 'Completed').length,
    };
  }

  setTab(tab: 'all' | 'drafted' | 'review' | 'completed') {
    this.activeTab = tab;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('');
  }
}
