# HCL Banking System

A comprehensive full-stack banking application with fraud detection, transaction management, loan processing, and real-time monitoring capabilities.

## 🌐 Live Demo

- **Application**: http://35.200.130.134:5173
- **Admin Panel**: http://35.200.130.134:8000/admin/
  - Username: `a19hu`
  - Password: `a19hu`

## 📋 Project Overview

This is a modern banking system that provides:
- User authentication and authorization (JWT-based)
- KYC (Know Your Customer) verification system
- Multiple account management (Savings, Current)
- Real-time transaction processing with fraud detection
- Loan application and management
- Daily transaction limits and monitoring
- Comprehensive audit logging
- Admin panel for system management

## 🏗️ Architecture

The application follows a microservices architecture with the following components:

```
┌─────────────┐
│   Nginx     │  ← Reverse Proxy & Load Balancer
└──────┬──────┘
       │
   ┌───┴────┬──────────┬──────────┐
   │        │          │          │
┌──▼──┐  ┌─▼──┐  ┌────▼────┐  ┌──▼────┐
│React│  │API │  │PostgreSQL│  │ Redis │
│ UI  │  │(DRF)│  │   DB    │  │ Cache │
└─────┘  └─┬──┘  └─────────┘  └───┬───┘
           │                       │
      ┌────▼────┐                 │
      │ Celery  │◄────────────────┘
      │ Worker  │
      └─────────┘
```

## 🗄️ Database Models

### 1. **User** (Django Built-in)
- Authentication and authorization

### 2. **KYC (Know Your Customer)**
- `user` - OneToOne with User
- `name`, `phone_number`, `date_of_birth`, `address`
- `aadhaar_number`, `pan_number`
- `document` - Uploaded verification documents
- `status` - PENDING/APPROVED/REJECTED
- `created_at`

### 3. **Account**
- `user` - ForeignKey to User
- `account_number` - Unique 11-digit BigInteger
- `account_type` - SAVINGS/CURRENT
- `balance` - Float
- `is_active` - Boolean
- `created_at`

### 4. **Transaction**
- `sender_account`, `receiver_account` - ForeignKeys to Account
- `amount` - Float
- `transaction_type` - DEBIT/CREDIT
- `is_fraud` - Boolean (AI/ML fraud detection)
- `created_at`

### 5. **Loan**
- `user` - ForeignKey to User
- `loan_type` - PERSONAL/HOME/EDUCATION
- `amount`, `tenure_months`, `interest_rate`, `emi`
- `status` - PENDING/APPROVED/REJECTED
- `created_at`

### 6. **AuditLog**
- `user` - ForeignKey to User
- `action`, `file_name`, `function_name`
- `ip_address`
- `created_at`

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library

### Backend
- **Django 4.2.17** - Python web framework
- **Django REST Framework 3.16** - RESTful API
- **PostgreSQL 13** - Relational database
- **Redis 6** - Caching and message broker
- **Celery 5.6** - Distributed task queue
- **JWT Authentication** - djangorestframework-simplejwt

### DevOps & Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Reverse proxy and load balancer
- **GCP (Google Cloud Platform)** - Cloud hosting
- **Ubuntu/Debian** - Server OS

### Additional Libraries
- **psycopg2** - PostgreSQL adapter
- **django-cors-headers** - CORS handling
- **Celery** - Asynchronous task processing
- **Redis** - Task queue backend

## 🚀 Features

### User Features
- ✅ User registration and JWT-based authentication
- ✅ KYC verification with document upload
- ✅ Multiple account creation (Savings/Current)
- ✅ Real-time money transfers between accounts
- ✅ Transaction history with filtering
- ✅ Daily transaction limits
- ✅ Loan application with EMI calculation
- ✅ Account balance tracking

### Admin Features
- ✅ User management
- ✅ KYC approval/rejection
- ✅ Transaction monitoring
- ✅ Fraud detection review
- ✅ Loan approval system
- ✅ Audit log tracking
- ✅ System-wide analytics

### Technical Features
- ✅ Fraud detection system
- ✅ Asynchronous transaction processing
- ✅ Daily transaction limits
- ✅ Audit logging for all actions
- ✅ RESTful API architecture
- ✅ JWT token-based security
- ✅ CORS-enabled for cross-origin requests
- ✅ Docker containerization
- ✅ Nginx reverse proxy

## 📦 Installation & Setup

### Prerequisites
- Docker & Docker Compose (for Docker setup)
- Python 3.11+ (for local setup)
- Node.js 20+ (for local setup)
- PostgreSQL 13+ (for local setup)
- Redis 6+ (for local setup)
- Git

### Clone Repository
```bash
git clone https://github.com/a19hu/HCLhackathon.git
cd HCLhackathon
```

## 🐳 Option 1: Run with Docker (Recommended)

### Quick Start
```bash
# Build and start all services
docker compose up --build

# Or run in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes (fresh start)
docker compose down -v
```

### What Docker Runs
- **PostgreSQL** - Database on port 5432
- **Redis** - Cache and message broker on port 6379
- **Django API** - Backend server on port 8000
- **React Frontend** - UI on port 5173
- **Celery Worker** - Background task processor
- **Nginx** - Reverse proxy (if configured)

### Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin/
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Create Superuser (Docker)
```bash
# Access Django container
docker compose exec server python manage.py createsuperuser

# Follow prompts to create admin user
```


### Access the Application (Local)
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin/
- **API Documentation**: http://localhost:8000/api/ (if enabled)

## 🔧 Local Development Tips

### Database Management
```bash
# Access PostgreSQL
psql -U postgres -d hcl_data

# View tables
\dt

# Query accounts
SELECT * FROM api_account;

# Exit
\q
```



#### Migration Issues
```bash
# Reset migrations (WARNING: Deletes all data)
python manage.py migrate --fake api zero
rm -rf server/api/migrations/00*.py
python manage.py makemigrations
python manage.py migrate
```

## 🌐 Deployment (GCP)

The application is deployed on Google Cloud Platform using:

1. **Compute Engine VM** - Ubuntu instance
2. **Docker Compose** - Multi-container orchestration
3. **Nginx** - Reverse proxy configuration
4. **Firewall Rules** - Ports 80, 443, 5173, 8000

### Production URLs
- Application: http://35.200.130.134:5173
- API: http://35.200.130.134:8000
- Admin: http://35.200.130.134:8000/admin/

## 📡 API Endpoints

### Authentication
- `POST /token` - Login and get JWT tokens
- `POST /token/refresh` - Refresh access token
- `POST /signup/` - User registration

### Accounts
- `GET /accounts/` - List user accounts
- `POST /accounts/` - Create new account
- `GET /accounts/{id}/` - Get account details

### Transactions
- `POST /transactions/` - Create transaction
- `GET /transactions/history/` - Get transaction history
- `GET /transactions/{id}/` - Get transaction details

### Loans
- `POST /loans/apply/` - Apply for loan
- `GET /loans/` - List user loans

### KYC
- `POST /kyc/` - Submit KYC documents
- `GET /kyc/` - Get KYC status

## 🔐 Security Features

- JWT-based authentication
- CSRF protection
- CORS configuration
- Password hashing (Django default)
- Input validation and sanitization
- SQL injection protection (ORM)
- XSS protection
- Audit logging for all actions

## 📊 Monitoring & Logging

- **Audit Logs**: All user actions are logged with IP addresses
- **Transaction Monitoring**: Real-time fraud detection
- **Celery Tasks**: Async processing with status tracking
- **Admin Dashboard**: System-wide analytics and monitoring


**Note**: This is a demonstration project for HCL Hackathon. Use proper security measures and credentials for production deployment.
