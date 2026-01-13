import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

export interface PdfFieldData {
    fieldName: string;
    value: string;
    isCheckbox?: boolean;
    page?: number;
    x?: number;
    y?: number;
}

export interface FillPdfRequest {
    fields: PdfFieldData[];
    patientName?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PdfBackendService {
    private http = inject(HttpClient);
    private readonly API_URL = 'http://localhost:8000/api/pdf';

    /**
     * Fill the PDF with provided fields using the Python backend
     */
    async fillPdf(fields: PdfFieldData[], patientName?: string): Promise<Blob> {
        const request: FillPdfRequest = {
            fields,
            patientName
        };

        try {
            const blob = await firstValueFrom(
                this.http.post(`${this.API_URL}/fill`, request, {
                    responseType: 'blob'
                })
            );
            return blob;
        } catch (error) {
            console.error('Error filling PDF via backend:', error);
            throw error;
        }
    }

    /**
     * Fill PDF using coordinate-based approach (fallback)
     */
    async fillPdfWithCoordinates(fields: PdfFieldData[], patientName?: string): Promise<Blob> {
        const request: FillPdfRequest = {
            fields,
            patientName
        };

        try {
            const blob = await firstValueFrom(
                this.http.post(`${this.API_URL}/fill-coordinates`, request, {
                    responseType: 'blob'
                })
            );
            return blob;
        } catch (error) {
            console.error('Error filling PDF with coordinates:', error);
            throw error;
        }
    }

    /**
     * Get available PDF fields
     */
    async getPdfFields(): Promise<{ fields: string[]; isFormFillable: boolean }> {
        try {
            return await firstValueFrom(
                this.http.get<{ fields: string[]; isFormFillable: boolean }>(`${this.API_URL}/fields`)
            );
        } catch (error) {
            console.error('Error getting PDF fields:', error);
            throw error;
        }
    }

    /**
     * Create a blob URL from a blob for display in iframe
     */
    createBlobUrl(blob: Blob): string {
        return URL.createObjectURL(blob);
    }

    /**
     * Revoke a blob URL to free memory
     */
    revokeBlobUrl(url: string): void {
        URL.revokeObjectURL(url);
    }
}
