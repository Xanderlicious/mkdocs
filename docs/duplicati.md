
![](images/duplicati.png)

!!!info
    I have retired duplicati for the time being

Duplicati is an application that runs on each server and essentially runs backup tasks every 3 days to back up my "Appdata" and "Docker Volumes" to Google Drive

![](<images/duplicati web ui.png>)

## docker-compose.yml

### TiTAN  
(with traefik labels)

``` yaml
networks:
  default:
    name: proxy
    external: true

services:

  duplicati:
    image: lscr.io/linuxserver/duplicati:latest
    container_name: duplicati
    networks:
      default:
        ipv4_address: "172.19.0.4"
    ports:
        - 8200:8200
    environment:
        - PUID=0
        - PGID=0
        - TZ=Europe/London
    volumes:
        - /ssd/appdata/duplicati/config:/config
        - /ssd/appdata/duplicati/backups:/backups
        - /:/source
    ports:
        - 8200:8200
    restart: unless-stopped
    labels:
        - traefik.enable=true
        - traefik.http.routers.titan-dupe.entrypoints=websecure-int
        - traefik.http.routers.titan-dupe.rule=Host(`subdomain.domain.co.uk`)
        - traefik.http.routers.titan-dupe.tls=true
        - traefik.http.routers.titan-dupe.tls.certresolver=production
        - traefik.http.routers.titan-dupe.tls.domains[0].main=domain.co.uk
        - traefik.http.routers.titan-dupe.tls.domains[0].sans=*.domain.co.uk
```

### Cuthbert  
(without traefik labels as on seperate host to traefik)

``` yaml
networks:
  default:
    name: cuthbert-network
    external: true


services:
  duplicati:
    image: lscr.io/linuxserver/duplicati:latest
    container_name: duplicati
    networks:
      default:
        ipv4_address: "172.22.0.4"
    environment:
      - PUID=0
      - PGID=0
      - TZ=Europe/London
    volumes:
      - /home/xander/appdata/duplicati/config:/config
      - /home/xander/appdata/duplicati/backups:/backups
      - /:/source
    ports:
      - 8200:8200
    restart: unless-stopped
```

### Traefik Dynamic File
 
### Duplicati (Cuthbert)

``` yaml
http:
  routers:
    cuthbert-dupe:
      entryPoints:
        - "websecure-int"
      rule: "Host(`subdomain.domain.co.uk`)"
      tls:
        certResolver: production
      service: cuthbert-dupe

  services:
    cuthbert-dupe:
      loadBalancer:
        servers:
          - url: "http://10.36.100.199:8200"
        passHostHeader: true
```

## Add Backup

To create a backup task, you would select "Add Backup" from the menu on the left and then follow the instructions on each step:

![](<images/add backup 0.png>)  
  
This will take you through a wizard that has 5 Steps

### Step 1

![](<images/add backup 1.png>)  

Give your back up a name.  
Select an encryption method  
Set a password

### Step 2

![](<images/add backup 2.png>)  

Select the Storage Type (here I'm using Google Drive)
Provide the file path on the server where the backup is being stored (it will create it for you if it doesn't already exist)
Enter in the AuthID (You can select the "AuthID link to set this up with Google)
I then use the same Auth ID for all three servers  
You can also use the button available to "Test Connection"

### Step 3

![](<images/add backup 3.png>)  

Select the Folder(s) & File(s) you are wanting to backup

### Step 4

![](<images/add backup 4.png>)  

Specify the schedule for when you want the backup to take place

### Step 5

![](<images/add backup 5.png>)  

Specify the remote volume size and the backup retention option.
I think the "Smart Backup Retention" is a good option