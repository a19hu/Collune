from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated,IsAdminUser
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import KYC, Account, Transaction, Loan, AuditLog
from .serializers import ( SignupSerializer, KYCSerializer, UserSerializer, 
                          AccountSerializer, TransactionSerializer, 
                          CreateTransactionSerializer, LoanSerializer, 
                          )
from .tasks import process_transaction
from .audit import audit_log
import math


@api_view(['POST'])
@permission_classes([AllowAny])
def SignUp(request):
    serializer = SignupSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "Signup and KYC completed successfully"},
            status=status.HTTP_201_CREATED
        )

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_accounts(request):
    if request.method == 'GET':
        # Get all accounts for the logged-in user
        accounts = Account.objects.filter(user=request.user)
        serializer = AccountSerializer(accounts, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create a new account for the logged-in user
        serializer = AccountSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def account_detail(request, account_id):
    try:
        account = Account.objects.get(id=account_id, user=request.user)
        serializer = AccountSerializer(account)
        return Response(serializer.data)
    except Account.DoesNotExist:
        return Response({
            'error': 'Account not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transfer_money(request):
    serializer = CreateTransactionSerializer(data=request.data)

    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    sender_account_number = serializer.validated_data['sender_account_id']
    receiver_account_number = serializer.validated_data['receiver_account_id']
    amount = serializer.validated_data['amount']

    # Get sender account by account_number and verify it belongs to user
    try:
        sender_account = Account.objects.get(account_number=sender_account_number, user=request.user)
    except Account.DoesNotExist:
        audit_log(request, f"Failed transaction attempt - Unauthorized sender account: {sender_account_number}")
        return Response(
            {"error": "Unauthorized sender account"},
            status=status.HTTP_403_FORBIDDEN
        )

    # Get receiver account by account_number
    try:
        receiver_account = Account.objects.get(account_number=receiver_account_number)
    except Account.DoesNotExist:
        audit_log(request, f"Failed transaction attempt - Receiver account not found: {receiver_account_number}")
        return Response(
            {"error": "Receiver account not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get client IP address
    from .audit import get_client_ip
    ip_address = get_client_ip(request)
    
    # Enqueue transaction with account IDs and IP address
    process_transaction.delay(sender_account.id, receiver_account.id, amount, ip_address)
    
    # Log successful transaction initiation
    audit_log(request, f"Transaction initiated: ₹{amount} from {sender_account_number} to {receiver_account_number}")

    return Response({
        "message": "Transaction is being processed"
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_history(request):
    accounts = Account.objects.filter(user=request.user)

    transactions = Transaction.objects.filter(
        sender_account__in=accounts
    ) | Transaction.objects.filter(
        receiver_account__in=accounts
    )

    transactions = transactions.order_by('-created_at')

    return Response([
        {
            "id": tx.id,
            "sender": tx.sender_account.id,
            "receiver": tx.receiver_account.id,
            "amount": tx.amount,
            "created_at": tx.created_at
        }
        for tx in transactions
    ])



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_detail(request, transaction_id):
    """
    Get details of a specific transaction.
    """
    try:
        user_accounts = Account.objects.filter(user=request.user)
        transaction_obj = Transaction.objects.get(
            id=transaction_id
        )
        
        # Verify user has access to this transaction
        if transaction_obj.sender_account not in user_accounts and \
           transaction_obj.receiver_account not in user_accounts:
            return Response({
                'error': 'Unauthorized'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TransactionSerializer(transaction_obj)
        return Response(serializer.data)
        
    except Transaction.DoesNotExist:
        return Response({
            'error': 'Transaction not found'
        }, status=status.HTTP_404_NOT_FOUND)


def calculate_emi(principal, annual_rate, tenure_months):
    r = annual_rate / (12 * 100)
    n = tenure_months

    emi = (principal * r * math.pow(1 + r, n)) / \
          (math.pow(1 + r, n) - 1)

    return round(emi, 2)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apply_loan(request):
    loan_type = request.data.get('loan_type')
    amount = float(request.data.get('amount'))
    tenure = int(request.data.get('tenure_months'))

    interest_rate = 12  # fixed for hackathon

    emi = calculate_emi(amount, interest_rate, tenure)

    loan = Loan.objects.create(
        user=request.user,
        loan_type=loan_type,
        amount=amount,
        tenure_months=tenure,
        interest_rate=interest_rate,
        emi=emi,
        status='PENDING'
    )
    
    # Log loan application
    audit_log(request, f"Loan applied: {loan_type} - ₹{amount} for {tenure} months (Loan ID: {loan.id})")

    return Response({
        "message": "Loan applied successfully",
        "emi": emi,
        "loan": LoanSerializer(loan).data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_loan(request, loan_id):
    action = request.data.get('action')  # APPROVED or REJECTED

    try:
        loan = Loan.objects.get(id=loan_id)
        loan.status = action
        loan.save()
        
        # Log loan approval/rejection
        audit_log(request, f"Loan {action}: Loan ID {loan_id} - {loan.loan_type} ₹{loan.amount} for user {loan.user.username}")

        return Response({
            "message": f"Loan {action.lower()} successfully"
        })
    except Loan.DoesNotExist:
        audit_log(request, f"Failed loan approval attempt - Loan ID {loan_id} not found")
        return Response(
            {"error": "Loan not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """
    Get comprehensive user profile including KYC, accounts, transactions, loans, and stats.
    """
    user = request.user
    
    # Get KYC data
    try:
        kyc = KYC.objects.get(user=user)
        kyc_data = KYCSerializer(kyc).data
    except KYC.DoesNotExist:
        kyc_data = None
    
    # Get all accounts
    accounts = Account.objects.filter(user=user)
    accounts_data = AccountSerializer(accounts, many=True).data
    
    # Get recent transactions (last 10)
    recent_transactions = Transaction.objects.filter(
        Q(sender_account__user=user) | Q(receiver_account__user=user)
    ).order_by('-created_at')[:10]
    transactions_data = TransactionSerializer(recent_transactions, many=True).data
    
    # Get all loans
    loans = Loan.objects.filter(user=user)
    loans_data = LoanSerializer(loans, many=True).data
    
    # Calculate stats
    total_balance = sum(account.balance for account in accounts)
    active_loans = loans.filter(status='APPROVED').count()
    
    return Response({
        'user': UserSerializer(user).data,
        'kyc': kyc_data,
        'accounts': accounts_data,
        'recent_transactions': transactions_data,
        'loans': loans_data,
        'stats': {
            'total_accounts': accounts.count(),
            'total_balance': total_balance,
            'active_loans': active_loans
        }
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_logs(request):
    logs = AuditLog.objects.all().order_by('-created_at')

    data = [{
        "user": log.user.username if log.user else None,
        "action": log.action,
        "file": log.file_name,
        "function": log.function_name,
        "ip": log.ip_address,
        "time": log.created_at
    } for log in logs]

    return Response(data)