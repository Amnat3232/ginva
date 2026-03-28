# Template - Keeper Logic

> Use this template for documenting keeper bot logic.

---

# [Keeper Name] - [Role]

## Overview
Brief description of keeper responsibilities.

## Trigger Condition
```typescript
// Pseudocode for when this keeper acts
if (CONDITION) {
    await executeAction();
}
```

## Action
```typescript
// What this keeper does
async function executeAction() {
    // Implementation
}
```

## Revenue Model
- Source: [Where revenue comes from]
- Share: [Percentage or amount]

## Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| Interval | 30s | How often to check |
| Min Threshold | $100 | Minimum value to act |

## Error Handling
- [ ] Retry logic
- [ ] Fallback behavior
- [ ] Logging

## Metrics
- Transactions executed
- Revenue generated
- Success rate

## Related
- [[02-Architecture/Keeper-System]]
- [[04-Keeper-Bots/Revenue-Share-Logic]]

---
**Last Updated**: {{date}}
