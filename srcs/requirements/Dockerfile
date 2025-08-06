# STAGE 1 - build frontend
FROM node:18-alpine AS frontend
WORKDIR /app
COPY ./frontend/package.json ./frontend/package-lock.json* ./
RUN npm install
COPY ./frontend .
RUN npm run build
RUN mkdir -p /frontend_dist && cp -a dist/. /frontend_dist/ && cp src/index.html /frontend_dist/ && cp src/style.css /frontend_dist/ && cp -r src/views/. /frontend_dist/views/


# STAGE 2 - nginx
FROM alpine:3.21
RUN apk update && apk upgrade && apk add nginx openssl
RUN mkdir -p /etc/nginx/ssl /var/www/html /var/run/nginx

# Certificat SSL
RUN openssl req -x509 -nodes -out "/etc/nginx/ssl/inception.crt" -keyout "/etc/nginx/ssl/inception.key" -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=transcendence.42.fr/UID=transcendence"

# Copier le build du frontend
COPY --from=frontend /frontend_dist /var/www/html

# Copier la conf nginx
COPY /nginx/conf/nginx.conf /etc/nginx/nginx.conf
COPY /nginx/conf/fastcgi-php.conf /etc/nginx/snippets/fastcgi-php.conf

RUN chmod 755 /var/www/html && chown -R nginx:nginx /var/www/html

RUN chmod -R 755 /var/www/html && chown -R nginx:nginx /var/www/html

CMD ["nginx", "-g", "daemon off;"]
