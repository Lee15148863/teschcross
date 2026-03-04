# 修复触发器配置 - 避免手动选择镜像

## 问题描述

每次部署都需要手动从Artifact Registry选择容器映像，这是因为触发器配置不正确。

## 正确的触发器配置

### 通过Console配置（推荐）

1. **访问触发器页面**：
   https://console.cloud.google.com/cloud-build/triggers

2. **删除所有现有触发器**：
   - 找到所有与 `teschcross` 相关的触发器
   - 点击右侧的 **⋮** (三个点)
   - 选择 **Delete**

3. **创建新触发器**：
   - 点击 **CREATE TRIGGER**
   
   **基本信息**：
   - Name: `teschcross-auto-deploy`
   - Description: `Auto deploy to Cloud Run`
   - Event: **Push to a branch**
   - Region: `europe-west3`

   **Source**：
   - Repository generation: **2nd gen**
   - Repository: 选择 `Lee15148863/teschcross`
   - Branch: `^main$`

   **Configuration** ⚠️ 最重要：
   - Type: **Cloud Build configuration file (yaml or json)**
   - Location: **Repository**
   - Cloud Build configuration file location: `/cloudbuild.yaml`

   **⚠️ 不要填写以下字段**：
   - ❌ Image name (留空)
   - ❌ Dockerfile location (留空)
   - ❌ 不要选择 "Dockerfile" 或 "Buildpacks"

4. **点击 CREATE**

### 通过gcloud命令配置

```bash
# 删除旧触发器（如果存在）
gcloud builds triggers list
gcloud builds triggers delete TRIGGER_NAME

# 创建新触发器
gcloud builds triggers create github \
  --name="teschcross-auto-deploy" \
  --repo-name="teschcross" \
  --repo-owner="Lee15148863" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml" \
  --region="europe-west3"
```

## 验证配置

创建触发器后，验证配置：

1. 在触发器列表中点击触发器名称
2. 检查 **Configuration** 部分：
   ```
   Type: Cloud Build configuration file
   Location: /cloudbuild.yaml
   ```
3. 确认没有显示 "Image name" 或 "Dockerfile"

## 测试自动部署

1. 修改任意文件（如README.md）
2. 提交并推送：
   ```bash
   git add .
   git commit -m "Test auto deploy"
   git push
   ```
3. 访问 Cloud Build 历史：
   https://console.cloud.google.com/cloud-build/builds
4. 应该看到自动触发的构建
5. 构建完成后，网站自动更新，无需手动操作

## 常见错误

### 错误1：触发器类型选择错误

**症状**：每次都要手动选择镜像

**原因**：触发器配置为 "Dockerfile" 或 "Autodetected"

**解决**：改为 "Cloud Build configuration file (yaml or json)"

### 错误2：cloudbuild.yaml路径错误

**症状**：触发器运行失败，提示找不到配置文件

**原因**：路径填写错误

**解决**：确保填写 `/cloudbuild.yaml` 或 `cloudbuild.yaml`

### 错误3：多个触发器冲突

**症状**：有时自动部署，有时需要手动

**原因**：存在多个触发器

**解决**：删除所有旧触发器，只保留一个正确配置的

## 正确的工作流程

配置正确后，工作流程应该是：

1. ✅ 修改代码
2. ✅ `git push`
3. ✅ Cloud Build 自动触发
4. ✅ 自动构建 Docker 镜像
5. ✅ 自动推送到 Artifact Registry
6. ✅ 自动部署到 Cloud Run
7. ✅ 自动切换流量到新版本
8. ✅ 网站立即更新

**完全不需要任何手动操作！**

## 如果还是不行

如果按照上述步骤配置后还是需要手动选择镜像，请检查：

1. 触发器是否正确触发？
   - 查看 Cloud Build 历史
   - 确认有自动构建记录

2. cloudbuild.yaml 是否正确？
   - 检查文件是否在仓库根目录
   - 检查语法是否正确

3. 权限是否正确？
   - Cloud Build 服务账号需要 Cloud Run Admin 权限
   - 需要 Artifact Registry Writer 权限

如果需要帮助，请提供：
- 触发器配置截图
- Cloud Build 构建日志
- 错误信息
