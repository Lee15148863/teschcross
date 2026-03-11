# 清除缓存指南

## 📍 访问清缓存页面

### 在线访问
```
https://techcross.ie/clear-cache.html
```

### 本地测试
```
直接在浏览器打开: clear-cache.html
```

## 🔧 功能说明

### 1. Clear Pricing Data Only（仅清除价格数据）
- ✅ 清除价格数据库
- ✅ 清除版本号
- ❌ 保留公告设置
- ❌ 保留搜索历史
- ❌ 保留管理员会话

**使用场景**：
- 价格数据显示错误
- 更新了pricing-data.js文件
- 需要重新加载默认价格

### 2. Clear All Data（清除所有数据）
- ✅ 清除价格数据库
- ✅ 清除版本号
- ✅ 清除公告设置
- ✅ 清除搜索历史
- ❌ 保留管理员会话（需要重新登录）

**使用场景**：
- 完全重置系统
- 清除所有自定义设置
- 解决各种显示问题

### 3. Show Stored Data（显示存储数据）
查看当前浏览器中存储的所有Tech Cross相关数据：
- 数据键名
- 数据预览（前50个字符）
- 数据大小

**使用场景**：
- 检查哪些数据被存储
- 调试问题
- 确认数据是否存在

### 4. 快速导航按钮
- **Go to Pricing** - 跳转到价格页面
- **Go to Admin** - 跳转到管理员页面

## 📊 状态显示

页面会自动显示当前状态：
- **Data Version**: 当前数据版本号（如：3.0）
- **Data Exists**: 数据是否存在（Yes/No）
- **Data Size**: 数据大小（KB）
- **Stored Items**: 存储项目数量

## 🎯 使用步骤

### 场景1：价格不更新
```
1. 打开 clear-cache.html
2. 点击 "Clear Pricing Data Only"
3. 等待2秒自动刷新
4. 访问 pricing.html 查看新价格
```

### 场景2：完全重置
```
1. 打开 clear-cache.html
2. 点击 "Clear All Data"
3. 等待2秒自动刷新
4. 重新登录管理员（如需要）
5. 重新设置公告（如需要）
```

### 场景3：检查数据
```
1. 打开 clear-cache.html
2. 查看页面底部的"Current Status"
3. 点击 "Show Stored Data"
4. 查看详细的存储信息
```

## 🔍 清除的数据项

### 价格相关
- `techcross_pricing_data` - 所有品牌的价格数据
- `techcross_pricing_version` - 数据版本号

### 公告相关
- `announcement_enabled` - 公告开关
- `announcement_text_en` - 英文公告文本
- `announcement_text_ga` - 爱尔兰语公告文本
- `announcement_font_size` - 字体大小
- `announcement_font_weight` - 字体粗细
- `announcement_text_color` - 文字颜色
- `announcement_bg_color` - 背景颜色
- `announcement_speed` - 滚动速度

### 其他
- `searchHistory` - 搜索历史记录

### 不会清除
- `techcross_admin_session` - 管理员会话（需要重新登录）
- `techcross_admin_username` - 自定义用户名
- `techcross_admin_password` - 自定义密码

## ⚠️ 注意事项

### 清除前
1. 确认是否需要备份当前数据
2. 如果在管理员面板做了修改，确保已保存
3. 了解清除后的影响

### 清除后
1. 价格数据会恢复到pricing-data.js中的默认值
2. 公告设置会被重置
3. 搜索历史会被清空
4. 管理员需要重新登录

### 数据恢复
- 清除后无法恢复
- 如需保留数据，请在清除前：
  1. 在管理员面板导出数据（如有此功能）
  2. 或手动记录重要设置

## 🚨 常见问题

### Q: 清除后价格还是旧的？
```
A: 
1. 确认已点击清除按钮
2. 等待页面自动刷新
3. 强制刷新浏览器 (Ctrl+Shift+R)
4. 清除浏览器缓存 (Ctrl+Shift+Delete)
```

### Q: 清除后管理员无法登录？
```
A: 
1. 使用默认账号登录
   用户名: 0876676466
   密码: 0870019999
2. 如果还是不行，清除浏览器所有数据
3. 使用无痕模式测试
```

### Q: 清除后公告消失了？
```
A: 
这是正常的，清除所有数据会重置公告设置
需要重新在 announcement-admin.html 设置
```

### Q: 如何只清除特定品牌的数据？
```
A: 
目前不支持，只能：
1. 清除所有价格数据
2. 或在管理员面板手动修改特定品牌
```

## 💡 最佳实践

### 定期维护
```
建议每次更新pricing-data.js后：
1. 访问 clear-cache.html
2. 点击 "Clear Pricing Data Only"
3. 确认新数据加载成功
```

### 问题排查
```
遇到显示问题时的检查顺序：
1. 查看 clear-cache.html 的状态信息
2. 点击 "Show Stored Data" 检查数据
3. 尝试 "Clear Pricing Data Only"
4. 如果还有问题，尝试 "Clear All Data"
5. 最后清除浏览器所有缓存
```

### 开发测试
```
开发时建议：
1. 使用无痕模式测试
2. 或频繁清除缓存
3. 或使用浏览器开发工具的 "Disable cache"
```

## 📞 需要帮助？

如果清除缓存后仍有问题：
- 📧 邮箱: navantechcross@gmail.com
- 📱 电话: 046 905 9854 / 089 482 5300

---

**更新时间**: 2026年3月11日  
**版本**: 增强版  
**新功能**: 
- ✅ 分离清除选项
- ✅ 显示存储数据
- ✅ 详细状态信息
- ✅ 更好的用户体验
