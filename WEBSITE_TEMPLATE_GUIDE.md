# Tech Cross 维修中心网站 - 完整功能模板指南

## 网站概述
一个专业的电子设备维修中心门户网站，支持多品牌、多设备、多语言的报价系统。

## 核心功能架构

### 1. 主页系统 (index.html)
**功能：**
- 5个轮播幻灯片展示服务
- 统计数据展示（14+ Yrs, 99%+ Success rate, Quick Turnaround）
- Walk-in Service 说明
- 4大服务板块（手机/平板维修、数据传输、配件商店、电脑/游戏机维修）
- 14个商店分类展示
- 联系表单（集成Web3Forms API）
- Google Maps嵌入
- 双语支持（英语/爱尔兰语）
- 增强搜索功能（Ctrl+K快捷键）
- 清除缓存按钮（右上角垃圾桶图标）

**技术特点：**
- 响应式设计（移动端优先）
- 平滑滚动动画
- 自动轮播（5秒间隔）
- 实时搜索建议和历史记录

---

### 2. 独立品牌数据库系统

**9个品牌独立数据库：**
1. Apple (iPhone: 15服务, iPad: 9服务)
2. Samsung (10服务)
3. Xiaomi (10服务)
4. Google Pixel (10服务)
5. OnePlus (10服务)
6. OPPO (10服务)
7. Huawei (10服务)
8. Honor (10服务)
9. Other Brands (10服务)

**数据库文件：**
- `pricing-data-apple.js` (v4.1)
- `pricing-data-samsung.js` (v2.0)
- `pricing-data-xiaomi.js` (v2.0)
- 其他品牌类似命名

**数据结构：**
```javascript
{
  brand: {
    name: 'Brand Name',
    serviceTypes: { /* 服务类型定义 */ },
    models: {
      'model-key': {
        name: 'Model Name (A1234)',
        services: { service1: price, service2: price },
        lastUpdated: timestamp
      }
    }
  }
}
```


---

### 3. 报价页面系统

**主报价页面 (pricing.html)：**
- 9个品牌卡片，每个显示"View Pricing"
- 品牌Logo展示
- 隐藏管理员入口（右下角©符号，双击访问，opacity: 0.15）

**品牌报价页面结构：**
1. **Apple选择页** (pricing-apple.html)
   - iPhone/iPad设备选择

2. **具体设备报价页** (10个页面)
   - pricing-apple-iphone.html (37款iPhone)
   - pricing-apple-ipad.html (28款iPad)
   - pricing-samsung.html
   - pricing-xiaomi.html
   - pricing-google.html
   - pricing-oneplus.html
   - pricing-oppo.html
   - pricing-huawei.html
   - pricing-honor.html
   - pricing-other.html

**报价页面布局（从上到下）：**
1. 标题和品牌Logo
2. 更新提示横幅（黄色渐变）
3. 选择框（设备型号 + 服务类型）
4. **报价结果框**（选择后显示）
5. **型号查询说明**（2种方法，居中显示）

**型号查询说明内容：**
- Apple设备：查看背面 + Settings → General → About
- Android设备：Settings → About phone + 包装盒/SIM卡槽

**特殊功能：**
- iPad屏幕维修：3个选项合并为"Screen Repair"，显示3个价格卡片
  - Full Screen Assembly
  - Touch Screen Only
  - Display Screen Only
- Home button N/A显示："This model does not have a Home button"
- 价格为0显示："Please Contact Us" + 电话号码


---

### 4. 管理员后台系统

**登录系统：**
- 入口：pricing.html右下角©符号（双击）
- 凭证：0876676466 / 0870019999
- 品牌选择页：admin-brands.html

**10个品牌管理页面：**
- admin-apple.html
- admin-samsung.html
- admin-xiaomi.html
- admin-google.html
- admin-oneplus.html
- admin-oppo.html
- admin-huawei.html
- admin-honor.html
- admin-other.html

**管理功能（4个标签）：**

1. **Edit Pricing** - 编辑价格
   - 选择型号和服务
   - 修改价格
   - 自动更新时间戳

2. **Manage Models** - 管理型号
   - 添加新型号
   - 删除型号
   - 编辑型号名称

3. **Manage Services** - 管理服务
   - 添加新服务类型
   - 删除服务类型
   - 编辑服务名称和描述

4. **Batch Operations** - 批量操作
   - 4种模式：
     - Set Price（设置价格）
     - Increase（增加金额）
     - Decrease（减少金额）
     - Percentage（百分比调整）
   - 可选择多个型号和服务
   - 批量应用价格变更

**核心文件：**
- `admin-enhanced-core.js` (17KB) - 通用管理核心
- 所有品牌管理页面共享此核心

**数据持久化：**
- localStorage存储
- 版本控制（自动清除旧数据）
- 智能时间戳（只在价格变动时更新）


---

### 5. 增强搜索系统

**搜索文件：**
- `search-data-enhanced.js` - 数据聚合器
- `search-engine-enhanced.js` - 搜索引擎

**搜索功能：**
- 9层智能匹配算法
  1. 精确匹配
  2. 包含匹配
  3. 词语匹配
  4. 数字匹配
  5. 品牌匹配
  6. 服务匹配
  7. 模糊匹配
  8. 首字母匹配
  9. 部分匹配

**特性：**
- 实时搜索建议
- 搜索历史（最近10次）
- 自动完成
- 键盘导航（↑↓ Enter ESC）
- Ctrl/Cmd+K快捷键
- 搜索结果缓存（最多100个查询）
- 流行度加权排序
- 覆盖200+设备和服务

**搜索范围：**
- 所有品牌手机型号
- 平板型号
- 电脑服务
- 游戏机服务
- 维修服务类型


---

### 6. 清除缓存系统

**功能位置：**
- 主页右上角垃圾桶图标
- 响应式设计（桌面和移动端）

**清除内容：**
- localStorage（保留语言设置和管理员登录状态）
- sessionStorage
- 扫帚清扫动画效果

**实现文件：**
- `clear-cache.html` - 独立清除缓存页面
- `script.js` - 主页集成

---

### 7. 公告系统

**管理页面：**
- `announcement-admin.html` - 公告管理后台
- `announcement-admin.js` - 管理逻辑

**功能：**
- 创建/编辑/删除公告
- 设置显示时间
- 横幅样式自定义
- 主页顶部显示

---

### 8. 其他页面

**辅助页面：**
- `data-transfer.html` - 数据传输服务介绍
- `computer-pricing.html` - 电脑/游戏机维修报价
- `shop-coming-soon.html` - 商店即将开放页面


---

## 技术栈和设计规范

### 前端技术
- **纯HTML/CSS/JavaScript** - 无框架依赖
- **响应式设计** - 移动端优先
- **localStorage** - 数据持久化
- **Web3Forms API** - 联系表单
- **Google Maps API** - 地图嵌入

### 设计规范

**配色方案：**
- 主色：#0071e3（Apple蓝）
- 背景：#f5f5f7（浅灰）
- 文字：#1d1d1f（深灰）
- 强调：#6e6e73（中灰）
- 警告：#ffc107（黄色）

**字体：**
- 系统字体栈（-apple-system, BlinkMacSystemFont, "Segoe UI"）
- 标题：48-56px, 600-700 weight
- 正文：17-21px, 400-500 weight
- 小字：14-15px

**圆角：**
- 卡片：18-24px
- 按钮：980px（完全圆角）
- 输入框：12px

**间距：**
- 容器：max-width 1200px
- 内边距：22-48px
- 外边距：40-60px
- 网格间距：20-32px

**动画：**
- 过渡：0.3-0.4s
- 悬停效果：translateY(-8px)
- 轮播：5秒间隔


---

## 文件结构

```
techcross/
├── index.html                          # 主页
├── styles.css                          # 全局样式
├── script.js                           # 主页脚本
├── logo.png                            # Logo
│
├── pricing.html                        # 主报价页
├── pricing-apple.html                  # Apple选择页
├── pricing-apple-iphone.html           # iPhone报价
├── pricing-apple-ipad.html             # iPad报价
├── pricing-samsung.html                # Samsung报价
├── pricing-xiaomi.html                 # Xiaomi报价
├── pricing-google.html                 # Google报价
├── pricing-oneplus.html                # OnePlus报价
├── pricing-oppo.html                   # OPPO报价
├── pricing-huawei.html                 # Huawei报价
├── pricing-honor.html                  # Honor报价
├── pricing-other.html                  # Other报价
│
├── pricing-data-apple.js               # Apple数据库 (v4.1)
├── pricing-data-samsung.js             # Samsung数据库 (v2.0)
├── pricing-data-xiaomi.js              # Xiaomi数据库 (v2.0)
├── pricing-data-google.js              # Google数据库 (v2.0)
├── pricing-data-oneplus.js             # OnePlus数据库 (v2.0)
├── pricing-data-oppo.js                # OPPO数据库 (v2.0)
├── pricing-data-huawei.js              # Huawei数据库 (v2.0)
├── pricing-data-honor.js               # Honor数据库 (v2.0)
├── pricing-data-other.js               # Other数据库 (v2.0)
│
├── admin-brands.html                   # 管理员品牌选择
├── admin-apple.html                    # Apple管理
├── admin-samsung.html                  # Samsung管理
├── admin-xiaomi.html                   # Xiaomi管理
├── admin-google.html                   # Google管理
├── admin-oneplus.html                  # OnePlus管理
├── admin-oppo.html                     # OPPO管理
├── admin-huawei.html                   # Huawei管理
├── admin-honor.html                    # Honor管理
├── admin-other.html                    # Other管理
├── admin-enhanced-core.js              # 管理核心 (17KB)
│
├── search-data-enhanced.js             # 搜索数据聚合
├── search-engine-enhanced.js           # 搜索引擎
│
├── announcement-admin.html             # 公告管理
├── announcement-admin.js               # 公告逻辑
│
├── clear-cache.html                    # 清除缓存页
├── data-transfer.html                  # 数据传输页
├── computer-pricing.html               # 电脑维修页
├── shop-coming-soon.html               # 商店即将开放
│
├── logos/                              # 品牌Logo文件夹
│   ├── apple.svg
│   ├── samsung.svg
│   ├── xiaomi.svg
│   ├── google.svg
│   ├── oneplus.svg
│   ├── oppo.svg
│   ├── huawei.svg
│   ├── honor.svg
│   └── other.svg
│
└── 文档/
    ├── WEBSITE_TEMPLATE_GUIDE.md       # 本文档
    ├── IPAD_PRICING_UPDATE_CN.md       # iPad更新说明
    ├── ENHANCED_ADMIN_COMPLETE.md      # 管理系统说明
    └── SEARCH_OPTIMIZATION_COMPLETE.md # 搜索系统说明
```


---

## 关键功能实现指南

### 1. 创建新品牌报价页面

**步骤：**
1. 复制 `pricing-samsung.html` 作为模板
2. 修改品牌名称和Logo路径
3. 创建对应的数据库文件 `pricing-data-brandname.js`
4. 在 `pricing.html` 添加品牌卡片
5. 创建管理页面 `admin-brandname.html`
6. 在 `admin-brands.html` 添加管理入口

**数据库模板：**
```javascript
const BRANDNAME_STORAGE_KEY = 'techcross_pricing_brandname';
const BRANDNAME_VERSION_KEY = 'techcross_pricing_brandname_version';
const BRANDNAME_CURRENT_VERSION = '1.0';

const serviceTypes = {
    screen: { name: 'Screen Replacement', description: '...' },
    battery: { name: 'Battery Replacement', description: '...' },
    // ... 其他服务
};

const defaultBrandnamePricingData = {
    brandname: {
        name: 'Brand Name',
        serviceTypes: serviceTypes,
        models: {
            'model-1': {
                name: 'Model Name',
                services: { screen: 100, battery: 50, ... },
                lastUpdated: new Date().toISOString()
            }
        }
    }
};

function loadBrandnamePricingData() { /* ... */ }
function saveBrandnamePricingData(data) { /* ... */ }
```


---

### 2. 添加新设备型号

**通过管理后台：**
1. 访问 `admin-brands.html`
2. 登录（0876676466 / 0870019999）
3. 选择品牌
4. 点击 "Manage Models" 标签
5. 填写型号信息并添加

**手动添加到数据库：**
```javascript
models: {
    'new-model-key': {
        name: 'New Model Name (A1234)',
        services: {
            screen: 100,
            battery: 50,
            charging_port: 60,
            // ... 所有服务类型
        },
        lastUpdated: new Date().toISOString()
    }
}
```

---

### 3. 修改价格显示规则

**当前规则：**
- `price = 0` → 显示 "Please Contact Us" + 电话
- `price > 0` → 显示 "€{price}"
- `price = 0 且 home_button` → 显示 "Not Available" + "This model does not have a Home button"

**修改位置：**
在各报价页面的JavaScript部分：
```javascript
if (price === 0) {
    priceDisplay.textContent = 'Please Contact Us';
    serviceDescription.innerHTML = `...电话号码...`;
} else {
    priceDisplay.textContent = `€${price}`;
    serviceDescription.innerHTML = `...更新时间...`;
}
```

---

### 4. 自定义型号查询说明

**修改位置：**
在各报价页面的 `<div class="model-help">` 部分

**Apple设备模板：**
```html
<div class="model-help-method">
    <h4>📱 Method 1: Check the back</h4>
    <ol>
        <li>步骤1</li>
        <li>步骤2</li>
        <li>找到 <span class="highlight">A-number</span></li>
    </ol>
</div>
```

**Android设备模板：**
```html
<div class="model-help-method">
    <h4>⚙️ Method 1: Check in Settings</h4>
    <ol>
        <li>Open <strong>Settings</strong></li>
        <li>Tap <strong>About phone</strong></li>
        <li>Find <strong>Model number</strong></li>
    </ol>
</div>
```


---

## 部署指南

### GitHub Pages 部署

1. **创建GitHub仓库**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

2. **启用GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 "main" 分支
   - 保存设置

3. **访问网站**
   - URL: `https://username.github.io/repo/`

### 本地开发服务器

**PowerShell服务器（Windows）：**
```powershell
# 使用 start-server.ps1
powershell -ExecutionPolicy Bypass -File start-server.ps1
```

**Python服务器：**
```bash
python -m http.server 8000
```

**Node.js服务器：**
```bash
npx http-server -p 8000
```

访问：`http://localhost:8000`


---

## 常见定制需求

### 1. 修改公司信息

**位置：** `index.html`

**联系信息：**
```html
<div class="info-group">
    <h3>Phone</h3>
    <p><a href="tel:0469059854">046 905 9854</a></p>
    <p><a href="tel:0894825300">089 482 5300</a></p>
</div>

<div class="info-group">
    <h3>Email</h3>
    <p><a href="mailto:navantechcross@gmail.com">navantechcross@gmail.com</a></p>
</div>

<div class="info-group">
    <h3>Address</h3>
    <p>Unit 4, Navan Shopping Centre<br>Navan, Co. Meath<br>Ireland</p>
</div>
```

**营业时间：**
```html
<div class="info-group">
    <h3>Hours</h3>
    <p>Mon-Wed: 9:30-18:00<br>Thu-Fri: 9:30-20:00<br>Sat: 9:30-18:00<br>Sun & Bank Holiday: 11:30-18:00</p>
</div>
```

**统计数据：**
```html
<div class="stat">
    <div class="stat-number">14+ Yrs</div>
    <div class="stat-label">Serving Local Community</div>
</div>
```

---

### 2. 修改管理员凭证

**位置：** `admin-brands.html` 和所有 `admin-*.html`

```javascript
const DEFAULT_USERNAME = '0876676466';
const DEFAULT_PASSWORD = '0870019999';
```

---

### 3. 修改联系表单API

**位置：** `index.html`

```html
<form id="contactForm" action="https://api.web3forms.com/submit" method="POST">
    <input type="hidden" name="access_key" value="YOUR_ACCESS_KEY">
    <!-- ... -->
</form>
```

获取API Key：https://web3forms.com

---

### 4. 修改Google Maps

**位置：** `index.html`

```html
<iframe 
    src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=YOUR_LOCATION"
    allowfullscreen="" 
    loading="lazy">
</iframe>
```


---

### 5. 添加新语言

**当前支持：** 英语 (EN) / 爱尔兰语 (GA)

**添加新语言步骤：**

1. 在 `index.html` 添加语言按钮
2. 为所有文本元素添加 `data-{lang}` 属性
3. 在 `script.js` 添加语言切换逻辑

**示例：**
```html
<h1 data-en="Services" data-ga="Seirbhísí" data-fr="Services">Services</h1>
```

```javascript
function switchLanguage(lang) {
    document.querySelectorAll('[data-' + lang + ']').forEach(el => {
        el.textContent = el.getAttribute('data-' + lang);
    });
}
```

---

### 6. 自定义品牌主题色

**位置：** 各品牌管理页面的 `<style>` 部分

**Apple主题：**
```css
.btn-primary { background: #0071e3; }
.btn-primary:hover { background: #0077ed; }
```

**Samsung主题：**
```css
.btn-primary { background: #1428a0; }
.btn-primary:hover { background: #0c1d6b; }
```

**自定义新品牌：**
```css
.btn-primary { background: #YOUR_COLOR; }
.btn-primary:hover { background: #YOUR_HOVER_COLOR; }
h1, h2 { color: #YOUR_COLOR; }
```


---

## 数据管理最佳实践

### 1. 版本控制
- 每次重大更新增加版本号
- 版本号变更会自动清除旧缓存
- 格式：'1.0', '2.0', '3.0'

### 2. 价格更新
- 使用管理后台批量更新
- 时间戳只在价格变动时更新
- 定期备份localStorage数据

### 3. 数据备份
```javascript
// 导出数据
const data = localStorage.getItem('techcross_pricing_apple');
console.log(data); // 复制保存

// 导入数据
localStorage.setItem('techcross_pricing_apple', backupData);
```

### 4. 清除缓存时机
- 重大价格更新后
- 添加新型号后
- 修改服务类型后
- 用户报告显示问题时

---

## 性能优化建议

### 1. 图片优化
- Logo使用SVG格式
- 压缩PNG/JPG图片
- 使用WebP格式（带降级）

### 2. 代码优化
- 合并CSS文件
- 压缩JavaScript
- 启用浏览器缓存

### 3. 加载优化
- 延迟加载非关键资源
- 使用CDN加速
- 启用Gzip压缩

---

## 安全注意事项

### 1. 管理员访问
- 定期更改管理员密码
- 不在代码中明文显示凭证
- 使用HTTPS部署

### 2. 数据保护
- localStorage数据可被用户访问
- 敏感数据不存储在前端
- 定期审计数据访问

### 3. XSS防护
- 验证用户输入
- 转义HTML内容
- 使用Content Security Policy


---

## 快速复制指令（给新Kiro）

### 创建相同模板网站的完整指令：

```
请创建一个电子设备维修中心网站，包含以下功能：

1. 主页系统：
   - 5个轮播幻灯片
   - 统计数据展示（14+ Yrs, 99%+ Success rate）
   - 4大服务板块
   - 14个商店分类
   - 联系表单（Web3Forms API）
   - Google Maps嵌入
   - 双语支持（英语/爱尔兰语）
   - 增强搜索（Ctrl+K快捷键）
   - 清除缓存按钮

2. 9个品牌独立数据库系统：
   - Apple (iPhone: 15服务, iPad: 9服务)
   - Samsung, Xiaomi, Google, OnePlus, OPPO, Huawei, Honor, Other (各10服务)
   - localStorage持久化
   - 版本控制

3. 报价页面系统（10个页面）：
   - 布局：标题 → 更新提示 → 选择框 → 报价结果 → 型号查询说明
   - iPad特殊功能：3个屏幕选项合并显示
   - 价格规则：0显示"Please Contact Us"
   - 型号查询说明：2种方法，居中显示

4. 管理员后台系统（10个品牌）：
   - 登录：0876676466 / 0870019999
   - 4个功能标签：Edit Pricing, Manage Models, Manage Services, Batch Operations
   - 共享核心：admin-enhanced-core.js
   - 智能时间戳

5. 增强搜索系统：
   - 9层智能匹配算法
   - 搜索历史和自动完成
   - 键盘导航
   - 覆盖200+设备

6. 其他功能：
   - 清除缓存系统
   - 公告系统
   - 数据传输页面
   - 电脑维修页面

设计规范：
- 配色：#0071e3主色，#f5f5f7背景
- 字体：系统字体栈，17-56px
- 圆角：18-24px卡片，980px按钮
- 响应式设计，移动端优先

技术栈：
- 纯HTML/CSS/JavaScript
- localStorage数据持久化
- 无框架依赖

请按照以上规范创建完整的网站结构和所有文件。
```

---

## 维护和更新

### 定期任务
- [ ] 每月更新价格数据
- [ ] 每季度检查链接有效性
- [ ] 每半年审查设备型号列表
- [ ] 每年更新统计数据（Yrs）

### 问题排查
1. **价格不显示** → 清除缓存，检查数据库版本
2. **搜索不工作** → 检查search-data-enhanced.js加载
3. **管理后台无法登录** → 检查凭证，清除sessionStorage
4. **型号查询说明不显示** → 检查model-help CSS样式

---

## 联系和支持

**项目仓库：** https://github.com/Lee15148863/teschcross.git
**在线演示：** https://lee15148863.github.io/teschcross/

**技术支持：**
- 查看文档文件夹中的详细说明
- 检查Git提交历史了解更新
- 参考现有代码作为模板

---

**文档版本：** 1.0
**最后更新：** 2026年3月13日
**适用于：** Tech Cross 维修中心网站模板

---

## 结语

这个模板提供了一个完整的、可扩展的电子设备维修中心网站解决方案。通过模块化设计和清晰的文件结构，您可以轻松地：

- 添加新品牌和设备
- 自定义价格和服务
- 扩展功能模块
- 适配不同业务需求

将本文档提供给新的Kiro，它就能理解整个网站的架构和功能，并创建相同模板的网站。

祝您使用愉快！🚀
```

