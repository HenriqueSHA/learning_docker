# =====================================================================
# ESTÁGIO 1: Compilação (Build) do Frontend React/Vite
# =====================================================================
# Usamos a imagem oficial do Node.js v18 baseada no Alpine Linux.
# Alpine é uma distribuição extremamente leve e segura (cerca de 5MB).
FROM node:18-alpine AS build

# Define a pasta de trabalho padrão dentro do container de compilação.
# Todos os comandos seguintes rodarão a partir desta pasta.
WORKDIR /app

# Copia os arquivos de configuração de dependências (package.json e lockfile).
# Copiar esses arquivos antes do código completo otimiza o cache do Docker,
# fazendo com que novos builds rodem instantaneamente se as dependências não mudaram.
COPY package*.json ./

# Instala todas as dependências especificadas no package.json de forma limpa e rápida.
RUN npm ci

# Copia todo o restante do código-fonte local para a pasta /app do container,
# respeitando as regras de exclusão especificadas no arquivo `.dockerignore`.
COPY . .

# Compila o projeto React gerando os arquivos estáticos de produção na pasta /app/dist.
RUN npm run build


# =====================================================================
# ESTÁGIO 2: Distribuição com Servidor Web Nginx
# =====================================================================
# Usamos a imagem oficial e extremamente leve do Nginx rodando em Alpine Linux.
FROM nginx:alpine

# Copia os arquivos estáticos compilados no estágio de build anterior (/app/dist)
# diretamente para a pasta padrão do Nginx, onde ele serve páginas web.
COPY --from=build /app/dist /usr/share/nginx/html

# Indica (de forma documental) que este container escuta requisições na porta 80.
EXPOSE 80

# Comando padrão que inicia o servidor Nginx em primeiro plano (daemon off)
# mantendo o container ativo e escutando conexões.
CMD ["nginx", "-g", "daemon off;"]
