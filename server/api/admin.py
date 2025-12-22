from django.contrib import admin
from .models import KYC, Account, Transaction, Loan, AuditLog


@admin.register(KYC)
class KYCAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'name', 'phone_number', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'phone_number', 'aadhaar_number', 'pan_number', 'user__username']
    readonly_fields = ['created_at']


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'account_number', 'account_type', 'balance', 'is_active', 'created_at']
    list_filter = ['account_type', 'is_active', 'created_at']
    search_fields = ['account_number', 'user__username']
    readonly_fields = ['account_number', 'created_at']


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender_account', 'receiver_account', 'amount', 'transaction_type', 'is_fraud', 'created_at']
    list_filter = ['transaction_type', 'is_fraud', 'created_at']
    search_fields = ['sender_account__account_number', 'receiver_account__account_number']
    readonly_fields = ['created_at']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'action', 'function_name', 'ip_address', 'created_at']
    list_filter = ['created_at', 'function_name']
    search_fields = ['user__username', 'action', 'ip_address']
    readonly_fields = ['user', 'action', 'file_name', 'function_name', 'ip_address', 'created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Loan)
class LoanAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'loan_type', 'amount', 'tenure_months', 'interest_rate', 'emi', 'status', 'created_at']
    list_filter = ['loan_type', 'status', 'created_at']
    search_fields = ['user__username', 'loan_type']
    readonly_fields = ['created_at']