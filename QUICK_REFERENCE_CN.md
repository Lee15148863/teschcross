# 快速参考指南

## 🚀 快速测试

### 测试Logo显示
```bash
# Windows: 双击运行
test-logos.bat

# 或直接在浏览器打开
test-logos.html
```

### 测试管理员功能
1. 打开浏览器访问: `admin.html`
2. 输入用户名: `0876676466`
3. 输入密码: `0870019999`
4. 点击Login

### 测试价格显示
1. 打开 `pricing.html`
2. 点击任意品牌卡片
3. 选择机型和服务类型
4. 查看价格显示

## 📁 关键文件位置

### 数据文件
```
pricing-data.js          # 所有品牌的价格数据（统一管理）
```

### Logo文件
```
logos/
├── apple.svg           # ✅ 已存在
├── samsung.svg         # ✅ 新创建
├── xiaomi.svg          # ✅ 已存在
├── google.svg          # ✅ 已存在
├── oneplus.svg         # ✅ 新创建
├── oppo.svg            # ✅ 新创建
├── huawei.svg          # ✅ 新创建
├── honor.svg           # ✅ 新创建
└── other.svg           # ✅ 新创建
```

### 用户页面
```
pricing.html            # 品牌选择页面
pricing-apple.html      # Apple价格页面
pricing-samsung.html    # Samsung价格页面
pricing-xiaomi.html     # Xiaomi价格页面
pricing-google.html     # Google价格页面
pricing-oneplus.html    # OnePlus价格页面
pricing-oppo.html       # OPPO价格页面
pricing-huawei.html     # Huawei价格页面
pricing-honor.html      # Honor价格页面
pricing-other.html      # 其他品牌价格页面
```

### 管理员页面
```
admin.html              # 管理员控制面板
admin.js                # 管理员功能脚本
clear-cache.html        # 清除缓存工具
```

## 🔐 管理员操作

### 登录信息
- **URL**: admin.html
- **用户名**: 0876676466
- **密码**: 0870019999

### 编辑价格
1. 登录管理员面板
2. 默认在"Edit Pricing"标签
3. 使用品牌下拉菜单筛选
4. 或使用搜索框查找机型
5. 点击"Expand All"展开所有品牌
6. 修改价格（输入数字或0）
7. 点击"Save All Changes"保存

### 添加新机型
1. 点击"Add New Model"标签
2. 选择品牌
3. 输入机型ID（如：galaxy-s25-ultra）
4. 输入显示名称（如：Galaxy S25 Ultra）
5. 设置所有服务价格
6. 点击"Add Model"

### 添加新品牌
1. 点击"Add New Brand"标签
2. 查看现有品牌列表
3. 输入新品牌ID（如：nokia）
4. 输入显示名称（如：Nokia）
5. 点击"Add Brand"

## 💰 价格规则

| 输入值 | 用户看到的内容 |
|--------|---------------|
| 0 | "Please Contact Us" + 电话号码 |
| 9999 | "Please Contact Us" + 特殊说明 |
| 45 | "€45" + 最后更新时间 |
| 150 | "€150" + 最后更新时间 |

## 🎨 品牌颜色

| 品牌 | 主色 | Hex代码 |
|------|------|---------|
| Apple | 黑色 | #000000 |
| Samsung | 蓝色 | #1428A0 |
| Xiaomi | 橙色 | #FF6900 |
| Google | 多彩 | - |
| OnePlus | 黑色 | #000000 |
| OPPO | 绿色 | #00A862 |
| Huawei | 红色 | #E60012 |
| Honor | 蓝色 | #0071CE |
| Other | 灰色 | #666666 |

## 🔧 常见问题

### Logo不显示？
```
1. 检查logos文件夹是否存在
2. 清除浏览器缓存 (Ctrl+Shift+Delete)
3. 使用test-logos.html测试
4. 检查浏览器控制台错误 (F12)
```

### 价格不更新？
```
1. 访问 clear-cache.html
2. 点击"Clear Cache"按钮
3. 刷新页面 (Ctrl+R 或 F5)
4. 重新登录管理员面板
```

### 无法登录管理员？
```
1. 确认用户名: 0876676466
2. 确认密码: 0870019999
3. 清除浏览器缓存
4. 使用无痕模式测试 (Ctrl+Shift+N)
```

### 数据丢失？
```
数据存储在浏览器localStorage中：
- 不要清除浏览器数据
- 定期备份pricing-data.js文件
- 版本号变化会自动重置数据
```

## 📱 联系方式

- **座机**: 046 905 9854
- **手机**: 089 482 5300
- **邮箱**: navantechcross@gmail.com
- **地址**: Unit 4, Navan Shopping Centre, Navan, Co. Meath, Ireland

## 🌐 在线地址

- **主页**: https://techcross.ie
- **价格页面**: https://techcross.ie/pricing.html
- **管理员**: https://techcross.ie/admin.html

## 📊 数据统计

### 当前系统
- **品牌数量**: 9个
- **机型总数**: 289款（Apple 37 + 其他品牌待添加）
- **服务类型**: 15种
- **Logo文件**: 9个SVG文件
- **数据版本**: 3.0

### Apple数据（已完成）
- **机型数量**: 37款
- **价格状态**: ✅ 已更新
- **服务类型**: 15种全部设置
- **特殊机型**: iPhone 17系列（部分服务ASK）

### 其他品牌（待更新）
- **Samsung**: 待添加价格数据
- **Xiaomi**: 60款，默认价格
- **Google**: 17款，默认价格
- **OnePlus**: 18款，默认价格
- **OPPO**: 24款，默认价格
- **Huawei**: 4款，默认价格
- **Honor**: 20款，默认价格
- **Other**: 11款，默认价格

## 🎯 下一步

### 立即测试
- [ ] 打开test-logos.html
- [ ] 访问pricing.html
- [ ] 登录admin.html
- [ ] 测试编辑功能

### 等待数据
- [ ] Samsung价格表格
- [ ] 其他品牌价格（可选）

### 准备部署
- [ ] 确认所有测试通过
- [ ] 提交到GitHub
- [ ] 自动部署到Cloud Run

---

**版本**: 3.0  
**更新**: 2026年3月11日  
**状态**: ✅ 系统就绪
