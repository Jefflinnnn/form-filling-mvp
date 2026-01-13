from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from PyPDFForm import PdfWrapper
import json
import io
from pathlib import Path

app = FastAPI(title="ISP-2519 PDF Filling Service")

# Enable CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to the PDF template
PDF_TEMPLATE_PATH = Path(__file__).parent.parent / "src" / "assets" / "pdfs" / "ISP-2519.pdf"


class FieldData(BaseModel):
    """Data for a single PDF field"""
    fieldName: str
    value: str
    isCheckbox: bool = False
    page: Optional[int] = None
    x: Optional[int] = None
    y: Optional[int] = None


class FillPdfRequest(BaseModel):
    """Request to fill PDF with multiple fields"""
    fields: List[FieldData]
    patientName: Optional[str] = None


class PdfFieldsResponse(BaseModel):
    """Response containing available PDF fields"""
    fields: List[str]
    isFormFillable: bool
    schema: Optional[Dict[str, Any]] = None


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "ISP-2519 PDF Filling Service",
        "status": "running",
        "pdf_template": str(PDF_TEMPLATE_PATH),
        "template_exists": PDF_TEMPLATE_PATH.exists()
    }


@app.get("/api/pdf/fields", response_model=PdfFieldsResponse)
async def get_pdf_fields():
    """
    Get all fillable fields from the PDF template with full schema
    """
    try:
        if not PDF_TEMPLATE_PATH.exists():
            raise HTTPException(status_code=404, detail="PDF template not found")
        
        # Load the PDF and get its schema
        pdf = PdfWrapper(str(PDF_TEMPLATE_PATH))
        
        # Get field names from schema
        schema = pdf.schema if hasattr(pdf, 'schema') else {}
        fields = list(schema.keys())
        
        print(f"PDF Schema: {json.dumps(schema, indent=2)}")
        
        return PdfFieldsResponse(
            fields=fields,
            isFormFillable=len(fields) > 0,
            schema=schema
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {str(e)}")


@app.get("/api/pdf/schema")
async def get_pdf_schema():
    """
    Get the complete PDF form schema for debugging
    """
    try:
        if not PDF_TEMPLATE_PATH.exists():
            raise HTTPException(status_code=404, detail="PDF template not found")
        
        pdf = PdfWrapper(str(PDF_TEMPLATE_PATH))
        
        schema = pdf.schema if hasattr(pdf, 'schema') else {}
        sample_data = pdf.sample_data if hasattr(pdf, 'sample_data') else {}
        
        print("=== PDF SCHEMA ===")
        print(json.dumps(schema, indent=2))
        
        return {
            "schema": schema,
            "sample_data": sample_data,
            "field_count": len(schema)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF schema: {str(e)}")


@app.post("/api/pdf/fill")
async def fill_pdf(request: FillPdfRequest):
    """
    Fill the PDF with provided field data and return the filled PDF
    Uses adobe_mode=True for better compatibility with government forms
    """
    try:
        if not PDF_TEMPLATE_PATH.exists():
            raise HTTPException(status_code=404, detail="PDF template not found")
        
        # Load the PDF
        pdf = PdfWrapper(str(PDF_TEMPLATE_PATH))
        
        # Prepare field data dictionary
        field_dict = {}
        
        for field in request.fields:
            # Use the fieldName directly as provided by frontend
            if field.isCheckbox:
                # For checkboxes, use boolean values
                field_dict[field.fieldName] = field.value.lower() in ['true', '1', 'yes']
            else:
                field_dict[field.fieldName] = field.value
        
        print(f"=== FILLING PDF ===")
        print(f"Fields to fill: {json.dumps(field_dict, indent=2)}")
        
        # Fill the PDF with adobe_mode=True for government forms
        try:
            filled_pdf = pdf.fill(field_dict, adobe_mode=True)
            filled_pdf_bytes = filled_pdf.read()
            
            print(f"✓ PDF filled successfully ({len(filled_pdf_bytes)} bytes)")
            
            # Return the PDF as a response
            return Response(
                content=filled_pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f"inline; filename=ISP-2519-filled.pdf",
                    "Access-Control-Expose-Headers": "Content-Disposition"
                }
            )
        except Exception as fill_error:
            print(f"✗ Error filling PDF: {fill_error}")
            # Return original PDF if filling fails
            with open(PDF_TEMPLATE_PATH, 'rb') as f:
                return Response(
                    content=f.read(),
                    media_type="application/pdf",
                    headers={
                        "Content-Disposition": f"inline; filename=ISP-2519-original.pdf",
                        "X-Fill-Error": str(fill_error)
                    }
                )
    
    except Exception as e:
        print(f"✗ Error in fill_pdf endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error filling PDF: {str(e)}")


@app.post("/api/pdf/fill-coordinates")
async def fill_pdf_with_coordinates(request: FillPdfRequest):
    """
    Fill the PDF by drawing text at specific coordinates
    (Fallback for non-fillable PDFs)
    """
    try:
        if not PDF_TEMPLATE_PATH.exists():
            raise HTTPException(status_code=404, detail="PDF template not found")
        
        # Load the PDF
        pdf = PdfWrapper(str(PDF_TEMPLATE_PATH))
        
        # For coordinate-based filling, we'll need to use reportlab or similar
        # PyPDFForm can also handle this with draw_text method
        
        for field in request.fields:
            if field.page is not None and field.x is not None and field.y is not None:
                try:
                    # Draw text at coordinates
                    # Note: PyPDFForm coordinates might need adjustment
                    pdf.draw_text(
                        field.value,
                        page=field.page,
                        x=field.x,
                        y=field.y,
                        font_size=9
                    )
                except Exception as draw_error:
                    print(f"Could not draw field {field.fieldName}: {draw_error}")
        
        # Get the filled PDF as bytes
        filled_pdf_stream = pdf.stream
        
        return Response(
            content=filled_pdf_stream,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=ISP-2519-filled.pdf"
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error filling PDF: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
