#!/bin/bash
thisdir=${0%/*}
cd "$thisdir"
mkdir -p "$thisdir"/export
timestamp="$(date "+%Y_%m_%d-%H_%M_%S")"
docker-compose exec -T database mongoexport --collection=users --db=aesthetics --pretty --quiet --jsonArray  > "$thisdir"/export/"$timestamp"_users.json
docker-compose exec -T database mongoexport --collection=images --db=aesthetics --pretty --quiet --jsonArray  > "$thisdir"/export/"$timestamp"_images.json
docker-compose exec -T database mongoexport --collection=emails --db=aesthetics --pretty --quiet --jsonArray  > "$thisdir"/export/"$timestamp"_emails.json

echo "export done: $timestamp"
