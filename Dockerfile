FROM nginx:alpine

# remove default config
RUN rm /etc/nginx/conf.d/default.conf

# copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copy react build
COPY dist /usr/share/nginx/html
