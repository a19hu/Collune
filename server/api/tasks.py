from celery import shared_task
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from .models import Account, Transaction
from .fraud_detection import simple_fraud_check

DAILY_LIMIT = 50000

@shared_task
@transaction.atomic
def process_transaction(sender_id, receiver_id, amount, ip_address='127.0.0.1'):
    sender = Account.objects.select_for_update().get(id=sender_id)
    receiver = Account.objects.select_for_update().get(id=receiver_id)

    # 1️⃣ Balance check
    if sender.balance < amount:
        raise Exception("Insufficient funds")

    # 2️⃣ Daily limit check
    today_total = Transaction.objects.filter(
        sender_account=sender,
        created_at__date=timezone.now().date()
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    if today_total + amount > DAILY_LIMIT:
        raise Exception("Daily limit exceeded")

    # 3️⃣ Update balances
    sender.balance -= amount
    receiver.balance += amount

    sender.save()
    receiver.save()

    # 4️⃣ Log transaction
    tx = Transaction.objects.create(
        sender_account=sender,
        receiver_account=receiver,
        amount=amount,
        transaction_type='DEBIT'
    )

    # 5️⃣ Fraud detection check
    fraud_result = simple_fraud_check(ip_address, amount)
    
    if fraud_result['is_fraud']:
        tx.is_fraud = True
        tx.save()
        # Optionally: Could reverse transaction here
    
    return {
        'status': 'success',
        'transaction_id': tx.id,
        'fraud_check': fraud_result
    }
