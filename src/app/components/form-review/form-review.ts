import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService, PdfFieldMapping } from '../../services/pdf.service';
import { PdfBackendService, PdfFieldData } from '../../services/pdf-backend.service';
import { getPdfFieldName } from '../../utils/pdf-field-mapping';
import { HttpClient } from '@angular/common/http';

interface Patient {
    firstName: string;
    lastName: string;
    dob: string;
    sin: string;
}

interface ReviewItem {
    id: number;
    sectionNumber: number;
    fieldTitle: string;
    fieldName: string;
    pdfFieldId: string;
    confidence: 'high' | 'medium' | 'low' | 'needs-review';
    llmResponse: string;
    source: string;
    isCheckbox: boolean;
    checkboxValue?: boolean;
    needsReviewMessage?: string;
    approved: boolean;
    editing: boolean;
    editValue?: string;
    // PDF coordinates for non-fillable PDFs
    page?: number;
    x?: number;
    y?: number;
}

// Field mapping for ISP-2519 PDF coordinates
// These coordinates need to be calibrated based on the actual PDF layout
const ISP2519_FIELD_MAPPINGS: { [key: string]: { page: number; x: number; y: number; fontSize?: number } } = {
    // Section 5 - Page 5 (index 4)
    'impairments': { page: 4, x: 72, y: 450, fontSize: 9 },
    'functional_limitations': { page: 4, x: 72, y: 350, fontSize: 9 },
    'prognosis_outcome': { page: 4, x: 200, y: 280 },
    'expected_duration': { page: 4, x: 200, y: 250 },
    'medications': { page: 4, x: 72, y: 180, fontSize: 9 },
    'treatments': { page: 4, x: 72, y: 120, fontSize: 9 },

    // Section 6 - Page 9 (index 8)
    'stop_working': { page: 8, x: 100, y: 650 },
    'return_to_work': { page: 8, x: 100, y: 550 },
    'return_timeline': { page: 8, x: 100, y: 450 },
    'work_type': { page: 8, x: 100, y: 350 },
};

@Component({
    selector: 'app-form-review',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './form-review.html',
    styleUrl: './form-review.css'
})
export class FormReview implements OnInit, AfterViewInit {
    @ViewChild('pdfIframe') pdfIframe?: ElementRef<HTMLIFrameElement>;

    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private sanitizer = inject(DomSanitizer);
    private pdfService = inject(PdfService);
    private pdfBackendService = inject(PdfBackendService);
    private http = inject(HttpClient);

    formId = signal<string>('');
    patient = signal<Patient>({
        firstName: 'Jane',
        lastName: 'Smith',
        dob: '1978-05-12',
        sin: '***-***-789'
    });

    reviewItems = signal<ReviewItem[]>([]);
    pdfUrl = signal<SafeResourceUrl | null>(null);
    pdfLoading = signal<boolean>(true);
    pdfError = signal<string | null>(null);
    highlightedPdfFields = signal<Set<string>>(new Set());
    currentPdfPage = signal<number>(1); // Track current PDF page for persistence

    // Computed values
    totalReviewItems = computed(() => this.reviewItems().length);
    approvedCount = computed(() => this.reviewItems().filter(item => item.approved).length);
    pendingItems = computed(() => this.reviewItems().filter(item => !item.approved));
    allItemsReviewed = computed(() => this.pendingItems().length === 0 && this.totalReviewItems() > 0);
    progressPercentage = computed(() => {
        const total = this.totalReviewItems();
        if (total === 0) return 0;
        return (this.approvedCount() / total) * 100;
    });

    patientFullName = computed(() => `${this.patient().firstName} ${this.patient().lastName}`);
    patientFormType = computed(() => 'ISP-2519');

    ngOnInit(): void {
        // Get form ID from route
        const id = this.route.snapshot.paramMap.get('formId');
        if (id) {
            this.formId.set(id);
        }

        // Load mock data and PDF
        this.loadMockData();
        this.loadPdf();
    }

    ngAfterViewInit(): void {
        // ViewChild is now available
        // We can use this to access the iframe if needed
    }

    async loadMockData(): Promise<void> {
        try {
            // Load mock patient data from JSON
            const data = await this.http.get<any>('/assets/data/mock-patient-data.json').toPromise();

            if (data) {
                this.patient.set({
                    firstName: data.patient.firstName,
                    lastName: data.patient.lastName,
                    dob: data.patient.dob,
                    sin: this.maskSin(data.patient.sin)
                });

                // Map review items from JSON
                const items: ReviewItem[] = data.reviewItems.map((item: any) => ({
                    ...item,
                    approved: false,
                    editing: false,
                    // Add PDF coordinates from mapping
                    ...(ISP2519_FIELD_MAPPINGS[item.fieldName] || {})
                }));

                this.reviewItems.set(items);
                this.updateHighlightedFields();
            }
        } catch (error) {
            console.error('Error loading mock data:', error);
            // Fall back to default data
            this.loadDefaultData();
        }
    }

    loadDefaultData(): void {
        this.reviewItems.set([
            {
                id: 1,
                sectionNumber: 5,
                fieldTitle: 'Impairment(s)',
                fieldName: 'impairments',
                pdfFieldId: 'Section5_Impairments',
                confidence: 'high',
                llmResponse: '• Severe mood disturbance\n• Cognitive impairment (concentration, focus)\n• Sleep disturbance\n• Psychomotor slowing',
                source: 'Clinical notes (2024-09-15, 2024-10-01)',
                isCheckbox: false,
                approved: false,
                editing: false,
                page: 4,
                x: 72,
                y: 450
            }
        ]);
        this.updateHighlightedFields();
    }

    maskSin(sin: string): string {
        if (!sin) return '***-***-***';
        const parts = sin.split('-');
        if (parts.length === 3) {
            return `***-***-${parts[2]}`;
        }
        return '***-***-***';
    }

    async loadPdf(): Promise<void> {
        this.pdfLoading.set(true);
        this.pdfError.set(null);

        try {
            // Display the original PDF directly in the iframe
            // This avoids pdf-lib parsing issues with complex/protected PDFs
            const pdfPath = '/assets/pdfs/ISP-2519.pdf';
            this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(pdfPath));
            this.pdfLoading.set(false);

            // Still load the PDF in pdf-lib for future manipulation (when downloading)
            // But don't block the UI if it fails
            try {
                await this.pdfService.loadPdf(pdfPath);
            } catch (pdfLibError) {
                console.warn('pdf-lib could not parse PDF, but displaying original:', pdfLibError);
                // PDF will still display, we just can't manipulate it with pdf-lib
            }
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.pdfError.set('Failed to load PDF. Please try again.');
            this.pdfLoading.set(false);
        }
    }

    async updatePdfDisplay(): Promise<void> {
        // This method is no longer needed since we display the original PDF
        // Kept for compatibility but does nothing
    }

    updateHighlightedFields(): void {
        const fields = new Set<string>();
        this.pendingItems().forEach(item => {
            fields.add(item.pdfFieldId);
        });
        this.highlightedPdfFields.set(fields);
    }

    async approveField(item: ReviewItem): Promise<void> {
        const items = this.reviewItems();
        const index = items.findIndex(i => i.id === item.id);

        if (index !== -1) {
            // Update item as approved
            items[index] = { ...item, approved: true, editing: false };
            this.reviewItems.set([...items]);
            this.updateHighlightedFields();

            // Track the current page for persistence
            if (item.page) {
                this.currentPdfPage.set(item.page);
            }

            // Update PDF in real-time using Python backend
            try {
                await this.regeneratePdfWithBackend();
            } catch (error) {
                console.warn('Could not update PDF in real-time:', error);
                this.showFieldAddedNotification(item);
            }

            // Scroll to next item if available
            setTimeout(() => {
                const nextItem = this.pendingItems()[0];
                if (nextItem) {
                    this.scrollToReviewItem(nextItem.id);
                    // Update page for next item
                    if (nextItem.page) {
                        this.currentPdfPage.set(nextItem.page);
                    }
                }
            }, 100);
        }
    }

    /**
     * Regenerate the PDF using the Python backend with all approved fields
     */
    async regeneratePdfWithBackend(): Promise<void> {
        try {
            // Get all approved items
            const approvedItems = this.reviewItems().filter(item => item.approved);

            if (approvedItems.length === 0) {
                // No fields to fill, show original PDF
                this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl('/assets/pdfs/ISP-2519.pdf'));
                return;
            }

            // Convert to backend format with actual PDF field names
            const fields: PdfFieldData[] = approvedItems.map(item => ({
                fieldName: getPdfFieldName(item.fieldName), // Use actual PDF field name
                value: item.isCheckbox ? (item.checkboxValue ? 'true' : 'false') : item.llmResponse,
                isCheckbox: item.isCheckbox,
                page: item.page,
                x: item.x,
                y: item.y
            }));

            console.log('Sending fields to backend:', fields);

            // Store the current page BEFORE updating
            const targetPage = this.currentPdfPage();
            console.log(`📄 Preserving page ${targetPage} before PDF refresh`);

            // Call backend to fill PDF using form fields (not coordinates)
            const filledPdfBlob = await this.pdfBackendService.fillPdf(
                fields,
                this.patientFullName()
            );

            // Create blob URL
            const blobUrl = this.pdfBackendService.createBlobUrl(filledPdfBlob);

            // Update the PDF URL with page fragment
            const urlWithPage = targetPage > 1 ? `${blobUrl}#page=${targetPage}` : blobUrl;
            this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(urlWithPage));

            // Wait for iframe to load, then navigate to the target page
            setTimeout(() => {
                this.navigateToPage(targetPage);
            }, 500);

            console.log(`✓ PDF updated successfully, navigating to page ${targetPage}`);
        } catch (error) {
            console.error('✗ Error regenerating PDF with backend:', error);
            throw error;
        }
    }

    /**
     * Navigate the PDF viewer to a specific page
     */
    navigateToPage(pageNumber: number): void {
        if (!this.pdfIframe?.nativeElement) {
            console.warn('PDF iframe not available for navigation');
            return;
        }

        try {
            const iframe = this.pdfIframe.nativeElement;
            const iframeWindow = iframe.contentWindow;

            if (iframeWindow) {
                // Try to navigate using the PDF viewer's built-in navigation
                // This works with the browser's built-in PDF viewer
                const targetUrl = iframe.src.split('#')[0] + `#page=${pageNumber}`;

                // Update the iframe src to include the page fragment
                if (iframe.src !== targetUrl) {
                    console.log(`🔄 Navigating PDF to page ${pageNumber}`);
                    iframe.src = targetUrl;
                }
            }
        } catch (error) {
            console.warn('Could not navigate PDF to page:', error);
        }
    }

    /**
     * Regenerate the PDF display with all approved fields
     * (Legacy method - now uses backend)
     */
    async regeneratePdfDisplay(): Promise<void> {
        await this.regeneratePdfWithBackend();
    }

    /**
     * Show a notification that a field was added (fallback when PDF can't be updated)
     */
    showFieldAddedNotification(item: ReviewItem): void {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.className = 'field-added-notification';
        notification.innerHTML = `
            <i data-lucide="check-circle"></i>
            <span>"${item.fieldTitle}" will be added to the final PDF</span>
        `;

        const container = document.querySelector('.pdf-panel');
        if (container) {
            container.appendChild(notification);

            // Initialize Lucide icon
            if (typeof (window as any).lucide !== 'undefined') {
                (window as any).lucide.createIcons();
            }

            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }

    /**
     * Add a visual overlay on the PDF to show the approved field
     * This creates the illusion of "filling" the PDF in real-time
     */
    addFieldOverlay(item: ReviewItem): void {
        const iframe = document.querySelector('.pdf-iframe') as HTMLIFrameElement;
        if (!iframe) return;

        // Get or create overlay container
        let overlayContainer = document.querySelector('.pdf-overlay-container') as HTMLElement;
        if (!overlayContainer) {
            overlayContainer = document.createElement('div');
            overlayContainer.className = 'pdf-overlay-container';
            iframe.parentElement?.appendChild(overlayContainer);
        }

        // Create overlay element for this field
        const overlay = document.createElement('div');
        overlay.className = 'pdf-field-overlay';
        overlay.id = `overlay-${item.fieldName}`;

        // Position based on PDF coordinates (these are approximate and need calibration)
        // PDF coordinates are from bottom-left, but CSS is from top-left
        // We'll need to adjust based on the actual PDF page height
        const pageHeight = 792; // Standard letter size in points (11 inches * 72 points/inch)
        const scale = 1.0; // Adjust based on iframe zoom level

        if (item.page !== undefined && item.x !== undefined && item.y !== undefined) {
            // Convert PDF coordinates (bottom-left origin) to CSS coordinates (top-left origin)
            const cssY = pageHeight - item.y;
            const cssX = item.x;

            overlay.style.position = 'absolute';
            overlay.style.left = `${cssX * scale}px`;
            overlay.style.top = `${(item.page * pageHeight + cssY) * scale}px`;
            overlay.style.fontSize = '9px';
            overlay.style.fontFamily = 'Helvetica, Arial, sans-serif';
            overlay.style.color = '#000';
            overlay.style.whiteSpace = 'pre-wrap';
            overlay.style.maxWidth = '400px';
            overlay.style.pointerEvents = 'none';
            overlay.style.zIndex = '10';

            if (item.isCheckbox) {
                overlay.textContent = item.checkboxValue ? '✓' : '';
                overlay.style.fontSize = '14px';
                overlay.style.fontWeight = 'bold';
            } else {
                overlay.textContent = item.llmResponse;
            }

            overlayContainer.appendChild(overlay);

            // Add animation
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease-in';
            setTimeout(() => {
                overlay.style.opacity = '1';
            }, 10);
        }
    }

    /**
     * Remove a field overlay (when editing)
     */
    removeFieldOverlay(fieldName: string): void {
        const overlay = document.getElementById(`overlay-${fieldName}`);
        if (overlay) {
            overlay.remove();
        }
    }

    async addFieldToPdf(item: ReviewItem): Promise<void> {
        // This will be called during finalization, not during approval
        try {
            if (item.page !== undefined && item.x !== undefined && item.y !== undefined) {
                if (item.isCheckbox) {
                    // Add checkmark for checkbox fields
                    await this.pdfService.addCheckmark(
                        item.page,
                        item.x,
                        item.y,
                        item.checkboxValue ?? true
                    );
                } else {
                    // Add text for text fields
                    await this.pdfService.addTextToPage(
                        item.page,
                        item.llmResponse,
                        item.x,
                        item.y,
                        9 // Font size
                    );
                }
            } else {
                // Try to fill form field by name
                await this.pdfService.fillFormField(item.pdfFieldId, item.llmResponse);
            }
        } catch (error) {
            console.warn(`Could not add field ${item.fieldName} to PDF:`, error);
        }
    }

    editField(item: ReviewItem): void {
        const items = this.reviewItems();
        const index = items.findIndex(i => i.id === item.id);
        if (index !== -1) {
            if (item.editing) {
                // Cancel edit
                items[index] = { ...item, editing: false, editValue: undefined };
            } else {
                // Start edit - remove overlay if field was already approved
                if (item.approved) {
                    this.removeFieldOverlay(item.fieldName);
                }
                items[index] = { ...item, editing: true, editValue: item.llmResponse };
            }
            this.reviewItems.set([...items]);
        }
    }

    async saveEdit(item: ReviewItem): Promise<void> {
        const items = this.reviewItems();
        const index = items.findIndex(i => i.id === item.id);
        if (index !== -1 && item.editValue !== undefined) {
            const updatedItem = {
                ...item,
                llmResponse: item.editValue,
                editing: false,
                editValue: undefined
            };
            items[index] = updatedItem;
            this.reviewItems.set([...items]);

            // If the item was already approved, regenerate the PDF with updated text
            if (item.approved) {
                try {
                    await this.regeneratePdfWithBackend();
                } catch (error) {
                    console.warn('Could not update PDF after edit:', error);
                    this.showFieldAddedNotification(updatedItem);
                }
            }
        }
    }

    cancelEdit(item: ReviewItem): void {
        const items = this.reviewItems();
        const index = items.findIndex(i => i.id === item.id);
        if (index !== -1) {
            items[index] = { ...item, editing: false, editValue: undefined };
            this.reviewItems.set([...items]);
        }
    }

    scrollToReviewItem(itemId: number): void {
        const element = document.getElementById(`review-item-${itemId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('pulse-highlight');
            setTimeout(() => {
                element.classList.remove('pulse-highlight');
            }, 1000);
        }
    }

    saveDraft(): void {
        console.log('Saving draft...', {
            formId: this.formId(),
            patient: this.patient(),
            approvedCount: this.approvedCount(),
            items: this.reviewItems()
        });
        alert('Draft saved successfully!');
    }

    async finalize(): Promise<void> {
        if (!this.allItemsReviewed()) {
            alert(`Please review all ${this.pendingItems().length} remaining items before finalizing.`);
            return;
        }

        console.log('Finalizing form...', {
            formId: this.formId(),
            patient: this.patient(),
            reviewedItems: this.reviewItems()
        });

        try {
            // Get all approved items
            const approvedItems = this.reviewItems().filter(item => item.approved);

            // Convert to backend format with actual PDF field names
            const fields: PdfFieldData[] = approvedItems.map(item => ({
                fieldName: getPdfFieldName(item.fieldName),
                value: item.isCheckbox ? (item.checkboxValue ? 'true' : 'false') : item.llmResponse,
                isCheckbox: item.isCheckbox,
                page: item.page,
                x: item.x,
                y: item.y
            }));

            console.log('Generating final PDF with backend...');

            // Call backend to fill PDF
            const filledPdfBlob = await this.pdfBackendService.fillPdf(
                fields,
                this.patientFullName()
            );

            // Download the filled PDF
            const filename = `ISP-2519_${this.patient().lastName}_${this.patient().firstName}_${new Date().toISOString().split('T')[0]}.pdf`;

            const link = document.createElement('a');
            link.href = URL.createObjectURL(filledPdfBlob);
            link.download = filename;
            link.click();

            // Clean up
            setTimeout(() => URL.revokeObjectURL(link.href), 100);

            console.log('✓ PDF finalized and downloaded successfully');
            alert('Form finalized and downloaded! You can now print and sign the physical copy.');
        } catch (error) {
            console.error('✗ Error generating final PDF:', error);
            alert('Unable to generate the filled PDF. Please try again or contact support.');
        }
    }

    getConfidenceBadgeClass(confidence: string): string {
        return `confidence-badge confidence-${confidence}`;
    }

    isFieldHighlighted(fieldId: string): boolean {
        return this.highlightedPdfFields().has(fieldId);
    }
}
