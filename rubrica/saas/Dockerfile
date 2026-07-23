# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

# React-scripts can sometimes fail on npm ci/install with legacy-peer-deps on React 19 templates
RUN npm install --legacy-peer-deps

COPY . .

# Aumentar límite de memoria de Node a 4GB y desactivar mapas de fuente para compilación rápida en producción
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV GENERATE_SOURCEMAP=false

RUN npm run build

# Production Stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
