
![](images/phpmyadmin.png)

phpMyAdmin is software that enables you to administer your MySQL databases within a browser.

You can use phpMyAdmin to perform most administration tasks, including creating a database, running queries, and adding user accounts.  All from the comfort of a GUI

I have set this up to give me easy administrative access to the databases used for the sites hosted using [ghost](https://docs.xmsystems.co.uk/ghost/)

### docker-compose.yml

``` yaml
networks:
  default:
    name: proxy
    external: "true"

services:
  phpmyadmin:
    image: phpmyadmin:latest
    container_name: phpmyadmin
    environment:
      - PMA_HOSTS=ghost-db-xms,ghost-db-stan-sal,host-db-lenny-sal
    restart: always
    networks:
      default:
        ipv4_address: "172.19.0.105"
    ports:
      - 84:80
    volumes:
      - /ssd/docker/appdata/phpmyadmin/sessions
      - /ssd/docker/appdata/phpmyadmin/config.user.inc.php:/etc/phpmyadmin/config.user.inc.php
      - /ssd/docker/appdata/phpmyadmin/custom/phpmyadmin/theme/:/www/themes/theme/
```

### Dynamic File

This file is located [here](https://docs.xmsystems.co.uk/dynamic/#phpmyadmin-titan)

