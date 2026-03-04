# Tech Cross 网站部署指南

## 上传到 GitHub

### 方法1：使用 Git 命令行

1. 安装 Git（如果还没安装）
   - 下载：https://git-scm.com/download/win
   - 安装后重启终端

2. 初始化仓库并上传
```bash
# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Tech Cross repair centre website"

# 添加远程仓库
git remote add origin https://github.com/Lee15148863/teschcross.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 方法2：使用 GitHub Desktop（推荐新手）

1. 下载并安装 GitHub Desktop
   - https://desktop.github.com/

2. 打开 GitHub Desktop
   - File → Add Local Repository
   - 选择当前文件夹：D:\Workspace\Techcross

3. 如果提示"This directory does not appear to be a Git repository"
   - 点击 "Create a repository"
   - 填写信息后点击 Create Repository

4. 提交更改
   - 在左下角输入提交信息："Initial commit"
   - 点击 "Commit to main"

5. 发布到 GitHub
   - 点击 "Publish repository"
   - 或者如果已存在远程仓库，点击 "Push origin"

### 方法3：直接通过 GitHub 网页上传

1. 访问：https://github.com/Lee15148863/teschcross

2. 如果仓库为空：
   - 点击 "uploading an existing file"
   - 拖拽所有文件到页面
   - 点击 "Commit changes"

3. 如果仓库已有内容：
   - 点击 "Add file" → "Upload files"
   - 拖拽所有文件
   - 点击 "Commit changes"

## 部署到 GitHub Pages

1. 进入仓库设置
   - 访问：https://github.com/Lee15148863/teschcross/settings/pages

2. 配置 GitHub Pages
   - Source: 选择 "Deploy from a branch"
   - Branch: 选择 "main" 分支
   - Folder: 选择 "/ (root)"
   - 点击 "Save"

3. 等待部署完成（约1-2分钟）
   - 访问：https://lee15148863.github.io/teschcross/

## 需要上传的文件列表

```
├── index.html          # 主页面
├── styles.css          # 样式文件
├── script.js           # JavaScript 脚本
├── logo.png            # Tech Cross Logo
├── README.md           # 项目说明
├── cloudbuild.yaml     # Google Cloud Build 配置
├── .gitignore          # Git 忽略文件
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Actions 自动部署
```

## 注意事项

- 确保 logo.png 文件已正确下载
- 检查所有文件路径是否正确
- 首次部署可能需要几分钟才能访问

## 更新网站

每次修改后：

```bash
git add .
git commit -m "描述你的更改"
git push
```

或使用 GitHub Desktop 的 "Commit" 和 "Push" 按钮。

## 故障排除

### 问题1：logo.png 无法显示
- 确保 logo.png 文件在根目录
- 检查文件名大小写是否正确

### 问题2：GitHub Pages 显示 404
- 检查仓库设置中 Pages 是否已启用
- 确认分支名称是否正确（main 或 master）
- 等待几分钟让部署完成

### 问题3：样式不显示
- 检查 styles.css 和 script.js 路径
- 清除浏览器缓存后重试

## 联系信息

- 电话：046 905 9854
- 邮箱：techcrossnavan@gmail.com
