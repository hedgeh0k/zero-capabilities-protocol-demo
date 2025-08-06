FROM node:22-slim

WORKDIR /app
COPY packages/client-ui ./packages/client-ui

# Build the dataset server
WORKDIR /app/packages/client-ui
RUN npm install -g typescript
RUN npm install --save-dev @types/node
RUN npm install
RUN npm run build
EXPOSE 8080
VOLUME ["/caps"]
CMD ["npm", "start"]
