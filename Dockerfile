# Use Node base image
FROM node:20

# Install compilers/interpreters for code runner
RUN apt-get update && apt-get install -y \
    php \
    python3 \
    openjdk-17-jdk \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all backend files
COPY . .

# Expose your app port (change if your app uses different port)
EXPOSE 8080

# Run the backend
CMD ["npm", "start"]