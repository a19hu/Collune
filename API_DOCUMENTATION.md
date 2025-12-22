# Banking API Documentation

## Base URL
```
http://localhost:8000
```

## Admin Credentials
- **Username:** `a19hu`
- **Password:** `a19hu`

## Customer Test Accounts
- **Username:** `customer1` | **Password:** `pass123`
- **Username:** `customer2` | **Password:** `pass123`
- **Username:** `customer3` | **Password:** `pass123`
- **Username:** `customer4` | **Password:** `pass123`

---

## Authentication Endpoints

### 1. Login (Get Access Token)
```bash
curl -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{
    "username": "a19hu",
    "password": "a19hu"
  }'
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Set Token Variable (for subsequent requests):**
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "a19hu", "password": "a19hu"}' | jq -r '.access')
```

### 2. Refresh Token
```bash
curl -X POST http://localhost:8000/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh": "YOUR_REFRESH_TOKEN"
  }'
```

---

## User Endpoints

### 3. Signup (Create New User with KYC)
**Permission:** Public (AllowAny)

```bash
curl -X POST http://localhost:8000/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@example.com",
    "password": "securepass123",
    "name": "John Doe",
    "phone_number": "+919876543210",
    "date_of_birth": "1990-01-01",
    "address": "123 Main St, City",
    "aadhaar_number": "123456789012",
    "pan_number": "ABCDE1234F"
  }'
```

**Response:**
```json
{
  "message": "Signup and KYC completed successfully"
}
```

### 4. Get User Profile
**Permission:** Authenticated Users

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "newuser", "password": "securepass123"}' | jq -r '.access')

curl -X GET http://localhost:8000/profile/ \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "customer1",
    "email": "customer1@bank.com",
    "first_name": "Customer",
    "last_name": "One"
  },
  "kyc": {
    "id": 1,
    "name": "Customer One",
    "phone_number": "+919876543210",
    "date_of_birth": "1990-01-15",
    "address": "123 Main Street",
    "aadhaar_number": "123456789012",
    "pan_number": "ABCDE1234F",
    "status": "APPROVED"
  },
  "accounts": [
    {
      "id": 1,
      "account_number": 68611961964,
      "account_type": "SAVINGS",
      "balance": "10000.00"
    }
  ],
  "recent_transactions": [...],
  "loans": [...],
  "stats": {
    "total_accounts": 1,
    "total_balance": 10000.0,
    "active_loans": 0
  }
}
```

---

## Account Endpoints

### 5. Get All Accounts (Current User)
**Permission:** Authenticated Users

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

curl -X GET http://localhost:8000/accounts/ \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Create New Account
**Permission:** Authenticated Users

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

curl -X POST http://localhost:8000/accounts/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "account_type": "SAVINGS",
    "balance": 5000.00
  }'
```

**Account Types:** `SAVINGS`, `CURRENT`, `FIXED_DEPOSIT`

### 7. Get Account Details
**Permission:** Authenticated Users (Own accounts only)

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

curl -X GET http://localhost:8000/accounts/1/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## Transaction Endpoints

### 8. Transfer Money (Create Transaction)
**Permission:** Authenticated Users

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

curl -X POST http://localhost:8000/transactions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sender_account_id": 68611961964,
    "receiver_account_id": 36423197671,
    "amount": 500.00
  }'
```

**Note:** Use 11-digit account numbers, not account IDs

**Response:**
```json
{
  "message": "Transaction is being processed"
}
```

### 9. Get Transaction History
**Permission:** Authenticated Users

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

curl -X GET http://localhost:8000/transactions/history/ \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "id": 1,
    "sender": 1,
    "receiver": 2,
    "amount": "500.00",
    "created_at": "2025-12-22T10:30:00Z"
  }
]
```

### 10. Get Transaction Details
**Permission:** Authenticated Users (Related to user's accounts)

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

curl -X GET http://localhost:8000/transactions/1/ \
  -H "Authorization: Bearer $TOKEN"
```

---

## Loan Endpoints

### 11. Apply for Loan
**Permission:** Authenticated Users

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

curl -X POST http://localhost:8000/loans/apply/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "loan_type": "PERSONAL",
    "amount": 50000.00,
    "tenure_months": 12
  }'
```

**Loan Types:** `PERSONAL`, `HOME`, `CAR`, `EDUCATION`

**Response:**
```json
{
  "message": "Loan applied successfully",
  "emi": 4432.92,
  "loan": {
    "id": 1,
    "loan_type": "PERSONAL",
    "amount": "50000.00",
    "tenure_months": 12,
    "interest_rate": "12.00",
    "emi": "4432.92",
    "status": "PENDING"
  }
}
```

### 12. Approve/Reject Loan (Admin Only)
**Permission:** Admin Users Only

**Approve Loan:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "a19hu", "password": "a19hu"}' | jq -r '.access')

curl -X POST http://localhost:8000/loans/1/approve/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "action": "APPROVED"
  }'
```

**Reject Loan:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "a19hu", "password": "a19hu"}' | jq -r '.access')

curl -X POST http://localhost:8000/loans/1/approve/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "action": "REJECTED"
  }'
```

**Response:**
```json
{
  "message": "Loan approved successfully"
}
```

---

## Admin Endpoints

### 13. Get All Customers (Admin Only)
**Permission:** Admin Users Only

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "a19hu", "password": "a19hu"}' | jq -r '.access')

curl -X GET http://localhost:8000/admin/customers/ \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "total_customers": 4,
  "customers": [
    {
      "user": {
        "id": 2,
        "username": "customer1",
        "email": "customer1@bank.com"
      },
      "kyc": {...},
      "accounts": [...],
      "loans": [...],
      "stats": {
        "total_accounts": 1,
        "total_balance": 10000.0,
        "total_transactions": 5,
        "total_loans": 2,
        "active_loans": 1
      }
    }
  ]
}
```

### 14. Get Audit Logs (Admin Only)
**Permission:** Admin Users Only

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "a19hu", "password": "a19hu"}' | jq -r '.access')

curl -X GET http://localhost:8000/audit-logs/ \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
[
  {
    "user": "customer1",
    "action": "Transaction initiated: ₹500.00 from 68611961964 to 36423197671",
    "file": "views.py",
    "function": "transfer_money",
    "ip": "127.0.0.1",
    "time": "2025-12-22T10:30:00Z"
  }
]
```

---

## Complete Workflow Examples

### Example 1: Admin Login and View All Customers
```bash
# Step 1: Login as admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "a19hu", "password": "a19hu"}' | jq -r '.access')

# Step 2: View all customers
curl -s -X GET http://localhost:8000/admin/customers/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Step 3: View audit logs
curl -s -X GET http://localhost:8000/audit-logs/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'
```

### Example 2: Customer Login and Transfer Money
```bash
# Step 1: Login as customer
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

# Step 2: View accounts
curl -s -X GET http://localhost:8000/accounts/ \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq '.'

# Step 3: Transfer money (use actual account numbers from step 2)
curl -s -X POST http://localhost:8000/transactions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "sender_account_id": 68611961964,
    "receiver_account_id": 36423197671,
    "amount": 500.00
  }' | jq '.'

# Step 4: View transaction history
curl -s -X GET http://localhost:8000/transactions/history/ \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq '.'

# Step 5: View profile
curl -s -X GET http://localhost:8000/profile/ \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" | jq '.'
```

### Example 3: Apply for Loan and Admin Approval
```bash
# Step 1: Customer applies for loan
CUSTOMER_TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "customer1", "password": "pass123"}' | jq -r '.access')

LOAN_RESPONSE=$(curl -s -X POST http://localhost:8000/loans/apply/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CUSTOMER_TOKEN" \
  -d '{
    "loan_type": "PERSONAL",
    "amount": 50000.00,
    "tenure_months": 12
  }')

echo $LOAN_RESPONSE | jq '.'
LOAN_ID=$(echo $LOAN_RESPONSE | jq -r '.loan.id')

# Step 2: Admin approves loan
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "a19hu", "password": "a19hu"}' | jq -r '.access')

curl -s -X POST http://localhost:8000/loans/$LOAN_ID/approve/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "action": "APPROVED"
  }' | jq '.'
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "error": "Unauthorized sender account"
}
```

### 404 Not Found
```json
{
  "error": "Account not found"
}
```

### 400 Bad Request
```json
{
  "field_name": ["Error message"]
}
```

---

## Important Notes

1. **Account Numbers:** Use 11-digit account numbers for transactions, not account IDs
2. **Fraud Detection:** Transactions over ₹50,000 may be flagged for review
3. **Daily Limit:** Transaction daily limit is ₹50,000
4. **Celery:** Transactions are processed asynchronously via Celery
5. **Audit Logs:** All transactions and loan operations are logged automatically
6. **KYC Status:** Automatically approved in hackathon mode

---

## Testing Account Numbers
- Customer 1: `68611961964`
- Customer 2: `36423197671`
- Customer 3: `83975693472`
- Customer 4: `27942360433`
