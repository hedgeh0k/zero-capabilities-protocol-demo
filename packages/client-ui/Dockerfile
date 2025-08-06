FROM node:22-slim
WORKDIR /app
COPY packages/client-ui ./
RUN npm install -g typescript
RUN npm install --save-dev @types/node

RUN npm install && npm run build
EXPOSE 8080
VOLUME ["/caps"]
CMD ["npm", "start"]
