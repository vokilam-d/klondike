docker build -t vokilamd/tcommerce-backend:latest .
docker push vokilamd/tcommerce-backend:latest
#docker pull vokilamd/tcommerce-backend:latest

#docker run --name tcommerce-backend --rm --env-file ~/docker/default/tcommerce-backend.env -p 3000:3500 -v ~/docker/mnt/static/upload:/app/upload vokilamd/tcommerce-backend
#docker run --name tcommerce-backend -d --rm --env-file /etc/default/tcommerce-backend.env -p 3000:3500 -v /mnt/static/upload:/app/upload vokilamd/tcommerce-backend
