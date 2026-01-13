import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  showProfileMenu = false;

  currentProvider = {
    name: 'Dr. Sarah Johnson',
    credentials: 'MD, CCFP',
    cpso: '12345',
    email: 'sarah.johnson@clinic.com'
  };

  get providerInitials(): string {
    return this.currentProvider.name
      .split(' ')
      .map(n => n[0])
      .join('');
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout() {
    alert('Logging out...');
    // In real app, handle logout logic
  }
}
