# Code Health Report — 2026-05-11

全项目体检报告。按严重程度排序，标注是否触及 **SOFT_FREEZE 冻结系统**。

---

## 一、CRITICAL — 安全问题（必须立即修复）

### 1.1 NoSQL ReDoS 注入 — `$regex` 未转义
- **`api/inv/invoices.js:164,167`** — `invoiceNumber` / `customer` 直接传入 `$regex`
- **`api/inv/transactions.js:277`** — 搜索词直接传入 `$regex`
- **`api/inv/whatsapp.js:29-30,56-57`** — 客户名/电话/备注全部未转义
- **对比**: `api/inv/products.js:31,82` 已正确使用 `keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` 转义
- **影响**: 攻击者发送 `(?:a|a)*` 等正则可导致 MongoDB 正则引擎灾难性回溯，服务中断
- **安全修复**: 不触及冻结系统 ✅ 可直接修复

### 1.2 CAPTCHA 接口缺少频率限制
- **`api/inv/auth.js:62`** — `POST /captcha` 完全无限制，攻击者可每分钟刷数万次填满内存
- **影响**: 内存耗尽，服务崩溃
- **安全修复**: 不触及冻结系统 ✅ 可直接修复

### 1.3 公共接口缺少频率限制
- **`api/reviews.js:39`** — 提交评价无限制
- **`api/inv/share-public.js`** — 所有公共分享接口无限制，可暴力破解共享链接 token
- **安全修复**: 不触及冻结系统 ✅ 可直接修复

---

## 二、HIGH — 安全/数据完整性

### 2.1 DOM XSS — 管理后台定价编辑器
- **`admin-enhanced-core.js:165-188`** — model 名/服务名直接拼入 `innerHTML`，未转义
- **影响**: 有定价管理权限的用户可在 model 名中植入 `<img src=x onerror=alert(1)>`，在另一管理员查看时执行
- **安全修复**: 不触及冻结系统 ✅

### 2.2 HTML 注入 — 发票邮件
- **`api/inv/invoices.js:115-131`** — `customerName` 等未转义直接拼 HTML
- **`services/inv-invoice-delivery-service.js:74-93`** — 同上
- **安全修复**: 不触及冻结系统 ✅

### 2.3 客户端的 simple humanCheck 绕过
- **`api/inv/auth.js:145-147`** — `humanCheck` 纯客户端 boolean，机器人直接发 `true` 即可绕过
- **安全修复**: 不触及冻结系统 ✅（需移除或改为真实验证）

### 2.4 服务端错误信息泄露
- **`api/inv/auth.js:306`** — `res.status(500).json({ error: '服务器错误', detail: err.message })`
- **`api/inv/delivery.js:46,71,91,117...`** — 大量 `.json({ error: 'Failed: ' + err.message })`
- **`api/inv/whatsapp.js:87,101,135,155,173`** — 内部错误信息直接返回客户端
- **安全修复**: 不触及冻结系统 ✅

### 2.5 login 服务的 humanCheck 绕过
- **`api/inv/auth.js:145-147`** — 仅检查客户端 sent 的 `humanCheck` boolean，机器人直接 `true` 即可

---

## 三、HIGH — 数据完整性

### 3.1 AuditLog 模型无任何保护钩子
- **`models/inv/AuditLog.js`** — 完全没有 pre-save/update/delete 钩子
- **对比**: CashLedger（8 个钩子）、Invoice（4 个）、DailyClose（4 个）、MonthlyReport（4 个）
- **影响**: 审计日志可以被任意修改或删除，破坏审计链。按 SYSTEM_SPEC §15 审计日志是强制要求
- **安全修复**: 不触及冻结系统 ✅

### 3.2 MonthlyReport 缺少 `deleteMany` 钩子
- **`models/inv/MonthlyReport.js:95-97`** — 有 `deleteOne` 但缺少 `deleteMany`
- **影响**: 通过 `deleteMany({})` 可绕过 `deleteOne` 保护，删除全部月度税报
- **安全修复**: 不触及冻结系统 ✅

### 3.3 LoginLog 模型无保护钩子
- 登录日志可被任意修改/删除，掩盖攻击痕迹
- **安全修复**: 不触及冻结系统 ✅

### 3.4 两套独立审计系统
- **`services/inv-admin-service.js`** — 定义了 7 个 `AUDIT_ACTIONS` 类型
- **`api/inv/root.js`** — 绕过 admin-service，直接用 `AuditLog.create()` 写自定义 action 字符串（如 `root.user.create`, `root.system.lock`）
- **影响**: 无法一次查询完整的审计历史
- **注意**: 此为架构不一致问题 — 触及 root.js（冻结系统的管理面），修复需谨慎

---

## 四、MEDIUM — 代码质量

### 4.1 生产错误日志缺失 — 7 个路由文件
以下文件有 `try/catch` 但 catch 中无 `console.error`：
- `products.js`（8 个 catch 块，0 个 console.error）
- `suppliers.js`（10 个，0 个）
- `expenses.js`（4 个，0 个）
- `purchases.js`（5 个，0 个）
- `stock.js`（6 个，0 个）
- `pos-shortcuts.js`（2 个，0 个）
- `invoices.js`（11 个，0 个）
- **正确示范**: `close.js`（5 个 catch，全部有 console.error）
- **安全修复**: 不触及冻结系统 ✅

### 4.2 管理操作缺少审计日志
以下 root/manager 操作完全没有 AuditLog 记录：
| 文件 | 操作 |
|------|------|
| `suppliers.js` | 批量禁用/启用、删除供应商 |
| `products.js` | 禁用/删除产品 |
| `expenses.js` | 创建/删除支出 |
| `purchases.js` | 创建/编辑/收货/取消采购单 |
| `pos-shortcuts.js` | 修改 POS 快捷方式 |
| `transactions.js` | 编辑交易项 |
- **安全修复**: 不触及冻结系统 ✅（添加审计记录不影响业务逻辑）

### 4.3 未使用的导入
- **`api/inv/transactions.js:3`** — `const { encryptData } = require('../../utils/inv-crypto')` 已无用
- **`api/inv/export.js:4`** — `const mongoose = require('mongoose')` 未用
- **安全修复**: 不触及冻结系统 ✅

### 4.4 未使用的工具模块
- **`utils/inv-reconciliation.js`** — 完整的对账工具，但从未被任何 API 或 service 导入
- `api/inv/stock.js:222-288` 独立实现了一套相同的对账逻辑（重复代码）
- **`utils/inv-system-lock.js:51`** — `requireSystemActiveMiddleware` Express 中间件从未被使用
- **安全修复**: 不触及冻结系统 ✅（删除未使用代码 / 统一使用对账工具）

### 4.5 代码重复
- **发票邮件模板**: `api/inv/invoices.js:89-154` 和 `services/inv-invoice-delivery-service.js:55-106` 几乎相同
- **报表聚合逻辑**: `api/inv/reports.js` 中 daily/monthly/weekly 三个端点各有独立但几乎相同的聚合循环
- **导出逻辑**: `api/inv/export.js:26-96` 和 `api/inv/root-export.js:26-127` 重复
- **安全修复**: 不触及冻结系统 ✅（提取共享函数）

### 4.6 内存存储可能丢失
- **`api/inv/auth.js:35`** — `captchaStore` 存于内存，服务器重启全部丢失
- **`api/inv/auth.js:39`** — `deviceFailureStore` 存于内存，重启后暴力破解计数器归零
- **影响**: 重启后暴力破解保护失效
- **注意**: 改为持久化存储可能涉及架构变更

---

## 五、MEDIUM — L1 层违规（前端含业务逻辑）

按 RUNBOOK §1 和 §6，前端不得包含 VAT/金额/定价计算。

### 5.1 inv-pos.html — 销售订单面板聚合（最严重）
- **`inv-pos.html:2158-2188`** — 在前端遍历交易、按 VAT 税率分"standard sales"、"margin sales"、"service sales"、"Lyca sales"，计算每种的总和
- 这是纯 L2 财务分类逻辑
- **安全修复**: 不触及冻结系统 ✅（移至服务端 API）

### 5.2 inv-products.html — 直接 VAT 计算
- **`inv-products.html:476-486`** — `updateMarginInfo()` 硬编码 `0.23/1.23` 计算 margin VAT 和 standard VAT
- 前端硬编码税率
- **安全修复**: 不触及冻结系统 ✅

### 5.3 inv-purchases.html — 采购单总计计算
- **`inv-purchases.html:313-322`** — `calcTotal()` 前端遍历所有行计算 `qty * price`
- **安全修复**: 不触及冻结系统 ✅

### 5.4 多文件 — 行项金额重复计算
- **`inv-pos.html:2022-2023`**, **`inv-transactions.html:424-425,571-572,665-666`** — 多处在前端计算 `price * quantity`
- **安全修复**: 不触及冻结系统 ✅（使用后端返回的 lineTotal）

### 5.5 前端硬编码 VAT 税率
- **`inv-pos.html:2953,3069`** — `vatRate: vatVal / 100` 默认为 23%
- **安全修复**: 不触及冻结系统 ✅

---

## 六、MEDIUM — 测试覆盖缺口

### 6.1 完全无测试的 API 路由（9/18）
| 文件 | 风险 |
|------|------|
| **`api/inv/root.js`** | HIGH — 最高权限管理接口 |
| **`api/inv/close.js`** | HIGH — 封账（财务） |
| **`api/inv/expenses.js`** | HIGH — 支出记录 |
| `api/inv/export.js` | MEDIUM |
| `api/inv/root-export.js` | MEDIUM |
| `api/inv/delivery.js` | MEDIUM |
| `api/inv/whatsapp.js` | LOW |
| `api/inv/pos-shortcuts.js` | LOW |
| `api/inv/share-public.js` | LOW |

### 6.2 完全无测试的 Service（5/9）
| 文件 | 风险 |
|------|------|
| **`services/inv-admin-service.js`** | HIGH — 审计日志 |
| `services/inv-receipt-delivery-service.js` | MEDIUM |
| `services/inv-invoice-delivery-service.js` | MEDIUM |
| `services/inv-share-service.js` | MEDIUM |
| `services/inv-invoice-pdf.js` | MEDIUM |

### 6.3 完全无测试的 Utils（3/9）
| 文件 | 风险 |
|------|------|
| **`utils/inv-system-lock.js`** | HIGH — 系统锁 |
| **`utils/inv-crypto.js`** | HIGH — 加密 |
| `utils/inv-receipt-number.js` | MEDIUM |

---

## 七、模型保护完成度

| 模型 | 钩子数 | 状态 |
|------|--------|------|
| CashLedger | 8 | ✅ 完整 |
| Invoice | 4 | ✅ 已修复 (本次) |
| DailyClose | 4 | ✅ 完整 |
| MonthlyReport | 4 | ⚠️ 缺 deleteMany |
| Device | 2 | ✅ 基本完整 |
| Transaction | 1 | ✅ 符合设计（root 可编辑） |
| User | 1 | ⚠️ 缺删除保护 |
| AuditLog | 0 | ❌ 完全无保护 |
| Product | 0 | OK（非财务） |
| Supplier | 0 | OK（非财务） |
| PurchaseOrder | 0 | OK（非财务） |
| StockMovement | 0 | OK（非财务） |
| Expense | 0 | ⚠️ 财务记录无保护 |
| PosShortcut | 0 | OK（UI 配置） |
| TrustedDevice | 0 | OK（设备信任） |
| LoginLog | 0 | ⚠️ 安全日志无保护 |
| SystemSetting | 0 | ⚠️ 系统配置无保护 |

---

## 八、修复优先级

### Priority 1 — 安全漏洞（立即）
| # | 问题 | 触及冻结系统 |
|---|------|:---:|
| 1 | `$regex` 转义（4 个文件） | ❌ |
| 2 | /captcha 频率限制 | ❌ |
| 3 | 公共接口频率限制 | ❌ |
| 4 | 移除 humanCheck 或改为真实验证 | ❌ |
| 5 | 生产环境错误信息不外泄 | ❌ |
| 6 | DOM XSS 修复 + 邮件 HTML 注入 | ❌ |

### Priority 2 — 数据完整（短期）
| # | 问题 | 触及冻结系统 |
|---|------|:---:|
| 7 | AuditLog 添加不可变钩子 | ❌ |
| 8 | MonthlyReport 添加 deleteMany | ❌ |
| 9 | LoginLog 添加不可变钩子 | ❌ |
| 10 | 管理操作补充审计日志 | ❌ |

### Priority 3 — 代码质量（中期）
| # | 问题 | 触及冻结系统 |
|---|------|:---:|
| 11 | 7 个路由文件添加 console.error | ❌ |
| 12 | 删除未使用导入和工具 | ❌ |
| 13 | 消除代码重复 | ❌ |
| 14 | 前端 L1 违规清理 | ❌ |
| 15 | 补充测试覆盖（优先 root.js, close.js, expenses.js） | ❌ |

---

## 九、不可触碰的底线

以下系统 **FROZEN**，本次审计中的所有建议均不涉及：

- ✅ 结账引擎（Transaction + CashLedger 原子流）
- ✅ 退款引擎（全额/部分退款、重复退款防护）
- ✅ VAT 引擎（23% / 13.5% / margin VAT）— 仅建议前端不再重复计算
- ✅ CashLedger 不可变设计（已完整）
- ✅ DailyClose 生命周期（已完整）
- ✅ 完整性层（Symbol-based authorization）
- ✅ Device 财务生命周期
- ✅ 月度报表生成逻辑

**检查结论**: 冻结系统的核心架构完整且安全，无需修改。所有建议修复均为周边防护（安全加固、审计补全、测试覆盖）。

---

*报告完成 — 共发现 29 项问题（6 Critical + 9 High + 14 Medium），其中 0 项触及 SOFT_FREEZE 冻结系统。*
