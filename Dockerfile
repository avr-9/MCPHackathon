FROM node:22-alpine AS dependencies
WORKDIR /app/forge-os

COPY forge-os/package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app/forge-os

COPY --from=dependencies /app/forge-os/node_modules ./node_modules
COPY forge-os ./
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app/forge-os

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/forge-os ./

EXPOSE 3000
CMD ["npm", "run", "start"]
