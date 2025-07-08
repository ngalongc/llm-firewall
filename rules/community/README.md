# Community Rules Directory

This directory contains community-contributed PII detection rules for the LLM Firewall.

## Contributing Rules

To contribute a new rule set:

1. Create a JSON file following the schema in `../schema.json`
2. Include comprehensive test cases for your patterns
3. Ensure patterns are specific to avoid false positives
4. Add appropriate metadata (author, description, tags)

## Rule Categories

- **personal**: Personal identifiers (SSN, names, addresses)
- **financial**: Financial information (credit cards, bank accounts)
- **medical**: Medical identifiers (patient IDs, medical records)
- **technical**: Technical secrets (API keys, passwords)
- **custom**: Organization-specific patterns

## Example Rule Structure

```json
{
  "name": "My Custom Rules",
  "version": "1.0.0",
  "description": "Custom PII detection for organization XYZ",
  "author": "Your Name",
  "tags": ["custom", "organizational"],
  "rules": [
    {
      "id": "employee_id",
      "name": "Employee ID",
      "description": "Detects employee IDs in format EMP-XXXXXX",
      "pattern": "\\bEMP-\\d{6}\\b",
      "flags": "g",
      "replacement": "[REDACTED_EMPLOYEE_ID]",
      "confidence": 0.95,
      "category": "custom",
      "severity": "medium",
      "enabled": true,
      "testCases": [
        {
          "input": "Employee EMP-123456 submitted report",
          "expected": "Employee [REDACTED_EMPLOYEE_ID] submitted report",
          "shouldMatch": true
        }
      ]
    }
  ]
}
```

## Testing Your Rules

Use the CLI to test your rules:

```bash
llm-firewall test-rules --file path/to/your/rules.json
```

## Best Practices

1. **Specificity**: Make patterns as specific as possible to avoid false positives
2. **Test Cases**: Include both positive and negative test cases
3. **Confidence**: Set appropriate confidence levels (0.0-1.0)
4. **Severity**: Use appropriate severity levels (low, medium, high, critical)
5. **Documentation**: Provide clear descriptions of what each rule detects

## Confidence Levels

- **0.9-1.0**: Very high confidence, minimal false positives
- **0.7-0.9**: High confidence, some false positives possible
- **0.5-0.7**: Medium confidence, review recommended
- **0.3-0.5**: Low confidence, high false positive rate
- **0.0-0.3**: Very low confidence, experimental patterns

## Severity Levels

- **critical**: Highly sensitive data that must be protected
- **high**: Sensitive data that should be protected
- **medium**: Moderately sensitive data
- **low**: Less sensitive but still worth protecting