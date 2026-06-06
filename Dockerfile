FROM nginx:alpine

# Copiar os arquivos estáticos da aplicação para a pasta padrão do Nginx
COPY ./app /usr/share/nginx/html

# Expor a porta 80
EXPOSE 80

# Iniciar o servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
