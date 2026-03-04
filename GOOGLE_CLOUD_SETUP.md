# Google Cloud Build 部署配置指南

## 前提条件

1. Google Cloud 项目已创建
2. 已启用以下 API：
   - Cloud Build API
   - Cloud Storage API
   - Developer Connect API

## 步骤1：创建 Cloud Storage 存储桶

```bash
# 创建存储桶（如果还没有）
gsutil mb -l europe-west1 gs://techcross-website

# 配置为网站托管
gsutil web set -m index.html gs://techcross-website

# 设置公开访问
gsutil iam ch allUsers:objectViewer gs://techcross-website
```

## 步骤2：配置 Cloud Build 触发器

### 方法A：通过 Console 配置（推荐）

1. 访问 Cloud Build 触发器页面：
   https://console.cloud.google.com/cloud-build/triggers

2. 如果已有触发器，点击 **编辑（EDIT）**；否则点击 **创建触发器（CREATE TRIGGER）**

3. 配置以下选项：
   - **Name**: `techcross-deploy`
   - **Event**: Push to a branch
   - **Source**: 
     - Repository: `Lee15148863/teschcross` (GitHub)
     - Branch: `^main$`
   - **Configuration**:
     - Type: **Cloud Build configuration file (yaml or json)** ⚠️ 重要！
     - Location: `/ cloudbuild.yaml`
   - **Service account**: 使用默认的 Cloud Build 服务账号

4. 点击 **CREATE** 或 **SAVE**

### 方法B：通过 gcloud 命令配置

```bash
# 设置项目
gcloud config set project YOUR_PROJECT_ID

# 创建触发器
gcloud builds triggers create github \
  --name="techcross-deploy" \
  --repo-name="teschcross" \
  --repo-owner="Lee15148863" \
  --branch-pattern="^main$" \
  --build-config="cloudbuild.yaml"
```

## 步骤3：配置 IAM 权限

确保 Cloud Build 服务账号有必要的权限：

```bash
# 获取项目编号
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format="value(projectNumber)")

# Cloud Build 服务账号
SERVICE_ACCOUNT="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# 添加 Storage Admin 权限
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/storage.admin"

# 添加 Developer Connect 权限（如果使用 GitHub 连接）
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/developerconnect.admin"
```

## 步骤4：测试部署

### 手动触发构建

1. 访问：https://console.cloud.google.com/cloud-build/triggers
2. 找到你的触发器
3. 点击 **RUN** 按钮
4. 查看构建日志

### 通过推送代码触发

```bash
git add .
git commit -m "Test Cloud Build deployment"
git push
```

## 步骤5：访问网站

部署成功后，访问：
- https://storage.googleapis.com/techcross-website/index.html

或配置自定义域名。

## 常见问题

### 问题1：权限错误 (Permission Denied)

**错误**: `Permission 'developerconnect.gitRepositoryLinks.get' denied`

**解决**:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/developerconnect.admin"
```

### 问题2：找不到 Dockerfile

**错误**: `unable to evaluate symlinks in Dockerfile path`

**原因**: 触发器配置错误，使用了 Docker 构建而不是 cloudbuild.yaml

**解决**: 
1. 编辑触发器
2. Configuration 改为 "Cloud Build configuration file (yaml or json)"
3. 确认文件路径是 `cloudbuild.yaml`

### 问题3：存储桶不存在

**错误**: `BucketNotFoundException: 404 gs://techcross-website`

**解决**:
```bash
gsutil mb -l europe-west1 gs://techcross-website
```

### 问题4：文件无法访问

**错误**: 访问网站显示 403 Forbidden

**解决**:
```bash
gsutil iam ch allUsers:objectViewer gs://techcross-website
```

## 自定义域名配置（可选）

1. 验证域名所有权
2. 创建 CNAME 记录指向：`c.storage.googleapis.com`
3. 配置 Load Balancer 和 SSL 证书

详细步骤：https://cloud.google.com/storage/docs/hosting-static-website

## 监控和日志

- 构建历史：https://console.cloud.google.com/cloud-build/builds
- 存储桶内容：https://console.cloud.google.com/storage/browser/techcross-website

## 成本估算

- Cloud Build: 前 120 分钟/天免费
- Cloud Storage: 
  - 存储: ~$0.02/GB/月
  - 网络出站: 前 1GB 免费，之后 ~$0.12/GB
  
对于小型网站，月成本通常 < $1

## 联系信息

如有问题，请联系：
- Email: techcrossnavan@gmail.com
- Phone: 046 905 9854
