# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /webapp

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Add these lines to handle the build-time argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the React app
RUN npm run build

# Install serve globally for production usage
RUN npm install -g serve

# Default command (can be overridden by Docker Compose)
CMD ["npm", "start"]
