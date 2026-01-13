# ISP-2519 PDF Filling Backend

Python FastAPI backend for filling ISP-2519 PDF forms using PyPDFForm.

## Setup

### 1. Create Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### GET `/`
Health check endpoint
- Returns service status and PDF template information

### GET `/api/pdf/fields`
Get all fillable fields from the PDF template
- Returns: `{ fields: string[], isFormFillable: boolean }`

### POST `/api/pdf/fill`
Fill the PDF using form fields
- Request body:
```json
{
  "fields": [
    {
      "fieldName": "field_name",
      "value": "field_value",
      "isCheckbox": false
    }
  ],
  "patientName": "Patient Name"
}
```
- Returns: Filled PDF as binary

### POST `/api/pdf/fill-coordinates`
Fill the PDF by drawing text at specific coordinates (for non-fillable PDFs)
- Request body: Same as `/api/pdf/fill` but with additional `page`, `x`, `y` coordinates
- Returns: Filled PDF as binary

## Development

The backend uses:
- **FastAPI** - Modern Python web framework
- **PyPDFForm** - PDF form filling library
- **Uvicorn** - ASGI server

## CORS

CORS is enabled for `http://localhost:4200` (Angular frontend).

## Notes

- The PDF template is located at `../src/assets/pdfs/ISP-2519.pdf`
- PyPDFForm can handle both fillable and non-fillable PDFs
- For non-fillable PDFs, use the `/api/pdf/fill-coordinates` endpoint with x, y coordinates
