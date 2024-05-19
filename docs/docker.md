![](images/docker.png)

I like to host all of my services using docker.

##Installation

Installation of docker within Ubuntu Server is done so by following the instructions on the official docker documentation site  

- [Docker Docs](https://docs.docker.com/engine/install/)  

As I use Ubuntu Server across my server estate, which is a debian based distro, I install using the apt repository

- [Docker apt installation instructions](https://docs.docker.com/engine/install/ubuntu/#install-using-the-repository)  

Once installed, running `docker --version` should then return something similar to the following:  

![](<images/docker version.png>)  

##Network Configuration

Before spinning up some docker containers, I need to ensure I have setup my docker networks.

I use 3 main networks (1 on each server)

###TiTAN

TiTAN runs a Traefik Reverse Proxy so to ensure that all applications (that need to be proxied) pass through Traefik, I would need to associate them with this network.    
The creation of the network is a simple command and is one that specifies a subnet.  
The reason for doing this is so I can provide a static IP Address to each of my services.  

!!! info 
    I found that if I didn't do this, when it came to restarting services (plex especially) Tautulli couldn't locate the plex server due to the apps IP Address changing and therefore was unable to report any stats.  This ensures it always gets the same IP Address regardless

```bash
docker network create --subnet 172.19.0.0/24 proxy
docker network create --subnet 172.18.0.0/24 monitoring
```  

This creates a /24 subnet named ***proxy*** and a /24 subnet named ***monitoring***

###Cuthbert

The "cuthbert-network" docker network has been created for all of the containers running on cuthbert  
Just like TiTAN containers, they have all been provided with static IP Addresses  

```bash
docker network create --subnet 172.22.0.0/24 cuthbert-network
```  

This creates a /24 subnet named ***cuthbert-network***

###NCC-1702

The "pi-network" docker network has been created for all of the containers running on NCC-1702
Like TiTAN & Cuthbert, all containers are provided with a static IP Address.

```bash
docker network create --subnet 172.16.0.0/24 pi-network
```

This creates a /24 network named ***pi-network***

##Docker Commands

With the exception of Portainer, I deploy all of my docker containers using compose.  

This is where I will write out everything the container needs in a YAML file.

To pull and deploy the image according to the details in the YAML, from the same directory as where the compose file resides, I would run the following command:

```bash
docker compose pull && docker compose up -d
```

The -d at the end will run the container ***detached*** meaning the terminal window can be closed and the container will continue running.

Should I need to make changes to my YAML configuration (change some environment settings or change the docker image being used), I can re-deploy the container with a similar command:

```bash
docker compose pull && docker compose up -d --force-recreate
```

This will ensure the container is re-created.

With the exception of Traefik & Monitoring, all of my compose file reside in the following location

###TiTAN

```
/ssd/docker-compose/
├── arrs
│   └── docker-compose.yml
├── duplicati
│   └── docker-compose.yml
├── glances
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

11 directories, 11 files
```

###Cuthbert

```
~/docker-compose/
├── cloudflare
│   └── docker-compose.yml
├── duplicati
│   └── docker-compose.yml
├── glances
│   └── docker-compose.yml
├── kuma
│   └── docker-compose.yml
├── mongodb
│   └── docker-compose.yml
├── monitoring
│   └── docker-compose.yml
├── motioneye
│   └── docker-compose.yml
├── unifi
│   └── docker-compose.yml
├── vaultwarden
│   └── docker-compose.yml
└── xbvr
    └── docker-compose.yml

10 directories, 10 files
```

###NCC-1702

```
~/docker-compose/
├── duplicati
│   └── docker-compose.yml
├── glances
│   └── docker-compose.yml
└── mkdocs
    └── docker-compose.yml

3 directories, 3 files
```