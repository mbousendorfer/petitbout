FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_APP_BUILD_NUMBER
ENV VITE_APP_BUILD_NUMBER=$VITE_APP_BUILD_NUMBER

RUN npm run build

FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /petitbout-entrypoint.sh
COPY --from=build /app/dist /usr/share/nginx/html
RUN chmod +x /petitbout-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

ENTRYPOINT ["/petitbout-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
