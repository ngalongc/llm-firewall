# Community Rules Examples

This document provides practical examples of how to create and use community rules for the LLM Firewall.

## Example 1: Custom Organization Patterns

Create rules specific to your organization:

```json
{
  "name": "Acme Corp Custom Rules",
  "version": "1.0.0", 
  "description": "Custom PII patterns for Acme Corporation",
  "author": "Acme Security Team",
  "tags": ["custom", "organizational", "acme"],
  "rules": [
    {
      "id": "acme_employee_id",
      "name": "Acme Employee ID",
      "description": "Detects Acme employee IDs in format ACME-EMP-XXXX",
      "pattern": "\\bACME-EMP-\\d{4}\\b",
      "flags": "gi",
      "replacement": "[REDACTED_EMPLOYEE_ID]",
      "confidence": 0.98,
      "category": "custom",
      "severity": "medium",
      "enabled": true,
      "testCases": [
        {
          "input": "Employee ACME-EMP-1234 approved the request",
          "expected": "Employee [REDACTED_EMPLOYEE_ID] approved the request",
          "shouldMatch": true
        },
        {
          "input": "The year was 1234 when we started",
          "expected": "The year was 1234 when we started", 
          "shouldMatch": false
        }
      ]
    },
    {
      "id": "acme_project_code",
      "name": "Acme Project Code",
      "description": "Detects internal project codes like PROJ-ALPHA-2024",
      "pattern": "\\bPROJ-[A-Z]{3,10}-\\d{4}\\b",
      "flags": "g",
      "replacement": "[REDACTED_PROJECT_CODE]",
      "confidence": 0.90,
      "category": "custom",
      "severity": "low",
      "enabled": true,
      "testCases": [
        {
          "input": "Working on PROJ-ALPHA-2024 this quarter",
          "expected": "Working on [REDACTED_PROJECT_CODE] this quarter",
          "shouldMatch": true
        }
      ]
    }
  ]
}
```

## Example 2: Healthcare/HIPAA Compliance

Rules for detecting healthcare-related PII:

```json
{
  "name": "Healthcare PII Detection",
  "version": "1.0.0",
  "description": "HIPAA-compliant PII detection patterns",
  "author": "Healthcare Security Team",
  "tags": ["healthcare", "hipaa", "medical"],
  "rules": [
    {
      "id": "medical_record_number",
      "name": "Medical Record Number",
      "description": "Detects medical record numbers in various formats",
      "pattern": "\\b(?:MRN|MR|Medical Record)[:\\s#]*[A-Z0-9]{6,12}\\b",
      "flags": "gi",
      "replacement": "[REDACTED_MRN]",
      "confidence": 0.85,
      "category": "medical",
      "severity": "critical",
      "enabled": true,
      "testCases": [
        {
          "input": "Patient MRN: ABC123456789",
          "expected": "Patient [REDACTED_MRN]",
          "shouldMatch": true
        },
        {
          "input": "Medical Record #DEF987654321",
          "expected": "Medical Record [REDACTED_MRN]",
          "shouldMatch": true
        }
      ]
    },
    {
      "id": "npi_number",
      "name": "National Provider Identifier",
      "description": "Detects NPI numbers (10-digit healthcare provider IDs)",
      "pattern": "\\b(?:NPI[:\\s#]*)?[0-9]{10}\\b",
      "flags": "g",
      "replacement": "[REDACTED_NPI]",
      "confidence": 0.70,
      "category": "medical", 
      "severity": "medium",
      "enabled": true,
      "testCases": [
        {
          "input": "Provider NPI: 1234567890",
          "expected": "Provider NPI: [REDACTED_NPI]",
          "shouldMatch": true
        }
      ]
    }
  ]
}
```

## Example 3: International Banking

Rules for international financial identifiers:

```json
{
  "name": "International Banking Rules",
  "version": "1.0.0",
  "description": "International banking and financial identifiers",
  "author": "Financial Security Team",
  "tags": ["financial", "international", "banking"],
  "rules": [
    {
      "id": "uk_sort_code",
      "name": "UK Sort Code",
      "description": "Detects UK bank sort codes (XX-XX-XX format)",
      "pattern": "\\b\\d{2}-\\d{2}-\\d{2}\\b",
      "flags": "g",
      "replacement": "[REDACTED_SORT_CODE]",
      "confidence": 0.75,
      "category": "financial",
      "severity": "high",
      "enabled": true,
      "testCases": [
        {
          "input": "Sort code: 12-34-56",
          "expected": "Sort code: [REDACTED_SORT_CODE]",
          "shouldMatch": true
        },
        {
          "input": "Date: 12-34-56 was invalid",
          "expected": "Date: [REDACTED_SORT_CODE] was invalid",
          "shouldMatch": true
        }
      ]
    },
    {
      "id": "canadian_sin",
      "name": "Canadian SIN",
      "description": "Detects Canadian Social Insurance Numbers",
      "pattern": "\\b\\d{3}[-\\s]?\\d{3}[-\\s]?\\d{3}\\b",
      "flags": "g",
      "replacement": "[REDACTED_SIN]",
      "confidence": 0.80,
      "category": "personal",
      "severity": "critical",
      "enabled": true,
      "testCases": [
        {
          "input": "SIN: 123 456 789",
          "expected": "SIN: [REDACTED_SIN]",
          "shouldMatch": true
        },
        {
          "input": "SIN: 123-456-789", 
          "expected": "SIN: [REDACTED_SIN]",
          "shouldMatch": true
        }
      ]
    }
  ]
}
```

## Example 4: Cloud Provider Secrets

Rules for detecting cloud provider API keys and secrets:

```json
{
  "name": "Cloud Provider Secrets",
  "version": "1.0.0",
  "description": "API keys and secrets for major cloud providers",
  "author": "DevSecOps Team",
  "tags": ["cloud", "api-keys", "secrets", "technical"],
  "rules": [
    {
      "id": "azure_connection_string",
      "name": "Azure Connection String",
      "description": "Detects Azure storage account connection strings",
      "pattern": "DefaultEndpointsProtocol=https;AccountName=[^;]+;AccountKey=[^;]+",
      "flags": "g",
      "replacement": "[REDACTED_AZURE_CONNECTION]",
      "confidence": 0.99,
      "category": "technical",
      "severity": "critical",
      "enabled": true,
      "testCases": [
        {
          "input": "DefaultEndpointsProtocol=https;AccountName=mystorageaccount;AccountKey=abc123def456==",
          "expected": "[REDACTED_AZURE_CONNECTION]",
          "shouldMatch": true
        }
      ]
    },
    {
      "id": "gcp_service_account_key",
      "name": "GCP Service Account Key",
      "description": "Detects Google Cloud service account key patterns",
      "pattern": "\"type\":\\s*\"service_account\"",
      "flags": "g",
      "replacement": "[REDACTED_GCP_SERVICE_ACCOUNT]",
      "confidence": 0.90,
      "category": "technical",
      "severity": "critical",
      "enabled": true,
      "testCases": [
        {
          "input": "{\"type\": \"service_account\", \"project_id\": \"my-project\"}",
          "expected": "{[REDACTED_GCP_SERVICE_ACCOUNT], \"project_id\": \"my-project\"}",
          "shouldMatch": true
        }
      ]
    },
    {
      "id": "docker_hub_token",
      "name": "Docker Hub Token",
      "description": "Detects Docker Hub access tokens",
      "pattern": "\\bdckr_pat_[a-zA-Z0-9\\-_]{22,}\\b",
      "flags": "g",
      "replacement": "[REDACTED_DOCKER_TOKEN]",
      "confidence": 0.95,
      "category": "technical",
      "severity": "high",
      "enabled": true,
      "testCases": [
        {
          "input": "Docker token: dckr_pat_abcdef123456789012345678901234567890",
          "expected": "Docker token: [REDACTED_DOCKER_TOKEN]",
          "shouldMatch": true
        }
      ]
    }
  ]
}
```

## Example 5: Cryptocurrency Wallets

Rules for detecting cryptocurrency wallet addresses:

```json
{
  "name": "Cryptocurrency Wallets",
  "version": "1.0.0",
  "description": "Cryptocurrency wallet addresses for major currencies",
  "author": "FinTech Security Team", 
  "tags": ["cryptocurrency", "financial", "wallets"],
  "rules": [
    {
      "id": "dogecoin_wallet",
      "name": "Dogecoin Wallet",
      "description": "Detects Dogecoin wallet addresses",
      "pattern": "\\b[DA][1-9A-HJ-NP-Za-km-z]{25,34}\\b",
      "flags": "g",
      "replacement": "[REDACTED_DOGE_WALLET]",
      "confidence": 0.90,
      "category": "financial",
      "severity": "medium",
      "enabled": true,
      "testCases": [
        {
          "input": "Send DOGE to DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L",
          "expected": "Send DOGE to [REDACTED_DOGE_WALLET]",
          "shouldMatch": true
        }
      ]
    },
    {
      "id": "litecoin_wallet",
      "name": "Litecoin Wallet", 
      "description": "Detects Litecoin wallet addresses",
      "pattern": "\\b[LM3][a-km-zA-HJ-NP-Z1-9]{26,33}\\b",
      "flags": "g",
      "replacement": "[REDACTED_LTC_WALLET]",
      "confidence": 0.90,
      "category": "financial",
      "severity": "medium",
      "enabled": true,
      "testCases": [
        {
          "input": "LTC address: LdP8Qox1VAhCzLJNqrr74YovaWYyNBUWvL",
          "expected": "LTC address: [REDACTED_LTC_WALLET]",
          "shouldMatch": true
        }
      ]
    }
  ]
}
```

## Example 6: Development Environment Secrets

Rules for detecting secrets commonly found in development:

```json
{
  "name": "Development Secrets",
  "version": "1.0.0",
  "description": "Common secrets found in development environments",
  "author": "DevOps Team",
  "tags": ["development", "secrets", "technical"],
  "rules": [
    {
      "id": "jwt_token",
      "name": "JWT Token",
      "description": "Detects JSON Web Tokens",
      "pattern": "\\beyJ[A-Za-z0-9\\-_=]+\\.[A-Za-z0-9\\-_=]+\\.[A-Za-z0-9\\-_.+/=]*\\b",
      "flags": "g",
      "replacement": "[REDACTED_JWT]",
      "confidence": 0.85,
      "category": "technical",
      "severity": "high",
      "enabled": true,
      "testCases": [
        {
          "input": "Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
          "expected": "Token: [REDACTED_JWT]",
          "shouldMatch": true
        }
      ]
    },
    {
      "id": "database_url",
      "name": "Database URL",
      "description": "Detects database connection URLs with credentials",
      "pattern": "\\b(?:mysql|postgresql|mongodb)://[^\\s:]+:[^\\s@]+@[^\\s/]+",
      "flags": "gi",
      "replacement": "[REDACTED_DB_URL]",
      "confidence": 0.95,
      "category": "technical",
      "severity": "critical",
      "enabled": true,
      "testCases": [
        {
          "input": "DATABASE_URL=postgresql://user:password@localhost:5432/mydb",
          "expected": "DATABASE_URL=[REDACTED_DB_URL]",
          "shouldMatch": true
        }
      ]
    },
    {
      "id": "redis_url",
      "name": "Redis URL",
      "description": "Detects Redis connection URLs with authentication",
      "pattern": "\\bredis://[^\\s:]*:[^\\s@]*@[^\\s/]+",
      "flags": "g",
      "replacement": "[REDACTED_REDIS_URL]",
      "confidence": 0.90,
      "category": "technical",
      "severity": "high",
      "enabled": true,
      "testCases": [
        {
          "input": "REDIS_URL=redis://user:pass123@redis.example.com:6379",
          "expected": "REDIS_URL=[REDACTED_REDIS_URL]",
          "shouldMatch": true
        }
      ]
    }
  ]
}
```

## Usage Examples

### Installing Custom Rules

1. **Place rule files in the appropriate directory:**
   ```bash
   cp my-custom-rules.json rules/vendor/
   ```

2. **Validate your rules:**
   ```bash
   llm-firewall rules validate rules/vendor/my-custom-rules.json
   ```

3. **Test your rules:**
   ```bash
   llm-firewall rules test-rules rules/vendor/my-custom-rules.json
   ```

4. **Start the firewall with custom rules:**
   ```bash
   llm-firewall start
   ```

### Testing Rules

```bash
# Test specific text against all rules
llm-firewall test-enhanced --text "Employee ACME-EMP-1234 has MRN: ABC123456789"

# List rules by category
llm-firewall rules list --category medical

# Enable/disable specific rules
llm-firewall rules disable medical_record_number
llm-firewall rules enable medical_record_number
```

### Configuration Examples

**Enable only high-confidence rules:**
```json
{
  "rules": {
    "enabled": true,
    "minConfidence": 0.90,
    "enabledCategories": ["financial", "technical"],
    "disabledRules": ["uk_sort_code"]
  }
}
```

**Development environment (less strict):**
```json
{
  "rules": {
    "enabled": true,
    "minConfidence": 0.70,
    "enabledCategories": ["technical"],
    "disabledRules": ["database_url", "redis_url"]
  }
}
```

**Production environment (strict):**
```json
{
  "rules": {
    "enabled": true,
    "minConfidence": 0.85,
    "enabledCategories": ["personal", "financial", "medical", "technical"],
    "disabledRules": []
  }
}
```

## Best Practices for Rule Creation

1. **Start Simple**: Begin with high-confidence, specific patterns
2. **Test Thoroughly**: Include both positive and negative test cases
3. **Use Appropriate Categories**: Choose the right category for filtering
4. **Set Realistic Confidence**: Balance security with false positives
5. **Document Well**: Provide clear descriptions and use cases
6. **Version Control**: Track changes to your rule sets
7. **Regular Updates**: Keep rules current with new threat patterns