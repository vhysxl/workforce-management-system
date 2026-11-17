FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --all
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=development

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

RUN mkdir -p uploads/attendance && chown -R node:node uploads
USER node

EXPOSE 3001 3002 3003

CMD ["node", "dist/apps/auth-service/main.js"]
