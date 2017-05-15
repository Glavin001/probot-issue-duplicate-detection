FROM glavin001/alpine-python2-numpy-scipy
MAINTAINER Glavin Wiechert <glavin.wiechert@gmail.com>

RUN apk update

# Install Node.js
RUN apk add nodejs

# Defines our working directory in container
WORKDIR /usr/src/app

# Copy the application project
COPY package.json ./
RUN npm install

# Build
COPY src/ src/

# Enable systemd init system in container
# ENV INITSYSTEM on

# Run on device
EXPOSE 3000
CMD npm run start
