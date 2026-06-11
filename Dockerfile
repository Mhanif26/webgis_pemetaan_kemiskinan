FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for building and running drizzle)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the frontend and backend api
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]
