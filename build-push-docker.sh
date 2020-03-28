docker build -t vokilamd/tcommerce-backend:latest .
docker push vokilamd/tcommerce-backend:latest

#docker run --name tcommerce-backend --rm --env-file /var/tcommerce-backend.env -p 3000:3500 vokilamd/tcommerce-backend
