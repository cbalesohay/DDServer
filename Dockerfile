# Total lines of code: 26
ARG NODE_VERSION=22.16.0
FROM node:${NODE_VERSION}-alpine

WORKDIR /ddserver

# Temporarily use dev mode so TypeScript is available
ENV NODE_ENV development

COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Prune dev dependencies for a lighter image
RUN npm prune --production

# Use non-root user
USER node

EXPOSE 8080
CMD ["node", "dist/index.js"]