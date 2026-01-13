import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

interface MedicalCondition {
  icd9: string;
  icd10: string;
  description: string;
}

interface Patient {
  name: string;
  dob: string;
  healthNumber: string;
  lastVisit: string;
  medicalConditions: MedicalCondition[];
}

interface Provider {
  id: number;
  type: string;
  name: string;
  credentials: string;
  cpso: string;
  address: string;
  phone: string;
  signature: string;
}

interface ICDCode {
  icd9: string;
  icd10: string;
  description: string;
}

interface DiagnosisForm {
  icd10: string;
  icd9: string;
  description: string;
  supportingDocs: {
    longitudinal: boolean;
    investigation: boolean;
    specialist: boolean;
    discharge: boolean;
    other: boolean;
    otherText: string;
    uploadedFile: File | null;
  };
}

@Component({
  selector: 'app-form-filling',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-filling.component.html',
  styleUrls: ['./form-filling.component.scss']
})
export class FormFillingComponent implements OnInit {
  formGroup: FormGroup;
  patient: Patient | null = null;
  selectedProvider: Provider | null = null;
  providers: Provider[] = [];

  // Mock data
  private mockPatients: { [key: string]: Patient } = {
    '111-111-111': {
      name: 'Jane Smith',
      dob: '1978-05-12',
      healthNumber: '1234-567-890',
      lastVisit: '2024-11-05',
      medicalConditions: [
        { icd9: '296.3', icd10: 'F32.2', description: 'Major depressive disorder, recurrent' },
        { icd9: '300.02', icd10: 'F41.1', description: 'Generalized anxiety disorder' },
        { icd9: '724.2', icd10: 'M54.5', description: 'Low back pain' }
      ]
    },
    '000-000-000': {
      name: 'John Doe',
      dob: '1965-08-20',
      healthNumber: '9876-543-210',
      lastVisit: '2024-10-15',
      medicalConditions: [
        { icd9: '401.9', icd10: 'I10', description: 'Essential hypertension' },
        { icd9: '250.00', icd10: 'E11.9', description: 'Type 2 diabetes mellitus' }
      ]
    }
  };

  // ICD-10 to ICD-9 mapping
  private icd10ToIcd9: { [key: string]: ICDCode } = {
    'F32.2': { icd9: '296.3', icd10: 'F32.2', description: 'Major depressive disorder, recurrent' },
    'F41.1': { icd9: '300.02', icd10: 'F41.1', description: 'Generalized anxiety disorder' },
    'M54.5': { icd9: '724.2', icd10: 'M54.5', description: 'Low back pain' },
    'I10': { icd9: '401.9', icd10: 'I10', description: 'Essential hypertension' },
    'E11.9': { icd9: '250.00', icd10: 'E11.9', description: 'Type 2 diabetes mellitus' }
  };

  // ICD-9 to ICD-10 mapping (reverse lookup)
  private icd9ToIcd10: { [key: string]: ICDCode } = {
    '296.3': { icd9: '296.3', icd10: 'F32.2', description: 'Major depressive disorder, recurrent' },
    '300.02': { icd9: '300.02', icd10: 'F41.1', description: 'Generalized anxiety disorder' },
    '724.2': { icd9: '724.2', icd10: 'M54.5', description: 'Low back pain' },
    '401.9': { icd9: '401.9', icd10: 'I10', description: 'Essential hypertension' },
    '250.00': { icd9: '250.00', icd10: 'E11.9', description: 'Type 2 diabetes mellitus' }
  };

  constructor(private fb: FormBuilder) {
    this.formGroup = this.fb.group({
      patientSIN: ['', [Validators.required, Validators.pattern(/^\d{3}-\d{3}-\d{3}$/)]],
      diagnoses: this.fb.array([]),
      providerId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProviders();
    this.setupSINFormatting();
  }

  setupSINFormatting(): void {
    // Auto-format SIN as user types
    this.formGroup.get('patientSIN')?.valueChanges.subscribe(value => {
      if (!value) return;

      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '');

      // Limit to 9 digits
      const limited = digitsOnly.substring(0, 9);

      // Format with dashes: XXX-XXX-XXX
      let formatted = '';
      for (let i = 0; i < limited.length; i++) {
        if (i === 3 || i === 6) {
          formatted += '-';
        }
        formatted += limited[i];
      }

      // Only update if the formatted value is different to avoid infinite loop
      if (formatted !== value) {
        this.formGroup.get('patientSIN')?.setValue(formatted, { emitEvent: false });
      }
    });
  }

  get diagnoses(): FormArray {
    return this.formGroup.get('diagnoses') as FormArray;
  }

  loadProviders(): void {
    // In real app, this would be an API call
    this.providers = [
      {
        id: 1,
        type: 'CCFP',
        name: 'Dr. Sarah Johnson',
        credentials: 'MD, CCFP',
        cpso: '12345',
        address: '123 Medical Centre, Toronto, ON M5V 2T6',
        phone: '416-555-0100',
        signature: 'signature_dr_johnson.png'
      },
      {
        id: 2,
        type: 'Nurse Practitioner',
        name: 'Emily Chen',
        credentials: 'NP, MScN',
        cpso: '67890',
        address: '456 Health Clinic, Toronto, ON M4K 1A1',
        phone: '416-555-0200',
        signature: 'signature_np_chen.png'
      },
      {
        id: 3,
        type: 'Other Physician Specialist',
        name: 'Dr. Michael Brown',
        credentials: 'MD, FRCPC (Psychiatry)',
        cpso: '54321',
        address: '789 Specialty Centre, Toronto, ON M6G 2B5',
        phone: '416-555-0300',
        signature: 'signature_dr_brown.png'
      }
    ];
  }

  searchPatient(): void {
    const sin = this.formGroup.get('patientSIN')?.value;

    if (!sin) {
      alert('Please enter a valid SIN');
      return;
    }

    // In real app, this would be an API call to PS Suite
    const foundPatient = this.mockPatients[sin];

    if (foundPatient) {
      this.patient = foundPatient;
    } else {
      alert('Patient not found. Please check the SIN and try again.');
      this.patient = null;
    }
  }

  addDiagnosis(): void {
    // Check if patient is found
    if (!this.patient) {
      alert('⚠️ Please search and select a patient first before adding medical conditions.');
      return;
    }

    // Check maximum limit
    if (this.diagnoses.length >= 3) {
      alert('⚠️ Maximum of 3 medical conditions can be added.');
      return;
    }

    const diagnosisGroup = this.fb.group({
      icd10: ['', Validators.required],
      icd9: [''],  // Enable ICD-9 input
      description: [{ value: '', disabled: true }],
      supportingDocs: this.fb.group({
        longitudinal: [false],
        investigation: [false],
        specialist: [false],
        discharge: [false],
        other: [false],
        otherText: [''],
        uploadedFile: [null]
      })
    });

    // Subscribe to ICD-10 changes to auto-fill ICD-9
    diagnosisGroup.get('icd10')?.valueChanges.subscribe(value => {
      this.autoFillICD9(diagnosisGroup, value || '');
    });

    // Subscribe to ICD-9 changes to auto-fill ICD-10
    diagnosisGroup.get('icd9')?.valueChanges.subscribe(value => {
      this.autoFillICD10(diagnosisGroup, value || '');
    });

    this.diagnoses.push(diagnosisGroup);
  }

  removeDiagnosis(index: number): void {
    this.diagnoses.removeAt(index);
  }

  autoFillICD9(diagnosisGroup: FormGroup, icd10Code: string): void {
    const code = icd10Code.trim().toUpperCase();

    if (this.icd10ToIcd9[code]) {
      diagnosisGroup.patchValue({
        icd9: this.icd10ToIcd9[code].icd9,
        description: this.icd10ToIcd9[code].description
      });
    } else {
      diagnosisGroup.patchValue({
        icd9: '',
        description: ''
      });
    }
  }

  autoFillICD10(diagnosisGroup: FormGroup, icd9Code: string): void {
    const code = icd9Code.trim();

    if (this.icd9ToIcd10[code]) {
      diagnosisGroup.patchValue({
        icd10: this.icd9ToIcd10[code].icd10,
        description: this.icd9ToIcd10[code].description
      });
    } else {
      diagnosisGroup.patchValue({
        icd10: '',
        description: ''
      });
    }
  }

  selectPatientCondition(condition: MedicalCondition): void {
    // Check maximum limit
    if (this.diagnoses.length >= 3) {
      alert('⚠️ Maximum of 3 medical conditions can be added.');
      return;
    }

    // Check for duplicates
    if (this.isDuplicateCondition(condition.icd10)) {
      alert('⚠️ This condition has already been added.');
      return;
    }

    const diagnosisGroup = this.fb.group({
      icd10: [condition.icd10, Validators.required],
      icd9: [{ value: condition.icd9, disabled: true }],
      description: [{ value: condition.description, disabled: true }],
      supportingDocs: this.fb.group({
        longitudinal: [false],
        investigation: [false],
        specialist: [false],
        discharge: [false],
        other: [false],
        otherText: [''],
        uploadedFile: [null]
      })
    });

    // Subscribe to ICD-10 changes
    diagnosisGroup.get('icd10')?.valueChanges.subscribe(value => {
      this.autoFillICD9(diagnosisGroup, value || '');
    });

    this.diagnoses.push(diagnosisGroup);
  }

  selectProvider(provider: Provider): void {
    // Check if patient is found
    if (!this.patient) {
      alert('⚠️ Please search and select a patient first before selecting a healthcare provider.');
      return;
    }

    this.selectedProvider = provider;
    this.formGroup.patchValue({ providerId: provider.id });
  }

  canAddMoreConditions(): boolean {
    return this.patient !== null && this.diagnoses.length < 3;
  }

  isDuplicateCondition(icd10Code: string): boolean {
    const normalizedCode = icd10Code.trim().toUpperCase();
    return this.diagnoses.controls.some(control => {
      const existingCode = control.get('icd10')?.value?.trim().toUpperCase();
      return existingCode === normalizedCode;
    });
  }

  isConditionAlreadyAdded(condition: MedicalCondition): boolean {
    return this.isDuplicateCondition(condition.icd10);
  }

  onFileSelected(event: any, diagnosisIndex: number): void {
    const file = event.target.files[0];
    if (file) {
      const diagnosisGroup = this.diagnoses.at(diagnosisIndex) as FormGroup;
      const supportingDocs = diagnosisGroup.get('supportingDocs') as FormGroup;
      supportingDocs.patchValue({ uploadedFile: file });
    }
  }

  removeFile(diagnosisIndex: number): void {
    const diagnosisGroup = this.diagnoses.at(diagnosisIndex) as FormGroup;
    const supportingDocs = diagnosisGroup.get('supportingDocs') as FormGroup;
    supportingDocs.patchValue({ uploadedFile: null });
  }

  getFileName(diagnosisIndex: number): string | null {
    const diagnosisGroup = this.diagnoses.at(diagnosisIndex) as FormGroup;
    const file = diagnosisGroup.get('supportingDocs.uploadedFile')?.value;
    return file ? file.name : null;
  }

  saveDraft(): void {
    // In real app, this would save to backend
    console.log('Draft saved:', this.formGroup.value);
    alert('Draft saved successfully! You can continue editing later.');
  }

  generateForm(): void {
    // Validation
    if (!this.patient) {
      alert('Please search and select a patient first.');
      return;
    }

    if (this.diagnoses.length === 0) {
      alert('Please add at least one medical condition.');
      return;
    }

    if (!this.selectedProvider) {
      alert('Please select a healthcare provider.');
      return;
    }

    // If all validation passes
    const formData = {
      patient: this.patient,
      diagnoses: this.formGroup.get('diagnoses')?.value,
      provider: this.selectedProvider
    };

    console.log('Form data:', formData);

    // In real app, this would call backend API
    alert('✓ Form generation started! Processing patient data...');
    // Navigate to review mode or show loading screen
  }

  isOtherChecked(diagnosisIndex: number): boolean {
    const diagnosisGroup = this.diagnoses.at(diagnosisIndex) as FormGroup;
    return diagnosisGroup.get('supportingDocs.other')?.value || false;
  }
}