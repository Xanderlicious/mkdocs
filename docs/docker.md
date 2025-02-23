![](images/docker.png)

I like to host all of my services using docker.

## Installation

Installation of docker within Ubuntu Server is done so by following the instructions on the official docker documentation site  

- [Docker Docs](https://docs.docker.com/engine/install/)  

I predominantly use Ubuntu Server which is based off Debian but I am starting to switch to using actual Debian itself.  I am also using Fedora 41 on my laptop as my daily driver so starting to mess around with running this as a server OS.  Below are links to docker installation instructions for all three.

- [Ubuntu](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)

- [Debian](https://docs.docker.com/engine/install/debian/#install-using-the-repository)

- [Fedora](https://docs.docker.com/engine/install/fedora/#install-using-the-repository)

Once installed, running `docker --version` should then return something similar to the following:  

![](<images/docker version.png>)  

## Network Configuration

Before spinning up some docker containers, I need to ensure I have setup my docker networks.

I use 3 docker networks (2 on titan and 1 on cuthbert)

### TiTAN

TiTAN runs a Reverse Proxy in the form of [Traefik](https://docs.xmsystems.co.uk/traefik/). To ensure that all applications (that need to be proxied) pass through Traefik, I would need to associate them with this network.

The creation of the network is a simple command and is one that specifies a subnet.  

The reason for specifying a subnet is so I can provide a static IP Address to each of my services.  This also assists with connectivity between containers and keeps everything organised.

```bash
docker network create --subnet 172.19.0.0/24 proxy
docker network create --subnet 172.18.0.0/24 monitoring
```  

This creates a /24 subnet named ***proxy*** and a /24 subnet named ***monitoring***

### Cuthbert

The "cuthbert-network" docker network has been created for all of the containers running on cuthbert  
Just like TiTAN containers, they have all been provided with static IP Addresses.
As this is a totally seperate system, I'm unable to associate docker containers here with the network that traefik is running on.  Therefore, any container that needs to run through traefik, a [dynamic file](https://docs.xmsystems.co.uk/dynamic/) needs to be created.   

```bash
docker network create --subnet 172.22.0.0/24 cuthbert-network
```  

This creates a /24 subnet named ***cuthbert-network***

## Docker Commands

I deploy all of my docker containers using docker compose.  

This is where I will write out everything the container needs in a YAML file.

To pull and deploy the image according to the details in the YAML, from the same directory as where the compose file resides, I would run the following command:

```bash
docker compose pull; docker compose up -d
```

The -d at the end will run the container ***detached*** meaning the terminal window can be closed and the container will continue running.

Should I need to make changes to my YAML configuration (change some environment settings or change the docker image being used), I can re-deploy the container with a similar command:

```bash
docker compose pull; docker compose up -d --force-recreate
```

This will ensure the container is re-created.

With the exception of Traefik & Monitoring on TiTAN, all of my compose files reside in the following locations

### TiTAN

```sh
/ssd/docker-compose/
├── arrs
│   └── docker-compose.yml
├── ha
│   └── docker-compose.yml
├── homepage
│   └── docker-compose.yml
├── navidrome
│   └── docker-compose.yml
├── plex-overseerr
│   └── docker-compose.yml
├── podgrab
│   └── docker-compose.yml
├── sabnzbd
│   └── docker-compose.yml
└── tautulli
    └── docker-compose.yml

8 directories, 8 files
```

### Cuthbert

```sh
~/docker-compose/
├── cloudflare
│   └── docker-compose.yml
├── kuma
│   └── docker-compose.yml
├── mkdocs
│   └── docker-compose.yml
├── monitoring
│   └── docker-compose.yml
├── motioneye
│   └── docker-compose.yml
├── portainer
│   └── docker-compose.yml
├── vaultwarden
│   └── docker-compose.yml

7 directories, 7 files
```
