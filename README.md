# Project V - Medical Forms Platform MVP

A modern, professional medical forms management platform built with Angular. Currently supporting ISP-2519 (Medical Report for CPP Disability Benefits) with plans to expand to additional medical forms.

## 🎯 Features

- **Form Selector**: Choose from multiple medical form types (ISP-2519 currently available)
- **ISP-2519 Form Filling**: Complete disability benefits forms with:
  - Patient search and selection
  - Medical condition management (ICD-9/ICD-10 code translation)
  - Healthcare provider selection
  - Supporting documentation upload
- **Dashboard**: Quick stats and recent forms overview
- **Form Management**: View and manage forms by status (Drafted, In Review, Completed)
- **Modern UI**: Clean, professional interface with DM Sans font and Lucide icons
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Tech Stack

- **Framework**: Angular 19+
- **Backend**: Python (FastAPI), PyPDFForm
- **Language**: TypeScript, Python 3.10+
- **Styling**: CSS with modern design patterns
- **Icons**: Lucide Icons
- **Font**: DM Sans (Google Fonts)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### macOS Installation

#### 1. Install Homebrew (if not already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Install Node.js and npm
```bash
# Install Node.js (includes npm)
brew install node

# Verify installation
node --version
npm --version
```

#### 3. Install Angular CLI
```bash
npm install -g @angular/cli

# Verify installation
ng version
```

### 4. Install Python (for Backend)
Ensure you have Python 3.10 or higher installed.
```bash
python3 --version
```

### Windows Installation

#### 1. Install Node.js and npm

**Option A: Using Official Installer (Recommended)**
1. Download the LTS version from [nodejs.org](https://nodejs.org/)
2. Run the installer (.msi file)
3. Follow the installation wizard (accept defaults)
4. Restart your terminal/command prompt

**Option B: Using Chocolatey (Package Manager)**
```powershell
# Install Chocolatey first (run in PowerShell as Administrator)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Node.js
choco install nodejs

# Verify installation
node --version
npm --version
```

#### 2. Install Angular CLI
```bash
npm install -g @angular/cli

# Verify installation
ng version
```

#### 3. Install Python
Download and install Python 3.10+ from [python.org](https://www.python.org/downloads/windows/).
Ensure you check "Add Python to PATH" during installation.

## 🛠️ Project Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Jefflinnnn/form-filling-mvp.git
cd form-filling-mvp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm start
```

The application will be available at `http://localhost:4200/`

### 4. Run Backend Server
Open a new terminal window:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 5. Build for Production
```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## 📁 Project Structure

```
isp-2519-mvp/
├── backend/                        # Python FastAPI Backend
│   ├── main.py                     # API Application
│   ├── requirements.txt            # Python dependencies
│   └── README.md                   # Backend documentation
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── dashboard/          # Dashboard with stats
│   │   │   ├── form-review/        # Form review & finalization
│   │   │   ├── form-selector/      # Form type selection
│   │   │   ├── forms-list/         # Form management
│   │   │   └── navbar/             # Navigation bar
│   │   ├── componenets/            # (Note: Typo in folder name)
│   │   │   └── form-filling/       # ISP-2519 form component
│   │   ├── services/
│   │   │   ├── pdf-backend.service.ts # API communication
│   │   │   └── pdf.service.ts      # PDF handling logic
│   │   ├── utils/
│   │   │   └── pdf-field-mapping.ts # Form field mappings
│   │   ├── app.routes.ts           # Application routing
│   │   ├── app.ts                  # Root component
│   │   └── app.html                # Root template
│   ├── assets/
│   │   ├── data/                   # Mock data
│   │   └── pdfs/                   # PDF Templates
│   ├── index.html                  # Main HTML file
│   └── styles.css                  # Global styles
├── package.json                    # Frontend dependencies
└── README.md                       # This file
```

## 🎨 Design System

### Color Palette
- **Primary**: `#667eea` (Soft Violet) → `#764ba2` (Deep Purple)
- **Text**: `#334155` (Slate 700)
- **Background**: `#f8fafc` (Slate 50)
- **Success**: `#48bb78` (Green)
- **Warning**: `#f6ad55` (Orange)
- **Info**: `#4299e1` (Blue)

### Typography
- **Font Family**: DM Sans (Google Fonts)
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

## 🗺️ Roadmap

### Current (v1.0)
- ✅ ISP-2519 Form Filling
- ✅ Dashboard
- ✅ Form Management
- ✅ Navigation System

### Upcoming Features
- 🔜 ISP-2530B - Terminal Illness Medical Attestation
- 🔜 ISP-2509 - Reassessment Medical Report
- 🔜 ISP-2525 - Medical Report - Recurrence
- 🔜 IMPAIR - Scannable Impairment Evaluation
- 🔜 ISP-1800 - Declaration of Incapacity
- 🔜 Form Preview & PDF Generation
- 🔜 User Authentication
- 🔜 Backend API Integration

## 🤝 Contributing

This is currently a private MVP project. For questions or suggestions, please contact the project maintainer.

## 📄 License

Copyright © 2026 Project V. All rights reserved.

## 🐛 Known Issues

- Form preview component is in development
- PDF generation not yet implemented
- Mock data is used for patient/provider search

## 📞 Support

For support or questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for healthcare professionals**
