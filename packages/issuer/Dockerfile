# Base image with a current Node.js release
FROM node:22-slim

# Create and set working directory
WORKDIR /app

# Copy only the common and issuer packages
COPY packages/common ./packages/common
COPY packages/issuer ./packages/issuer

# Install TypeScript globally (no external deps needed)
RUN npm install -g typescript
RUN npm install --save-dev @types/node


# Build the common helpers
WORKDIR /app/packages/common
RUN npm run build

# Build the issuer package
WORKDIR /app/packages/issuer
RUN npm run build

# Provide a mount point for the shared caps volume
VOLUME ["/caps"]

# Run the issuer script (writes keys/capabilities to /caps)
CMD ["node", "dist/index.js"]
