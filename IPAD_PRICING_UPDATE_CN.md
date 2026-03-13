# iPad 维修报价更新完成

## 更新日期
2026年3月13日

## 更新内容

### 1. 更新了iPad服务类型
新的服务类型完全匹配您提供的Excel表格：
- **Screen (Full Screen only/Both)** - 全屏组件更换
- **Touch Screen** - 触摸屏数字化器更换
- **Display Screen** - 显示屏更换
- **Home button (No Touch ID)** - Home键维修（无Touch ID）
- **Battery (High Quality/Premium)** - 高品质/优质电池更换
- **Charging Port** - 充电口维修/更换
- **Motherboard/Liquid Damage/Audio/Touch IC Repair** - 主板及IC复杂维修
- **Software Flash/Restore (Apple ID required)** - 软件修复和恢复（需要Apple ID）
- **Any Other Please ASK** - 其他维修 - 请联系咨询

### 2. 录入了27款iPad的完整价格数据

#### 最新款iPad（从新到旧排列）：
1. **iPad A16 (11th generation 11inch)** (A3162)
   - Screen Full: €220, Touch Screen: €85, Display: €185
   - Battery: €95, Charging Port: €90, Motherboard: €145

2. **iPad mini (A17 Pro)** (A2993, A2995)
   - 标记为"Full"的项目显示"Please Contact Us"
   - Battery: €90, Charging Port: €90, Motherboard: €145

3. **iPad Pro 13-inch (M4)** (A2925, A2926)
4. **iPad Pro 11-inch (M4)** (A2836, A2837)
5. **iPad Air 13-inch (M2)** (A2898, A2899)
6. **iPad Air 11-inch (M2)** (A2902, A2903)
7. **iPad Pro 12.9-inch (6th gen)** (A2436, A2764, A2437)
8. **iPad Pro 11-inch (4th gen)** (A2759, A2435, A2761)

9. **iPad (10th generation)** (A2696, A2757, A2777)
   - Screen Full: €195, Touch Screen: €80, Display: €160
   - Home Button: €65, Battery: €80, Charging Port: €85

10. **iPad Air (5th generation)** (A2588, A2589, A2591)
11. **iPad mini (6th generation)** (A2567, A2568)

12. **iPad (9th generation)** (A2602, A2604, A2603)
    - Screen Full: €135, Touch Screen: €65, Display: €110
    - Home Button: €65, Battery: €90, Charging Port: €70

13. **iPad Pro 12.9-inch (5th gen)** (A2378, A2461, A2379)
14. **iPad Pro 11-inch (3rd gen)** (A2377, A2459, A2301)
15. **iPad Air (4th generation)** (A2316, A2324, A2325, A2072)

16. **iPad (8th generation)** (A2270, A2428, A2429, A2430)
    - Screen Full: €135, Touch Screen: €65, Display: €110

17. **iPad Pro 12.9-inch (4th gen)** (A2229, A2069, A2232)
18. **iPad Pro 11-inch (2nd gen)** (A2228, A2068, A2230)

19. **iPad (7th generation)** (A2197, A2198, A2200)
    - Screen Full: €130, Touch Screen: €65, Display: €110

20. **iPad Air (3rd generation)** (A2152, A2123, A2153)
21. **iPad mini (5th generation)** (A2133, A2124, A2126)
22. **iPad Pro 12.9-inch (3rd gen)** (A1876, A1895, A2014)
23. **iPad Pro 11-inch (1st gen)** (A1980, A1934, A2013)

24. **iPad (6th generation)** (A1893, A1954)
    - Screen Full: €125, Touch Screen: €60, Display: €95

25. **iPad Pro 12.9-inch (2nd gen)** (A1670, A1671)
26. **iPad Pro 10.5-inch** (A1701, A1709)

27. **iPad (5th generation)** (A1822, A1823)
    - Screen Full: €125, Touch Screen: €60, Display: €95

28. **iPad Pro 9.7-inch** (A1673, A1674, A1675)
    - Home Button: €60, Battery: €70, Charging Port: €65

### 3. 价格显示规则
- **标记为"Full"的项目** → 价格设为 €0 → 显示 "Please Contact Us"
- **有具体价格的项目** → 显示实际价格（如 €125, €220等）
- **所有Software服务** → 统一 €20
- **标记为"ASK"的项目** → 价格设为 €0 → 显示 "Please Contact Us"

### 4. 特殊说明
根据您的要求，对于那些标记为"Full"的维修项目（主要是较新款iPad的屏幕维修），系统会显示：
```
Please Contact Us
Please call us for a quote: 046 905 9854 or 089 482 5300
```

这是因为这些维修项目的价格浮动较大，需要客人来电咨询具体报价。

### 5. 数据库版本更新
- **版本号**: v3.0 → v4.0
- **更新原因**: iPad服务类型和价格数据完全重构
- **影响**: 用户访问网站时会自动清除旧缓存，加载新的iPad价格数据

## 文件更新列表
- `pricing-data-apple.js` - 更新iPad服务类型和所有27款iPad价格数据
- 版本号从 v3.0 升级到 v4.0

## 访问方式
1. 主页 → Pricing → Apple → iPad
2. 或直接访问：`pricing-apple-ipad.html`

## 测试建议
1. 清除浏览器缓存（或使用主页右上角的清除缓存按钮）
2. 访问 iPad 报价页面
3. 测试几款不同的iPad型号：
   - 测试有完整价格的型号（如 iPad 10th generation）
   - 测试标记为"Full"的型号（如 iPad Pro 13-inch M4）
   - 验证"Please Contact Us"显示是否正确

## 注意事项
- 所有价格均为欧元（€）
- 标记为"Full"的项目会提示客人来电咨询
- Software服务统一为 €20，需要Apple ID
- 价格会持续更新，页面顶部有更新说明提示

---
更新完成时间：2026年3月13日
数据库版本：v4.0
