# Use a slim Node.js base image
FROM node:22-slim

# Set working directory
WORKDIR /app

# Accept a build-time arg to label the client
ARG CLIENT_LABEL=UserC
ENV CLIENT_LABEL=${CLIENT_LABEL}

# Copy the common helpers and client UI code
COPY packages/common ./packages/common
COPY packages/client-ui ./packages/client-ui

# Install TypeScript globally
RUN npm install -g typescript
RUN npm install --save-dev @types/node


# Build the common helpers
WORKDIR /app/packages/common
RUN npm run build

# Build the client UI
WORKDIR /app/packages/client-ui
RUN npm run build

# Expose the UI port (mapped externally by docker-compose)
EXPOSE 8080

# Mount the /caps volume read-only
VOLUME ["/caps"]

# Run the compiled UI server
CMD ["node", "dist/index.js"]
