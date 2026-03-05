# 🚀 部署说明

## 当前状态
- ✅ 本地代码：最新版本（包含搜索功能）
- ✅ GitHub：最新版本（已推送）
- ❌ Google Cloud Run：旧版本（需要重新部署）

## 部署方法

### 方法1：通过 Google Cloud Console（推荐）

1. 访问 Cloud Build 触发器页面：
   ```
   https://console.cloud.google.com/cloud-build/triggers
   ```

2. 找到 `teschcross` 的触发器

3. 点击右侧的"运行"按钮

4. 等待构建完成（约5-10分钟）

5. 访问网站验证：
   ```
   https://teschcross-1045728849939.europe-west3.run.app
   ```

### 方法2：通过 gcloud CLI

如果已安装 gcloud CLI：

```powershell
# 触发构建
gcloud builds submit --config=cloudbuild.yaml .

# 或使用脚本
.\trigger-deploy.ps1
```

### 方法3：配置自动部署（一次性设置）

1. 访问 Cloud Build 触发器页面
2. 创建新触发器
3. 连接到 GitHub 仓库：`Lee15148863/teschcross`
4. 设置触发条件：推送到 `main` 分支
5. 构建配置：使用 `cloudbuild.yaml`
6. 保存

配置后，每次推送代码到 GitHub 都会自动部署！

## 验证部署

部署完成后，检查以下功能：

- [ ] 搜索框显示正常
- [ ] 点击搜索图标打开模态框
- [ ] 输入搜索词显示结果
- [ ] 键盘快捷键 Ctrl+K 工作
- [ ] 移动端搜索按钮显示

## 当前版本信息

- **最新 Commit**: 92626be
- **包含功能**:
  - 高级搜索引擎
  - 实时自动完成
  - 移动端优化
  - 键盘导航

## 故障排除

### 问题：搜索功能不工作
**原因**：旧版本还在运行
**解决**：重新部署（见上方方法）

### 问题：gcloud 命令不存在
**原因**：未安装 Google Cloud SDK
**解决**：
1. 下载：https://cloud.google.com/sdk/docs/install
2. 安装后运行：`gcloud init`

### 问题：构建失败
**检查**：
1. 访问 Cloud Build 历史：https://console.cloud.google.com/cloud-build/builds
2. 查看错误日志
3. 检查 Dockerfile 和 cloudbuild.yaml 配置

## 联系信息

如有问题，请检查：
- GitHub 仓库：https://github.com/Lee15148863/teschcross
- Cloud Build 日志：https://console.cloud.google.com/cloud-build/builds
