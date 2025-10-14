# Benefit Structure Example

## Understanding the Benefit Structure

Your `Benefit` type represents a credit card benefit that can be used at a specific merchant (business/store).

### Example from your MongoDB:

```json
{
  "_id": { "$oid": "68dff40594f461d5eb47f793" },
  "merchant": {
    "name": "Onfit", // ← The business/store where you use the benefit
    "type": "business"
  },
  "bank": "Santander", // ← The bank offering this benefit
  "network": "VISA", // ← Payment network
  "cardTypes": [
    {
      "name": "Santander Visa Crédito",
      "category": "Standard",
      "mode": "credit"
    }
  ],
  "benefitTitle": "20% de ahorro + hasta 6 cuotas sin interés",
  "description": "20% de ahorro con tope de reintegro de $150.000...",
  "categories": ["deportes"],
  "discountPercentage": 20,
  "online": false,
  "location": "Buenos Aires y CABA"
}
```

### How it works:

1. **Merchant** (`"Onfit"`) = The gym/fitness business where you can use this benefit
2. **Bank** (`"Santander"`) = The bank that offers this benefit to their cardholders
3. **Benefit** = 20% discount when you pay at Onfit with your Santander Visa card

### In the UI:

```
┌─────────────────────────────────────────┐
│ 🏪 Onfit                    🏦 Santander │
│ business                         VISA    │
│                                          │
│ 20% de ahorro + hasta 6 cuotas sin int. │
│ 20% de ahorro con tope de reintegro...  │
│                                          │
│ [20% OFF] 🏪 Solo presencial            │
│                                          │
│ 🏷️ deportes                             │
│                                          │
│ Tarjetas válidas:                        │
│ [Santander Visa Crédito (credit)]       │
└─────────────────────────────────────────┘
```

### Real-world scenario:

- You have a **Santander Visa Credit Card**
- You go to **Onfit gym** to pay for a membership
- You pay with your Santander card
- You get **20% discount** (up to $150,000 cashback)
- Plus you can pay in **6 installments without interest**

So the **merchant name** represents the business where you can use your credit card benefit! 🎯
