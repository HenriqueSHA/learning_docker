import React, { useState, useEffect, useRef } from 'react';

// Dicionário completo de explicações (Dockerfile, docker-compose.yml, .dockerignore)
const syntaxDictionary = {
  // Dockerfile
  'FROM': {
    title: 'FROM',
    context: 'Dockerfile',
    desc: 'Imagem base. Define qual imagem servirá de ponto de partida para a sua. Toda receita Dockerfile deve começar obrigatoriamente com FROM.',
    example: 'FROM node:18-alpine'
  },
  'WORKDIR': {
    title: 'WORKDIR',
    context: 'Dockerfile',
    desc: 'Diretório de trabalho. Cria e define a pasta interna do container onde todos os próximos comandos (como RUN, COPY e CMD) serão executados por padrão.',
    example: 'WORKDIR /usr/src/app'
  },
  'COPY': {
    title: 'COPY',
    context: 'Dockerfile',
    desc: 'Copia arquivos locais para dentro da imagem. Geralmente usado para transferir o código fonte ou arquivos de dependência (ex: package.json).',
    example: 'COPY package*.json ./'
  },
  'RUN': {
    title: 'RUN',
    context: 'Dockerfile',
    desc: 'Executa comandos durante o build da imagem. Ideal para instalar dependências de sistema, compilar arquivos ou rodar scripts de configuração prévia.',
    example: 'RUN npm ci'
  },
  'ENV': {
    title: 'ENV',
    context: 'Dockerfile',
    desc: 'Variáveis de ambiente. Cria variáveis internas permanentes dentro do container. Útil para guardar configurações acessíveis pela aplicação.',
    example: 'ENV PORT=3000'
  },
  'USER': {
    title: 'USER',
    context: 'Dockerfile',
    desc: 'Segurança. Configura qual usuário do sistema operacional irá executar os processos do container. Evita rodar como root por padrão.',
    example: 'USER node'
  },
  'EXPOSE': {
    title: 'EXPOSE',
    context: 'Dockerfile',
    desc: 'Documentação de porta. Indica qual porta de rede o container escuta internamente. Serve apenas como aviso documental para outros devs.',
    example: 'EXPOSE 3000'
  },
  'VOLUME': {
    title: 'VOLUME',
    context: 'Dockerfile',
    desc: 'Volume interno. Declara que determinada pasta interna do container persistirá seus dados de forma externa para evitar perda de dados.',
    example: 'VOLUME /data'
  },
  'CMD': {
    title: 'CMD',
    context: 'Dockerfile',
    desc: 'Comando de inicialização padrão. Define o comando principal que rodará assim que o container iniciar. Só deve haver uma instrução CMD por Dockerfile.',
    example: 'CMD ["node", "app.js"]'
  },
  'ENTRYPOINT': {
    title: 'ENTRYPOINT',
    context: 'Dockerfile',
    desc: 'Comando fixo de execução. Define o executável padrão do container. Ao contrário do CMD, parâmetros passados ao container no terminal são anexados a ele.',
    example: 'ENTRYPOINT ["nginx"]'
  },

  // Compose
  'version': {
    title: 'version',
    context: 'docker-compose.yml',
    desc: 'Especifica a versão do esquema do arquivo Docker Compose. A versão 3.8 é amplamente compatível e recomendada.',
    example: "version: '3.8'"
  },
  'services': {
    title: 'services',
    context: 'docker-compose.yml',
    desc: 'Define o bloco principal que agrupa todos os containers e serviços que serão orquestrados em conjunto.',
    example: 'services:'
  },
  'web-app': {
    title: 'web-app',
    context: 'docker-compose.yml',
    desc: 'Nome customizado do serviço. Serve de alias DNS dentro da rede interna criada pelo compose para que um container localize o outro.',
    example: 'web-app:'
  },
  'build': {
    title: 'build',
    context: 'docker-compose.yml',
    desc: 'Instrui o Compose a compilar localmente uma imagem a partir de um Dockerfile no caminho especificado (o ponto representa o diretório atual).',
    example: 'build: .'
  },
  'image': {
    title: 'image',
    context: 'docker-compose.yml',
    desc: 'Define o nome e a tag de versão da imagem associada. Se build estiver declarado, a imagem será criada localmente com este nome.',
    example: 'image: node-app:1.0'
  },
  'ports': {
    title: 'ports',
    context: 'docker-compose.yml',
    desc: 'Mapeamento de portas de rede de entrada entre a máquina física (Host) e a porta interna do container.',
    example: 'ports:\n  - "8080:3000"'
  },
  'environment': {
    title: 'environment',
    context: 'docker-compose.yml',
    desc: 'Injeta variáveis de ambiente no container durante a inicialização. Ótimo para chaves de conexão e configurações dinâmicas.',
    example: 'environment:\n  - DB_HOST=db'
  },
  'volumes': {
    title: 'volumes',
    context: 'docker-compose.yml',
    desc: 'Mapeia pastas físicas do computador para dentro do container (bind mounts) ou declara volumes nomeados gerenciados pelo Docker.',
    example: 'volumes:\n  - .:/usr/src/app'
  },
  'restart': {
    title: 'restart',
    context: 'docker-compose.yml',
    desc: 'Política de reinício automático. A opção unless-stopped sobe o container de novo se ele cair ou o servidor reiniciar, a menos que parado manualmente.',
    example: 'restart: unless-stopped'
  },
  'networks': {
    title: 'networks',
    context: 'docker-compose.yml',
    desc: 'Associa o container a redes virtuais específicas configuradas na orquestração.',
    example: 'networks:\n  - rede-app'
  },

  // dockerignore
  'node_modules/': {
    title: 'node_modules/',
    context: '.dockerignore',
    desc: 'Ignora dependências locais do Node.js. Isso acelera o build e garante que o container baixe suas próprias dependências limpas compatíveis com Alpine.',
    example: 'node_modules/'
  },
  '.git': {
    title: '.git',
    context: '.dockerignore',
    desc: 'Evita enviar os logs e histórico de alterações do Git para dentro da imagem final, protegendo a segurança e reduzindo tamanho.',
    example: '.git'
  },
  '*.log': {
    title: '*.log',
    context: '.dockerignore',
    desc: 'Exclui qualquer arquivo de log de desenvolvimento gerado localmente, evitando empacotar lixo inútil em disco.',
    example: '*.log'
  },
  '.env': {
    title: '.env',
    context: '.dockerignore',
    desc: 'Importante por segurança. Impede que chaves de API, senhas de banco ou dados sensíveis de ambiente local sejam vazados dentro da imagem.',
    example: '.env'
  },
  'Dockerfile': {
    title: 'Dockerfile',
    context: '.dockerignore',
    desc: 'O próprio arquivo de instrução de build não precisa ser copiado para dentro do container em execução.',
    example: 'Dockerfile'
  },
  '.dockerignore': {
    title: '.dockerignore',
    context: '.dockerignore',
    desc: 'O arquivo de controle de exclusões também é removido da cópia interna final por convenção de organização.',
    example: '.dockerignore'
  }
};

// Tabelas de Comandos do Cheatsheet
const commandsList = [
  { cat: 'Build & Tag', cmd: 'docker build -t app:1.0 .', desc: 'Constrói uma imagem a partir de um Dockerfile no diretório atual.', use: 'Ao criar novas versões de uma imagem local.' },
  { cat: 'Build & Tag', cmd: 'docker tag app:1.0 user/app:1.0', desc: 'Cria uma tag/alias para uma imagem local existente.', use: 'Antes de publicar no Docker Hub.' },
  { cat: 'Registro', cmd: 'docker login', desc: 'Autentica no Docker Hub com suas credenciais.', use: 'Para permitir push e pull de repositórios privados.' },
  { cat: 'Registro', cmd: 'docker push user/app:1.0', desc: 'Envia uma imagem local para o registro remoto do Docker Hub.', use: 'Ao subir a imagem para uso em produção.' },
  { cat: 'Registro', cmd: 'docker pull nginx', desc: 'Baixa uma imagem pronta diretamente do Docker Hub para sua máquina.', use: 'Para atualizar imagens base locais.' },
  { cat: 'Execução', cmd: 'docker run -d -p 80:80 nginx', desc: 'Instancia e roda um container em background (detached) mapeando portas.', use: 'Para subir servidores e bancos permanentemente.' },
  { cat: 'Execução', cmd: 'docker run -it ubuntu bash', desc: 'Instancia um container conectado interativamente ao seu terminal.', use: 'Para testes rápidos ou rodar comandos isolados no Linux.' },
  { cat: 'Execução', cmd: 'docker start meu-app', desc: 'Inicia um container parado previamente sem alterar suas configurações.', use: 'Reativar serviços.' },
  { cat: 'Interação', cmd: 'docker exec -it app bash', desc: 'Executa comandos adicionais dentro de um container que já está ativo.', use: 'Para rodar migrações de banco ou depurar.' },
  { cat: 'Interação', cmd: 'docker logs -f app', desc: 'Acompanha a saída de logs do container em tempo real no terminal.', use: 'Monitorar requisições ou capturar erros de runtime.' },
  { cat: 'Estado', cmd: 'docker ps', desc: 'Lista todos os containers ativos em execução na máquina.', use: 'Verificar a saúde de serviços.' },
  { cat: 'Estado', cmd: 'docker ps -a', desc: 'Lista todos os containers já criados, incluindo os parados e terminados.', use: 'Achar containers antigos.' },
  { cat: 'Estado', cmd: 'docker inspect app', desc: 'Retorna um JSON gigante com as propriedades completas e rede do container.', use: 'Depurar portas, IPs ou variáveis.' },
  { cat: 'Estado', cmd: 'docker stats', desc: 'Exibe consumo de CPU, RAM e banda de rede de cada container ativo.', use: 'Verificar problemas de vazamento de memória.' },
  { cat: 'Limpeza', cmd: 'docker stop app', desc: 'Envia um sinal SIGTERM para encerrar o container graciosamente.', use: 'Desligar serviços temporariamente.' },
  { cat: 'Limpeza', cmd: 'docker rm app', desc: 'Remove permanentemente um container parado da máquina.', use: 'Limpar disco após encerrar testes.' },
  { cat: 'Limpeza', cmd: 'docker rmi nginx', desc: 'Remove a imagem estática local salva em disco.', use: 'Liberar armazenamento físico.' },
  { cat: 'Limpeza', cmd: 'docker system prune -a', desc: 'Limpa de uma vez imagens órfãs, containers inativos e redes vazias.', use: 'Manutenção periódica de disco.' },
  { cat: 'Compose', cmd: 'docker compose up -d', desc: 'Sobe todos os serviços declarados no docker-compose.yml de uma vez.', use: 'Iniciar ambientes locais complexos.' },
  { cat: 'Compose', cmd: 'docker compose down', desc: 'Para e remove todos os containers e redes criados pelo compose.', use: 'Encerrar o dia de desenvolvimento local.' }
];

// Dicionário de Flags
const flagsList = [
  { flag: '-d', name: 'Detached', desc: 'Roda o container em background, liberando o prompt do terminal imediatamente.', example: 'docker run -d nginx' },
  { flag: '-p', name: 'Publish Port', desc: 'Mapeia portas do Host para o Container (Formato: host:container).', example: 'docker run -p 8080:80 nginx' },
  { flag: '-it', name: 'Interactive TTY', desc: 'Combina entrada interativa (-i) e emulação de terminal (-t) para rodar prompts.', example: 'docker run -it ubuntu bash' },
  { flag: '--name', name: 'Name', desc: 'Atribui um nome amigável único ao container ao invés de gerar um aleatório.', example: 'docker run --name meu-servidor nginx' },
  { flag: '-v', name: 'Volume', desc: 'Mapeia uma pasta do computador para dentro do container para persistir dados.', example: 'docker run -v /dados:/data alpine' },
  { flag: '-e', name: 'Environment', desc: 'Define variáveis de ambiente internas que o aplicativo lerá no runtime.', example: 'docker run -e DB_PORT=3306 mysql' },
  { flag: '--rm', name: 'Auto Remove', desc: 'Exclui automaticamente o container do disco no momento em que ele for parado.', example: 'docker run --rm alpine ls' },
  { flag: '--restart', name: 'Restart Policy', desc: 'Regras de reinício automático em caso de falhas (ex: unless-stopped, always).', example: 'docker run --restart always redis' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('o-que-e');
  const [selectedInstruction, setSelectedInstruction] = useState(null);
  const [activeDeployStep, setActiveDeployStep] = useState(1);

  // Estados dos Simuladores
  const [namespacePid, setNamespacePid] = useState(false);
  const [namespaceNet, setNamespaceNet] = useState(false);
  const [cpuLimit, setCpuLimit] = useState(1);
  const [ramLimit, setRamLimit] = useState(512);
  const [workloadStatus, setWorkloadStatus] = useState('idle'); // idle, running, oom, success
  const [workloadProgress, setWorkloadProgress] = useState(0);

  // Estados dos Comandos e Filtros
  const [commandSearch, setCommandSearch] = useState('');
  const [commandCategory, setCommandCategory] = useState('Todos');

  // Estados do Terminal Virtual
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'system', text: 'DockerLab Terminal Playground - v1.0.0' },
    { type: 'system', text: 'Digite "help" para ver os comandos simulados disponíveis.' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isUbuntuShell, setIsUbuntuShell] = useState(false);
  const [isUbuntuCurlInstalled, setIsUbuntuCurlInstalled] = useState(false);
  const [isTerminalLoading, setIsTerminalLoading] = useState(false);
  const [terminalLoadingText, setTerminalLoadingText] = useState('');
  const [terminalLoadingProgress, setTerminalLoadingProgress] = useState(0);
  
  // Imagens e containers virtuais do Playground
  const [virtualImages, setVirtualImages] = useState([
    { id: '3c44249a5b3a', name: 'nginx', tag: 'alpine', size: '23.5MB' }
  ]);
  const [virtualContainers, setVirtualContainers] = useState([]);

  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, isTerminalLoading, terminalLoadingProgress, terminalLoadingText]);

  // Função para rodar carga de cgroups
  const startCgroupsSimulation = () => {
    setWorkloadProgress(0);
    // Se RAM for muito baixa (ex: menor de 256MB), simular OOMKilled
    if (ramLimit <= 256) {
      setWorkloadStatus('running');
      let prog = 0;
      const interval = setInterval(() => {
        prog += 20;
        setWorkloadProgress(prog);
        if (prog >= 60) {
          clearInterval(interval);
          setWorkloadStatus('oom');
        }
      }, 300);
    } else {
      setWorkloadStatus('running');
      let prog = 0;
      // Quanto maior a CPU limit configurada, mais rápido o processamento
      const speed = Math.max(100, 400 - (cpuLimit * 80));
      const interval = setInterval(() => {
        prog += 10;
        setWorkloadProgress(prog);
        if (prog >= 100) {
          clearInterval(interval);
          setWorkloadStatus('success');
        }
      }, speed);
    }
  };

  // Interpretador de Comandos do Playground
  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    // Adiciona comando ao histórico
    const promptPrefix = isUbuntuShell ? 'root@ubuntu-container:/# ' : 'docker@learning-host:~$ ';
    setTerminalHistory(prev => [...prev, { type: 'input', text: promptPrefix + cmd }]);
    setTerminalInput('');

    if (isUbuntuShell) {
      handleUbuntuCommand(cmd);
      return;
    }

    handleHostCommand(cmd);
  };

  // Comandos rodados no terminal hospedeiro do Docker
  const handleHostCommand = (cmd) => {
    const parts = cmd.split(/\s+/);
    const base = parts[0];

    if (base === 'clear') {
      setTerminalHistory([]);
      return;
    }

    if (base === 'help') {
      setTerminalHistory(prev => [
        ...prev,
        { type: 'output', text: 'Comandos disponíveis no simulador:' },
        { type: 'output', text: '  docker login                    - Simula autenticação no Docker Hub' },
        { type: 'output', text: '  docker pull <imagem>            - Simula download de uma imagem (ex: nginx, alpine)' },
        { type: 'output', text: '  docker build -t <tag> .         - Simula compilação do Dockerfile local' },
        { type: 'output', text: '  docker images                   - Lista imagens baixadas ou construídas' },
        { type: 'output', text: '  docker run -d -p <p1:p2> <img > - Roda imagem em segundo plano (ex: docker run -d -p 8080:80 nginx)' },
        { type: 'output', text: '  docker run -it ubuntu bash      - Entra na sub-shell interativa do Ubuntu' },
        { type: 'output', text: '  docker ps                       - Lista containers ativos' },
        { type: 'output', text: '  docker ps -a                    - Lista todos os containers (ativos e parados)' },
        { type: 'output', text: '  docker stop <nome_do_container> - Para um container em execução' },
        { type: 'output', text: '  docker rm <nome_do_container>   - Remove um container parado' },
        { type: 'output', text: '  clear                           - Limpa a tela' }
      ]);
      return;
    }

    if (base === 'docker') {
      const sub = parts[1];
      if (!sub) {
        setTerminalHistory(prev => [...prev, { type: 'error', text: 'Comando inválido. Digite "docker --help" ou "help".' }]);
        return;
      }

      if (sub === 'login') {
        runProgressSimulation('Autenticando no Docker Hub...', 4, () => {
          setTerminalHistory(prev => [
            ...prev,
            { type: 'output', text: 'WARNING! Your password will be stored unencrypted in /root/.docker/config.json.' },
            { type: 'output', text: 'Login Succeeded' }
          ]);
        });
        return;
      }

      if (sub === 'pull') {
        const imgName = parts[2] || 'nginx';
        runProgressSimulation(`Buscando e puxando biblioteca/${imgName} do Docker Hub...`, 6, () => {
          const newImg = {
            id: Math.random().toString(16).substring(2, 14),
            name: imgName,
            tag: 'latest',
            size: '48.2MB'
          };
          setVirtualImages(prev => {
            if (prev.some(i => i.name === imgName)) return prev;
            return [...prev, newImg];
          });
          setTerminalHistory(prev => [
            ...prev,
            { type: 'output', text: `Using default tag: latest` },
            { type: 'output', text: `latest: Pulling from library/${imgName}` },
            { type: 'output', text: `Digest: sha256:d892d110199e4b6c8aa5582fbc788cc9a5b3a...` },
            { type: 'output', text: `Status: Downloaded newer image for ${imgName}:latest` }
          ]);
        });
        return;
      }

      if (sub === 'build') {
        // docker build -t test-app .
        const flagIndex = parts.indexOf('-t');
        const tag = flagIndex !== -1 && parts[flagIndex + 1] ? parts[flagIndex + 1] : 'my-app:latest';
        runProgressSimulation('Compilando Dockerfile (Multi-stage build)...', 8, () => {
          const newImg = {
            id: '4fd910c2830f',
            name: tag.split(':')[0],
            tag: tag.split(':')[1] || 'latest',
            size: '42.1MB'
          };
          setVirtualImages(prev => [...prev, newImg]);
          setTerminalHistory(prev => [
            ...prev,
            { type: 'output', text: 'Step 1/5 : FROM node:18-alpine AS build' },
            { type: 'output', text: ' ---> 8c76ad87ab91' },
            { type: 'output', text: 'Step 2/5 : WORKDIR /app' },
            { type: 'output', text: ' ---> Running in 7289547d2a5d' },
            { type: 'output', text: 'Step 3/5 : COPY package*.json ./' },
            { type: 'output', text: 'Step 4/5 : RUN npm ci && COPY . . && npm run build' },
            { type: 'output', text: ' ---> Running in e38d21b38f83' },
            { type: 'output', text: 'Step 5/5 : FROM nginx:alpine' },
            { type: 'output', text: ' ---> COPY --from=build /app/dist /usr/share/nginx/html' },
            { type: 'output', text: `Successfully built 4fd910c2830f` },
            { type: 'output', text: `Successfully tagged ${tag}` }
          ]);
        });
        return;
      }

      if (sub === 'images') {
        setTerminalHistory(prev => {
          const lines = [
            { type: 'output', text: 'REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE' }
          ];
          virtualImages.forEach(img => {
            lines.push({
              type: 'output',
              text: `${img.name.padEnd(20)}${img.tag.padEnd(20)}${img.id.padEnd(20)}Just now            ${img.size}`
            });
          });
          return [...prev, ...lines];
        });
        return;
      }

      if (sub === 'run') {
        const isDetached = parts.includes('-d');
        const isInteractive = parts.includes('-it');
        
        // docker run -d -p 8080:80 nginx
        // docker run -it ubuntu bash
        const imgName = parts[parts.length - 2] === 'ubuntu' || parts[parts.length - 1] === 'ubuntu' ? 'ubuntu' : parts[parts.length - 1];

        // Se for ubuntu interativo
        if (isInteractive && imgName === 'ubuntu') {
          runProgressSimulation('Baixando imagem base do Ubuntu...', 5, () => {
            setIsUbuntuShell(true);
            setIsUbuntuCurlInstalled(false);
            setTerminalHistory(prev => [
              ...prev,
              { type: 'output', text: 'root@ubuntu-container:/# ' },
              { type: 'system', text: 'Você entrou no container do Ubuntu. Sinta-se em uma máquina virtual leve.' },
              { type: 'system', text: 'Comandos disponíveis: ls, pwd, whoami, apt update, apt install curl, curl <url>, exit' }
            ]);
          });
          return;
        }

        if (isDetached) {
          const portFlagIndex = parts.indexOf('-p');
          const portsMapping = portFlagIndex !== -1 && parts[portFlagIndex + 1] ? parts[portFlagIndex + 1] : '80:80';
          const nameFlagIndex = parts.indexOf('--name');
          const customName = nameFlagIndex !== -1 && parts[nameFlagIndex + 1] ? parts[nameFlagIndex + 1] : `container-${Math.floor(Math.random() * 1000)}`;

          // Verifica se a imagem existe localmente
          const hasImage = virtualImages.some(i => i.name === imgName);
          if (!hasImage) {
            setTerminalHistory(prev => [
              ...prev,
              { type: 'output', text: `Unable to find image '${imgName}:latest' locally` },
              { type: 'output', text: `Pulling from library/${imgName}...` }
            ]);
          }

          runProgressSimulation(`Instanciando container '${customName}'...`, 4, () => {
            const containerId = Math.random().toString(16).substring(2, 14);
            const newContainer = {
              id: containerId,
              name: customName,
              image: imgName,
              ports: portsMapping,
              status: 'Up Just now'
            };
            setVirtualContainers(prev => [...prev, newContainer]);
            setTerminalHistory(prev => [
              ...prev,
              { type: 'output', text: containerId }
            ]);
          });
          return;
        }

        setTerminalHistory(prev => [...prev, { type: 'error', text: 'Suporte limitado neste simulador. Tente com "-d" (ex: docker run -d -p 8080:80 nginx) ou "-it ubuntu bash".' }]);
        return;
      }

      if (sub === 'ps') {
        const showAll = parts.includes('-a');
        setTerminalHistory(prev => {
          const lines = [
            { type: 'output', text: 'CONTAINER ID        IMAGE               COMMAND             STATUS              PORTS               NAMES' }
          ];
          const list = showAll ? virtualContainers : virtualContainers.filter(c => c.status.startsWith('Up'));
          list.forEach(c => {
            lines.push({
              type: 'output',
              text: `${c.id.padEnd(20)}${c.image.padEnd(20)}"/entrypoint.sh"     ${c.status.padEnd(20)}${c.ports.padEnd(20)}${c.name}`
            });
          });
          return [...prev, ...lines];
        });
        return;
      }

      if (sub === 'stop') {
        const name = parts[2];
        if (!name) {
          setTerminalHistory(prev => [...prev, { type: 'error', text: 'Erro: especifique o nome ou ID do container.' }]);
          return;
        }
        setVirtualContainers(prev =>
          prev.map(c => (c.name === name || c.id === name ? { ...c, status: 'Exited (0) Just now' } : c))
        );
        setTerminalHistory(prev => [...prev, { type: 'output', text: name }]);
        return;
      }

      if (sub === 'rm') {
        const name = parts[2];
        if (!name) {
          setTerminalHistory(prev => [...prev, { type: 'error', text: 'Erro: especifique o nome ou ID do container.' }]);
          return;
        }
        setVirtualContainers(prev => {
          const container = prev.find(c => c.name === name || c.id === name);
          if (container && container.status.startsWith('Up')) {
            setTerminalHistory(t => [...t, { type: 'error', text: `Error response from daemon: You cannot remove a running container ${name}. Stop the container first.` }]);
            return prev;
          }
          return prev.filter(c => c.name !== name && c.id !== name);
        });
        return;
      }

      setTerminalHistory(prev => [...prev, { type: 'error', text: `Subcomando docker "${sub}" não implementado no playground.` }]);
      return;
    }

    setTerminalHistory(prev => [...prev, { type: 'error', text: `Comando desconhecido: "${base}". Digite "help" para ver a lista de comandos simulados.` }]);
  };

  // Comandos rodados dentro da sub-shell interativa do Ubuntu
  const handleUbuntuCommand = (cmd) => {
    const parts = cmd.split(/\s+/);
    const base = parts[0];

    if (base === 'exit') {
      setIsUbuntuShell(false);
      setTerminalHistory(prev => [...prev, { type: 'system', text: 'Saiu do container do Ubuntu. Retornou ao host local.' }]);
      return;
    }

    if (base === 'ls') {
      setTerminalHistory(prev => [...prev, { type: 'output', text: 'bin   dev   etc   home  lib   media mnt   opt   proc  root  run   sbin  srv   sys   tmp   usr   var' }]);
      return;
    }

    if (base === 'pwd') {
      setTerminalHistory(prev => [...prev, { type: 'output', text: '/' }]);
      return;
    }

    if (base === 'whoami') {
      setTerminalHistory(prev => [...prev, { type: 'output', text: 'root' }]);
      return;
    }

    if (base === 'apt') {
      const sub = parts[1];
      if (sub === 'update') {
        runProgressSimulation('Lendo listas de pacotes... Concluído', 5, () => {
          setTerminalHistory(prev => [
            ...prev,
            { type: 'output', text: 'Get:1 http://archive.ubuntu.com/ubuntu focal InRelease [265 kB]' },
            { type: 'output', text: 'Get:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease [114 kB]' },
            { type: 'output', text: 'Fetched 379 kB in 2s (180 kB/s)' },
            { type: 'output', text: 'Reading package lists... Done' },
            { type: 'output', text: 'Building dependency tree... Done' }
          ]);
        });
        return;
      }

      if (sub === 'install') {
        const pkg = parts[2];
        if (pkg === 'curl') {
          runProgressSimulation('Lendo dependências e descompactando curl...', 6, () => {
            setIsUbuntuCurlInstalled(true);
            setTerminalHistory(prev => [
              ...prev,
              { type: 'output', text: 'The following NEW packages will be installed:' },
              { type: 'output', text: '  curl libcurl4' },
              { type: 'output', text: '0 upgraded, 2 newly installed, 0 to remove.' },
              { type: 'output', text: 'Unpacking curl (7.68.0-1ubuntu2)...' },
              { type: 'output', text: 'Setting up curl (7.68.0-1ubuntu2)...' },
              { type: 'output', text: 'Processing triggers for libc-bin... Done' }
            ]);
          });
          return;
        }
        setTerminalHistory(prev => [...prev, { type: 'error', text: 'Pacote indisponível no repositório simulado do Ubuntu. Tente "apt install curl".' }]);
        return;
      }
    }

    if (base === 'curl') {
      if (!isUbuntuCurlInstalled) {
        setTerminalHistory(prev => [...prev, { type: 'error', text: 'bash: curl: command not found' }]);
        return;
      }
      const target = parts[1] || 'google.com';
      setTerminalHistory(prev => [
        ...prev,
        { type: 'output', text: `*   Trying ${target}...` },
        { type: 'output', text: `* Connected to ${target} (142.250.191.110) port 80 (#0)` },
        { type: 'output', text: `> GET / HTTP/1.1\n> Host: ${target}\n> User-Agent: curl/7.68.0` },
        { type: 'output', text: `< HTTP/1.1 301 Moved Permanently\n< Location: http://www.${target}/\n< Content-Type: text/html; charset=UTF-8` },
        { type: 'output', text: `<HTML><HEAD><meta http-equiv="content-type" content="text/html;charset=utf-8">\n<TITLE>301 Moved</TITLE></HEAD>\n<BODY>\n<H1>301 Moved</H1>\nThe document has moved\n<A HREF="http://www.${target}/">here</A>.\n</BODY></HTML>` }
      ]);
      return;
    }

    setTerminalHistory(prev => [...prev, { type: 'error', text: `bash: ${base}: comando não implementado na sub-shell simulada.` }]);
  };

  // Simulação genérica de progresso/carregamento no terminal
  const runProgressSimulation = (text, seconds, callback) => {
    setIsTerminalLoading(true);
    setTerminalLoadingText(text);
    setTerminalLoadingProgress(0);
    
    let prog = 0;
    const step = 100 / (seconds * 2);
    const interval = setInterval(() => {
      prog += step;
      setTerminalLoadingProgress(Math.min(100, Math.round(prog)));
      if (prog >= 100) {
        clearInterval(interval);
        setIsTerminalLoading(false);
        callback();
      }
    }, 500);
  };

  return (
    <div className="dockerlab-container">
      
      {/* Sidebar de Navegação */}
      <aside className="sidebar">
        <div className="logo-section">
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 11V13M4 13V15M4 13H20M20 13V11M20 13V15M8 7H10V9H8V7ZM14 7H16V9H14V7ZM8 3H10V5H8V3ZM14 3H16V5H14V3ZM5 18C7.5 18 10 19 12 19C14 19 16.5 18 19 18C20 18 21 17 21 15.5V14H3V15.5C3 17 4 18 5 18Z" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h2>Docker<span>Lab</span></h2>
        </div>

        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'o-que-e' ? 'active' : ''}`}
            onClick={() => setActiveTab('o-que-e')}
            id="tab-o-que-e"
          >
            <span>📖</span> O que é Docker?
          </button>
          <button 
            className={`nav-item ${activeTab === 'sob-o-capo' ? 'active' : ''}`}
            onClick={() => setActiveTab('sob-o-capo')}
            id="tab-sob-o-capo"
          >
            <span>🏗️</span> Sob o Capô
          </button>
          <button 
            className={`nav-item ${activeTab === 'ciclo-de-vida' ? 'active' : ''}`}
            onClick={() => setActiveTab('ciclo-de-vida')}
            id="tab-ciclo-de-vida"
          >
            <span>🔄</span> Ciclo de Vida
          </button>
          <button 
            className={`nav-item ${activeTab === 'como-procurar' ? 'active' : ''}`}
            onClick={() => setActiveTab('como-procurar')}
            id="tab-como-procurar"
          >
            <span>🌎</span> Procurar & Rodar
          </button>
          <button 
            className={`nav-item ${activeTab === 'ciclo-completo' ? 'active' : ''}`}
            onClick={() => setActiveTab('ciclo-completo')}
            id="tab-ciclo-completo"
          >
            <span>🚀</span> Ciclo Completo
          </button>
          <button 
            className={`nav-item ${activeTab === 'escrevendo' ? 'active' : ''}`}
            onClick={() => setActiveTab('escrevendo')}
            id="tab-escrevendo"
          >
            <span>✍️</span> Escrevendo Docker
          </button>
          <button 
            className={`nav-item ${activeTab === 'comandos' ? 'active' : ''}`}
            onClick={() => setActiveTab('comandos')}
            id="tab-comandos"
          >
            <span>🛠️</span> Comandos
          </button>
          <button 
            className={`nav-item ${activeTab === 'flags' ? 'active' : ''}`}
            onClick={() => setActiveTab('flags')}
            id="tab-flags"
          >
            <span>🚩</span> Flags
          </button>
          <button 
            className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`}
            onClick={() => setActiveTab('playground')}
            id="tab-playground"
          >
            <span>💻</span> Terminal Playground
          </button>
        </nav>

        <div className="sidebar-footer">
          Criado para ensinar Docker na prática.
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="main-content">
        
        {/* TAB 1: O que é Docker */}
        {activeTab === 'o-que-e' && (
          <section className="tab-section fade-in">
            <h1>O que é o Docker?</h1>
            <p className="subtitle">Compreenda o conceito fundamental por trás da virtualização moderna e como ela resolve o problema de paridade de ambientes.</p>

            <div className="alert-box warning">
              <h3>🚨 O Problema: "Na minha máquina funciona!"</h3>
              <p>Antes do Docker, inconsistências de dependências, versões de bibliotecas e de sistemas operacionais faziam aplicações que rodavam perfeitamente no computador do programador falharem na produção. O Docker resolve isso encapsulando tudo o que a aplicação precisa para rodar em um único pacote.</p>
            </div>

            <div className="dual-cards">
              <div className="premium-card">
                <div className="card-header">
                  <span className="badge vm">Máquina Virtual (VM)</span>
                  <h3>Virtualização Completa</h3>
                </div>
                <p>As Máquinas Virtuais simulam hardware de computador inteiro por meio de um Hypervisor. Cada VM precisa de um sistema operacional convidado (Guest OS) completo com seu próprio Kernel.</p>
                <ul>
                  <li>❌ Extremamente pesadas (gigabytes)</li>
                  <li>❌ Inicialização lenta (minutos)</li>
                  <li>❌ Alto consumo desnecessário de CPU/RAM</li>
                </ul>
              </div>

              <div className="premium-card active">
                <div className="card-header">
                  <span className="badge container-badge">Docker Container</span>
                  <h3>Isolamento de Processos</h3>
                </div>
                <p>Os Containers Docker rodam diretamente no topo do sistema operacional hospedeiro, compartilhando o mesmo Kernel. Eles apenas separam os arquivos e variáveis utilizando recursos internos do Linux.</p>
                <ul>
                  <li>✅ Leves e compactos (megabytes)</li>
                  <li>✅ Inicialização instantânea (milisegundos)</li>
                  <li>✅ Performance de aplicação nativa</li>
                </ul>
              </div>
            </div>

            {/* Diagrama simplificado inline */}
            <div className="diagram-card">
              <h3>Arquitetura Lado a Lado</h3>
              <div className="diagram-flex">
                <div className="diagram-column">
                  <h4>Estrutura VM</h4>
                  <div className="diag-block app">Aplicações (Código)</div>
                  <div className="diag-block deps">Dependências / Libs</div>
                  <div className="diag-block guest">Guest OS (Completo)</div>
                  <div className="diag-block hyper">Hypervisor</div>
                  <div className="diag-block host">Kernel do Host</div>
                </div>
                <div className="diagram-column">
                  <h4>Estrutura Container</h4>
                  <div className="diag-block app">Aplicações (Código)</div>
                  <div className="diag-block deps">Dependências / Libs</div>
                  <div className="diag-block engine">Docker Engine</div>
                  <div className="diag-block host">Kernel do Host (Compartilhado)</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: Sob o Capô (Simuladores de Namespaces & cgroups) */}
        {activeTab === 'sob-o-capo' && (
          <section className="tab-section fade-in">
            <h1>Como funciona sob o capô?</h1>
            <p className="subtitle">Interaja com os dois pilares fundamentais do kernel Linux que dão vida aos containers Docker.</p>

            <div className="simulators-grid">
              
              {/* Simulador de Namespaces */}
              <div className="premium-card">
                <h2>1. Namespaces (Isolamento Visual)</h2>
                <p className="card-desc">O isolamento faz o container acreditar que ele é o único sistema operacional rodando na máquina hospedeira.</p>
                
                <div className="sim-controls">
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={namespacePid}
                      onChange={(e) => setNamespacePid(e.target.checked)}
                    />
                    <span className="slider-round"></span>
                    Ativar Isolamento de Processos (PID Namespace)
                  </label>

                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={namespaceNet}
                      onChange={(e) => setNamespaceNet(e.target.checked)}
                    />
                    <span className="slider-round"></span>
                    Ativar Isolamento de Rede (NET Namespace)
                  </label>
                </div>

                <div className="visualizer-box">
                  <h4>Visualização do Container:</h4>
                  {namespacePid ? (
                    <div className="code-output pid-isolated">
                      <p className="system-line">[PID Namespace ATIVO - Visualização restrita]</p>
                      <p>PID 1  {"→"} node server.js (Aplicação Principal)</p>
                      <p>PID 12 {"→"} python check_status.py</p>
                    </div>
                  ) : (
                    <div className="code-output pid-leaked">
                      <p className="system-line error">[PID Namespace INATIVO - Vazamento do Host!]</p>
                      <p>PID 1  {"→"} /sbin/init (Host)</p>
                      <p>PID 12 {"→"} /usr/lib/systemd/systemd</p>
                      <p>PID 541 {"→"} chrome --type=renderer</p>
                      <p>PID 873 {"→"} docker-daemon</p>
                      <p>PID 912 {"→"} node server.js (O container enxerga tudo!)</p>
                    </div>
                  )}

                  <h4 style={{ marginTop: '15px' }}>Rede e IP Virtual:</h4>
                  {namespaceNet ? (
                    <div className="code-output net-isolated">
                      <p className="system-line">[NET Namespace ATIVO]</p>
                      <p>Interface: eth0  |  IP: 172.17.0.2</p>
                      <p>Portas em uso: 80 (Binds locais funcionam isoladamente)</p>
                    </div>
                  ) : (
                    <div className="code-output net-leaked">
                      <p className="system-line error">[NET Namespace INATIVO - Conflito de Rede!]</p>
                      <p>Interface: localhost  |  IP: 127.0.0.1</p>
                      <p className="error">Conflito de Porta: Porta 80 já está em uso pelo Host ou outro container!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Simulador de cgroups */}
              <div className="premium-card">
                <h2>2. Control Groups / cgroups (Limite de Hardware)</h2>
                <p className="card-desc">O cgroup limita a quantidade máxima de CPU, Memória RAM e I/O que o container tem autorização para extrair da máquina física.</p>
                
                <div className="sim-controls">
                  <div className="slider-group">
                    <label>Limite de CPU: <strong>{cpuLimit} Cores</strong></label>
                    <input 
                      type="range" 
                      min="0.5" 
                      max="4" 
                      step="0.5" 
                      value={cpuLimit} 
                      onChange={(e) => setCpuLimit(parseFloat(e.target.value))}
                      disabled={workloadStatus === 'running'}
                    />
                  </div>

                  <div className="slider-group">
                    <label>Limite de Memória RAM: <strong>{ramLimit} MB</strong></label>
                    <input 
                      type="range" 
                      min="128" 
                      max="2048" 
                      step="128" 
                      value={ramLimit} 
                      onChange={(e) => setRamLimit(parseInt(e.target.value))}
                      disabled={workloadStatus === 'running'}
                    />
                  </div>

                  <button 
                    className="primary-button" 
                    onClick={startCgroupsSimulation}
                    disabled={workloadStatus === 'running'}
                  >
                    Simular Carga de Trabalho
                  </button>
                </div>

                <div className="visualizer-box">
                  <h4>Status da Simulação:</h4>
                  
                  {workloadStatus === 'idle' && (
                    <p className="status-text text-muted">Pronto para iniciar simulação de carga pesada.</p>
                  )}

                  {workloadStatus === 'running' && (
                    <div className="progress-container">
                      <p className="status-text text-info">Processando carga com {cpuLimit} cores de CPU...</p>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${workloadProgress}%` }}></div>
                      </div>
                      <span className="progress-percentage">{workloadProgress}%</span>
                    </div>
                  )}

                  {workloadStatus === 'success' && (
                    <p className="status-text text-success">
                      🎉 <strong>Sucesso!</strong> A carga foi completada com segurança. Os limites de cgroups impediram a queda da máquina física.
                    </p>
                  )}

                  {workloadStatus === 'oom' && (
                    <div className="oom-alert">
                      <p className="status-text text-error">
                        💥 <strong>OOMKilled! (Out of Memory)</strong>
                      </p>
                      <p>O container tentou consumir mais memória do que o limite definido de {ramLimit}MB. O cgroup interrompeu e encerrou o container para salvar a máquina hospedeira de travar completamente.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </section>
        )}

        {/* TAB 3: Ciclo de Vida */}
        {activeTab === 'ciclo-de-vida' && (
          <section className="tab-section fade-in">
            <h1>O Ciclo de Vida do Docker</h1>
            <p className="subtitle">Entenda o fluxo completo desde o código do desenvolvedor até o container rodando no servidor de produção.</p>

            <div className="lifecycle-visualizer">
              
              <div className="lifecycle-step">
                <div className="step-num">1</div>
                <h3>Dockerfile</h3>
                <span className="step-desc">O projeto arquitetônico</span>
                <div className="step-code">
                  <pre>
                    FROM node:18-alpine<br/>
                    WORKDIR /app<br/>
                    COPY . .<br/>
                    CMD ["node", "app.js"]
                  </pre>
                </div>
                <p>Arquivo de texto plano que detalha a receita passo a passo de como estruturar sua aplicação.</p>
              </div>

              <div className="lifecycle-arrow">➡️</div>

              <div className="lifecycle-step">
                <div className="step-num">2</div>
                <h3>Imagem</h3>
                <span className="step-desc">O bolo congelado</span>
                <div className="step-code static">
                  <pre>
                    [Camada 4] CMD: node app.js<br/>
                    [Camada 3] COPY: arquivos de código<br/>
                    [Camada 2] WORKDIR: /app<br/>
                    [Camada 1] Node.js Alpine base
                  </pre>
                </div>
                <p>O arquivo binário gerado a partir do comando `docker build`. É somente leitura e composto de camadas.</p>
              </div>

              <div className="lifecycle-arrow">➡️</div>

              <div className="lifecycle-step">
                <div className="step-num">3</div>
                <h3>Registro</h3>
                <span className="step-desc">O supermercado</span>
                <div className="registry-hub">
                  <div className="hub-box">Docker Hub</div>
                  <span className="pull-push-text">docker push / pull</span>
                </div>
                <p>Servidor remoto que armazena e distribui imagens oficiais e customizadas em segurança.</p>
              </div>

              <div className="lifecycle-arrow">➡️</div>

              <div className="lifecycle-step">
                <div className="step-num">4</div>
                <h3>Container</h3>
                <span className="step-desc">O bolo pronto</span>
                <div className="container-status active-run">
                  <div className="pulse-dot"></div>
                  <span>Container Ativo</span>
                  <p>IP: 172.17.0.2<br/>Porta: 8080</p>
                </div>
                <p>Instância viva, isolada e em execução de uma Imagem. Gerada usando `docker run`.</p>
              </div>

            </div>
          </section>
        )}

        {/* TAB 4: Procurar & Rodar */}
        {activeTab === 'como-procurar' && (
          <section className="tab-section fade-in">
            <h1>Como Procurar & Rodar Imagens do Docker Hub</h1>
            <p className="subtitle">Aprenda a buscar no Docker Hub e rodar containers oficiais e interativos na prática.</p>

            <div className="tutorials-container">
              
              <div className="premium-card">
                <div className="tutorial-header">
                  <span className="tut-step">Etapa 1</span>
                  <h3>Buscando Imagens</h3>
                </div>
                <p>O <strong>Docker Hub</strong> é o grande acervo público do Docker. Você pode procurar pacotes de banco de dados, servidores web ou sistemas operacionais oficiais diretamente no terminal:</p>
                <div className="code-example-box">
                  <code>docker search nginx</code>
                </div>
                <p className="notes">Isso listará repositórios públicos oficiais contendo o Nginx, permitindo checar número de downloads, avaliação de estrelas e se a imagem é oficial.</p>
              </div>

              <div className="premium-card">
                <div className="tutorial-header">
                  <span className="tut-step">Etapa 2</span>
                  <h3>O Primeiro Teste: Hello-World</h3>
                </div>
                <p>O teste clássico para garantir que tudo está se comunicando perfeitamente:</p>
                <div className="code-example-box">
                  <code>docker run hello-world</code>
                </div>
                <p>O Docker tentará achar a imagem localmente. Como não a encontra no primeiro boot, ele a baixa (pull) do Docker Hub de forma transparente, monta o container, exibe o log de sucesso e encerra.</p>
              </div>

              <div className="premium-card">
                <div className="tutorial-header">
                  <span className="tut-step">Etapa 3</span>
                  <h3>Servindo Páginas Web (Nginx)</h3>
                </div>
                <p>Para levantar serviços permanentes que rodam em segundo plano e expõem portas de acesso para o seu navegador:</p>
                <div className="code-example-box">
                  <code>docker run -d -p 8080:80 --name meu-servidor nginx</code>
                </div>
                <div className="flag-explain-mini">
                  <p><strong>-d</strong>: Roda em segundo plano (detached).</p>
                  <p><strong>-p 8080:80</strong>: Porta 8080 do seu PC se conecta à porta 80 dentro do container.</p>
                  <p><strong>--name meu-servidor</strong>: Atribui um nome legível para o container.</p>
                </div>
                <p>Com esse comando rodando, você pode acessar <strong>http://localhost:8080</strong> para visualizar o Nginx funcionando!</p>
              </div>

              <div className="premium-card">
                <div className="tutorial-header">
                  <span className="tut-step">Etapa 4</span>
                  <h3>Sub-shell Interativa do Ubuntu</h3>
                </div>
                <p>Deseja abrir e testar coisas dentro de um sistema Linux limpo sem corromper sua máquina?</p>
                <div className="code-example-box">
                  <code>docker run -it ubuntu bash</code>
                </div>
                <p>A combinação de flags <strong>-it</strong> conecta seu teclado e terminal diretamente à sub-shell do container. Ao digitar isso, você estará logado como <code>root</code> dentro do Ubuntu virtualizado. Você pode rodar comandos como <code>apt update</code>, instalar pacotes ou testar scripts e, ao digitar <code>exit</code>, o container é destruído ou parado mantendo seu computador hospedeiro limpo.</p>
              </div>

            </div>
          </section>
        )}

        {/* TAB 4.5: Ciclo Completo (Build, Push, Compose, Deploy) */}
        {activeTab === 'ciclo-completo' && (
          <section className="tab-section fade-in">
            <h1>Ciclo Completo: Build, Push, Compose & Deploy</h1>
            <p className="subtitle">Aprenda a criar sua própria imagem, publicá-la em nuvem e rodar em qualquer servidor usando Docker Compose.</p>

            {/* Wizard Navigation */}
            <div className="deploy-steps-nav">
              <button 
                className={`deploy-step-btn ${activeDeployStep === 1 ? 'active' : ''}`}
                onClick={() => setActiveDeployStep(1)}
              >
                1. Build (Criar Imagem)
              </button>
              <button 
                className={`deploy-step-btn ${activeDeployStep === 2 ? 'active' : ''}`}
                onClick={() => setActiveDeployStep(2)}
              >
                2. Push (Publicar)
              </button>
              <button 
                className={`deploy-step-btn ${activeDeployStep === 3 ? 'active' : ''}`}
                onClick={() => setActiveDeployStep(3)}
              >
                3. Compose (Orquestrar)
              </button>
              <button 
                className={`deploy-step-btn ${activeDeployStep === 4 ? 'active' : ''}`}
                onClick={() => setActiveDeployStep(4)}
              >
                4. Deploy (Servidor Remoto)
              </button>
            </div>

            {/* Passo 1: Build */}
            {activeDeployStep === 1 && (
              <div className="premium-card fade-in">
                <h2>🛠️ Passo 1: Criando a sua própria Imagem (Build)</h2>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
                  Após escrever o seu código e configurar o seu <code>Dockerfile</code> na pasta raiz do seu projeto, você precisa compilar esse conjunto em um arquivo de imagem executável.
                </p>
                <div className="code-example-box">
                  <code>docker build -t seu-usuario/minha-app:1.0.0 .</code>
                </div>
                <div className="alert-box note" style={{ marginTop: '20px' }}>
                  <h4>🔍 O que significa esse comando?</h4>
                  <p style={{ marginTop: '8px' }}>
                    <strong>docker build</strong>: Comando que lê o arquivo Dockerfile do seu projeto e executa as instruções de compilação.
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    <strong>-t seu-usuario/minha-app:1.0.0</strong>: Define o nome da imagem (<code>minha-app</code>) e a versão/tag (<code>1.0.0</code>) associada ao seu nome de usuário.
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    <strong>. (ponto)</strong>: Indica que o contexto de build é a pasta atual. O Docker buscará o Dockerfile e os arquivos do código nesta pasta.
                  </p>
                </div>
              </div>
            )}

            {/* Passo 2: Push */}
            {activeDeployStep === 2 && (
              <div className="premium-card fade-in">
                <h2>☁️ Passo 2: Publicando a Imagem no Docker Hub (Push)</h2>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
                  Com a imagem gerada localmente, o próximo passo é enviá-la para o <strong>Docker Hub</strong> (o registro oficial na nuvem) para que ela possa ser acessada e baixada de qualquer lugar.
                </p>
                
                <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>1. Autentique seu terminal:</h4>
                <div className="code-example-box">
                  <code>docker login</code>
                </div>
                
                <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>2. Faça o upload da imagem:</h4>
                <div className="code-example-box">
                  <code>docker push seu-usuario/minha-app:1.0.0</code>
                </div>
                
                <div className="alert-box warning" style={{ marginTop: '20px' }}>
                  <h4>💡 Inteligência de Camadas (Cache)</h4>
                  <p>O Docker envia a imagem dividida em camadas. Se você fizer modificações futuras no seu código e fizer um novo build/push, o Docker enviará apenas as camadas contendo as novas alterações, economizando banda e tempo!</p>
                </div>
              </div>
            )}

            {/* Passo 3: Compose */}
            {activeDeployStep === 3 && (
              <div className="premium-card fade-in">
                <h2>📦 Passo 3: Orquestrando com Docker Compose</h2>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
                  Para evitar ter de digitar comandos <code>docker run</code> imensos no terminal para cada container, declaramos toda a arquitetura da nossa aplicação em um arquivo <code>docker-compose.yml</code>.
                </p>
                
                <div className="detail-example" style={{ marginTop: '20px' }}>
                  <strong>Estrutura recomendada para o arquivo docker-compose.yml:</strong>
                  <pre style={{ color: '#6ee7b7' }}>{`version: '3.8'

services:
  web:
    image: seu-usuario/minha-app:1.0.0
    container_name: meu-servico-web
    ports:
      - "8080:80"
    restart: unless-stopped`}</pre>
                </div>

                <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Iniciar os serviços declarados no compose:</h4>
                <div className="code-example-box">
                  <code>docker compose up -d</code>
                </div>
              </div>
            )}

            {/* Passo 4: Deploy */}
            {activeDeployStep === 4 && (
              <div className="premium-card fade-in">
                <h2>🚀 Passo 4: Fazendo Deploy em Outra Máquina (Servidor / VPS)</h2>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
                  Levar a sua aplicação para rodar em produção (ex: nuvens como AWS EC2, Google Cloud, DigitalOcean) é extremamente simples com o Docker. Você <strong>não</strong> precisa copiar seus códigos fontes para a máquina.
                </p>

                <div className="visualizer-box" style={{ marginTop: '20px', border: '1px solid var(--color-primary)' }}>
                  <p className="system-line">[ Roteiro do Deploy Real ]</p>
                  <p>1. Acesse o servidor remoto de produção (via SSH).</p>
                  <p>2. Certifique-se de que o <strong>Docker</strong> e o <strong>Docker Compose</strong> estão instalados nele.</p>
                  <p>3. Transfira <strong>apenas</strong> o seu arquivo <code>docker-compose.yml</code> para o servidor:</p>
                  <p style={{ color: 'var(--color-primary)', paddingLeft: '12px' }}>
                    scp docker-compose.yml usuario@ip-do-servidor:/home/usuario/app/
                  </p>
                  <p>4. No servidor, acesse a pasta e rode: <strong>docker compose up -d</strong></p>
                  <p style={{ color: 'var(--color-success)', marginTop: '8px' }}>
                    ✔ Pronto! O Docker do servidor remoto baixa a imagem do Docker Hub e executa a app perfeitamente.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB 5: Escrevendo Docker */}
        {activeTab === 'escrevendo' && (
          <section className="tab-section fade-in">
            <h1>Escrevendo Código Docker</h1>
            <p className="subtitle">Clique em qualquer linha dos arquivos abaixo para ver a explicação detalhada de sua sintaxe e boas práticas.</p>

            <div className="alert-box note">
              <p>💡 <strong>Dica Didática:</strong> Os arquivos de configuração abaixo possuem comentários para demonstrar a estrutura real que você utilizará no seu editor de código (como o VS Code).</p>
            </div>

            <div className="syntax-explorer-layout">
              
              {/* Arquivos de Código Interativos */}
              <div className="code-files-grid">
                
                {/* 1. Dockerfile */}
                <div className="code-file-box">
                  <div className="file-header">Dockerfile</div>
                  <div className="file-content">
                    <div className="line-comment"># Imagem base oficial do Node</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['FROM'])}>
                      <span className="keyword">FROM</span> node:18-alpine
                    </div>
                    <div className="line-comment"># Pasta padrão dentro do container</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['WORKDIR'])}>
                      <span className="keyword">WORKDIR</span> /usr/src/app
                    </div>
                    <div className="line-comment"># Copia configurações de pacotes</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['COPY'])}>
                      <span className="keyword">COPY</span> package*.json ./
                    </div>
                    <div className="line-comment"># Instala dependências de produção</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['RUN'])}>
                      <span className="keyword">RUN</span> npm ci
                    </div>
                    <div className="line-comment"># Variável de ambiente padrão</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['ENV'])}>
                      <span className="keyword">ENV</span> PORT=3000
                    </div>
                    <div className="line-comment"># Define usuário não-root (segurança)</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['USER'])}>
                      <span className="keyword">USER</span> node
                    </div>
                    <div className="line-comment"># Documenta a porta que será exposta</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['EXPOSE'])}>
                      <span className="keyword">EXPOSE</span> 3000
                    </div>
                    <div className="line-comment"># Declara pasta persistente</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['VOLUME'])}>
                      <span className="keyword">VOLUME</span> /data
                    </div>
                    <div className="line-comment"># Comando de inicialização do app</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['CMD'])}>
                      <span className="keyword">CMD</span> ["node", "app.js"]
                    </div>
                  </div>
                </div>

                {/* 2. docker-compose.yml */}
                <div className="code-file-box">
                  <div className="file-header">docker-compose.yml</div>
                  <div className="file-content">
                    <div className="line-comment"># Versão do esquema de composição</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['version'])}>
                      <span className="keyword">version</span>: '3.8'
                    </div>
                    <div className="line-comment"># Declaração dos containers/serviços</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['services'])}>
                      <span className="keyword">services</span>:
                    </div>
                    <div className="line-comment"># Nome do container/serviço local</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['web-app'])}>
                      &nbsp;&nbsp;<span className="keyword">web-app</span>:
                    </div>
                    <div className="line-comment"># Constrói imagem usando Dockerfile da pasta local</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['build'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">build</span>: .
                    </div>
                    <div className="line-comment"># Nome da imagem de build gerada</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['image'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">image</span>: node-app:1.0
                    </div>
                    <div className="line-comment"># Mapeamento de portas (host:container)</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['ports'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">ports</span>:
                    </div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['ports'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- "8080:3000"
                    </div>
                    <div className="line-comment"># Variáveis de ambiente no container</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['environment'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">environment</span>:
                    </div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['environment'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- DB_HOST=db
                    </div>
                    <div className="line-comment"># Pasta sincronizada (host:container)</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['volumes'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">volumes</span>:
                    </div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['volumes'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- .:/usr/src/app
                    </div>
                    <div className="line-comment"># Reinício automático em falhas</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['restart'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">restart</span>: unless-stopped
                    </div>
                    <div className="line-comment"># Redes virtuais do container</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['networks'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;<span className="keyword">networks</span>:
                    </div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['networks'])}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- rede-app
                    </div>
                  </div>
                </div>

                {/* 3. .dockerignore */}
                <div className="code-file-box">
                  <div className="file-header">.dockerignore</div>
                  <div className="file-content">
                    <div className="line-comment"># Ignora pastas pesadas do Node</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['node_modules/'])}>
                      node_modules/
                    </div>
                    <div className="line-comment"># Ignora versionamento do Git</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['.git'])}>
                      .git
                    </div>
                    <div className="line-comment"># Ignora arquivos de logs locais</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['*.log'])}>
                      *.log
                    </div>
                    <div className="line-comment"># Ignora dados sensíveis</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['.env'])}>
                      .env
                    </div>
                    <div className="line-comment"># Ignora o próprio Dockerfile</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['Dockerfile'])}>
                      Dockerfile
                    </div>
                    <div className="line-comment"># Ignora o arquivo .dockerignore</div>
                    <div className="interactive-line" onClick={() => setSelectedInstruction(syntaxDictionary['.dockerignore'])}>
                      .dockerignore
                    </div>
                  </div>
                </div>

              </div>

              {/* Detalhes da Sintaxe Clicada */}
              <div className="syntax-details-pane">
                {selectedInstruction ? (
                  <div className="detail-card active">
                    <div className="detail-meta">
                      <span className="file-badge">{selectedInstruction.context}</span>
                    </div>
                    <h3>Sintaxe: <code>{selectedInstruction.title}</code></h3>
                    <p className="detail-description">{selectedInstruction.desc}</p>
                    <div className="detail-example">
                      <strong>Exemplo prático de escrita:</strong>
                      <pre>{selectedInstruction.example}</pre>
                    </div>
                  </div>
                ) : (
                  <div className="detail-card">
                    <p className="no-selection">Clique em qualquer instrução ou comando ao lado para abrir a explicação detalhada.</p>
                  </div>
                )}
              </div>

            </div>
          </section>
        )}

        {/* TAB 6: Dicionário de Comandos */}
        {activeTab === 'comandos' && (
          <section className="tab-section fade-in">
            <h1>Dicionário de Comandos Úteis</h1>
            <p className="subtitle">Pesquise e consulte os comandos mais utilizados no fluxo de desenvolvimento com Docker.</p>

            <div className="filter-bar">
              <input 
                type="text" 
                placeholder="🔎 Pesquisar comando (ex: run, build, compose)..."
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                className="search-input"
              />

              <div className="category-tabs">
                {['Todos', 'Build & Tag', 'Registro', 'Execução', 'Interação', 'Estado', 'Limpeza', 'Compose'].map(cat => (
                  <button 
                    key={cat} 
                    className={`cat-btn ${commandCategory === cat ? 'active' : ''}`}
                    onClick={() => setCommandCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Comando</th>
                    <th>Descrição</th>
                    <th>Quando utilizar</th>
                  </tr>
                </thead>
                <tbody>
                  {commandsList
                    .filter(c => {
                      const matchesSearch = c.cmd.toLowerCase().includes(commandSearch.toLowerCase()) || c.desc.toLowerCase().includes(commandSearch.toLowerCase());
                      const matchesCategory = commandCategory === 'Todos' || c.cat === commandCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map((c, i) => (
                      <tr key={i}>
                        <td><span className="table-cat-badge">{c.cat}</span></td>
                        <td><code>{c.cmd}</code></td>
                        <td>{c.desc}</td>
                        <td><span className="text-muted">{c.use}</span></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 7: Dicionário de Flags */}
        {activeTab === 'flags' && (
          <section className="tab-section fade-in">
            <h1>Dicionário de Flags do Terminal</h1>
            <p className="subtitle">Entenda as opções adicionais utilizadas ao rodar comandos como docker run e docker build.</p>

            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Flag</th>
                    <th>Nome Técnico</th>
                    <th>Para que serve</th>
                    <th>Exemplo de Uso</th>
                  </tr>
                </thead>
                <tbody>
                  {flagsList.map((f, i) => (
                    <tr key={i}>
                      <td><strong className="flag-tag">{f.flag}</strong></td>
                      <td><strong>{f.name}</strong></td>
                      <td>{f.desc}</td>
                      <td><code>{f.example}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 8: Playground do Terminal */}
        {activeTab === 'playground' && (
          <section className="tab-section fade-in">
            <h1>Terminal Playground Interativo</h1>
            <p className="subtitle">Execute comandos docker reais simulados e entre na sub-shell interativa do Ubuntu.</p>

            <div className="playground-layout">
              
              {/* Terminal */}
              <div className="terminal-box">
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <span className="terminal-title">
                    {isUbuntuShell ? 'bash - root@ubuntu-container:~' : 'bash - docker@learning-host:~'}
                  </span>
                </div>

                <div className="terminal-body">
                  {terminalHistory.map((line, idx) => (
                    <div key={idx} className={`terminal-line ${line.type}`}>
                      {line.text}
                    </div>
                  ))}

                  {/* Simulador de Barra de Progresso no Terminal */}
                  {isTerminalLoading && (
                    <div className="terminal-loader-line">
                      <span className="loader-text">{terminalLoadingText}</span>
                      <div className="terminal-progress-bar-bg">
                        <div className="terminal-progress-bar-fill" style={{ width: `${terminalLoadingProgress}%` }}></div>
                      </div>
                      <span className="loader-percent">{terminalLoadingProgress}%</span>
                    </div>
                  )}

                  <form onSubmit={handleTerminalSubmit} className="terminal-form">
                    <span className="terminal-prompt">
                      {isUbuntuShell ? 'root@ubuntu-container:/# ' : 'docker@learning-host:~$ '}
                    </span>
                    <input 
                      type="text" 
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      className="terminal-input-element"
                      autoFocus
                      disabled={isTerminalLoading}
                    />
                  </form>
                  <div ref={terminalEndRef}></div>
                </div>
              </div>

              {/* Status do Host Virtual */}
              <div className="host-status-pane">
                <div className="status-header">
                  <h3>Estado do Docker Daemon</h3>
                  <span className="active-pill">Ativo</span>
                </div>
                
                <div className="status-section">
                  <h4>Imagens Locais ({virtualImages.length})</h4>
                  {virtualImages.length === 0 ? (
                    <p className="no-item">Nenhuma imagem carregada.</p>
                  ) : (
                    <ul>
                      {virtualImages.map((img, i) => (
                        <li key={i}>
                          <code>{img.name}:{img.tag}</code>
                          <span className="meta-info">{img.size}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="status-section">
                  <h4>Containers Ativos ({virtualContainers.filter(c => c.status.startsWith('Up')).length})</h4>
                  {virtualContainers.filter(c => c.status.startsWith('Up')).length === 0 ? (
                    <p className="no-item">Nenhum container ativo.</p>
                  ) : (
                    <ul>
                      {virtualContainers.filter(c => c.status.startsWith('Up')).map((c, i) => (
                        <li key={i}>
                          <strong>{c.name}</strong> 
                          <span className="meta-info">Portas: {c.ports}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="guide-box">
                  <h4>Experimente rodar:</h4>
                  <ul>
                    <li><code>docker login</code></li>
                    <li><code>docker build -t app:1.0 .</code></li>
                    <li><code>docker run -it ubuntu bash</code></li>
                    <li><code>docker run -d -p 8080:80 nginx</code></li>
                    <li><code>docker ps -a</code></li>
                  </ul>
                </div>
              </div>

            </div>
          </section>
        )}

      </main>
    </div>
  );
}
