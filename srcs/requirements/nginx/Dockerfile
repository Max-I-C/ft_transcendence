FROM alpine:3.21
RUN apk update
RUN apk upgrade
RUN apk add nginx
RUN apk add vim
RUN mkdir -p /etc/nginx/ssl
RUN apk add openssl
RUN openssl req -x509 -nodes -out "/etc/nginx/ssl/inception.crt" -keyout "/etc/nginx/ssl/inception.key" -subj "/C=FR/ST=IDF/L=Paris/O=42/OU=42/CN=transcendence.42.fr/UID=transcendence"
RUN mkdir -p /var/www/html 
RUN mkdir -p /var/run/nginx
COPY /conf/nginx.conf /etc/nginx/nginx.conf
RUN chmod 755 /var/www/html
RUN chown -R nginx:nginx /var/www/html
CMD ["nginx", "-g", "daemon off;"]
