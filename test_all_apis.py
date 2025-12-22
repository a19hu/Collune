#!/usr/bin/env python3
"""
API Testing Script - Tests all endpoints in the banking system
Run: python3 test_all_apis.py
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

# Test counters
total_tests = 0
passed_tests = 0
failed_tests = 0

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_test(name, status, details=""):
    global total_tests, passed_tests, failed_tests
    total_tests += 1
    
    if status:
        passed_tests += 1
        print(f"{GREEN}✅ PASS{RESET} - {name}")
    else:
        failed_tests += 1
        print(f"{RED}❌ FAIL{RESET} - {name}")
    
    if details:
        print(f"   {YELLOW}{details}{RESET}")

def test_endpoint(method, endpoint, headers=None, data=None, expected_keys=None, name=""):
    """Generic endpoint tester"""
    url = f"{BASE_URL}{endpoint}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        # Check if response is successful
        if response.status_code in [200, 201, 202]:
            result = response.json()
            
            # Check for expected keys
            if expected_keys:
                for key in expected_keys:
                    if key not in result and not any(key in item for item in result if isinstance(result, list)):
                        print_test(name, False, f"Missing key: {key}")
                        return None
            
            print_test(name, True, f"Status: {response.status_code}")
            return result
        else:
            print_test(name, False, f"Status: {response.status_code} - {response.text[:100]}")
            return None
            
    except Exception as e:
        print_test(name, False, f"Exception: {str(e)}")
        return None

def main():
    print_header("BANKING API - COMPREHENSIVE TEST SUITE")
    print(f"Base URL: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Store tokens
    admin_token = None
    customer_token = None
    customer2_token = None
    account_number = None
    account_number2 = None
    loan_id = None
    transaction_id = None
    
    # =========================================================================
    # 1. AUTHENTICATION ENDPOINTS
    # =========================================================================
    print_header("1. AUTHENTICATION ENDPOINTS")
    
    # Test 1.1: Admin Login
    result = test_endpoint(
        "POST", "/token",
        data={"username": "a19hu", "password": "a19hu"},
        expected_keys=["access", "refresh"],
        name="Admin Login"
    )
    if result:
        admin_token = result.get("access")
    
    # Test 1.2: Customer1 Login
    result = test_endpoint(
        "POST", "/token",
        data={"username": "customer1", "password": "pass123"},
        expected_keys=["access", "refresh"],
        name="Customer1 Login"
    )
    if result:
        customer_token = result.get("access")
    
    # Test 1.3: Customer2 Login
    result = test_endpoint(
        "POST", "/token",
        data={"username": "customer2", "password": "pass123"},
        expected_keys=["access", "refresh"],
        name="Customer2 Login"
    )
    if result:
        customer2_token = result.get("access")
    
    # Test 1.4: Invalid Login (Expected to fail - 401 is correct)
    result = test_endpoint(
        "POST", "/token",
        data={"username": "invalid", "password": "wrong"},
        name="Invalid Login (Expected to Fail)"
    )
    # Note: This should return None/401, which is correct behavior
    
    if not customer_token:
        print(f"\n{RED}Cannot proceed without customer token{RESET}")
        return
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    headers2 = {"Authorization": f"Bearer {customer2_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # =========================================================================
    # 2. USER ENDPOINTS
    # =========================================================================
    print_header("2. USER ENDPOINTS")
    
    # Test 2.1: Get Profile
    result = test_endpoint(
        "GET", "/profile/",
        headers=headers,
        expected_keys=["user", "kyc", "accounts"],
        name="Get User Profile"
    )
    if result and result.get("accounts"):
        account_number = result["accounts"][0].get("account_number")
    
    # Test 2.2: Signup New User (Create)
    new_user_data = {
        "username": f"testuser_{datetime.now().strftime('%H%M%S')}",
        "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
        "password": "testpass123",
        "name": "Test User",
        "phone_number": "+919999999999",
        "date_of_birth": "1995-05-05",
        "address": "Test Address, City",
        "aadhaar_number": "999999999999",
        "pan_number": "TSTPN9999T"
    }
    test_endpoint(
        "POST", "/signup/",
        data=new_user_data,
        name="Signup New User"
    )
    
    # =========================================================================
    # 3. ACCOUNT ENDPOINTS
    # =========================================================================
    print_header("3. ACCOUNT ENDPOINTS")
    
    # Test 3.1: Get All Accounts
    result = test_endpoint(
        "GET", "/accounts/",
        headers=headers,
        name="Get All Accounts (Current User)"
    )
    if result and len(result) > 0:
        account_id = result[0].get("id")
        account_number = result[0].get("account_number")
        
        # Test 3.2: Get Specific Account
        test_endpoint(
            "GET", f"/accounts/{account_id}/",
            headers=headers,
            expected_keys=["account_number", "balance"],
            name=f"Get Account Details (ID: {account_id})"
        )
    
    # Test 3.3: Create New Account
    test_endpoint(
        "POST", "/accounts/",
        headers=headers,
        data={"account_type": "SAVINGS", "balance": 1000.00},
        name="Create New Savings Account"
    )
    
    # Get customer2's account number
    result = test_endpoint(
        "GET", "/accounts/",
        headers=headers2,
        name="Get Customer2 Accounts"
    )
    if result and len(result) > 0:
        account_number2 = result[0].get("account_number")
    
    # =========================================================================
    # 4. TRANSACTION ENDPOINTS
    # =========================================================================
    print_header("4. TRANSACTION ENDPOINTS")
    
    if account_number and account_number2:
        # Test 4.1: Create Transaction
        result = test_endpoint(
            "POST", "/transactions/",
            headers=headers,
            data={
                "sender_account_id": account_number,
                "receiver_account_id": account_number2,
                "amount": 50.00
            },
            name="Create Transaction (Transfer Money)"
        )
        if result and result.get("result"):
            transaction_id = result["result"].get("transaction_id")
    
    # Test 4.2: Get Transaction History
    result = test_endpoint(
        "GET", "/transactions/history/",
        headers=headers,
        name="Get Transaction History"
    )
    
    # Test 4.3: Get Specific Transaction
    if transaction_id:
        test_endpoint(
            "GET", f"/transactions/{transaction_id}/",
            headers=headers,
            expected_keys=["sender", "receiver", "amount"],
            name=f"Get Transaction Details (ID: {transaction_id})"
        )
    
    # Test 4.4: Transaction with Insufficient Balance (Should Fail)
    test_endpoint(
        "POST", "/transactions/",
        headers=headers,
        data={
            "sender_account_id": account_number,
            "receiver_account_id": account_number2,
            "amount": 999999.00
        },
        name="Transaction with Insufficient Balance (Should Fail)"
    )
    
    # Test 4.5: Transaction with Invalid Account
    test_endpoint(
        "POST", "/transactions/",
        headers=headers,
        data={
            "sender_account_id": account_number,
            "receiver_account_id": 99999999999,
            "amount": 10.00
        },
        name="Transaction with Invalid Receiver (Should Fail)"
    )
    
    # =========================================================================
    # 5. LOAN ENDPOINTS
    # =========================================================================
    print_header("5. LOAN ENDPOINTS")
    
    # Test 5.1: Apply for Loan
    result = test_endpoint(
        "POST", "/loans/apply/",
        headers=headers,
        data={
            "loan_type": "PERSONAL",
            "amount": 10000.00,
            "tenure_months": 12
        },
        expected_keys=["message", "loan"],
        name="Apply for Personal Loan"
    )
    if result and result.get("loan"):
        loan_id = result["loan"].get("id")
    
    # Test 5.2: Apply for Home Loan
    test_endpoint(
        "POST", "/loans/apply/",
        headers=headers,
        data={
            "loan_type": "HOME",
            "amount": 50000.00,
            "tenure_months": 24
        },
        name="Apply for Home Loan"
    )
    
    # Test 5.3: Approve Loan (Admin)
    if loan_id and admin_token:
        test_endpoint(
            "POST", f"/loans/{loan_id}/approve/",
            headers=admin_headers,
            data={"action": "APPROVED"},
            name=f"Approve Loan (Admin) - ID: {loan_id}"
        )
    
    # Test 5.4: Reject Loan (Admin)
    if loan_id and admin_token:
        # Apply another loan to reject
        result = test_endpoint(
            "POST", "/loans/apply/",
            headers=headers,
            data={
                "loan_type": "CAR",
                "amount": 20000.00,
                "tenure_months": 18
            },
            name="Apply for Car Loan (For Rejection Test)"
        )
        if result and result.get("loan"):
            reject_loan_id = result["loan"].get("id")
            test_endpoint(
                "POST", f"/loans/{reject_loan_id}/approve/",
                headers=admin_headers,
                data={"action": "REJECTED"},
                name=f"Reject Loan (Admin) - ID: {reject_loan_id}"
            )
    
    # =========================================================================
    # 6. ADMIN ENDPOINTS
    # =========================================================================
    print_header("6. ADMIN ENDPOINTS")
    
    if admin_token:
        # Test 6.1: Get All Customers (Admin Only)
        result = test_endpoint(
            "GET", "/admin/customers/",
            headers=admin_headers,
            expected_keys=["total_customers", "customers"],
            name="Get All Customers (Admin)"
        )
        
        # Test 6.2: Get Audit Logs (Admin Only)
        test_endpoint(
            "GET", "/audit-logs/",
            headers=admin_headers,
            name="Get Audit Logs (Admin)"
        )
    
    # Test 6.3: Customer tries to access admin endpoint (Should Fail)
    test_endpoint(
        "GET", "/admin/customers/",
        headers=headers,
        name="Customer Access Admin Endpoint (Should Fail)"
    )
    
    # =========================================================================
    # 7. EDGE CASES & ERROR HANDLING
    # =========================================================================
    print_header("7. EDGE CASES & ERROR HANDLING")
    
    # Test 7.1: Access without token
    test_endpoint(
        "GET", "/accounts/",
        name="Access without Authentication (Should Fail)"
    )
    
    # Test 7.2: Invalid token
    test_endpoint(
        "GET", "/accounts/",
        headers={"Authorization": "Bearer invalid_token_12345"},
        name="Access with Invalid Token (Should Fail)"
    )
    
    # Test 7.3: Transaction to same account
    if account_number:
        test_endpoint(
            "POST", "/transactions/",
            headers=headers,
            data={
                "sender_account_id": account_number,
                "receiver_account_id": account_number,
                "amount": 10.00
            },
            name="Transaction to Same Account (Should Fail)"
        )
    
    # Test 7.4: Negative amount transaction
    if account_number and account_number2:
        test_endpoint(
            "POST", "/transactions/",
            headers=headers,
            data={
                "sender_account_id": account_number,
                "receiver_account_id": account_number2,
                "amount": -50.00
            },
            name="Negative Amount Transaction (Should Fail)"
        )
    
    # Test 7.5: High amount transaction (Fraud Detection)
    if account_number and account_number2:
        test_endpoint(
            "POST", "/transactions/",
            headers=headers,
            data={
                "sender_account_id": account_number,
                "receiver_account_id": account_number2,
                "amount": 55000.00
            },
            name="High Amount Transaction (Fraud Detection)"
        )
    
    # =========================================================================
    # SUMMARY
    # =========================================================================
    print_header("TEST SUMMARY")
    
    print(f"Total Tests: {total_tests}")
    print(f"{GREEN}Passed: {passed_tests}{RESET}")
    print(f"{RED}Failed: {failed_tests}{RESET}")
    
    if failed_tests == 0:
        print(f"\n{GREEN}🎉 ALL TESTS PASSED! 🎉{RESET}\n")
    else:
        success_rate = (passed_tests / total_tests) * 100
        print(f"\n{YELLOW}Success Rate: {success_rate:.1f}%{RESET}\n")
    
    print(f"{BLUE}{'='*60}{RESET}\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Test interrupted by user{RESET}\n")
    except Exception as e:
        print(f"\n\n{RED}Test suite error: {str(e)}{RESET}\n")
