# Use a slim Node.js base image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy the dataset server code
COPY packages/dataset-server ./packages/dataset-server

# Install TypeScript globally
RUN npm install -g typescript
RUN npm install --save-dev @types/node

# Build the dataset server
WORKDIR /app/packages/dataset-server
RUN npm run build

# Expose the internal port used by the server (will be mapped by docker-compose)
EXPOSE 3000

# Mount the /caps volume read-only (defined in docker-compose)
VOLUME ["/caps"]

# Run the compiled server
CMD ["node", "dist/server.js"]
