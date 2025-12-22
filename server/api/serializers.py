from rest_framework import serializers
from django.contrib.auth.models import User
from .models import KYC, Account, Transaction, Loan
import math

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user



class SignupSerializer(serializers.ModelSerializer):
    # User fields (not in KYC model)
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = KYC
        fields = [
            # User fields
            'username',
            'email',
            'password',

            # KYC fields
            'name',
            'phone_number',
            'date_of_birth',
            'address',
            'aadhaar_number',
            'pan_number',
        ]

    def create(self, validated_data):
        # extract user data
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        password = validated_data.pop('password')

        # create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # create kyc (auto-approved for hackathon)
        kyc = KYC.objects.create(
            user=user,
            status='APPROVED',
            **validated_data
        )

        return kyc
    

class KYCSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYC
        fields = ['id', 'user', 'name', 'phone_number', 'date_of_birth', 
                  'address', 'aadhaar_number', 'pan_number', 'status', 
                  'created_at']
        read_only_fields = ['id', 'created_at']


class AccountSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    account_number = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Account
        fields = ['id', 'user', 'user_details', 'account_number', 'account_type', 
                  'balance', 'is_active', 'created_at']
        read_only_fields = ['id', 'account_number', 'balance', 'created_at', 'user_details', 'user']
        extra_kwargs = {
            'account_type': {'required': True}
        }


class TransactionSerializer(serializers.ModelSerializer):
    sender_account_details = AccountSerializer(source='sender_account', read_only=True)
    receiver_account_details = AccountSerializer(source='receiver_account', read_only=True)
    
    class Meta:
        model = Transaction
        fields = ['id', 'sender_account', 'sender_account_details', 'receiver_account', 
                  'receiver_account_details', 'amount', 'transaction_type', 'is_fraud', 'created_at']
        read_only_fields = ['id', 'transaction_type', 'is_fraud', 'created_at', 
                           'sender_account_details', 'receiver_account_details']


class CreateTransactionSerializer(serializers.Serializer):
    sender_account_id = serializers.IntegerField()
    receiver_account_id = serializers.IntegerField()
    amount = serializers.FloatField(min_value=1)

    def validate(self, data):
        if data['sender_account_id'] == data['receiver_account_id']:
            raise serializers.ValidationError("Sender and receiver must be different")
        return data

class LoanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Loan
        fields = [
            'id',
            'loan_type',
            'amount',
            'tenure_months',
            'interest_rate',
            'emi',
            'status',
            'created_at'
        ]
        read_only_fields = ['emi', 'status', 'created_at']


# class LoanRepaymentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = LoanRepayment
#         fields = ['id', 'loan', 'emi_number', 'emi_amount', 'due_date', 'paid_on', 'status', 'transaction', 'created_at']
#         read_only_fields = ['id', 'created_at']


# class LoanSerializer(serializers.ModelSerializer):
#     user_details = UserSerializer(source='user', read_only=True)
#     account_details = AccountSerializer(source='account', read_only=True)
#     approved_by_details = UserSerializer(source='approved_by', read_only=True)
#     repayments = LoanRepaymentSerializer(many=True, read_only=True)
    
#     class Meta:
#         model = Loan
#         fields = ['id', 'user', 'user_details', 'account', 'account_details', 'loan_type', 
#                   'principal_amount', 'interest_rate', 'tenure_months', 'emi', 'total_payable',
#                   'status', 'approved_by', 'approved_by_details', 'approved_at', 'rejection_reason',
#                   'repayments', 'created_at', 'updated_at']
#         read_only_fields = ['id', 'user', 'emi', 'total_payable', 'status', 'approved_by', 
#                            'approved_at', 'created_at', 'updated_at', 'user_details', 
#                            'account_details', 'approved_by_details', 'repayments']


# class LoanApplicationSerializer(serializers.Serializer):
#     loan_type = serializers.ChoiceField(choices=Loan.LOAN_TYPES)
#     principal_amount = serializers.FloatField(min_value=1000)
#     interest_rate = serializers.FloatField(min_value=0.1, max_value=50)
#     tenure_months = serializers.IntegerField(min_value=1, max_value=360)
#     account_id = serializers.IntegerField(required=False)
    
#     def validate_principal_amount(self, value):
#         if value < 1000:
#             raise serializers.ValidationError("Minimum loan amount is ₹1,000")
#         if value > 10000000:
#             raise serializers.ValidationError("Maximum loan amount is ₹1,00,00,000")
#         return value
    
#     def validate_tenure_months(self, value):
#         if value < 1:
#             raise serializers.ValidationError("Minimum tenure is 1 month")
#         if value > 360:
#             raise serializers.ValidationError("Maximum tenure is 360 months (30 years)")
#         return value
    
#     def calculate_emi(self, principal, rate, tenure):
#         """
#         Calculate EMI using formula: EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
#         where:
#         P = Principal loan amount
#         r = Monthly interest rate (annual rate / 12 / 100)
#         n = Loan tenure in months
#         """
#         # Convert annual rate to monthly rate
#         monthly_rate = rate / 12 / 100
        
#         # Calculate EMI
#         if monthly_rate == 0:
#             emi = principal / tenure
#         else:
#             emi = (principal * monthly_rate * math.pow(1 + monthly_rate, tenure)) / \
#                   (math.pow(1 + monthly_rate, tenure) - 1)
        
#         return round(emi, 2)
    
#     def create(self, validated_data):
#         user = self.context['request'].user
        
#         # Calculate EMI
#         principal = validated_data['principal_amount']
#         rate = validated_data['interest_rate']
#         tenure = validated_data['tenure_months']
        
#         emi = self.calculate_emi(principal, rate, tenure)
#         total_payable = round(emi * tenure, 2)
        
#         # Get account if provided
#         account = None
#         if 'account_id' in validated_data:
#             try:
#                 account = Account.objects.get(id=validated_data['account_id'], user=user)
#             except Account.DoesNotExist:
#                 raise serializers.ValidationError("Invalid account")
        
#         # Create loan
#         loan = Loan.objects.create(
#             user=user,
#             account=account,
#             loan_type=validated_data['loan_type'],
#             principal_amount=principal,
#             interest_rate=rate,
#             tenure_months=tenure,
#             emi=emi,
#             total_payable=total_payable,
#             status='PENDING'
#         )
        
#         return loan


# class LoanApprovalSerializer(serializers.Serializer):
#     action = serializers.ChoiceField(choices=['approve', 'reject'])
#     rejection_reason = serializers.CharField(required=False, allow_blank=True)
    
#     def validate(self, data):
#         if data['action'] == 'reject' and not data.get('rejection_reason'):
#             raise serializers.ValidationError("Rejection reason is required when rejecting a loan")
#         return data