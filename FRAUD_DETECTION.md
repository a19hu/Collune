# Fraud Detection Integration Guide

## Overview
This project uses **FraudLabs Pro API** for real-time fraud detection on banking transactions.

## Features
✅ Real-time fraud scoring (0-100)
✅ IP-based risk analysis
✅ Transaction amount validation
✅ Automatic fraud flagging
✅ Fallback to rule-based detection

## Setup Instructions

### 1. Get FraudLabs Pro API Key (Free)

1. Go to https://www.fraudlabspro.com/sign-up
2. Create a free account
3. Copy your API Key from the dashboard
4. Free tier includes: **500 queries/month**

### 2. Configure API Key

**Option A: Environment Variable (Recommended)**
```bash
export FRAUDLABS_API_KEY='your_api_key_here'
```

**Option B: Direct in settings.py**
```python
# In server/settings.py
FRAUDLABS_API_KEY = 'your_api_key_here'
```

### 3. How It Works

#### Transaction Flow:
```
User initiates transaction
    ↓
Django View validates data
    ↓
Celery Task processes transaction
    ↓
Fraud Detection checks:
    - IP address
    - Transaction amount
    - User history
    ↓
Mark as fraud if score ≥ 70
    ↓
Save transaction with fraud flag
```

## Fraud Detection Methods

### 1. FraudLabs Pro API (Primary)
**When API key is configured:**
- Checks IP geolocation
- Analyzes transaction patterns
- Returns fraud score (0-100)
- Returns status: APPROVE, REVIEW, or REJECT

**Response Example:**
```json
{
  "is_fraud": false,
  "fraud_score": 25,
  "fraud_status": "APPROVE",
  "message": "Transaction appears safe",
  "details": {
    "distribution": "US",
    "id": "20231222123456",
    "credits": "499"
  }
}
```

### 2. Rule-Based Detection (Fallback)
**When API key is not configured:**
- Large transaction check (>₹50,000)
- Very large transaction check (>₹100,000)
- Local IP detection
- Suspicious patterns

**Rules:**
- Amount > ₹50,000 → +30 points
- Amount > ₹100,000 → +40 points
- Local IP → +10 points
- Score ≥ 70 → REJECT
- Score ≥ 40 → REVIEW
- Score < 40 → APPROVE

## Testing Fraud Detection

### Test with Normal Transaction
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/token \
  -H "Content-Type: application/json" \
  -d '{"username": "a19hu", "password": "a19hu"}' \
  | jq -r '.access')

curl -X POST http://localhost:8000/transactions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sender_account_id": "a231a877-9fdf-4c05-aa36-9a90c75f2f2a",
    "receiver_account_id": "8084178b-715f-4473-b98c-c7165a9c1d70",
    "amount": 1000.00
  }'
```
**Expected:** ✅ APPROVE (low amount)

### Test with High-Risk Transaction
```bash
curl -X POST http://localhost:8000/transactions/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "sender_account_id": "a231a877-9fdf-4c05-aa36-9a90c75f2f2a",
    "receiver_account_id": "8084178b-715f-4473-b98c-c7165a9c1d70",
    "amount": 150000.00
  }'
```
**Expected:** ⚠️ REJECT or REVIEW (high amount triggers fraud rules)

## View Fraud Transactions

### Check Transaction History
```bash
curl -X GET http://localhost:8000/transactions/history/ \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

### Filter Fraudulent Transactions (Django Shell)
```bash
source ../enva/bin/activate
python3 manage.py shell
```

```python
from api.models import Transaction

# Get all fraudulent transactions
fraud_txs = Transaction.objects.filter(is_fraud=True)
for tx in fraud_txs:
    print(f"Transaction #{tx.id}: ₹{tx.amount} - Fraud detected")

# Get fraud statistics
total = Transaction.objects.count()
fraud_count = Transaction.objects.filter(is_fraud=True).count()
fraud_rate = (fraud_count / total * 100) if total > 0 else 0
print(f"\nFraud Rate: {fraud_rate:.2f}%")
```

## Database Schema

### Transaction Model (is_fraud field)
```python
class Transaction(models.Model):
    sender_account = models.ForeignKey(Account, related_name='sent_transactions')
    receiver_account = models.ForeignKey(Account, related_name='received_transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10)
    is_fraud = models.BooleanField(default=False)  # 🔥 Fraud flag
    created_at = models.DateTimeField(auto_now_add=True)
```

## API Endpoints

### POST /transactions/
**Creates a new transaction with fraud detection**

**Request:**
```json
{
  "sender_account_id": "uuid-here",
  "receiver_account_id": "uuid-here",
  "amount": 1000.00
}
```

**Response:**
```json
{
  "message": "Transaction is being processed"
}
```

**Background Process:**
1. Validates accounts
2. Checks balance
3. Checks daily limits
4. **Runs fraud detection**
5. Updates balances
6. Saves transaction with fraud flag

## Production Recommendations

### 1. Enhanced Fraud Rules
```python
# Add more sophisticated rules:
- Velocity checks (transactions per hour)
- Geographic anomalies
- Unusual transfer patterns
- Known blacklisted IPs
```

### 2. Fraud Response Actions
```python
# In tasks.py
if fraud_result['is_fraud']:
    tx.is_fraud = True
    tx.save()
    
    # Option 1: Reverse transaction
    sender.balance += amount
    receiver.balance -= amount
    sender.save()
    receiver.save()
    
    # Option 2: Hold for manual review
    tx.status = 'PENDING_REVIEW'
    tx.save()
    
    # Option 3: Notify admin
    send_fraud_alert(tx.id)
```

### 3. Machine Learning Enhancement
```python
# Train model on historical fraud patterns
from sklearn.ensemble import RandomForestClassifier

# Features: amount, time, location, user history
# Label: is_fraud (0 or 1)
```

## Troubleshooting

### Issue: Fraud detection not working
**Check:**
1. API key is set correctly
2. Redis and Celery are running
3. Check Celery logs for errors
4. Verify IP address is being captured

### Issue: All transactions marked as fraud
**Cause:** Likely using rule-based fallback with strict rules
**Solution:** Configure FraudLabs Pro API key or adjust rules

### Issue: API timeout errors
**Solution:** Already handled with fallback to APPROVE
**Enhancement:** Consider caching results or async retries

## Monitoring

### View Celery Worker Logs
```bash
celery -A server worker -l info
```

### Check Fraud Detection Stats
```bash
python3 manage.py shell
```

```python
from api.models import Transaction
from django.db.models import Count, Avg

# Fraud statistics
stats = Transaction.objects.aggregate(
    total=Count('id'),
    fraud_count=Count('id', filter=models.Q(is_fraud=True)),
    avg_amount=Avg('amount')
)
print(stats)
```

## Cost Estimation

**FraudLabs Pro Free Tier:**
- 500 queries/month
- Perfect for hackathons and demos

**Paid Tiers:**
- Micro: $29.95/mo (2,000 queries)
- Mini: $49.95/mo (5,000 queries)
- Small: $99.95/mo (12,000 queries)

**Alternative:** Rule-based detection (free, included as fallback)

## Summary

✅ **Implemented:** Real-time fraud detection
✅ **API:** FraudLabs Pro integration
✅ **Fallback:** Rule-based detection
✅ **Testing:** Easy curl commands
✅ **Production-Ready:** With enhancements

**Next Steps:**
1. Get your free FraudLabs Pro API key
2. Add it to settings
3. Test with transactions
4. Monitor fraud rates
5. Tune rules as needed

🎉 **Your banking app now has enterprise-grade fraud detection!**
