FROM node:20-alpine AS build 

WORKDIR /app

COPY package.json ./

RUN yarn

COPY . .

RUN yarn build

FROM node:20-alpine AS runner

WORKDIR /app

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next/static ./.next/static

EXPOSE 3000

CMD [ "node" , "server.js" ]