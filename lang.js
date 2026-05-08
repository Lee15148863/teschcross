/**
 * Bilingual translation system for Boss Control Panel
 * Supports: en (English), zh (Chinese)
 */

const LANG = {
  en: {
    /* ─── Header ─── */
    'app.title': 'Boss Control',
    'app.logout': 'Logout',
    'app.langToggle': '中',

    /* ─── Tabs ─── */
    'tab.overview': 'Overview',
    'tab.users': 'Users',
    'tab.ledger': 'Ledger',
    'tab.refund': 'Refund',
    'tab.devices': 'Devices',
    'tab.system': 'System',

    /* ─── Overview Tab ─── */
    'ov.cashToday': 'Cash Today',
    'ov.cardToday': 'Card Today',
    'ov.vatCollected': 'VAT Collected',
    'ov.netSales': 'Net Sales',
    'ov.salesCount': 'Sales Count',
    'ov.refunds': 'Refunds',
    'ov.ledgerIn': 'Ledger in',
    'ov.gross': 'Gross',
    'ov.refundLabel': '{count} refunds (-€{amount})',
    'ov.closed': 'Closed',
    'ov.noClose': 'No close yet',
    'ov.devicePL': 'Device Profit / Loss',
    'ov.soldDevices': 'Sold Devices',
    'ov.grossProfit': 'Gross Profit',
    'ov.quickActions': 'Quick Actions',
    'ov.refresh': 'Refresh',
    'ov.failedLoad': 'Failed to load overview',
    'ov.refreshed': 'Refreshed',

    /* ─── Navigation ─── */
    'nav.posTill': '🛒 POS / Till',
    'nav.inventory': '📦 Inventory',
    'nav.refunds': '💰 Refunds',
    'nav.reports': '📊 Reports',
    'nav.websiteAdmin': '🌐 Website Admin',

    /* ─── Users Tab ─── */
    'users.title': 'User Management',
    'users.create': '+ Create User',
    'users.disabled': 'disabled',
    'users.role': 'Role',
    'users.disable': 'Disable',
    'users.enable': 'Enable',
    'users.created': 'User created',
    'users.enabledMsg': 'User enabled',
    'users.disabledMsg': 'User disabled',
    'users.allFieldsReq': 'All fields required',
    'users.disableTitle': 'Disable User',
    'users.disableBody': 'This user will lose access to the system.',
    'users.notFound': 'User not found',
    'users.resetPw': 'Reset PW',
    'users.resetPwTitle': 'Reset Password',
    'users.newPassword': 'New Password',
    'users.confirmPassword': 'Confirm Password',
    'users.pwMismatch': 'Passwords do not match',
    'users.pwTooShort': 'Password must be at least 8 characters',
    'users.pwWeak': 'Password must contain at least one letter and one digit',
    'users.pwResetDone': 'Password reset successful',
    'users.edit': 'Edit',
    'users.editTitle': 'Edit User',
    'users.save': 'Save',
    'users.updated': 'User updated',
    'users.permissions': 'Permissions',
    'users.permLocked': 'Permissions are set automatically for {role} role',
    'users.delete': 'Delete User',
    'users.deleteTitle': 'Delete User',
    'users.deleteBody': 'Permanently delete <strong>{name}</strong>?',
    'users.deleteWarn': 'This cannot be undone. The user will be permanently removed.',
    'users.deleted': 'User deleted',

    /* ─── Permission Labels ─── */
    'perm.pos': 'POS / Checkout',
    'perm.products': 'Products',
    'perm.stock': 'Stock',
    'perm.suppliers': 'Suppliers',
    'perm.purchases': 'Purchases',
    'perm.transactions': 'Transactions',
    'perm.reports': 'Reports',
    'perm.invoices': 'Invoices',
    'perm.settings': 'Settings',
    'perm.users': 'Users',
    'perm.expenses': 'Expenses',
    'perm.refund': 'Refund',
    'perm.website': 'Website',

    /* ─── Create User Modal ─── */
    'cu.title': 'Create User',
    'cu.username': 'Username',
    'cu.password': 'Password',
    'cu.passwordPlaceholder': 'Min 8 characters, letter + digit',
    'cu.displayName': 'Display Name',
    'cu.displayPlaceholder': 'Display name',
    'cu.role': 'Role',
    'cu.staff': 'Staff',
    'cu.manager': 'Manager',
    'cu.root': 'Root',
    'cu.create': 'Create',

    /* ─── Ledger Tab ─── */
    'ledger.title': 'Cash Ledger',
    'ledger.all': 'All',
    'ledger.sales': 'Sales',
    'ledger.refunds': 'Refunds',
    'ledger.expenses': 'Expenses',
    'ledger.netFlow': 'Net Flow',
    'ledger.noEntries': 'No entries',
    'ledger.showing': 'Showing {count} of {total} entries',

    /* ─── Entry Types ─── */
    'entry.sale': 'Sale',
    'entry.refund': 'Refund',
    'entry.expense': 'Expense',
    'entry.supplier': 'Supplier',
    'entry.device_buy': 'Device Buy',
    'entry.bank_in': 'Bank In',
    'entry.bank_out': 'Bank Out',

    /* ─── Refund Tab ─── */
    'refund.forceTitle': 'Force Refund',
    'refund.receipt': 'Receipt Number',
    'refund.receiptPlaceholder': 'e.g. S-20260507-001',
    'refund.method': 'Refund Method',
    'refund.cash': 'Cash',
    'refund.card': 'Card',
    'refund.reason': 'Reason',
    'refund.reasonPlaceholder': 'Root forced refund',
    'refund.execute': 'Execute Refund',
    'refund.reverseTitle': 'Reverse Refund',
    'refund.reverseReceipt': 'Refund Receipt Number',
    'refund.reverseReceiptPlaceholder': 'e.g. R-20260507-001',
    'refund.reverseBtn': 'Reverse Refund',
    'refund.recent': 'Recent Refunds',
    'refund.noRefunds': 'No refunds',
    'refund.original': 'Original',
    'refund.receiptReq': 'Receipt number required',
    'refund.reverseReceiptReq': 'Refund receipt number required',
    'refund.executed': 'Refund executed: €{amount}',
    'refund.reversed': 'Refund reversed',
    'refund.confirmExecute': 'Refund <strong>{receipt}</strong> via <strong>{method}</strong>?',
    'refund.confirmExecuteWarn': 'This will reverse the full transaction amount.',
    'refund.confirmReverse': 'Reverse refund <strong>{receipt}</strong>?',
    'refund.confirmReverseWarn': 'This will create a compensating refund to reverse the original refund.',

    /* ─── Devices Tab ─── */
    'devices.title': 'Device Inventory',
    'devices.all': 'All',
    'devices.sold': 'Sold',
    'devices.tested': 'Tested',
    'devices.pending': 'Pending',
    'devices.buyIn': 'Buy In',
    'devices.total': 'Total Devices',
    'devices.totalBuy': 'Total Buy',
    'devices.totalSell': 'Total Sell',
    'devices.grossProfit': 'Gross Profit',
    'devices.noDevices': 'No devices',
    'devices.buy': 'Buy',
    'devices.sell': 'Sell',
    'devices.pl': 'PL',
    'devices.edit': 'Edit',
    'devices.showing': 'Showing {count} of {total}',
    'devices.notFound': 'Device not found',
    'devices.updated': 'Device updated',

    /* ─── Device Edit Modal ─── */
    'devEdit.title': 'Edit Device',
    'devEdit.buyPrice': 'Buy Price (€)',
    'devEdit.sellPrice': 'Sell Price (€)',
    'devEdit.status': 'Status',
    'devEdit.notes': 'Notes',
    'devEdit.save': 'Save',

    /* ─── System Tab ─── */
    'sys.status': 'System Status',
    'sys.serverTime': 'Server Time',
    'sys.activeUsers': 'Active Users',
    'sys.activeUsersVal': '{count} active',
    'sys.posStatus': 'POS Status',
    'sys.paused': 'PAUSED',
    'sys.running': 'Running',
    'sys.txnLocked': 'Transactions Locked',
    'sys.locked': 'Locked',
    'sys.unlocked': 'Unlocked',
    'sys.lastClose': 'Last Daily Close',
    'sys.noClose': 'No close yet',
    'sys.dailyClose': 'Daily Close',
    'sys.date': 'Date',
    'sys.forceClose': 'Force Close',
    'sys.reopen': 'Reopen',
    'sys.emergency': '⚠ Emergency Controls',
    'sys.pausePos': 'Pause POS',
    'sys.resumePos': 'Resume POS',
    'sys.lockTxns': 'Lock All Transactions',
    'sys.auditLog': 'Audit Log',
    'sys.loadAudit': 'Load Recent Actions',
    'sys.openAudit': 'Open Audit Dashboard',
    'sys.export': 'Export & Tax Preparation',
    'sys.startDate': 'Start Date',
    'sys.endDate': 'End Date',
    'sys.failedLoad': 'Failed to load system status',
    'sys.selectDate': 'Select a date',

    /* ─── Export ─── */
    'export.transactions': 'Transactions',
    'export.ledger': 'Ledger',
    'export.audit': 'Audit',
    'export.dailyClose': 'Daily Close',
    'export.vatSummary': 'VAT Summary',
    'export.download': 'Download {label} as CSV?',
    'export.period': 'Period: {start} → {end}',
    'export.notAuth': 'Not authenticated',
    'export.downloading': 'Downloading {label}…',
    'export.downloaded': '{label} downloaded',
    'export.failed': 'Export failed',

    /* ─── Daily Close Confirm Modals ─── */
    'close.forceTitle': 'Force Daily Close',
    'close.forceBody': 'Close <strong>{date}</strong>?',
    'close.forceWarn': 'This will lock all transactions for this day.',
    'close.forceDone': 'Daily close completed for {date}',
    'close.reopenTitle': 'Reopen Daily Close',
    'close.reopenBody': 'Reopen <strong>{date}</strong>?',
    'close.reopenWarn': 'This will allow modifications to closed day transactions. Use with caution.',
    'close.reopenDone': 'Daily close reopened for {date}',

    /* ─── System Control Modals ─── */
    'ctrl.pauseTitle': 'Pause POS System',
    'ctrl.pauseBody': 'This will STOP all POS operations immediately.',
    'ctrl.pauseWarn': 'Staff will not be able to process sales.',
    'ctrl.pauseBtn': 'Pause System',
    'ctrl.pauseDone': 'System paused',
    'ctrl.resumeTitle': 'Resume POS System',
    'ctrl.resumeBody': 'Restore normal POS operations?',
    'ctrl.resumeBtn': 'Resume',
    'ctrl.resumeDone': 'System resumed',
    'ctrl.lockTitle': 'Lock All Transactions',
    'ctrl.lockWarn': 'This will prevent ANY modification to historical transactions.',
    'ctrl.lockSub': 'This action is reversible via system controls.',
    'ctrl.lockBtn': 'Lock All',
    'ctrl.lockDone': 'Transactions locked',

    /* ─── Confirm Modal ─── */
    'modal.confirm': 'Confirm',
    'modal.cancel': 'Cancel',

    /* ─── Audit Page ─── */
    'audit.title': 'Audit Log',
    'audit.back': '← Back',
    'audit.filters': 'Filters',
    'audit.startDate': 'Start Date',
    'audit.endDate': 'End Date',
    'audit.actionType': 'Action Type',
    'audit.allActions': 'All Actions',
    'audit.systemLock': 'System Lock',
    'audit.systemUnlock': 'System Unlock',
    'audit.systemPause': 'System Pause',
    'audit.systemResume': 'System Resume',
    'audit.lockTxns': 'Lock Transactions',
    'audit.forceRefund': 'Force Refund',
    'audit.reverseRefund': 'Reverse Refund',
    'audit.forceClose': 'Force Close',
    'audit.reopenClose': 'Reopen Close',
    'audit.userCreate': 'User Create',
    'audit.userUpdate': 'User Update',
    'audit.userDelete': 'User Delete',
    'audit.userDisable': 'User Disable',
    'audit.deviceUpdate': 'Device Update',
    'audit.moduleAll': 'All',
    'audit.moduleSystem': 'System',
    'audit.moduleRefund': 'Refund',
    'audit.moduleDailyClose': 'Daily Close',
    'audit.moduleUser': 'User',
    'audit.moduleDevice': 'Device',
    'audit.search': 'Search',
    'audit.entries': 'Audit Entries',
    'audit.entryCount': '{count} entries',
    'audit.loadMore': 'Load More',
    'audit.loading': 'Loading...',
    'audit.noEntries': 'No audit entries found',
    'audit.before': 'Before',
    'audit.after': 'After',
    'audit.none': 'none',

    /* ─── Errors / Toasts ─── */
    'err.sessionExpired': 'Session expired. Please login again.',
    'err.authFailed': 'Auth failed',
    'err.noToken': 'No token',
    'err.requestFailed': 'Request failed',
    'err.network': 'Network error',
  },

  zh: {
    /* ─── Header ─── */
    'app.title': '老板控制面板',
    'app.logout': '退出登录',
    'app.langToggle': 'EN',

    /* ─── Tabs ─── */
    'tab.overview': '总览',
    'tab.users': '用户',
    'tab.ledger': '流水',
    'tab.refund': '退款',
    'tab.devices': '设备',
    'tab.system': '系统',

    /* ─── Overview Tab ─── */
    'ov.cashToday': '今日现金',
    'ov.cardToday': '今日刷卡',
    'ov.vatCollected': 'VAT 总额',
    'ov.netSales': '净销售额',
    'ov.salesCount': '销售笔数',
    'ov.refunds': '退款总额',
    'ov.ledgerIn': '账本收入',
    'ov.gross': '毛销售额',
    'ov.refundLabel': '{count} 笔退款 (-€{amount})',
    'ov.closed': '已日结',
    'ov.noClose': '未日结',
    'ov.devicePL': '设备损益',
    'ov.soldDevices': '已售设备',
    'ov.grossProfit': '毛利润',
    'ov.quickActions': '快捷操作',
    'ov.refresh': '刷新',
    'ov.failedLoad': '加载总览失败',
    'ov.refreshed': '已刷新',

    /* ─── Navigation ─── */
    'nav.posTill': '🛒 POS / 收银',
    'nav.inventory': '📦 库存管理',
    'nav.refunds': '💰 退款',
    'nav.reports': '📊 报表',
    'nav.websiteAdmin': '🌐 网站管理',

    /* ─── Users Tab ─── */
    'users.title': '用户管理',
    'users.create': '+ 创建用户',
    'users.disabled': '已停用',
    'users.role': '角色',
    'users.disable': '停用',
    'users.enable': '启用',
    'users.created': '用户已创建',
    'users.enabledMsg': '用户已启用',
    'users.disabledMsg': '用户已停用',
    'users.allFieldsReq': '请填写所有字段',
    'users.disableTitle': '停用用户',
    'users.disableBody': '该用户将无法登录系统。',
    'users.notFound': '用户未找到',
    'users.resetPw': '重置密码',
    'users.resetPwTitle': '重置密码',
    'users.newPassword': '新密码',
    'users.confirmPassword': '确认密码',
    'users.pwMismatch': '两次密码不一致',
    'users.pwTooShort': '密码至少8个字符',
    'users.pwWeak': '密码必须包含至少一个字母和一个数字',
    'users.pwResetDone': '密码重置成功',
    'users.edit': '编辑',
    'users.editTitle': '编辑用户',
    'users.save': '保存',
    'users.updated': '用户已更新',
    'users.permissions': '权限设置',
    'users.permLocked': '{role} 角色的权限为自动设置',
    'users.delete': '删除用户',
    'users.deleteTitle': '删除用户',
    'users.deleteBody': '永久删除 <strong>{name}</strong>？',
    'users.deleteWarn': '此操作不可撤销，用户将被永久移除。',
    'users.deleted': '用户已删除',

    /* ─── Permission Labels ─── */
    'perm.pos': 'POS / 收银',
    'perm.products': '商品管理',
    'perm.stock': '库存管理',
    'perm.suppliers': '供应商管理',
    'perm.purchases': '采购管理',
    'perm.transactions': '交易记录',
    'perm.reports': '报表中心',
    'perm.invoices': '发票管理',
    'perm.settings': '系统设置',
    'perm.users': '用户管理',
    'perm.expenses': '每日支出',
    'perm.refund': '退款',
    'perm.website': '网站管理',

    /* ─── Create User Modal ─── */
    'cu.title': '创建用户',
    'cu.username': '用户名',
    'cu.password': '密码',
    'cu.passwordPlaceholder': '至少 8 位，需包含字母和数字',
    'cu.displayName': '显示名称',
    'cu.displayPlaceholder': '显示名称',
    'cu.role': '角色',
    'cu.staff': '员工',
    'cu.manager': '经理',
    'cu.root': '老板',
    'cu.create': '创建',

    /* ─── Ledger Tab ─── */
    'ledger.title': '现金流水账',
    'ledger.all': '全部',
    'ledger.sales': '销售',
    'ledger.refunds': '退款',
    'ledger.expenses': '支出',
    'ledger.netFlow': '净流量',
    'ledger.noEntries': '无记录',
    'ledger.showing': '显示 {count} / {total} 条',

    /* ─── Entry Types ─── */
    'entry.sale': '销售',
    'entry.refund': '退款',
    'entry.expense': '支出',
    'entry.supplier': '供应商',
    'entry.device_buy': '设备购入',
    'entry.bank_in': '银行入账',
    'entry.bank_out': '银行出账',

    /* ─── Refund Tab ─── */
    'refund.forceTitle': '强制退款',
    'refund.receipt': '收据编号',
    'refund.receiptPlaceholder': '例如 S-20260507-001',
    'refund.method': '退款方式',
    'refund.cash': '现金',
    'refund.card': '刷卡',
    'refund.reason': '原因',
    'refund.reasonPlaceholder': '老板强制退款',
    'refund.execute': '执行退款',
    'refund.reverseTitle': '撤销退款',
    'refund.reverseReceipt': '退款收据编号',
    'refund.reverseReceiptPlaceholder': '例如 R-20260507-001',
    'refund.reverseBtn': '撤销退款',
    'refund.recent': '最近退款',
    'refund.noRefunds': '无退款记录',
    'refund.original': '原始单据',
    'refund.receiptReq': '请输入收据编号',
    'refund.reverseReceiptReq': '请输入退款收据编号',
    'refund.executed': '退款已执行：€{amount}',
    'refund.reversed': '退款已撤销',
    'refund.confirmExecute': '退款 <strong>{receipt}</strong>，方式 <strong>{method}</strong>？',
    'refund.confirmExecuteWarn': '这将撤销该笔交易的完整金额。',
    'refund.confirmReverse': '撤销退款 <strong>{receipt}</strong>？',
    'refund.confirmReverseWarn': '这将创建一笔冲销交易来撤销原退款。',

    /* ─── Devices Tab ─── */
    'devices.title': '设备库存',
    'devices.all': '全部',
    'devices.sold': '已售',
    'devices.tested': '已测试',
    'devices.pending': '待处理',
    'devices.buyIn': '已购入',
    'devices.total': '设备总数',
    'devices.totalBuy': '购入总额',
    'devices.totalSell': '出售总额',
    'devices.grossProfit': '毛利润',
    'devices.noDevices': '无设备',
    'devices.buy': '购入价',
    'devices.sell': '售价',
    'devices.pl': '损益',
    'devices.edit': '编辑',
    'devices.showing': '显示 {count} / {total}',
    'devices.notFound': '设备未找到',
    'devices.updated': '设备已更新',

    /* ─── Device Edit Modal ─── */
    'devEdit.title': '编辑设备',
    'devEdit.buyPrice': '购入价 (€)',
    'devEdit.sellPrice': '售价 (€)',
    'devEdit.status': '状态',
    'devEdit.notes': '备注',
    'devEdit.save': '保存',

    /* ─── System Tab ─── */
    'sys.status': '系统状态',
    'sys.serverTime': '服务器时间',
    'sys.activeUsers': '活跃用户',
    'sys.activeUsersVal': '{count} 个在线',
    'sys.posStatus': 'POS 状态',
    'sys.paused': '已暂停',
    'sys.running': '运行中',
    'sys.txnLocked': '交易锁定',
    'sys.locked': '已锁定',
    'sys.unlocked': '未锁定',
    'sys.lastClose': '最近日结',
    'sys.noClose': '未日结',
    'sys.dailyClose': '日结操作',
    'sys.date': '日期',
    'sys.forceClose': '强制日结',
    'sys.reopen': '重新开启',
    'sys.emergency': '⚠ 紧急控制',
    'sys.pausePos': '暂停 POS',
    'sys.resumePos': '恢复 POS',
    'sys.lockTxns': '锁定所有交易',
    'sys.auditLog': '审计日志',
    'sys.loadAudit': '加载最近操作',
    'sys.openAudit': '打开审计面板',
    'sys.export': '导出与税务准备',
    'sys.startDate': '开始日期',
    'sys.endDate': '结束日期',
    'sys.failedLoad': '加载系统状态失败',
    'sys.selectDate': '请选择日期',

    /* ─── Export ─── */
    'export.transactions': '交易记录',
    'export.ledger': '流水账',
    'export.audit': '审计日志',
    'export.dailyClose': '日结报告',
    'export.vatSummary': 'VAT 汇总',
    'export.download': '下载 {label} CSV？',
    'export.period': '期间：{start} → {end}',
    'export.notAuth': '未登录',
    'export.downloading': '正在下载 {label}…',
    'export.downloaded': '{label} 已下载',
    'export.failed': '导出失败',

    /* ─── Daily Close Confirm Modals ─── */
    'close.forceTitle': '强制日结',
    'close.forceBody': '日结 <strong>{date}</strong>？',
    'close.forceWarn': '这将锁定当天的所有交易。',
    'close.forceDone': '{date} 日结已完成',
    'close.reopenTitle': '重新开启日结',
    'close.reopenBody': '重新开启 <strong>{date}</strong>？',
    'close.reopenWarn': '这将允许修改已日结的交易，请谨慎操作。',
    'close.reopenDone': '{date} 日结已重新开启',

    /* ─── System Control Modals ─── */
    'ctrl.pauseTitle': '暂停 POS 系统',
    'ctrl.pauseBody': '这将立即停止所有 POS 操作。',
    'ctrl.pauseWarn': '员工将无法进行销售。',
    'ctrl.pauseBtn': '暂停系统',
    'ctrl.pauseDone': '系统已暂停',
    'ctrl.resumeTitle': '恢复 POS 系统',
    'ctrl.resumeBody': '恢复正常的 POS 操作？',
    'ctrl.resumeBtn': '恢复',
    'ctrl.resumeDone': '系统已恢复',
    'ctrl.lockTitle': '锁定所有交易',
    'ctrl.lockWarn': '这将禁止修改任何历史交易。',
    'ctrl.lockSub': '此操作可通过系统控制撤销。',
    'ctrl.lockBtn': '全部锁定',
    'ctrl.lockDone': '交易已锁定',

    /* ─── Confirm Modal ─── */
    'modal.confirm': '确认',
    'modal.cancel': '取消',

    /* ─── Audit Page ─── */
    'audit.title': '审计日志',
    'audit.back': '← 返回',
    'audit.filters': '筛选条件',
    'audit.startDate': '开始日期',
    'audit.endDate': '结束日期',
    'audit.actionType': '操作类型',
    'audit.allActions': '全部操作',
    'audit.systemLock': '系统锁定',
    'audit.systemUnlock': '系统解锁',
    'audit.systemPause': '系统暂停',
    'audit.systemResume': '系统恢复',
    'audit.lockTxns': '锁定交易',
    'audit.forceRefund': '强制退款',
    'audit.reverseRefund': '撤销退款',
    'audit.forceClose': '强制日结',
    'audit.reopenClose': '重新日结',
    'audit.userCreate': '创建用户',
    'audit.userUpdate': '更新用户',
    'audit.userDelete': '删除用户',
    'audit.userDisable': '停用用户',
    'audit.deviceUpdate': '更新设备',
    'audit.moduleAll': '全部',
    'audit.moduleSystem': '系统',
    'audit.moduleRefund': '退款',
    'audit.moduleDailyClose': '日结',
    'audit.moduleUser': '用户',
    'audit.moduleDevice': '设备',
    'audit.search': '搜索',
    'audit.entries': '审计记录',
    'audit.entryCount': '{count} 条记录',
    'audit.loadMore': '加载更多',
    'audit.loading': '加载中…',
    'audit.noEntries': '未找到审计记录',
    'audit.before': '之前',
    'audit.after': '之后',
    'audit.none': '无',

    /* ─── Errors / Toasts ─── */
    'err.sessionExpired': '会话已过期，请重新登录。',
    'err.authFailed': '认证失败',
    'err.noToken': '无令牌',
    'err.requestFailed': '请求失败',
    'err.network': '网络错误',
  }
};

// ─── Current language (stored in localStorage) ───
function getLang() {
  return localStorage.getItem('inv_lang') || 'en';
}

function setLang(lang) {
  localStorage.setItem('inv_lang', lang);
}

// ─── Translate a key with optional variables ───
function __(key, vars) {
  const lang = getLang();
  let text = LANG[lang]?.[key] || LANG['en']?.[key] || key;
  if (vars && typeof vars === 'object') {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace('{' + k + '}', v);
    }
  }
  return text;
}

// ─── Apply translations to all data-i18n elements ───
function applyLang() {
  const lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    let text = LANG[lang]?.[key] || LANG['en']?.[key] || key;
    // Check for data-i18n-vars
    const varsAttr = el.getAttribute('data-i18n-vars');
    if (varsAttr) {
      try {
        const vars = JSON.parse(varsAttr);
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace('{' + k + '}', v);
        }
      } catch(e) {}
    }
    el.textContent = text;
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = LANG[lang]?.[key] || LANG['en']?.[key] || key;
  });

  // Update language toggle button text
  const toggle = document.getElementById('langToggle');
  if (toggle) {
    toggle.textContent = __(lang === 'en' ? 'app.langToggle' : 'app.langToggle');
    // Actually just show the opposite language
    toggle.textContent = lang === 'en' ? '中' : 'EN';
  }
}

// ─── Toggle language ───
function toggleLang() {
  const current = getLang();
  const next = current === 'en' ? 'zh' : 'en';
  setLang(next);
  applyLang();
}
