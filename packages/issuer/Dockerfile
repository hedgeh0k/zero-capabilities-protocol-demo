# Base image with a current Node.js release
FROM node:22-slim

# Create and set working directory
WORKDIR /app

COPY packages/issuer ./packages/issuer

# Build the issuer package
WORKDIR /app/packages/issuer
RUN npm install -g typescript
RUN npm install --save-dev @types/node
RUN npm install
RUN npm run build

# Provide a mount point for the shared caps volume
VOLUME ["/caps"]

# Run the issuer script (writes keys/capabilities to /caps)
CMD ["node", "dist/index.js"]
