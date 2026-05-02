# Context Transfer — POS UI Redesign

## Current State (as of latest commit)

### Project
- **Repo**: `https://github.com/Lee15148863/teschcross`
- **Branch**: `main`
- **Deployment**: Cloud Run `teschcross-git` (europe-west1) → `techcross.ie`
- **Local path**: `~/Documents/workspace/techcross/teschcross/`
- **Admin login**: username `Lee087`

### What's Done
- Full POS system with product search, cart, checkout, receipt printing
- Permission system (13 modules, per-user toggles)
- Staff Portal with two tabs (Inventory + Management)
- Transactions page with search, date filter, refund, reprint
- Receipt with full shop info, T&C, VAT breakdown
- Inline expandable panels for Sale/Repair/Used (replaced popups)
- Reports: daily/weekly/monthly with 4 VAT categories + Lyca + expenses
- Expense tracking system
- Split payment (card + cash)
- 426 tests passing

### What Needs To Be Done — POS UI Redesign

**Goal**: Merge the right Action Sidebar and Cart Panel into one unified professional POS interface.

**Requirements**:
1. **Layout**: Action bar on top → Cart + Checkout below. Single unified right panel.
2. **Styling**: Unified border-radius 10-12px, consistent padding/fonts, hover effects, disabled states, alternating row colors, sticky table header, bold amounts, green change display.
3. **Functionality**: Empty cart state, auto-show table when items added, Clear only when cart not empty, Checkout only when amount > 0, discount auto-recalculates VAT, Standard/Margin VAT auto-detection, auto change calculation.
4. **Interaction**: Full keyboard shortcuts (F1-F6, Enter, Esc, Del, arrows), touch-friendly, no flicker, formatted amounts.
5. **Code quality**: CSS class names (no inline styles), JS event listeners (no inline onclick), i18n support, maintainable.

### Key Files
- `teschcross/inv-pos.html` — THE file to rewrite (~1800 lines)
- `teschcross/api/inv/transactions.js` — checkout/refund API
- `teschcross/utils/inv-receipt-generator.js` — receipt content
- `teschcross/utils/inv-discount-calculator.js` — discount engine
- `teschcross/utils/inv-vat-calculator.js` — VAT calculation
- `teschcross/models/inv/Product.js` — product schema with permissions
- `teschcross/models/inv/User.js` — user schema with permissions

### Current POS Layout (3 columns)
```
[Left 30%: Search + Quick Add Panels] [Center: Cart + Checkout] [Right 20%: Action Sidebar]
```

### Target POS Layout (2 columns)
```
[Left 35%: Search + Quick Add Panels] [Right 65%: Action Bar + Cart + Checkout]
```

### Existing Features to Preserve
- Product search (name/SKU/IMEI)
- Inline Sale/Repair/Used panels (expandable, no popups)
- Cart: add/remove items, quantity +/-, inline discount per item
- Per-item VAT rate display (23%, 13.5%, Margin)
- Order discount (F2 modal)
- Split payment (card + cash inputs)
- Change calculation
- Checkout → completion screen (Print Receipt / New Transaction)
- F1=Search, F2=Discount, F3=Card/Cash, F4=Print, F5=New, F6=Orders
- Language toggle (中/EN)
- Receipt preview with full shop info + T&C

### i18n Keys (zh/en)
Both languages defined for: posTitle, cartTitle, clearCartText, emptyCartText, checkoutText, thProduct, thPrice, thDisc, thQty, thTax, thSubtotal, lblSubtotal, lblDiscount, lblTotal, lblCardAmount, lblCashAmount, scSearch, scDiscount, scPayment, scCheckout, scClear, scRemove, scNavUp, scNavDown, sidebarTitle, scOrderSearch, scRefund, dmTitle, dmItemLabel, dmOrderLabel, lblStdVat, lblMarginVat, quickAddText, qaTitle, qaBtnSave, qaBtnCancel, qaLblName, qaLblSku, qaLblCat, qaLblCost, qaLblPrice, qaLblQty, qaLblSH, qaLblSource, qaLblMargin, qaLblVat, scPrint, scNavUp, scNavDown, sidebarTitle, scOrderSearch, scRefund

### Git Rules
- Don't push without permission
- Commit first, push when user says "push"
- Username: Lee15148863, email: Lee15148863@gmail.com

### Security
- Don't display credentials in chat
- .env uses placeholders
- Steering file: `.kiro/steering/security-practices.md`
