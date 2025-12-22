import requests
from django.conf import settings

def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0]
    return request.META.get('REMOTE_ADDR', '127.0.0.1')


def check_fraud(request, amount, transaction_id=None):
    """
    Check transaction for fraud using FraudLabs Pro API
    
    Args:
        request: Django request object
        amount: Transaction amount
        transaction_id: Optional transaction ID for reference
    
    Returns:
        dict: {
            'is_fraud': bool,
            'fraud_score': int (0-100),
            'fraud_status': str ('APPROVE', 'REJECT', 'REVIEW'),
            'message': str,
            'details': dict
        }
    """
    
    # Get FraudLabs Pro API key from settings
    api_key = getattr(settings, 'FRAUDLABS_API_KEY', None)
    
    if not api_key:
        # If no API key, skip fraud check
        return {
            'is_fraud': False,
            'fraud_score': 0,
            'fraud_status': 'APPROVE',
            'message': 'Fraud detection disabled (no API key)',
            'details': {}
        }
    
    try:
        # Get user and IP information
        user = request.user if request.user.is_authenticated else None
        ip_address = get_client_ip(request)
        
        # Prepare API request
        url = 'https://api.fraudlabspro.com/v2/order/screen'
        
        payload = {
            'key': api_key,
            'ip': ip_address,
            'amount': float(amount),
            'currency': 'INR',
            'format': 'json',
        }
        
        # Add optional fields if user is authenticated
        if user:
            payload['email'] = user.email if user.email else f'{user.username}@example.com'
            payload['user_order_id'] = transaction_id if transaction_id else user.id
        
        # Make API request
        response = requests.get(url, params=payload, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Parse FraudLabs Pro response
            fraud_status = data.get('fraudlabspro_status', 'APPROVE')
            fraud_score = int(data.get('fraudlabspro_score', 0))
            
            # Determine if transaction is fraudulent
            # APPROVE = safe, REJECT = fraud, REVIEW = suspicious
            is_fraud = fraud_status == 'REJECT'
            
            return {
                'is_fraud': is_fraud,
                'fraud_score': fraud_score,
                'fraud_status': fraud_status,
                'message': data.get('fraudlabspro_message', 'Transaction checked'),
                'details': {
                    'distribution': data.get('fraudlabspro_distribution', 'N/A'),
                    'id': data.get('fraudlabspro_id', 'N/A'),
                    'version': data.get('fraudlabspro_version', 'N/A'),
                    'credits': data.get('fraudlabspro_credits', 'N/A'),
                }
            }
        else:
            # API error - default to approve
            return {
                'is_fraud': False,
                'fraud_score': 0,
                'fraud_status': 'APPROVE',
                'message': f'Fraud check failed: HTTP {response.status_code}',
                'details': {}
            }
            
    except requests.exceptions.Timeout:
        # Timeout - default to approve
        return {
            'is_fraud': False,
            'fraud_score': 0,
            'fraud_status': 'APPROVE',
            'message': 'Fraud check timed out',
            'details': {}
        }
        
    except Exception as e:
        # Any other error - default to approve
        return {
            'is_fraud': False,
            'fraud_score': 0,
            'fraud_status': 'APPROVE',
            'message': f'Fraud check error: {str(e)}',
            'details': {}
        }


def simple_fraud_check(ip_address, amount):
    """
    Simple rule-based fraud detection (fallback)
    Used when FraudLabs Pro is not available
    """
    is_fraud = False
    fraud_score = 0
    reasons = []
    
    # Rule 1: Large transactions
    if amount > 50000:
        fraud_score += 30
        reasons.append('Large transaction amount')
    
    # Rule 2: Very large transactions
    if amount > 100000:
        fraud_score += 40
        reasons.append('Very large transaction')
    
    # Rule 3: Local IP (testing environment)
    if ip_address in ['127.0.0.1', 'localhost']:
        fraud_score += 10
        reasons.append('Local IP address')
    
    # Determine fraud status
    if fraud_score >= 70:
        is_fraud = True
        fraud_status = 'REJECT'
    elif fraud_score >= 40:
        fraud_status = 'REVIEW'
    else:
        fraud_status = 'APPROVE'
    
    return {
        'is_fraud': is_fraud,
        'fraud_score': fraud_score,
        'fraud_status': fraud_status,
        'message': ', '.join(reasons) if reasons else 'Transaction appears safe',
        'details': {'rules_triggered': reasons}
    }
