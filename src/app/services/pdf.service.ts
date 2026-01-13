import { Injectable } from '@angular/core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PdfFieldMapping {
    fieldId: string;
    value: string;
    isCheckbox?: boolean;
    page?: number;
    x?: number;
    y?: number;
    fontSize?: number;
}

@Injectable({
    providedIn: 'root'
})
export class PdfService {
    private pdfDoc: PDFDocument | null = null;
    private pdfBytes: Uint8Array | null = null;
    private originalPdfBytes: Uint8Array | null = null;

    /**
     * Load a PDF from a URL or path
     */
    async loadPdf(pdfUrl: string): Promise<void> {
        try {
            const response = await fetch(pdfUrl);
            const arrayBuffer = await response.arrayBuffer();
            this.originalPdfBytes = new Uint8Array(arrayBuffer);
            // Load with ignoreEncryption to handle PDFs with security settings
            this.pdfDoc = await PDFDocument.load(this.originalPdfBytes, { ignoreEncryption: true });
            this.pdfBytes = await this.pdfDoc.save();
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw error;
        }
    }

    /**
     * Get the current PDF as a blob URL for display
     */
    async getPdfBlobUrl(): Promise<string> {
        if (!this.pdfBytes) {
            throw new Error('No PDF loaded');
        }
        // Use slice to create a proper ArrayBuffer for Blob compatibility
        const buffer = this.pdfBytes.buffer.slice(
            this.pdfBytes.byteOffset,
            this.pdfBytes.byteOffset + this.pdfBytes.byteLength
        ) as ArrayBuffer;
        const blob = new Blob([buffer], { type: 'application/pdf' });
        return URL.createObjectURL(blob);
    }

    /**
     * Get form fields from the PDF (if it's a fillable form)
     */
    async getFormFields(): Promise<string[]> {
        if (!this.pdfDoc) {
            throw new Error('No PDF loaded');
        }

        const form = this.pdfDoc.getForm();
        const fields = form.getFields();
        return fields.map(field => field.getName());
    }

    /**
     * Fill a form field in the PDF
     */
    async fillFormField(fieldName: string, value: string): Promise<void> {
        if (!this.pdfDoc) {
            throw new Error('No PDF loaded');
        }

        try {
            const form = this.pdfDoc.getForm();
            const field = form.getField(fieldName);

            if (field) {
                const fieldType = field.constructor.name;

                if (fieldType === 'PDFTextField') {
                    const textField = form.getTextField(fieldName);
                    textField.setText(value);
                } else if (fieldType === 'PDFCheckBox') {
                    const checkbox = form.getCheckBox(fieldName);
                    if (value === 'true' || value === '1') {
                        checkbox.check();
                    } else {
                        checkbox.uncheck();
                    }
                } else if (fieldType === 'PDFRadioGroup') {
                    const radioGroup = form.getRadioGroup(fieldName);
                    radioGroup.select(value);
                }

                // Update the bytes after modification
                this.pdfBytes = await this.pdfDoc.save();
            }
        } catch (error) {
            console.warn(`Field ${fieldName} not found or cannot be filled:`, error);
        }
    }

    /**
     * Add text at specific coordinates (for non-fillable PDFs)
     */
    async addTextToPage(
        pageNumber: number,
        text: string,
        x: number,
        y: number,
        fontSize: number = 10
    ): Promise<void> {
        if (!this.pdfDoc) {
            throw new Error('No PDF loaded');
        }

        const pages = this.pdfDoc.getPages();
        if (pageNumber < 0 || pageNumber >= pages.length) {
            throw new Error(`Invalid page number: ${pageNumber}`);
        }

        const page = pages[pageNumber];
        const font = await this.pdfDoc.embedFont(StandardFonts.Helvetica);

        // Handle multi-line text
        const lines = text.split('\n');
        let currentY = y;

        for (const line of lines) {
            page.drawText(line, {
                x,
                y: currentY,
                size: fontSize,
                font,
                color: rgb(0, 0, 0),
            });
            currentY -= fontSize + 2; // Line spacing
        }

        this.pdfBytes = await this.pdfDoc.save();
    }

    /**
     * Add a checkmark at specific coordinates
     */
    async addCheckmark(
        pageNumber: number,
        x: number,
        y: number,
        checked: boolean = true
    ): Promise<void> {
        if (!this.pdfDoc) {
            throw new Error('No PDF loaded');
        }

        const pages = this.pdfDoc.getPages();
        if (pageNumber < 0 || pageNumber >= pages.length) {
            throw new Error(`Invalid page number: ${pageNumber}`);
        }

        const page = pages[pageNumber];
        const font = await this.pdfDoc.embedFont(StandardFonts.ZapfDingbats);

        if (checked) {
            // ZapfDingbats checkmark character
            page.drawText('4', { // ✓ in ZapfDingbats
                x,
                y,
                size: 12,
                font,
                color: rgb(0, 0, 0),
            });
        }

        this.pdfBytes = await this.pdfDoc.save();
    }

    /**
     * Fill multiple fields at once
     */
    async fillMultipleFields(fields: PdfFieldMapping[]): Promise<void> {
        for (const field of fields) {
            if (field.isCheckbox && field.page !== undefined && field.x !== undefined && field.y !== undefined) {
                await this.addCheckmark(field.page, field.x, field.y, field.value === 'true');
            } else if (field.page !== undefined && field.x !== undefined && field.y !== undefined) {
                await this.addTextToPage(
                    field.page,
                    field.value,
                    field.x,
                    field.y,
                    field.fontSize || 10
                );
            } else {
                await this.fillFormField(field.fieldId, field.value);
            }
        }
    }

    /**
     * Reset PDF to original state
     */
    async resetPdf(): Promise<void> {
        if (!this.originalPdfBytes) {
            throw new Error('No original PDF to reset to');
        }
        this.pdfDoc = await PDFDocument.load(this.originalPdfBytes, { ignoreEncryption: true });
        this.pdfBytes = await this.pdfDoc.save();
    }

    /**
     * Download the current PDF
     */
    async downloadPdf(filename: string = 'filled-form.pdf'): Promise<void> {
        if (!this.pdfBytes) {
            throw new Error('No PDF loaded');
        }

        // Use slice to create a proper ArrayBuffer for Blob compatibility
        const buffer = this.pdfBytes.buffer.slice(
            this.pdfBytes.byteOffset,
            this.pdfBytes.byteOffset + this.pdfBytes.byteLength
        ) as ArrayBuffer;
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Get total page count
     */
    getPageCount(): number {
        if (!this.pdfDoc) {
            return 0;
        }
        return this.pdfDoc.getPageCount();
    }
}
