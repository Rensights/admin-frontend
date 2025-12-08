# Security Testing Scenario - Complete Test Plan
## Comprehensive Security Testing for All Fixed Vulnerabilities

**Purpose:** Verify all security fixes are working correctly  
**Scope:** OWASP Top 10 2021 compliance verification  
**Expected Duration:** 4-6 hours

---

## 📋 PRE-TESTING CHECKLIST

- [ ] Application deployed to test environment
- [ ] Test user accounts created
- [ ] Postman/Insomnia or similar API testing tool ready
- [ ] Browser developer tools ready
- [ ] Network proxy tool ready (Burp Suite/OWASP ZAP optional)
- [ ] Access to server logs

---

## 🔐 A01: BROKEN ACCESS CONTROL TESTS

### Test 1.1: Path Traversal Prevention
**Objective:** Verify path traversal attacks are blocked

**Steps:**
1. Authenticate as a valid user
2. Try to access files using path traversal:
   ```
   GET /api/analysis-requests/files/../../../etc/passwd
   GET /api/analysis-requests/files/../../../app/application.yml
   GET /api/analysis-requests/files/../../../../etc/hosts
   ```

**Expected Result:**
- ✅ Status: 403 Forbidden or 404 Not Found
- ✅ Security violation logged in server logs
- ✅ No file content returned

**Verify Logs:**
```bash
# Check for security alerts
grep "SECURITY ALERT.*Path traversal" application.log
```

---

### Test 1.2: Unauthenticated File Access Prevention
**Objective:** Verify file access requires authentication

**Steps:**
1. **Without authentication**, try to access a file:
   ```
   GET /api/analysis-requests/files/analysis-requests/valid-uuid/file.pdf
   Authorization: (omit header)
   ```

**Expected Result:**
- ✅ Status: 401 Unauthorized
- ✅ No file content returned

---

### Test 1.3: Authorization Bypass Prevention
**Objective:** Verify users can only access their own data

**Steps:**
1. Create User A and User B accounts
2. User A creates an analysis request
3. User A uploads a file (file1.pdf)
4. User B tries to access User A's file:
   ```
   GET /api/analysis-requests/files/analysis-requests/{userA-requestId}/file1.pdf
   Authorization: Bearer {userB-token}
   ```

**Expected Result:**
- ✅ Status: 403 Forbidden or 404 Not Found
- ✅ User B cannot access User A's files

---

## 🔒 A02: CRYPTOGRAPHIC FAILURES TESTS

### Test 2.1: Password Strength Enforcement
**Objective:** Verify strong password requirements

**Steps:**
1. Try to register with weak passwords:
   ```
   POST /api/auth/register
   {
     "email": "test@example.com",
     "password": "123456",  // Too short
     "firstName": "Test",
     "lastName": "User"
   }
   
   POST /api/auth/register
   {
     "email": "test2@example.com",
     "password": "password",  // No uppercase, number, special char
     "firstName": "Test",
     "lastName": "User"
   }
   
   POST /api/auth/register
   {
     "email": "test3@example.com",
     "password": "Password1",  // Missing special char
     "firstName": "Test",
     "lastName": "User"
   }
   ```

**Expected Result:**
- ✅ Status: 400 Bad Request
- ✅ Error message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
- ✅ Registration fails

**Success Case:**
```
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "firstName": "Test",
  "lastName": "User"
}
```
- ✅ Status: 200 OK or requires verification

---

### Test 2.2: JWT Secret Validation
**Objective:** Verify JWT secret is validated on startup

**Steps:**
1. Set weak JWT secret (< 32 characters):
   ```yaml
   JWT_SECRET=weak
   ```
2. Start the application

**Expected Result:**
- ✅ Application fails to start
- ✅ Error message: "JWT secret must be at least 32 characters long"
- ✅ Application does not accept weak secrets

---

## 💉 A03: INJECTION TESTS

### Test 3.1: File Upload MIME Type Validation
**Objective:** Verify only allowed file types are accepted

**Steps:**
1. Authenticate as a user
2. Try to upload malicious files:

   **Test 3.1a: PHP file with .jpg extension**
   ```
   POST /api/analysis-requests
   Content-Type: multipart/form-data
   files: malicious.php (renamed to image.jpg)
   Content-Type header: image/jpeg
   ```

   **Test 3.1b: Executable file**
   ```
   files: malware.exe (renamed to document.pdf)
   Content-Type: application/pdf
   ```

   **Test 3.1c: Script file**
   ```
   files: script.js
   Content-Type: text/javascript
   ```

**Expected Result:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Invalid file type. Allowed types: images (JPEG, PNG, GIF, WebP) and PDF"
- ✅ File not stored on server

**Success Case:**
```
files: valid-image.jpg
Content-Type: image/jpeg
File content: Valid JPEG magic bytes (FF D8 FF)
```
- ✅ Status: 200 OK
- ✅ File stored successfully

---

### Test 3.2: File Content Validation (Magic Bytes)
**Objective:** Verify file content matches declared type

**Steps:**
1. Create a file with JPEG extension but PHP content:
   ```
   File: fake.jpg
   Content: <?php phpinfo(); ?>
   Magic Bytes: NOT JPEG format
   ```
2. Try to upload with Content-Type: image/jpeg

**Expected Result:**
- ✅ Status: 400 Bad Request
- ✅ Error: "File content does not match declared file type"
- ✅ File rejected even if extension and MIME type are correct

---

### Test 3.3: SQL Injection Prevention
**Objective:** Verify parameterized queries prevent SQL injection

**Steps:**
1. Try SQL injection in search/filter parameters:
   ```
   GET /api/deals?city=' OR '1'='1
   GET /api/deals?area=test' UNION SELECT * FROM users--
   ```

**Expected Result:**
- ✅ No SQL errors in response
- ✅ Query treats input as literal string
- ✅ No user data exposed
- ✅ Status: 200 OK (but no results or filtered results)

---

## 🛡️ A04: INSECURE DESIGN TESTS

### Test 4.1: User Enumeration Prevention
**Objective:** Verify user enumeration is prevented

**Steps:**
1. **Password Reset Test:**
   ```
   POST /api/auth/forgot-password
   { "email": "nonexistent@example.com" }
   ```
   
   **Expected Result:**
   - ✅ Status: 200 OK
   - ✅ Message: "If the email exists, a password reset code has been sent."
   - ✅ Same response for existing and non-existing emails
   - ✅ Response time is similar (timing attack prevention)

2. **Registration Test:**
   ```
   POST /api/auth/register
   { "email": "existing@example.com", ... }
   ```
   
   **Expected Result:**
   - ✅ Status: 400 Bad Request
   - ✅ Error: "Email already exists" (this is acceptable for registration)

3. **Login Test:**
   ```
   POST /api/auth/login
   { "email": "nonexistent@example.com", "password": "anything" }
   ```
   
   **Expected Result:**
   - ✅ Status: 401 Unauthorized
   - ✅ Error: "Invalid email or password" (generic message)
   - ✅ Same response for invalid email vs invalid password

---

### Test 4.2: Rate Limiting - Code Generation
**Objective:** Verify rate limiting prevents abuse

**Steps:**
1. Request verification code multiple times rapidly:
   ```
   POST /api/auth/resend-verification-code
   { "email": "test@example.com" }
   
   # Repeat 6 times quickly
   ```

**Expected Result:**
- ✅ First 5 requests: Status 200 OK
- ✅ 6th request: Status 429 Too Many Requests or 400 Bad Request
- ✅ Error: "Too many code generation requests. Please try again later."

---

### Test 4.3: Rate Limiting - Code Verification
**Objective:** Verify brute-force protection

**Steps:**
1. Request a verification code
2. Try incorrect codes 6 times:
   ```
   POST /api/auth/verify-email
   { "email": "test@example.com", "code": "000000" }
   # Repeat with different wrong codes
   ```

**Expected Result:**
- ✅ First 5 attempts: Status 400 Bad Request
- ✅ 6th attempt: Status 429 or 400 with account lockout message
- ✅ Error: "Too many failed verification attempts. Please request a new code."

---

### Test 4.4: Memory Exhaustion Prevention
**Objective:** Verify code cleanup prevents memory issues

**Steps:**
1. Generate codes for multiple emails (100+ emails)
2. Wait 10+ minutes (code expiration time)
3. Monitor server memory

**Expected Result:**
- ✅ Expired codes are cleaned up automatically
- ✅ Memory usage remains stable
- ✅ No memory leaks
- ✅ Logs show cleanup activity

**Verify Logs:**
```bash
grep "Cleaned up.*expired verification codes" application.log
```

---

## ⚙️ A05: SECURITY MISCONFIGURATION TESTS

### Test 5.1: Security Headers Verification
**Objective:** Verify all security headers are present

**Steps:**
1. Make any API request:
   ```
   GET /api/users/me
   Authorization: Bearer {token}
   ```

2. Check response headers:
   ```
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   Referrer-Policy: strict-origin-when-cross-origin
   ```

**Expected Result:**
- ✅ All security headers present
- ✅ Correct values as specified

**Browser Test:**
1. Open frontend in browser
2. Check Network tab → Response Headers
3. Verify all headers present

---

### Test 5.2: CORS Configuration
**Objective:** Verify CORS is properly restricted

**Steps:**
1. From unauthorized origin, try CORS request:
   ```javascript
   fetch('https://api.rensights.com/api/users/me', {
     method: 'GET',
     headers: { 'Authorization': 'Bearer token' },
     credentials: 'include'
   })
   ```
   Origin: `https://evil.com`

**Expected Result:**
- ✅ CORS error in browser console
- ✅ Request blocked by browser
- ✅ No CORS headers in response

**Valid Origin Test:**
- ✅ Allowed origins work correctly
- ✅ CORS headers present for valid origins

---

### Test 5.3: Docker Security (Non-Root User)
**Objective:** Verify container runs as non-root

**Steps:**
1. SSH into running container:
   ```bash
   kubectl exec -it <pod-name> -- sh
   ```

2. Check current user:
   ```bash
   whoami
   id
   ```

**Expected Result:**
- ✅ User: `appuser` (not `root`)
- ✅ UID: 1001 (not 0)
- ✅ GID: 1001

---

### Test 5.4: Kubernetes Security Contexts
**Objective:** Verify security contexts are applied

**Steps:**
1. Check pod configuration:
   ```bash
   kubectl describe pod <pod-name> | grep -A 10 Security
   ```

**Expected Result:**
- ✅ `runAsNonRoot: true`
- ✅ `runAsUser: 1001`
- ✅ `allowPrivilegeEscalation: false`
- ✅ `capabilities.drop: ALL`

---

### Test 5.5: SQL Logging Disabled in Production
**Objective:** Verify sensitive data not logged

**Steps:**
1. Make API requests with sensitive data
2. Check production logs:
   ```bash
   kubectl logs <pod-name> | grep -i "select\|insert\|update\|delete"
   ```

**Expected Result:**
- ✅ No SQL queries in logs
- ✅ No database credentials in logs
- ✅ No sensitive data in logs

---

## 🔑 A07: AUTHENTICATION FAILURES TESTS

### Test 7.1: Password Complexity Requirements
**Objective:** Verify password requirements enforced

**Test Cases:**
```
✅ Valid: "SecurePass123!"
✅ Valid: "MyP@ssw0rd!"
❌ Invalid: "password" (no uppercase, number, special)
❌ Invalid: "PASSWORD123" (no lowercase, special)
❌ Invalid: "Pass123" (too short, no special)
❌ Invalid: "Password!" (no number)
```

**Expected Result:**
- ✅ All invalid passwords rejected
- ✅ Validation error message clear

---

### Test 7.2: Timing Attack Prevention
**Objective:** Verify code verification is constant-time

**Steps:**
1. Use timing attack tool or measure response times:
   ```bash
   # Measure response time for invalid codes
   time curl -X POST /api/auth/verify-email \
     -d '{"email":"test@example.com","code":"000000"}'
   
   time curl -X POST /api/auth/verify-email \
     -d '{"email":"test@example.com","code":"111111"}'
   ```

**Expected Result:**
- ✅ Response times are similar (±50ms)
- ✅ No significant timing difference between different codes
- ✅ Cannot determine valid code characters from timing

---

### Test 7.3: Token Revocation (Service Check)
**Objective:** Verify token revocation service exists

**Steps:**
1. Check service is available:
   ```java
   // Verify TokenRevocationService.java exists
   ```

**Expected Result:**
- ✅ Service created and ready for Redis integration
- ✅ Structure in place for token blacklisting

---

## 📝 A09: SECURITY LOGGING TESTS

### Test 9.1: Verification Codes Not in Logs
**Objective:** Verify sensitive data not logged

**Steps:**
1. Request password reset
2. Check logs:
   ```bash
   kubectl logs <pod-name> | grep -i "code\|verification"
   ```

**Expected Result:**
- ✅ No actual codes in logs
- ✅ Only `[REDACTED]` in log messages
- ✅ Email addresses may be logged (acceptable)

---

### Test 9.2: Error Message Sanitization
**Objective:** Verify error messages don't expose internal details

**Steps:**
1. Trigger various errors:
   ```
   GET /api/users/99999999-9999-9999-9999-999999999999
   GET /api/invalid-endpoint
   POST /api/users/me (malformed request)
   ```

**Expected Result:**
- ✅ Generic error messages: "Error retrieving user. Please try again later."
- ✅ No stack traces in response
- ✅ No internal file paths
- ✅ No database errors exposed
- ✅ Detailed errors only in server logs (not sent to client)

---

## 🌐 FRONTEND SECURITY TESTS

### Test F1: Security Headers in Frontend
**Objective:** Verify Next.js security headers

**Steps:**
1. Open frontend in browser
2. Check Response Headers in Network tab
3. Verify headers present

**Expected Result:**
- ✅ All security headers present
- ✅ CSP configured correctly

---

### Test F2: XSS Prevention
**Objective:** Verify XSS protection

**Steps:**
1. Try to inject script in user input:
   ```javascript
   <script>alert('XSS')</script>
   ```

**Expected Result:**
- ✅ Scripts are sanitized/escaped
- ✅ No script execution

---

## 🔍 INTEGRATION TESTS

### Test I1: Complete User Registration Flow
**Steps:**
1. Register with strong password
2. Receive verification code
3. Verify email
4. Login successfully

**Expected Result:**
- ✅ All steps work correctly
- ✅ Security measures don't break functionality

---

### Test I2: File Upload Complete Flow
**Steps:**
1. Authenticate
2. Submit analysis request with valid file
3. Upload image/PDF
4. Retrieve file later

**Expected Result:**
- ✅ Valid files accepted
- ✅ Invalid files rejected
- ✅ Files stored securely
- ✅ Files accessible only to authenticated users

---

## 📊 TEST RESULTS TEMPLATE

```
TEST SCENARIO: [Test Name]
DATE: [Date]
TESTER: [Name]
ENVIRONMENT: [Dev/Staging/Prod]

STEPS:
1. [Step]
2. [Step]

EXPECTED RESULT: [Description]
ACTUAL RESULT: [Description]
STATUS: ✅ PASS / ❌ FAIL

NOTES:
[Any observations]
```

---

## 🚨 FAILURE ESCALATION

If any test fails:
1. **Document** the failure with screenshots/logs
2. **Verify** it's a real security issue (not false positive)
3. **Prioritize** based on severity:
   - Critical: Fix immediately
   - High: Fix within 24 hours
   - Medium: Fix within 1 week
4. **Re-test** after fix

---

## ✅ ACCEPTANCE CRITERIA

All tests must pass for production deployment:
- ✅ All Critical tests: 100% pass
- ✅ All High severity tests: 100% pass
- ✅ All Medium severity tests: 95%+ pass
- ✅ No security headers missing
- ✅ No sensitive data in logs
- ✅ Rate limiting functional
- ✅ File upload validation working

---

## 📅 TESTING SCHEDULE

**Recommended Frequency:**
- **Before each release:** Full test suite
- **Weekly:** Critical and High severity tests
- **Monthly:** Complete test suite
- **After security patches:** Affected test areas

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** Quarterly

