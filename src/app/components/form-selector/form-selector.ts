import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface FormType {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  available: boolean;
  color: string;
}

@Component({
  selector: 'app-form-selector',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './form-selector.html',
  styleUrl: './form-selector.css',
})
export class FormSelector {
  forms: FormType[] = [
    {
      id: 'isp-2519',
      code: 'ISP-2519',
      title: 'Medical Report for CPP Disability Benefits',
      description: 'Complete medical report for Canada Pension Plan disability benefit applications',
      icon: '📋',
      available: true,
      color: '#667eea'
    },
    {
      id: 'isp-2530b',
      code: 'ISP-2530B',
      title: 'Terminal Illness Medical Attestation',
      description: 'Medical attestation for terminal illness disability benefit under CPP',
      icon: '🏥',
      available: false,
      color: '#f6ad55'
    },
    {
      id: 'isp-2509',
      code: 'ISP-2509',
      title: 'Reassessment Medical Report',
      description: 'Medical report for disability benefit reassessment',
      icon: '🔄',
      available: false,
      color: '#4299e1'
    },
    {
      id: 'isp-2525',
      code: 'ISP-2525',
      title: 'Medical Report - Recurrence',
      description: 'Medical report for recurrence of the same medical problem',
      icon: '🔁',
      available: false,
      color: '#48bb78'
    },
    {
      id: 'impair',
      code: 'IMPAIR',
      title: 'Scannable Impairment Evaluation',
      description: 'Standardized impairment evaluation form',
      icon: '📊',
      available: false,
      color: '#ed64a6'
    },
    {
      id: 'isp-1800',
      code: 'ISP-1800',
      title: 'Declaration of Incapacity',
      description: "Physician's report for declaration of incapacity",
      icon: '📝',
      available: false,
      color: '#9f7aea'
    }
  ];
}
