#!/bin/bash
read -p "Are you sure to delete the database (y/n)?" choice
case "$choice" in
  y|Y ) echo "database will be deleted";;
  n|N ) exit 0;;
  * ) exit 0;;
esac

docker-compose exec database mongo aesthetics --eval "db.users.remove({}); db.images.remove({}); db.emails.remove({})"


