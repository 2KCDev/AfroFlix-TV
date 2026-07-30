FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_SITE_VERIFICATION=
ARG VITE_GOOGLE_ANALYTICS_ID=
ARG VITE_GA4_MEASUREMENT_ID=
ARG VITE_GOOGLE_ADSENSE_CLIENT_ID=
ARG VITE_GOOGLE_ADSENSE_ENABLED=false
ARG NGINX_CONF=nginx.conf
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_SITE_VERIFICATION=$VITE_GOOGLE_SITE_VERIFICATION
ENV VITE_GOOGLE_ANALYTICS_ID=$VITE_GOOGLE_ANALYTICS_ID
ENV VITE_GA4_MEASUREMENT_ID=$VITE_GA4_MEASUREMENT_ID
ENV VITE_GOOGLE_ADSENSE_CLIENT_ID=$VITE_GOOGLE_ADSENSE_CLIENT_ID
ENV VITE_GOOGLE_ADSENSE_ENABLED=$VITE_GOOGLE_ADSENSE_ENABLED
RUN npm run build
# ads.txt must contain the real public AdSense publisher ID, never a placeholder.
RUN if [ -n "$VITE_GOOGLE_ADSENSE_CLIENT_ID" ]; then \
      sed -i "s/ca-pub-xxxxxxxxxxxxxxxx/$VITE_GOOGLE_ADSENSE_CLIENT_ID/g" /app/dist/ads.txt; \
    else \
      sed -i '/^google.com, ca-pub-xxxxxxxxxxxxxxxx/d' /app/dist/ads.txt; \
    fi

FROM nginx:alpine
ARG NGINX_CONF=nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
