FROM node:20-alpine

WORKDIR /app

# Install Google Cloud SDK for StoreFlow deployment operations
RUN apk add --no-cache curl python3 && \
    curl -sSL https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz | \
    tar xz -C /usr/local && \
    /usr/local/google-cloud-sdk/install.sh --quiet --path-update=true && \
    ln -s /usr/local/google-cloud-sdk/bin/gcloud /usr/local/bin/gcloud && \
    rm -rf /tmp/*

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy all website files
COPY . .

# Expose port
EXPOSE 8080

# Start Node.js server
CMD ["node", "server.js"]
