FROM node:24-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json & package-lock.json first for optimal caching
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application
COPY . .

# Expose API Port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
