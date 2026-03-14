# 使用 Nginx 作为 Web 服务器
FROM nginx:alpine

# 删除默认的 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/

# 复制所有网站文件到 nginx 的 html 目录
COPY *.html /usr/share/nginx/html/
COPY *.css /usr/share/nginx/html/
COPY *.js /usr/share/nginx/html/
COPY *.png /usr/share/nginx/html/
COPY logos/ /usr/share/nginx/html/logos/

# 暴露 8080 端口（Cloud Run 要求）
EXPOSE 8080

# 使用环境变量设置端口，默认为 8080
ENV PORT=8080

# 启动脚本：使用 envsubst 替换端口变量
CMD sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/nginx.conf && \
    nginx -g "daemon off;"
