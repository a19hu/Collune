from django.db import models
from django.contrib.auth.models import User
import uuid
import random


def generate_account_number():
    """Generate a unique 11-digit account number"""
    return random.randint(10000000000, 99999999999)  # 11 digits


class KYC(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE)

    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    date_of_birth = models.DateField()
    address = models.TextField()

    aadhaar_number = models.CharField(max_length=12)
    pan_number = models.CharField(max_length=10)

    document = models.FileField(upload_to='kyc_documents/')

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    created_at = models.DateTimeField(auto_now_add=True)


class Account(models.Model):
    ACCOUNT_TYPES = (
        ('SAVINGS', 'Savings'),
        ('CURRENT', 'Current'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    account_number = models.BigIntegerField(default=generate_account_number, unique=True, editable=False)
    account_type = models.CharField(max_length=10, choices=ACCOUNT_TYPES)

    balance = models.FloatField(default=0.0)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.account_number}"


class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('DEBIT', 'Debit'),
        ('CREDIT', 'Credit'),
    )

    sender_account = models.ForeignKey(
        Account,
        related_name='sent_transactions',
        on_delete=models.CASCADE
    )
    receiver_account = models.ForeignKey(
        Account,
        related_name='received_transactions',
        on_delete=models.CASCADE
    )

    amount = models.FloatField()
    transaction_type = models.CharField(
        max_length=10,
        choices=TRANSACTION_TYPES
    )

    is_fraud = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)


class Loan(models.Model):
    LOAN_STATUS = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    LOAN_TYPE = (
        ('PERSONAL', 'Personal'),
        ('HOME', 'Home'),
        ('EDUCATION', 'Education'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    loan_type = models.CharField(max_length=20, choices=LOAN_TYPE)
    amount = models.FloatField()
    tenure_months = models.IntegerField()
    interest_rate = models.FloatField()   # annual %
    emi = models.FloatField()

    status = models.CharField(
        max_length=10,
        choices=LOAN_STATUS,
        default='PENDING'
    )

    created_at = models.DateTimeField(auto_now_add=True)

class AuditLog(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    action = models.CharField(max_length=255)
    file_name = models.CharField(max_length=255, null=True, blank=True)
    function_name = models.CharField(max_length=255, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} - {self.created_at}"

    class Meta:
        ordering = ['-created_at']
