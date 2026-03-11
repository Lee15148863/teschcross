# Tech Cross 维修定价系统 - 完整概览

## 📁 文件结构

### 核心数据文件
- `pricing-data.js` - 统一的价格数据库（所有品牌）

### 品牌Logo文件 (logos/)
- `apple.svg` ✅
- `samsung.svg` ✅ (新创建)
- `xiaomi.svg` ✅
- `google.svg` ✅
- `oneplus.svg` ✅ (新创建)
- `oppo.svg` ✅ (新创建)
- `huawei.svg` ✅ (新创建)
- `honor.svg` ✅ (新创建)
- `other.svg` ✅ (新创建)

### 用户界面页面
- `pricing.html` - 品牌选择页面（9个品牌卡片）
- `pricing-apple.html` - Apple维修价格页面
- `pricing-samsung.html` - Samsung维修价格页面
- `pricing-xiaomi.html` - Xiaomi维修价格页面
- `pricing-google.html` - Google维修价格页面
- `pricing-oneplus.html` - OnePlus维修价格页面
- `pricing-oppo.html` - OPPO维修价格页面
- `pricing-huawei.html` - Huawei维修价格页面
- `pricing-honor.html` - Honor维修价格页面
- `pricing-other.html` - 其他品牌维修价格页面

### 管理员界面
- `admin.html` - 管理员控制面板
- `admin.js` - 管理员功能脚本
- `clear-cache.html` - 清除缓存工具页面

### 测试文件
- `test-logos.html` - Logo显示测试页面
- `test-logos.bat` - Windows快速打开测试页面

## 🎨 品牌Logo颜色方案

| 品牌 | 颜色 | 文件 |
|------|------|------|
| Apple | 黑色 #000000 | apple.svg |
| Samsung | 蓝色 #1428A0 | samsung.svg |
| Xiaomi | 橙色 #FF6900 | xiaomi.svg |
| Google | 多彩 | google.svg |
| OnePlus | 黑色 #000000 | oneplus.svg |
| OPPO | 绿色 #00A862 | oppo.svg |
| Huawei | 红色 #E60012 | huawei.svg |
| Honor | 蓝色 #0071CE | honor.svg |
| Other | 灰色 #666666 | other.svg |

## 📊 数据库结构

### 品牌和机型数量
```javascript
{
  apple: { name: 'Apple', models: 37款 },      // ✅ 已更新价格
  samsung: { name: 'Samsung', models: 待添加 }, // ⏳ 等待数据
  xiaomi: { name: 'Xiaomi', models: 60款 },    // 默认价格
  google: { name: 'Google', models: 17款 },    // 默认价格
  oneplus: { name: 'OnePlus', models: 18款 },  // 默认价格
  oppo: { name: 'OPPO', models: 24款 },        // 默认价格
  huawei: { name: 'Huawei', models: 4款 },     // 默认价格
  honor: { name: 'Honor', models: 20款 },      // 默认价格
  other: { name: 'Other Brands', models: 11款 } // 默认价格
}
```

### 服务类型 (15项)
1. `screen_compatible` - Screen (Compatible)
2. `screen_high_quality` - Screen (High Quality/Premium)
3. `screen_original` - Original Screen (Samsung Services Pack)
4. `battery` - Battery (High Quality/Premium)
5. `charging_port` - Charging Port
6. `software` - Software Flash/Restore
7. `back_glass` - Back Glass Replacement
8. `motherboard` - Motherboard/Liquid Damage/Audio/Touch IC Repair
9. `rear_camera` - Rear Camera Replacement
10. `front_camera` - Front Camera Replacement
11. `camera_lens` - Camera Lens Replacement
12. `microphone` - Microphone Repair
13. `earpiece` - Earpiece Speaker Repair
14. `loudspeaker` - Loudspeaker Replacement
15. `power_button` - Power Button Repair

### 已删除的服务
- ❌ `network_unlock` - Network Unlocking
- ❌ `frp_reset` - FRP Google Account Reset

## 🔐 管理员功能

### 登录信息
- URL: `https://techcross.ie/admin.html`
- 用户名: `0876676466`
- 密码: `0870019999`

### 功能标签页
1. **Edit Pricing** - 编辑现有机型价格
   - 按品牌筛选
   - 搜索机型
   - 展开/折叠所有
   - 显示机型数量
   - 批量保存

2. **Add New Model** - 添加新机型
   - 选择品牌
   - 输入机型ID和名称
   - 设置所有服务价格

3. **Add New Brand** - 添加新品牌
   - 查看现有品牌
   - 添加新品牌ID和名称

4. **Manage Services** - 管理服务类型
   - 查看现有服务
   - 添加新服务类型

## 💾 数据存储

### LocalStorage Keys
- `techcross_pricing_data` - 价格数据
- `techcross_pricing_version` - 数据版本 (当前: 3.0)
- `techcross_admin_session` - 管理员会话
- `techcross_admin_username` - 自定义用户名
- `techcross_admin_password` - 自定义密码

### 版本控制
当版本号改变时，系统会自动清除旧数据并加载新的默认数据。

## 🔄 工作流程

### 用户查看价格
1. 访问 `pricing.html`
2. 选择品牌卡片
3. 进入品牌专属页面（如 `pricing-apple.html`）
4. 选择机型和服务类型
5. 查看价格和最后更新时间

### 管理员更新价格
1. 访问 `admin.html`
2. 登录（用户名/密码）
3. 选择"Edit Pricing"标签
4. 使用品牌筛选或搜索找到机型
5. 修改价格
6. 点击"Save All Changes"
7. 系统自动更新localStorage
8. 用户端立即看到新价格

### 添加新机型
1. 登录管理员面板
2. 选择"Add New Model"标签
3. 选择品牌
4. 输入机型ID（如：iphone-16-pro）
5. 输入显示名称（如：iPhone 16 Pro）
6. 设置所有服务价格
7. 点击"Add Model"

## 🎯 价格显示规则

| 价格值 | 显示内容 |
|--------|----------|
| 0 | "Please Contact Us" + 电话号码 |
| 9999 | "Please Contact Us" + 特殊说明 |
| 其他数字 | "€价格" + 最后更新时间 |

## 📱 响应式设计

所有页面都支持：
- 桌面电脑 (1200px+)
- 平板电脑 (768px - 1199px)
- 手机 (< 768px)

## 🚀 部署信息

### 当前部署
- 平台: Google Cloud Run
- 区域: europe-west3
- 服务名: teschcross
- URL: https://techcross.ie

### 部署文件
- `Dockerfile` - Docker容器配置
- `nginx.conf` - Nginx服务器配置
- `cloudbuild.yaml` - Cloud Build配置

## 📝 待办事项

1. ⏳ 等待Samsung价格数据
2. ⏳ 可选：为其他品牌添加实际价格
3. ⏳ 测试所有logo在不同浏览器中的显示
4. ⏳ 确认管理员可以正常编辑所有品牌

## 🔧 故障排除

### Logo不显示
1. 检查 `logos/` 文件夹是否存在
2. 检查SVG文件是否完整
3. 清除浏览器缓存
4. 使用 `test-logos.html` 测试

### 价格数据不更新
1. 访问 `clear-cache.html`
2. 点击"Clear Cache"按钮
3. 刷新页面

### 管理员无法登录
1. 确认用户名: 0876676466
2. 确认密码: 0870019999
3. 清除浏览器缓存
4. 使用无痕模式测试

## 📞 联系信息

- 电话: 046 905 9854 (座机)
- 手机: 089 482 5300
- 邮箱: navantechcross@gmail.com
- 地址: Unit 4, Navan Shopping Centre, Navan, Co. Meath, Ireland

---

**版本**: 3.0  
**最后更新**: 2026年3月11日  
**状态**: ✅ 系统完整，等待Samsung数据
