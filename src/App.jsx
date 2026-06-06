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
  const [activeLifecycleStep, setActiveLifecycleStep] = useState(1);

  // Estados dos Comandos e Filtros
  const [commandSearch, setCommandSearch] = useState('');
  const [commandCategory, setCommandCategory] = useState('Todos');



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
        {/* TAB 3: Ciclo de Vida */}
        {activeTab === 'ciclo-de-vida' && (
          <section className="tab-section fade-in">
            <h1>O Ciclo de Vida do Docker</h1>
            <p className="subtitle">Aprenda a sequência de transformação: do arquivo de receita escrito até o container rodando isolado na nuvem.</p>

            {/* Pipeline de Passos Interativos */}
            <div className="lifecycle-pipeline">
              <button 
                className={`pipeline-node ${activeLifecycleStep === 1 ? 'active' : ''}`}
                onClick={() => setActiveLifecycleStep(1)}
              >
                <div className="node-number">1</div>
                <div className="node-label">Dockerfile</div>
                <div className="node-action">Receita</div>
              </button>
              
              <div className="pipeline-connector">
                <span className="connector-cmd">docker build</span>
                <div className="connector-line"></div>
              </div>

              <button 
                className={`pipeline-node ${activeLifecycleStep === 2 ? 'active' : ''}`}
                onClick={() => setActiveLifecycleStep(2)}
              >
                <div className="node-number">2</div>
                <div className="node-label">Imagem</div>
                <div className="node-action">Pacote</div>
              </button>

              <div className="pipeline-connector">
                <span className="connector-cmd">docker push</span>
                <div className="connector-line"></div>
              </div>

              <button 
                className={`pipeline-node ${activeLifecycleStep === 3 ? 'active' : ''}`}
                onClick={() => setActiveLifecycleStep(3)}
              >
                <div className="node-number">3</div>
                <div className="node-label">Registro</div>
                <div className="node-action">Nuvem</div>
              </button>

              <div className="pipeline-connector">
                <span className="connector-cmd">docker run</span>
                <div className="connector-line"></div>
              </div>

              <button 
                className={`pipeline-node ${activeLifecycleStep === 4 ? 'active' : ''}`}
                onClick={() => setActiveLifecycleStep(4)}
              >
                <div className="node-number">4</div>
                <div className="node-label">Container</div>
                <div className="node-action">Execução</div>
              </button>
            </div>

            {/* Painel de Explicação do Passo Selecionado */}
            <div className="premium-card lifecycle-detail-card fade-in">
              {activeLifecycleStep === 1 && (
                <div>
                  <div className="detail-header-row">
                    <span className="step-badge">Passo 1</span>
                    <h2>📄 Dockerfile: A Receita Escrita</h2>
                  </div>
                  <p className="step-intro-text">
                    O <strong>Dockerfile</strong> é um arquivo de texto plano que lista todas as instruções ordenadas para construir a imagem de sua aplicação. É o projeto arquitetônico do seu container.
                  </p>
                  
                  <div className="lifecycle-grid-details">
                    <div className="code-column-wrapper">
                      <strong>Exemplo prático de Dockerfile:</strong>
                      <pre className="code-pre-box">{`FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "app.js"]`}</pre>
                    </div>
                    <div className="explanation-column-wrapper">
                      <h4>💡 Conceitos Chave:</h4>
                      <ul>
                        <li><strong>FROM:</strong> Inicia o blueprint definindo a imagem base de sistema operacional.</li>
                        <li><strong>WORKDIR:</strong> Cria e acessa a pasta de trabalho interna.</li>
                        <li><strong>COPY:</strong> Move arquivos do seu computador para dentro do container.</li>
                        <li><strong>CMD:</strong> O script/comando rodado ao instanciar o container.</li>
                      </ul>
                      <div className="alert-box note" style={{ marginTop: '16px' }}>
                        <p><strong>Comando de Build:</strong> Para transformar essa receita em imagem, rodamos: <code>docker build -t app:1.0 .</code></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeLifecycleStep === 2 && (
                <div>
                  <div className="detail-header-row">
                    <span className="step-badge">Passo 2</span>
                    <h2>📦 Imagem: O Pacote Estático (Read-Only)</h2>
                  </div>
                  <p className="step-intro-text">
                    A <strong>Imagem</strong> é o arquivo binário estático empacotado após o build. Ela não roda código diretamente, mas armazena todas as camadas somente leitura necessárias para a execução.
                  </p>

                  <div className="lifecycle-grid-details">
                    <div className="layers-visualizer">
                      <strong>Estrutura de Camadas (ReadOnly Layers):</strong>
                      <div className="layer-block">
                        <span className="layer-tag">Camada 5</span> CMD ["node", "app.js"] (1 Byte)
                      </div>
                      <div className="layer-block">
                        <span className="layer-tag">Camada 4</span> COPY . . (42.5 MB)
                      </div>
                      <div className="layer-block">
                        <span className="layer-tag">Camada 3</span> RUN npm ci (85.1 MB)
                      </div>
                      <div className="layer-block">
                        <span className="layer-tag">Camada 2</span> WORKDIR /app (0 Bytes)
                      </div>
                      <div className="layer-block base">
                        <span className="layer-tag">Camada 1</span> Node.js Base OS (174 MB)
                      </div>
                    </div>
                    <div className="explanation-column-wrapper">
                      <h4>💡 Conceitos Chave:</h4>
                      <ul>
                        <li><strong>Imutabilidade:</strong> Uma imagem nunca muda. Para atualizar a aplicação, gera-se uma nova tag de imagem.</li>
                        <li><strong>Armazenamento em Cache:</strong> Se uma camada não sofrer alterações, o Docker reutiliza o cache nas próximas compilações.</li>
                        <li><strong>Tamanho Otimizado:</strong> O uso de sistemas base como Alpine Linux mantém o peso final em megabytes, ao contrário de gigabytes de VMs.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeLifecycleStep === 3 && (
                <div>
                  <div className="detail-header-row">
                    <span className="step-badge">Passo 3</span>
                    <h2>☁️ Registro: O Compartilhamento (Docker Hub)</h2>
                  </div>
                  <p className="step-intro-text">
                    O <strong>Registro</strong> é o serviço de nuvem encarregado de armazenar, catalogar e distribuir as imagens compiladas de forma que qualquer computador autorizado possa baixá-las.
                  </p>

                  <div className="lifecycle-grid-details">
                    <div className="visual-diagram-box">
                      <div className="diagram-node local">Seu PC (Imagem)</div>
                      <div className="diagram-link">
                        <span>docker push</span>
                        <span className="arrow-line">────────────────&gt;</span>
                      </div>
                      <div className="diagram-node cloud">Docker Hub</div>
                      <div className="diagram-link">
                        <span>docker pull</span>
                        <span className="arrow-line">────────────────&gt;</span>
                      </div>
                      <div className="diagram-node prod">Servidor VPS</div>
                    </div>
                    <div className="explanation-column-wrapper">
                      <h4>💡 Conceitos Chave:</h4>
                      <ul>
                        <li><strong>docker login:</strong> Autentica seu terminal de desenvolvimento com sua conta oficial no Docker Hub.</li>
                        <li><strong>docker push:</strong> Faz o upload da sua imagem local para o registro remoto.</li>
                        <li><strong>docker pull:</strong> Faz o download de uma imagem do registro para executar na máquina local ou em nuvem.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeLifecycleStep === 4 && (
                <div>
                  <div className="detail-header-row">
                    <span className="step-badge">Passo 4</span>
                    <h2>⚡ Container: A Instância Executável (Read-Write)</h2>
                  </div>
                  <p className="step-intro-text">
                    O <strong>Container</strong> é a instância em execução da imagem. Ele cria uma camada temporária de escrita (Read-Write Layer) no topo das camadas estáticas da imagem e roda isolado no Host.
                  </p>

                  <div className="lifecycle-grid-details">
                    <div className="container-status-box">
                      <div className="container-status-header">
                        <span className="pulse-dot-active"></span>
                        <strong>STATUS: RUNNING</strong>
                      </div>
                      <div className="status-item"><span>Container ID:</span> <code>e842bd98a1c0</code></div>
                      <div className="status-item"><span>IP Local:</span> <code>172.17.0.2</code></div>
                      <div className="status-item"><span>Mapeamento:</span> <code>Porta 8080 ──&gt; 3000</code></div>
                    </div>
                    <div className="explanation-column-wrapper">
                      <h4>💡 Conceitos Chave:</h4>
                      <ul>
                        <li><strong>Camada R/W (Writable Layer):</strong> Toda alteração feita no container ativo (gravação de banco, logs) ocorre nessa camada e desaparece se o container for deletado.</li>
                        <li><strong>Isolamento Total:</strong> Possui redes virtuais, IDs de processos e discos totalmente apartados do sistema operacional hospedeiro.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
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

                <div className="mock-terminal-console">
                  <div className="console-header">
                    <span className="terminal-dot red"></span>
                    <span className="terminal-dot yellow"></span>
                    <span className="terminal-dot green"></span>
                    <span className="console-title">terminal - docker build</span>
                  </div>
                  <div className="console-body">
                    <p className="cmd-line">$ docker build -t seu-usuario/minha-app:1.0.0 .</p>
                    <p>[+] Building 2.4s (6/6) FINISHED</p>
                    <p>=&gt; [internal] load build definition from Dockerfile  0.1s</p>
                    <p>=&gt; [internal] load .dockerignore  0.0s</p>
                    <p>=&gt; [internal] load metadata for docker.io/library/node:18-alpine  0.8s</p>
                    <p>=&gt; [1/3] FROM docker.io/library/node:18-alpine@sha256:1a87b...  0.0s</p>
                    <p>=&gt; [2/3] WORKDIR /usr/src/app  0.1s</p>
                    <p>=&gt; [3/3] COPY package*.json ./  0.0s</p>
                    <p>=&gt; exporting to image  0.3s</p>
                    <p>=&gt; =&gt; naming to docker.io/seu-usuario/minha-app:1.0.0  0.0s</p>
                    <p className="success-line">✔ Successfully tagged seu-usuario/minha-app:1.0.0</p>
                  </div>
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

                <div className="mock-terminal-console">
                  <div className="console-header">
                    <span className="terminal-dot red"></span>
                    <span className="terminal-dot yellow"></span>
                    <span className="terminal-dot green"></span>
                    <span className="console-title">terminal - docker push</span>
                  </div>
                  <div className="console-body">
                    <p className="cmd-line">$ docker push seu-usuario/minha-app:1.0.0</p>
                    <p>The push refers to repository [docker.io/seu-usuario/minha-app]</p>
                    <p>f72b83a21bc3: Pushed  2.4MB</p>
                    <p>a4c1f9d8c83e: Layer already exists</p>
                    <p>8cf771d9d95f: Layer already exists</p>
                    <p>1.0.0: digest: sha256:4d87e2b8c9d0a... size: 952</p>
                    <p className="success-line">✔ Upload completo! Imagem disponível publicamente no Docker Hub.</p>
                  </div>
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

                <div className="mock-terminal-console">
                  <div className="console-header">
                    <span className="terminal-dot red"></span>
                    <span className="terminal-dot yellow"></span>
                    <span className="terminal-dot green"></span>
                    <span className="console-title">terminal - docker compose up</span>
                  </div>
                  <div className="console-body">
                    <p className="cmd-line">$ docker compose up -d</p>
                    <p>[+] Running 2/2</p>
                    <p> 🟢 Network app_default      Created  0.1s</p>
                    <p> 🟢 Container meu-servico-web Started  0.4s</p>
                    <p className="success-line">✔ Aplicação inicializada com sucesso em segundo plano!</p>
                  </div>
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

                <div className="mock-terminal-console">
                  <div className="console-header">
                    <span className="terminal-dot red"></span>
                    <span className="terminal-dot yellow"></span>
                    <span className="terminal-dot green"></span>
                    <span className="console-title">terminal - ssh vps-production</span>
                  </div>
                  <div className="console-body">
                    <p className="cmd-line">$ ssh usuario@ip-do-servidor</p>
                    <p>Welcome to Ubuntu VPS (GNU/Linux 5.15.0 x86_64)</p>
                    <p className="cmd-line">usuario@vps:~$ cd app/</p>
                    <p className="cmd-line">usuario@vps:~/app$ docker compose up -d</p>
                    <p>Pulling web ... done</p>
                    <p>Recreating meu-servico-web ... done</p>
                    <p className="success-line">✔ Deploy remoto concluído! Acesse: http://ip-do-servidor:8080</p>
                  </div>
                </div>

                <div className="alert-box note" style={{ marginTop: '20px' }}>
                  <h4>🔍 Roteiro do Deploy Real:</h4>
                  <p style={{ marginTop: '8px' }}>1. Acesse o servidor remoto de produção (via SSH).</p>
                  <p style={{ marginTop: '8px' }}>2. Certifique-se de que o <strong>Docker</strong> e o <strong>Docker Compose</strong> estão instalados nele.</p>
                  <p style={{ marginTop: '8px' }}>3. Transfira <strong>apenas</strong> o seu arquivo <code>docker-compose.yml</code> para o servidor usando scp:</p>
                  <p style={{ color: 'var(--color-primary)', paddingLeft: '12px', fontFamily: 'var(--font-code)', fontSize: '12px', marginTop: '4px' }}>
                    scp docker-compose.yml usuario@ip-do-servidor:/home/usuario/app/
                  </p>
                  <p style={{ marginTop: '8px' }}>4. No servidor, acesse a pasta e rode: <strong>docker compose up -d</strong></p>
                  <p style={{ color: 'var(--color-success)', marginTop: '8px' }}>
                    ✔ O Docker do servidor remoto lê o compose, puxa a imagem do Docker Hub e inicializa a aplicação sem expor seu código fonte local.
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
      </main>
    </div>
  );
}
