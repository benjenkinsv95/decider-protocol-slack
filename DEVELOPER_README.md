# Local Development
## Prerequisite
Node.js

## Run
Then startup the website with 
```
npm install && \
npm start
```

# Deployment
## Prerequisite
Install Docker

## Create config.json file
Create a `config.json` file with your slack credentials.

## Build
On the production machine
```
  docker image build -t decider-protocol .
```

### Prerequisites
This application requires [the following prerequisites](https://github.com/benjenkinsv95/personal-website/blob/master/docker_nginx_prerequisites.md) so that it can be hosted with a domain name using a secure HTTPS encryption.

### Run App in Production
Finally, run the application from DockerHub. Pulls down a fresh copy and specifies what the domain name should be.
``` \
docker run -d \
-e VIRTUAL_HOST=decider-protocol.ben-jenkins.com \
-e LETSENCRYPT_HOST=decider-protocol.ben-jenkins.com \
-e LETSENCRYPT_EMAIL=benjenkinsv95@gmail.com \
decider-protocol
```