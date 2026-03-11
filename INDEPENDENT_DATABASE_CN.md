# 独立品牌数据库系统

## ✅ 已完成

1. 移除了隐藏的管理员入口链接
2. 为每个品牌创建独立的数据库文件
3. 每个品牌可以有不同的维修项目

## 📁 新的文件结构

### 独立数据库文件
```
pricing-data-apple.js      - Apple独立数据库（iPhone + iPad）
pricing-data-samsung.js    - Samsung独立数据库
pricing-data-xiaomi.js     - Xiaomi独立数据库
pricing-data-google.js     - Google独立数据库（待创建）
pricing-data-oneplus.js    - OnePlus独立数据库（待创建）
pricing-data-oppo.js       - OPPO独立数据库（待创建）
pricing-data-huawei.js     - Huawei独立数据库（待创建）
pricing-data-honor.js      - Honor独立数据库（待创建）
pricing-data-other.js      - Other Brands独立数据库（待创建）
```

### 旧文件（可删除）
```
pricing-data.js            - 旧的统一数据库（不再使用）
```

## 🎯 独立数据库的优势

### 1. 灵活的服务类型
每个品牌可以有完全不同的维修项目：

**iPhone服务类型（15项）：**
- Screen (Compatible)
- Screen (High Quality/Premium)
- Original Screen
- Battery
- Charging Port
- Software Flash/Restore
- Back Glass Replacement
- Motherboard/Liquid Damage/Audio/Touch IC Repair
- Rear Camera Replacement
- Front Camera Replacement
- Camera Lens Replacement
- Microphone Repair
- Earpiece Speaker Repair
- Loudspeaker Replacement
- Power Button Repair

**iPad服务类型（10项）：**
- Screen (Compatible)
- Original Screen
- Battery Replacement
- Charging Port
- Software Flash/Restore
- Motherboard/Liquid Damage Repair
- Camera Replacement
- Speaker Repair
- Power Button Repair
- Home Button Repair

**Xiaomi服务类型（10项）：**
- Screen (Compatible)
- Screen (High Quality/Premium)
- Battery Replacement
- Charging Port
- Software Flash/Restore
- Back Cover Replacement
- Motherboard Repair
- Camera Replacement
- Speaker Repair
- Power Button Repair

### 2. 独立的localStorage
每个品牌使用独立的localStorage键：
- `techcross_pricing_apple`
- `techcross_pricing_samsung`
- `techcross_pricing_xiaomi`
- 等等...

### 3. 独立的版本控制
每个品牌有自己的版本号：
- `techcross_pricing_apple_version`
- `techcross_pricing_samsung_version`
- 等等...

## 📐 Apple数据库结构

### 特殊设计：iPhone + iPad分离
```javascript
{
  iphone: {
    name: 'iPhone',
    serviceTypes: { /* 15种iPhone服务 */ },
    models: {
      'iphone-7': { name: 'iPhone 7', services: {...}, lastUpdated: '...' },
      'iphone-8': { name: 'iPhone 8', services: {...}, lastUpdated: '...' },
      // ...
    }
  },
  ipad: {
    name: 'iPad',
    serviceTypes: { /* 10种iPad服务 */ },
    models: {
      'ipad-pro-12-9-2024': { name: 'iPad Pro 12.9"', services: {...}, lastUpdated: '...' },
      'ipad-air-2024': { name: 'iPad Air', services: {...}, lastUpdated: '...' },
      // ...
    }
  }
}
```

## 📐 其他品牌数据库结构

### 标准结构
```javascript
{
  name: 'Samsung',
  serviceTypes: { /* 品牌特定的服务类型 */ },
  models: {
    'galaxy-s24-ultra': { 
      name: 'Galaxy S24 Ultra', 
      services: {...}, 
      lastUpdated: '...' 
    },
    // ...
  }
}
```

## 🔧 如何使用

### 1. 在品牌页面中引用
```html
<!-- pricing-apple.html -->
<script src="pricing-data-apple.js"></script>
<script>
  let pricingData = loadApplePricingData();
  // 使用 pricingData.iphone 或 pricingData.ipad
</script>

<!-- pricing-samsung.html -->
<script src="pricing-data-samsung.js"></script>
<script>
  let pricingData = loadSamsungPricingData();
  // 使用 pricingData
</script>
```

### 2. 添加新机型
```javascript
// 在对应的数据库文件中添加
'new-model-id': {
  name: 'New Model Name',
  services: createDefaultServices(), // 使用对应品牌的helper函数
  lastUpdated: new Date().toISOString()
}
```

### 3. 修改服务类型
每个品牌可以独立修改serviceTypes对象，添加或删除服务项目。

## 🎨 管理员界面更新

### 需要创建新的管理员页面
由于每个品牌现在有独立的数据库和不同的服务类型，需要：

1. **品牌选择页面** - 选择要管理的品牌
2. **品牌专属管理页面** - 每个品牌有自己的管理界面
3. **动态服务类型** - 根据品牌显示对应的服务项目

### 建议的管理员结构
```
admin.html              - 品牌选择页面
admin-apple.html        - Apple管理页面（iPhone + iPad）
admin-samsung.html      - Samsung管理页面
admin-xiaomi.html       - Xiaomi管理页面
// ... 其他品牌
```

## 📊 数据迁移

### 从旧系统迁移
如果需要从 `pricing-data.js` 迁移数据：

1. 读取旧的 `pricing-data.js`
2. 按品牌分离数据
3. 转换为新的独立格式
4. 保存到对应的品牌数据库

## 🚀 下一步工作

### 立即需要：
1. ✅ 创建Apple数据库（已完成）
2. ✅ 创建Samsung数据库（已完成）
3. ✅ 创建Xiaomi数据库（已完成）
4. ⏳ 创建其他6个品牌的数据库
5. ⏳ 更新所有品牌页面引用新数据库
6. ⏳ 创建新的管理员界面

### 可选：
- 创建数据导入/导出工具
- 创建批量编辑工具
- 添加数据备份功能

## 💡 设计理念

### 为什么独立数据库？

1. **灵活性** - 每个品牌可以有完全不同的维修项目
2. **可扩展性** - 添加新品牌不影响现有品牌
3. **性能** - 只加载需要的品牌数据
4. **维护性** - 每个品牌独立管理，互不影响
5. **清晰性** - 数据结构更清晰，易于理解

### iPhone vs iPad
- iPhone有15种服务（包括前后摄像头、镜头等）
- iPad有10种服务（简化的服务项目）
- 两者在同一个Apple数据库中，但分开管理

## 📝 示例代码

### 加载Apple数据（iPhone）
```javascript
let appleData = loadApplePricingData();
let iphoneModels = appleData.iphone.models;
let iphoneServices = appleData.iphone.serviceTypes;

// 获取iPhone 7的屏幕价格
let iphone7 = iphoneModels['iphone-7'];
let screenPrice = iphone7.services.screen_compatible;
```

### 加载Apple数据（iPad）
```javascript
let appleData = loadApplePricingData();
let ipadModels = appleData.ipad.models;
let ipadServices = appleData.ipad.serviceTypes;

// 获取iPad Pro的电池价格
let ipadPro = ipadModels['ipad-pro-12-9-2024'];
let batteryPrice = ipadPro.services.battery;
```

### 保存数据
```javascript
// 修改价格
appleData.iphone.models['iphone-7'].services.screen_compatible = 50;
appleData.iphone.models['iphone-7'].lastUpdated = new Date().toISOString();

// 保存
saveApplePricingData(appleData);
```

## 🔒 数据安全

### localStorage限制
- 每个品牌独立存储
- 不会相互影响
- 版本控制防止数据冲突

### 数据验证
每个数据库文件都有：
- 版本检查
- 错误处理
- 默认数据回退

## 📞 需要帮助？

如有问题：
- 📧 navantechcross@gmail.com
- 📱 046 905 9854 / 089 482 5300

---

**创建时间**: 2026年3月11日  
**版本**: 独立数据库 v1.0  
**状态**: ✅ 基础结构完成，需要继续完善
