# 增强管理员功能说明

## ✅ 已完成的功能

### 1. Apple管理员页面增强 (admin-apple.html)

已添加以下新功能：

#### 📝 管理型号 (Manage Models Tab)
- **添加新型号**：点击"+ Add New Model"按钮
  - 输入型号ID（如：iphone-18-pro）
  - 输入型号名称（如：iPhone 18 Pro (A4000)）
  - 自动为新型号创建所有服务项目，默认价格为0
  
- **删除型号**：每个型号旁边有"Delete"按钮
  - 点击后需要确认
  - 删除后该型号的所有数据将被移除
  
- **编辑型号名称**：直接在输入框中修改型号名称
  - 修改后点击"Save Model Names"保存

#### 🔧 管理服务项目 (Manage Services Tab)
- **添加新服务**：点击"+ Add New Service"按钮
  - 输入服务ID（如：face_id_repair）
  - 输入服务名称（如：Face ID Repair）
  - 输入描述
  - 新服务会自动添加到所有现有型号，默认价格为0
  
- **删除服务**：每个服务旁边有"Delete"按钮
  - 点击后需要确认
  - 删除后该服务会从所有型号中移除
  
- **编辑服务信息**：直接在输入框中修改服务名称和描述
  - 修改后点击"Save Service Changes"保存

#### 💰 编辑价格 (Edit Pricing Tab)
- 保持原有功能
- **新增**：只有价格变动时才更新时间戳
- 每个服务单独追踪最后更新时间

### 2. 价格更新时间追踪

#### 数据结构更新
每个型号现在包含：
```javascript
{
    name: "iPhone 17 Pro Max (A3526)",
    services: {
        screen_compatible: 145,
        battery: 70,
        // ... 其他服务
    },
    serviceUpdates: {
        screen_compatible: "2026-03-11T10:30:00.000Z",
        battery: "2026-03-10T15:20:00.000Z",
        // ... 每个服务的最后更新时间
    },
    lastUpdated: "2026-03-11T10:30:00.000Z"
}
```

#### 智能时间戳更新
- 只有当价格实际变动时，才更新该服务的时间戳
- 如果价格没变，保持原有时间戳
- 例如：
  - iPhone 11的屏幕价格从50改为60 → 更新screen_compatible的时间戳
  - iPhone 11的充电口价格保持60不变 → 不更新charging_port的时间戳
  - iPhone 12的屏幕价格保持65不变 → 不更新时间戳

### 3. 前台显示更新时间（待实现）

需要在pricing-apple-iphone.html和pricing-apple-ipad.html中添加：

```javascript
// 显示价格时，检查该服务是否有最近更新
function displayPrice(model, service) {
    const price = model.services[service];
    const updateTime = model.serviceUpdates?.[service];
    
    if (updateTime) {
        const date = new Date(updateTime);
        const now = new Date();
        const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        // 如果在7天内更新过，显示"Updated: X days ago"
        if (daysDiff <= 7) {
            return `€${price} <span class="updated-badge">Updated: ${daysDiff} days ago</span>`;
        }
    }
    
    return `€${price}`;
}
```

## 🔄 其他品牌管理员页面

需要为以下品牌创建相同的增强功能：
- ✅ Apple (已完成)
- ⏳ Samsung (待更新)
- ⏳ Xiaomi (待更新)
- ⏳ Google (待更新)
- ⏳ OnePlus (待更新)
- ⏳ OPPO (待更新)
- ⏳ Huawei (待更新)
- ⏳ Honor (待更新)
- ⏳ Other Brands (待更新)

## 📝 使用说明

### 添加新型号
1. 登录管理员后台
2. 选择"Manage Models"标签
3. 点击"+ Add New Model"
4. 填写型号ID和名称
5. 点击"Add Model"
6. 新型号会自动包含所有服务项目，价格默认为0

### 删除型号
1. 在"Manage Models"标签中
2. 找到要删除的型号
3. 点击该型号旁边的"Delete"按钮
4. 确认删除

### 添加新服务
1. 选择"Manage Services"标签
2. 点击"+ Add New Service"
3. 填写服务ID、名称和描述
4. 点击"Add Service"
5. 新服务会自动添加到所有现有型号

### 删除服务
1. 在"Manage Services"标签中
2. 找到要删除的服务
3. 点击该服务旁边的"Delete"按钮
4. 确认删除（会从所有型号中移除）

### 修改价格
1. 在"Edit Pricing"标签中
2. 直接在输入框中修改价格
3. 点击"Save All Changes"
4. 只有实际变动的价格会更新时间戳

## ⚠️ 注意事项

1. **型号ID命名规范**：
   - 使用小写字母
   - 单词之间用连字符分隔
   - 例如：iphone-17-pro-max, ipad-pro-12-9-2024

2. **服务ID命名规范**：
   - 使用小写字母
   - 单词之间用下划线分隔
   - 例如：screen_compatible, battery, charging_port

3. **删除操作不可恢复**：
   - 删除型号或服务前请确认
   - 删除后数据无法恢复

4. **版本控制**：
   - 数据库版本号已更新为3.0
   - 首次加载会清除旧数据并使用新结构

## 🚀 下一步工作

1. **更新其他品牌管理员页面**：
   - 复制admin-apple.html的功能到其他品牌
   - 调整品牌特定的配色和名称

2. **前台显示更新时间**：
   - 在pricing-apple-iphone.html中添加更新时间显示
   - 在pricing-apple-ipad.html中添加更新时间显示
   - 为其他品牌的pricing页面添加相同功能

3. **样式优化**：
   - 添加"Updated"徽章的CSS样式
   - 使用绿色或蓝色突出显示最近更新的价格

4. **批量操作**：
   - 添加批量修改价格功能
   - 添加批量导入/导出功能

## 📊 数据迁移

由于数据结构变化，首次使用新版本时：
- 旧数据会被清除
- 使用新的默认数据结构
- 所有serviceUpdates字段会被初始化为当前时间

如果需要保留旧数据，请在更新前备份localStorage中的数据。

---

**更新日期**：2026年3月11日  
**版本**：3.0  
**状态**：Apple管理员页面已完成，其他品牌待更新
