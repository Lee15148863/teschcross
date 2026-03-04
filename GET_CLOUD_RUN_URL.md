# 获取固定的Cloud Run URL

## 方法1：通过Console获取

1. 访问：https://console.cloud.google.com/run
2. 找到服务：`teschcross`
3. 点击服务名称
4. 在顶部会显示URL，格式类似：
   ```
   https://teschcross-xxxxx-ew.a.run.app
   ```
5. 这个URL是固定的，不会改变

## 方法2：通过gcloud命令获取

```bash
gcloud run services describe teschcross \
  --region=europe-west3 \
  --format='value(status.url)'
```

## 方法3：自动获取并保存到文件

在cloudbuild.yaml中添加步骤，自动获取URL：

```yaml
# 获取并显示Cloud Run URL
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: bash
  args:
    - '-c'
    - |
      URL=$(gcloud run services describe teschcross --region=europe-west3 --format='value(status.url)')
      echo "=========================================="
      echo "🚀 Deployment Successful!"
      echo "📍 Your website is live at:"
      echo "   $URL"
      echo "=========================================="
```

## 配置自定义域名的好处

1. ✅ 固定的、易记的URL
2. ✅ 专业的品牌形象
3. ✅ 更好的SEO
4. ✅ 可以配置SSL证书（自动）
5. ✅ 不需要每次查找URL

## 推荐配置

如果你有域名 `techcross.ie`，建议配置：

- 主域名：`techcross.ie` → Cloud Run
- 或子域名：`app.techcross.ie` → Cloud Run

这样访问 `techcross.ie` 就能直接看到网站，不需要记住复杂的Cloud Run URL。

## 临时解决方案

如果暂时不想配置域名，可以：

1. 获取当前的Cloud Run URL
2. 保存到浏览器书签
3. 或创建一个快捷方式

当前的Cloud Run URL格式：
```
https://teschcross-[PROJECT-HASH]-ew.a.run.app
```

这个URL是固定的，不会因为部署而改变。
