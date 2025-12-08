# Security Fixes - Quick Action Checklist

## 🔴 CRITICAL - Fix Immediately

### 1. Disable SQL Logging in DataSource Configs
**Files to fix:**
- `app-backend/src/src/main/java/com/rensights/config/AdminDataSourceConfig.java`
- `app-backend/src/src/main/java/com/rensights/config/PublicDataSourceConfig.java`
- `admin-backend/src/src/main/java/com/rensights/admin/config/AdminDataSourceConfig.java`
- `admin-backend/src/src/main/java/com/rensights/admin/config/PublicDataSourceConfig.java`

**Change:**
```java
// BEFORE:
properties.put("hibernate.show_sql", "true");
properties.put("hibernate.format_sql", "true");

// AFTER:
properties.put("hibernate.show_sql", "false");
properties.put("hibernate.format_sql", "false");
```

**Or make it conditional:**
```java
@Value("${spring.profiles.active:}")
private String activeProfile;

// In properties setup:
boolean isDev = activeProfile.contains("dev");
properties.put("hibernate.show_sql", isDev ? "true" : "false");
properties.put("hibernate.format_sql", isDev ? "true" : "false");
```

---

### 2. Fix Health Endpoint Details Exposure
**File:** `app-backend/src/src/main/resources/application.yml`

**Change:**
```yaml
# BEFORE:
management:
  endpoint:
    health:
      show-details: always

# AFTER:
management:
  endpoint:
    health:
      show-details: when-authorized
```

---

### 3. Implement Rate Limiting
**Add dependency to `pom.xml`:**
```xml
<dependency>
    <groupId>com.github.vladimir-bukhtoyarov</groupId>
    <artifactId>bucket4j-core</artifactId>
    <version>8.7.0</version>
</dependency>
```

**Or use Spring Cloud Gateway rate limiting (if using gateway)**
**Or implement custom filter/interceptor**

---

## ⚠️ HIGH - Fix Soon

### 4. Add Input Validation to Controllers
**File:** `AnalysisRequestController.java`

**Add validation:**
```java
@PostMapping(consumes = {"multipart/form-data"})
public ResponseEntity<?> submitAnalysisRequest(
        @RequestParam("email") @Email @NotBlank String email,
        @RequestParam(value = "latitude", required = false) 
            @DecimalMin("-90") @DecimalMax("90") 
            @Pattern(regexp = "^-?\\d+(\\.\\d+)?$", message = "Invalid latitude format")
            String latitude,
        // ... other parameters with appropriate validations
```

---

### 5. Review and Clean Console Logs
**Files:** All frontend `.tsx` and `.ts` files

**Remove or make conditional:**
```typescript
// BEFORE:
console.log('Sensitive data:', data);

// AFTER:
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}
```

---

### 6. Add Request Size Limits
**File:** `application.yml` or `application-prod.yml`

**Add:**
```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
  # Also add general request limits
server:
  max-http-header-size: 8KB
```

---

## Testing Checklist

- [ ] Run `mvn dependency-check:check`
- [ ] Run `npm audit` on frontend
- [ ] Test rate limiting (after implementation)
- [ ] Verify SQL logging is disabled in production
- [ ] Test health endpoint doesn't expose details
- [ ] Verify CORS origins are restricted in production
- [ ] Test file upload with malicious files
- [ ] Verify path traversal protection works
- [ ] Test authentication with invalid tokens
- [ ] Verify error messages don't leak sensitive data

---

## Quick Wins (Low Effort, High Impact)

1. **Remove SQL logging** (5 minutes)
2. **Fix health endpoint** (2 minutes)
3. **Remove console.logs** (30 minutes)
4. **Add request size limits** (5 minutes)
5. **Run dependency scans** (10 minutes)

---

## Before Production Deployment

### Must Have:
- [x] SQL logging disabled
- [ ] Rate limiting implemented
- [ ] Health endpoint secured
- [ ] All CRITICAL issues fixed
- [ ] Dependency scan clean
- [ ] CORS origins restricted
- [ ] Error handling reviewed

### Should Have:
- [ ] Centralized security logging
- [ ] Input validation enhanced
- [ ] CSRF strategy reviewed
- [ ] Security monitoring setup

### Nice to Have:
- [ ] MFA implementation
- [ ] Redis token blacklist
- [ ] Security headers audit
- [ ] Penetration testing completed
