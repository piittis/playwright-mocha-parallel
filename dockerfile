FROM node:14
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci