FROM node:21.6.0-alpine3.18 AS build

RUN mkdir /app
WORKDIR /app

COPY . ./

RUN npm install
RUN npm run build

FROM nginx:1.25.3 AS production

COPY --from=build /app/dist /usr/share/nginx/html/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8081
