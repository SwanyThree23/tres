# CYLive — Backend Utility Service

This is the Python-based backend for the **CYLive** platform, built with **FastAPI**. It handles specialized tasks such as AI inference, data processing, and background services that complement the main Next.js application.

## 🚀 Responsibilities
- **AI Services**: Interfaces with Anthropic and other LLMs for specialized content generation.
- **Data Analytics**: Complex aggregation tasks for platform-wide statistics.
- **Worker Services**: Placeholder for future background job processing.

## 🛠️ Tech Stack
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.11+
- **Database**: SQLite (Development) / PostgreSQL (Production)
- **Containerization**: Docker

## 🏁 Getting Started

### 1. Setup Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Development Server
```bash
uvicorn main:app --reload
```

---
*Note: This service is intended to be run alongside the main Next.js frontend.*
