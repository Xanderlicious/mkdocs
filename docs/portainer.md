
![](images/Portainer.png)

To quote Portainer themselves:

!!! quote
    *Portainer is the most versatile container management software that simplifies your secure adoption of containers with remarkable speed.*

I use portainer (with portainer agent) to give me a quick and easy cursory overview of all of my containers and their status.

I install portainer on both servers where there are many containers running and also on my primary pi-hole where this very site runs.

![](<images/Portainer Envs.png>)

My main Portainer instance is installed on my primary server, [TiTAN](https://docs.xanderman.co.uk/titan), as part of a stack with [Traefik](https://docs.xanderman.co.uk/traefik/)


##Standalone Installation

I install portainer on other servers using the below docker run command:

```bash
docker run -d -p 8000:8000 -p 9443:9443 --name=portainer --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v portainer_data:/data portainer/portainer-ee:2.20.1
```

To allow my main instance to be able to link to these other environments, I would install *"Portainer Agent"* using the below docker run command:

```bash
docker run -d  -p 9001:9001 --name portainer_agent --restart=always -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker/volumes:/var/lib/docker/volumes portainer/agent:2.20.1
```

It is advisable to ensure both portainer and portainer agent are running the same version (the version is specified at the end of the command)


##Upgrading Portainer

To upgrade portainer and portainer agent, before running the 2 commands above (with the newly specified version at the end) you would first need to stop the container and remove the old version with the commands below:

###Portainer

``` bash
docker stop portainer
docker rm portainer
```

###Portainer Agent

``` bash
docker stop portainer_agent
docker rm portainer_agent
```

###Dynamic Files

Even though I can reach the portainer environments for Cuthbert and NCC-1702 through TiTAN & portainer agent, I have still setup domain names for each of them individually.

This requires the setup of dynamic files which are detailed [here](https://docs.xanderman.co.uk/dynamic/#portainer-cuthbert) and [here](https://docs.xanderman.co.uk/dynamic/#portainer-ncc-1702)
