from django.urls import path
from .views import (SignUp, manage_accounts, 
                    account_detail, transfer_money, transaction_history, 
                    transaction_detail, apply_loan, approve_loan, audit_logs, 
                    get_profile, get_all_customers)

urlpatterns = [
    path('signup/', SignUp, name='signup'),
    path('accounts/', manage_accounts, name='manage_accounts'),
    path('accounts/<int:account_id>/', account_detail, name='account_detail'),
    path('transactions/', transfer_money, name='create_transaction'),
    path('transactions/history/', transaction_history, name='transaction_history'),
    path('transactions/<int:transaction_id>/', transaction_detail, name='transaction_detail'),
    
    # Loan endpoints
    path('loans/apply/', apply_loan, name='apply_loan'),
    path('loans/<int:loan_id>/approve/', approve_loan, name='approve_loan'),
    
    # User and audit endpoints
    path('profile/', get_profile, name='profile'),
    path('admin/customers/', get_all_customers, name='all_customers'),
    path('audit-logs/', audit_logs, name='audit_logs'),
]