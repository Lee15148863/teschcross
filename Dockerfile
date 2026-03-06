# 使用 Nginx 作为 Web 服务器
FROM nginx:alpine

# 删除默认的 nginx 配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/

# 复制网站文件到 nginx 的 html 目录
COPY index.html /usr/share/nginx/html/
COPY pricing.html /usr/share/nginx/html/
COPY admin.html /usr/share/nginx/html/
COPY computer-pricing.html /usr/share/nginx/html/
COPY computer-admin.html /usr/share/nginx/html/
COPY data-transfer.html /usr/share/nginx/html/
COPY shop-coming-soon.html /usr/share/nginx/html/
COPY announcement-admin.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
COPY search-engine.js /usr/share/nginx/html/
COPY pricing.js /usr/share/nginx/html/
COPY pricing-data.js /usr/share/nginx/html/
COPY admin.js /usr/share/nginx/html/
COPY computer-pricing.js /usr/share/nginx/html/
COPY computer-pricing-data.js /usr/share/nginx/html/
COPY computer-admin.js /usr/share/nginx/html/
COPY announcement-admin.js /usr/share/nginx/html/
COPY logo.png /usr/share/nginx/html/

# 暴露 8080 端口（Cloud Run 要求）
EXPOSE 8080

# 使用环境变量设置端口，默认为 8080
ENV PORT=8080

# 启动脚本：使用 envsubst 替换端口变量
CMD sed -i "s/listen 80;/listen $PORT;/g" /etc/nginx/conf.d/nginx.conf && \
    nginx -g "daemon off;"

