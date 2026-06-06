document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Lucide Icons
    lucide.createIcons();

    // 1. Navegação de Abas (Sidebar)
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');

    const pageTitles = {
        'intro': 'Introdução ao Docker',
        'architecture': 'VM vs. Container',
        'pillars': 'Pilares do Kernel Linux',
        'lifecycle': 'Ciclo de Vida do Docker',
        'installation': 'Instalação & Comandos Básicos',
        'flags': 'Flags do Docker',
        'code-writing': 'Escrevendo Código Docker',
        'playground': 'Playground Terminal'
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            
            // Alterar ativo nos botões
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Alterar ativo nas seções
            sections.forEach(sec => {
                sec.classList.remove('active');
                if (sec.id === `sec-${target}`) {
                    sec.classList.add('active');
                }
            });

            // Atualizar título do cabeçalho
            if (pageTitles[target]) {
                pageTitle.textContent = pageTitles[target];
            }
        });
    });

    // 2. Simulador de Namespaces
    const toggleNamespaceBtn = document.getElementById('toggle-namespace');
    const hostLeakProc = document.getElementById('host-leak-proc');
    const containerProc1 = document.getElementById('container-proc-1');
    const containerProc2 = document.getElementById('container-proc-2');
    let namespacesIsolated = true;

    toggleNamespaceBtn.addEventListener('click', () => {
        namespacesIsolated = !namespacesIsolated;

        if (namespacesIsolated) {
            toggleNamespaceBtn.textContent = 'Remover Isolamento';
            toggleNamespaceBtn.style.backgroundColor = 'var(--color-error)';
            
            // Visualizar isolamento: esconde processos do host
            hostLeakProc.classList.add('disabled');
            containerProc1.textContent = 'PID 1: Node.js (App)';
            containerProc2.textContent = 'PID 2: Nginx (App)';
        } else {
            toggleNamespaceBtn.textContent = 'Isolar Namespace';
            toggleNamespaceBtn.style.backgroundColor = 'var(--accent-primary)';
            
            // Remove isolamento: vaza processos do host para o container e revela PIDs reais
            hostLeakProc.classList.remove('disabled');
            containerProc1.textContent = 'PID 102: Node.js (App)';
            containerProc2.textContent = 'PID 105: Nginx (App)';
        }
    });

    // 3. Simulador de Control Groups (cgroups)
    const cpuLimitSlider = document.getElementById('cpu-limit');
    const cpuValSpan = document.getElementById('cpu-val');
    const containerCpuBar = document.getElementById('container-cpu-bar');
    const simulateLoadBtn = document.getElementById('simulate-load');
    let isSimulatingLoad = false;

    cpuLimitSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        cpuValSpan.textContent = `${val}%`;
        if (isSimulatingLoad) {
            // Se já estiver simulando, limita a barra em tempo real
            containerCpuBar.style.width = `${val}%`;
            containerCpuBar.textContent = `Container: ${val}%`;
        }
    });

    simulateLoadBtn.addEventListener('click', () => {
        isSimulatingLoad = !isSimulatingLoad;

        if (isSimulatingLoad) {
            simulateLoadBtn.textContent = 'Parar Carga';
            simulateLoadBtn.style.backgroundColor = 'var(--color-error)';
            const limit = cpuLimitSlider.value;
            containerCpuBar.style.width = `${limit}%`;
            containerCpuBar.textContent = `Container: ${limit}% (Max)`;
            containerCpuBar.style.background = 'linear-gradient(90deg, #ef4444, #f59e0b)';
        } else {
            simulateLoadBtn.textContent = 'Simular Carga de Trabalho';
            simulateLoadBtn.style.backgroundColor = 'var(--accent-primary)';
            containerCpuBar.style.width = '10%';
            containerCpuBar.textContent = 'Container: 10%';
            containerCpuBar.style.background = 'var(--gradient-accent)';
        }
    });

    // 4. Simulador do Terminal Playground
    const terminalOutput = document.getElementById('terminal-output');
    const termInput = document.getElementById('term-input');
    const promptEl = document.querySelector('.prompt');
    
    // Guias do playground
    const guideSteps = {
        1: document.getElementById('guide-step-1'),
        2: document.getElementById('guide-step-2'),
        3: document.getElementById('guide-step-3'),
        4: document.getElementById('guide-step-4')
    };

    // Componentes de estado visual
    const sandboxEmpty = document.getElementById('sandbox-empty');
    const sandboxImgCard = document.getElementById('sandbox-img-card');
    const sandboxContainerCard = document.getElementById('sandbox-container-card');

    let currentGuideStep = 1;

    // Estado do motor virtual Docker
    let systemState = {
        images: {
            'nginx:alpine': { id: '3c44249a5b3a', size: '23.5MB', created: '2 weeks ago' }
        },
        containers: {},
        dockerLoggedIn: false,
        inSubshell: false,
        ubuntuState: {
            curlInstalled: false,
            updated: false
        }
    };

    // Focar no input ao clicar no corpo do terminal
    document.querySelector('.terminal-container').addEventListener('click', () => {
        termInput.focus();
    });

    termInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const command = termInput.value.trim();
            termInput.value = '';
            
            if (command) {
                handleCommand(command);
            }
        }
    });

    function printLine(text, type = 'term-line') {
        const line = document.createElement('div');
        line.className = type;
        line.textContent = text;
        // Inserir antes da linha de input
        terminalOutput.insertBefore(line, terminalOutput.lastElementChild);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function updateGuideStep(step) {
        currentGuideStep = step;
        Object.keys(guideSteps).forEach(s => {
            if (guideSteps[s]) guideSteps[s].classList.remove('active');
        });
        if (guideSteps[step]) {
            guideSteps[step].classList.add('active');
        }
    }

    function updateSandboxVisuals() {
        const runningContainer = Object.values(systemState.containers).find(c => c.status === 'running');
        const customImage = Object.keys(systemState.images).find(img => img !== 'nginx:alpine');

        if (runningContainer) {
            sandboxContainerCard.classList.remove('hidden');
            const nameEl = sandboxContainerCard.querySelector('strong');
            const portsEl = sandboxContainerCard.querySelector('.ports');
            const stateEl = sandboxContainerCard.querySelector('.running-state');
            nameEl.textContent = runningContainer.name;
            portsEl.textContent = `Portas: 0.0.0.0:${runningContainer.ports}->80/tcp`;
            stateEl.textContent = 'ONLINE (Executando)';
            stateEl.style.color = '#10b981';
        } else {
            const stoppedContainer = Object.values(systemState.containers).find(c => c.status === 'stopped');
            if (stoppedContainer) {
                sandboxContainerCard.classList.remove('hidden');
                const nameEl = sandboxContainerCard.querySelector('strong');
                const portsEl = sandboxContainerCard.querySelector('.ports');
                const stateEl = sandboxContainerCard.querySelector('.running-state');
                nameEl.textContent = stoppedContainer.name;
                portsEl.textContent = `Portas: -`;
                stateEl.textContent = 'OFFLINE (Parado)';
                stateEl.style.color = '#ef4444';
            } else {
                sandboxContainerCard.classList.add('hidden');
            }
        }

        if (customImage) {
            sandboxImgCard.classList.remove('hidden');
            const nameEl = sandboxImgCard.querySelector('strong');
            nameEl.textContent = customImage;
        } else {
            sandboxImgCard.classList.add('hidden');
        }

        if (!runningContainer && !Object.values(systemState.containers).find(c => c.status === 'stopped') && !customImage) {
            sandboxEmpty.classList.remove('hidden');
        } else {
            sandboxEmpty.classList.add('hidden');
        }
    }

    // Função assíncrona fictícia para simular carregamento de progresso
    function simulateProgress(lines, callback) {
        let index = 0;
        termInput.disabled = true;
        
        function printNext() {
            if (index < lines.length) {
                printLine(lines[index][0], lines[index][1]);
                index++;
                setTimeout(printNext, 250);
            } else {
                termInput.disabled = false;
                termInput.focus();
                if (callback) callback();
            }
        }
        printNext();
    }

    function handleCommand(cmd) {
        const promptPrefix = systemState.inSubshell ? 'root@ubuntu-container:/# ' : 'docker@host:~$ ';
        printLine(`${promptPrefix}${cmd}`, 'term-line');

        const normalizedCmd = cmd.toLowerCase().replace(/\s+/g, ' ');

        // Se estiver dentro da sub-shell do Ubuntu
        if (systemState.inSubshell) {
            if (normalizedCmd === 'exit') {
                systemState.inSubshell = false;
                promptEl.textContent = 'docker@host:~$ ';
                printLine('exit', 'cmd-output');
                printLine('Connection to container closed. Back to host.', 'cmd-output');
                return;
            }

            if (normalizedCmd === 'clear') {
                const lines = terminalOutput.querySelectorAll('.term-line, .cmd-output, .cmd-success, .cmd-error');
                lines.forEach(l => l.remove());
                return;
            }

            if (normalizedCmd === 'pwd') {
                printLine('/', 'cmd-output');
                return;
            }

            if (normalizedCmd === 'whoami') {
                printLine('root', 'cmd-output');
                return;
            }

            if (normalizedCmd === 'ls' || normalizedCmd === 'ls -la' || normalizedCmd === 'ls -l') {
                printLine('bin   dev  home  media  opt   root  sbin  sys  usr', 'cmd-output');
                printLine('boot  etc  lib   mnt    proc  run   srv   tmp  var', 'cmd-output');
                return;
            }

            if (normalizedCmd === 'apt update') {
                const lines = [
                    ['Get:1 http://archive.ubuntu.com/ubuntu noble InRelease [256 kB]', 'cmd-output'],
                    ['Get:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]', 'cmd-output'],
                    ['Get:3 http://archive.ubuntu.com/ubuntu noble-security InRelease [126 kB]', 'cmd-output'],
                    ['Fetched 508 kB in 1s (508 kB/s)', 'cmd-output'],
                    ['Reading package lists... Done', 'cmd-output'],
                    ['Building dependency tree... Done', 'cmd-output'],
                    ['All packages are up to date.', 'cmd-success']
                ];
                simulateProgress(lines, () => {
                    systemState.ubuntuState.updated = true;
                });
                return;
            }

            if (normalizedCmd === 'apt install curl' || normalizedCmd === 'apt install -y curl' || normalizedCmd === 'apt install curl -y') {
                if (!systemState.ubuntuState.updated) {
                    printLine('Reading package lists... Done', 'cmd-output');
                    printLine('Building dependency tree... Done', 'cmd-output');
                    printLine('E: Unable to locate package curl. Try running "apt update" first!', 'cmd-error');
                    return;
                }
                const lines = [
                    ['Reading package lists... Done', 'cmd-output'],
                    ['Building dependency tree... Done', 'cmd-output'],
                    ['The following NEW packages will be installed:', 'cmd-output'],
                    ['  curl libcurl4', 'cmd-output'],
                    ['0 upgraded, 2 newly installed, 0 to remove.', 'cmd-output'],
                    ['Need to get 382 kB of archives.', 'cmd-output'],
                    ['Get:1 http://archive.ubuntu.com/ubuntu noble/main amd64 libcurl4 [280 kB]', 'cmd-output'],
                    ['Get:2 http://archive.ubuntu.com/ubuntu noble/main amd64 curl [102 kB]', 'cmd-output'],
                    ['Selecting previously unselected package libcurl4:amd64.', 'cmd-output'],
                    ['Preparing to unpack .../libcurl4_8.5.0-2ubuntu1_amd64.deb ...', 'cmd-output'],
                    ['Unpacking libcurl4:amd64 ...', 'cmd-output'],
                    ['Selecting previously unselected package curl.', 'cmd-output'],
                    ['Unpacking curl ...', 'cmd-output'],
                    ['Setting up libcurl4:amd64 ...', 'cmd-output'],
                    ['Setting up curl ...', 'cmd-output'],
                    ['Processing triggers for libc-bin ...', 'cmd-success']
                ];
                simulateProgress(lines, () => {
                    systemState.ubuntuState.curlInstalled = true;
                });
                return;
            }

            if (normalizedCmd === 'curl' || normalizedCmd === 'curl --help') {
                if (!systemState.ubuntuState.curlInstalled) {
                    printLine('bash: curl: command not found. Install it using "apt install curl"!', 'cmd-error');
                } else {
                    printLine('curl: try "curl --help" for more information', 'cmd-output');
                }
                return;
            }

            if (normalizedCmd.startsWith('curl ')) {
                if (!systemState.ubuntuState.curlInstalled) {
                    printLine('bash: curl: command not found. Install it using "apt install curl"!', 'cmd-error');
                    return;
                }
                const url = cmd.substring(5).trim();
                const lines = [
                    [`*   Trying ${url}...`, 'cmd-output'],
                    ['* Connected to ' + url + ' (127.0.0.1) port 80', 'cmd-output'],
                    ['> GET / HTTP/1.1', 'cmd-output'],
                    ['> User-Agent: curl/8.5.0', 'cmd-output'],
                    ['> Accept: */*', 'cmd-output'],
                    ['>', 'cmd-output'],
                    ['< HTTP/1.1 200 OK', 'cmd-output'],
                    ['< Content-Type: text/html; charset=UTF-8', 'cmd-output'],
                    ['< Content-Length: 154', 'cmd-output'],
                    ['<', 'cmd-output'],
                    ['<!DOCTYPE html><html><head><title>Mock Page</title></head>', 'cmd-output'],
                    ['<body><h1>Hello from DockerLab Virtual Service!</h1></body></html>', 'cmd-success']
                ];
                simulateProgress(lines);
                return;
            }

            printLine(`bash: ${cmd.split(' ')[0]}: command not found. Commands: ls, pwd, whoami, apt update, apt install curl, exit, clear.`, 'cmd-error');
            return;
        }

        // COMANDOS NO HOST DOCKER
        if (normalizedCmd === 'clear') {
            const lines = terminalOutput.querySelectorAll('.term-line, .cmd-output, .cmd-success, .cmd-error');
            lines.forEach(l => l.remove());
            return;
        }

        if (normalizedCmd === 'help') {
            printLine('Comandos do Docker virtual disponíveis:', 'cmd-output');
            printLine('  docker build -t <tag> .             - Constrói uma imagem local', 'cmd-output');
            printLine('  docker images                       - Lista imagens locais', 'cmd-output');
            printLine('  docker run -d -p <host>:<container> <imagem>  - Roda em background', 'cmd-output');
            printLine('  docker run -it ubuntu bash          - Entra em shell interativo Ubuntu', 'cmd-output');
            printLine('  docker ps                           - Lista containers ativos', 'cmd-output');
            printLine('  docker ps -a                        - Lista todos os containers', 'cmd-output');
            printLine('  docker stop <id_ou_nome>            - Para um container', 'cmd-output');
            printLine('  docker rm <id_ou_nome>              - Exclui um container parado', 'cmd-output');
            printLine('  docker rmi <imagem>                 - Exclui uma imagem local', 'cmd-output');
            printLine('  docker login                        - Autentica no Docker Hub', 'cmd-output');
            printLine('  docker push <imagem>                - Publica imagem no Docker Hub', 'cmd-output');
            printLine('  docker pull <imagem>                - Baixa imagem do Docker Hub', 'cmd-output');
            printLine('  clear                               - Limpa a tela', 'cmd-output');
            return;
        }

        // docker login
        if (normalizedCmd === 'docker login') {
            const lines = [
                ['Username: docker-user', 'cmd-output'],
                ['Password: **********', 'cmd-output'],
                ['WARNING! Your password will be stored unencrypted in /root/.docker/config.json.', 'cmd-output'],
                ['Login Succeeded', 'cmd-success']
            ];
            simulateProgress(lines, () => {
                systemState.dockerLoggedIn = true;
            });
            return;
        }

        // docker build
        if (normalizedCmd.startsWith('docker build ')) {
            const match = cmd.match(/docker build -t\s+([^\s]+)\s+\./i);
            if (!match) {
                printLine('Erro: Use a sintaxe correta: docker build -t <tag> .', 'cmd-error');
                return;
            }
            const tag = match[1];
            const lines = [
                ['Sending build context to Docker daemon  42.15MB', 'cmd-output'],
                ['Step 1/5 : FROM node:18-alpine', 'cmd-output'],
                [' ---> 3c44249a5b3a', 'cmd-output'],
                ['Step 2/5 : WORKDIR /usr/src/app', 'cmd-output'],
                [' ---> Running in e38d21b38f83', 'cmd-output'],
                [' ---> 8c76ad87ab91', 'cmd-output'],
                ['Step 3/5 : COPY package*.json ./', 'cmd-output'],
                [' ---> 4bcf56a7c3d1', 'cmd-output'],
                ['Step 4/5 : RUN npm ci --only=production', 'cmd-output'],
                [' ---> Running in ad37bc7d2a5d', 'cmd-output'],
                [' ---> 98cf6510a2bd', 'cmd-output'],
                ['Step 5/5 : CMD ["node", "server.js"]', 'cmd-output'],
                [' ---> Running in 7289547d2a5d', 'cmd-output'],
                [' ---> Removing intermediate container 7289547d2a5d', 'cmd-output'],
                ['Successfully built 4fd910c2830f', 'cmd-success'],
                [`Successfully tagged ${tag}`, 'cmd-success']
            ];
            simulateProgress(lines, () => {
                systemState.images[tag] = { id: '4fd910c2830f', size: '42.1MB', created: 'Just now' };
                updateSandboxVisuals();
                if (currentGuideStep === 1) {
                    updateGuideStep(2);
                }
            });
            return;
        }

        // docker images
        if (normalizedCmd === 'docker images') {
            printLine('REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE', 'cmd-output');
            Object.entries(systemState.images).forEach(([name, img]) => {
                const tagSplit = name.split(':');
                const repo = tagSplit[0];
                const tagVal = tagSplit[1] || 'latest';
                // Alinhamento básico de espaços
                const repoCol = repo.padEnd(20, ' ');
                const tagCol = tagVal.padEnd(20, ' ');
                const idCol = img.id.padEnd(20, ' ');
                const createdCol = img.created.padEnd(20, ' ');
                printLine(`${repoCol}${tagCol}${idCol}${createdCol}${img.size}`, 'cmd-output');
            });
            if (currentGuideStep === 2 && Object.keys(systemState.images).length > 1) {
                updateGuideStep(3);
            }
            return;
        }

        // docker pull
        if (normalizedCmd.startsWith('docker pull ')) {
            const imgName = cmd.substring(12).trim();
            if (!imgName) {
                printLine('Erro: Especifique a imagem. Ex: docker pull ubuntu', 'cmd-error');
                return;
            }
            const isFullTag = imgName.includes(':');
            const cleanName = isFullTag ? imgName : `${imgName}:latest`;
            const lines = [
                [`Using default tag: ${isFullTag ? imgName.split(':')[1] : 'latest'}`, 'cmd-output'],
                [`${cleanName}: Pulling from library/${imgName.split(':')[0]}`, 'cmd-output'],
                ['5f70bf18a086: Pulling fs layer', 'cmd-output'],
                ['8a6dc5f7396c: Downloading [========================>]  12.4MB/12.4MB', 'cmd-output'],
                ['e02b32b14486: Extracting [==========================>]  23.1MB/23.1MB', 'cmd-output'],
                ['5f70bf18a086: Pull complete', 'cmd-output'],
                ['8a6dc5f7396c: Pull complete', 'cmd-output'],
                ['e02b32b14486: Pull complete', 'cmd-output'],
                ['Digest: sha256:82c7d2c1c3c9bf1814e82bd89283f5c86c12b7f7e279f5be637dbf20c29f64bf', 'cmd-output'],
                [`Status: Downloaded newer image for ${cleanName}`, 'cmd-success']
            ];
            simulateProgress(lines, () => {
                systemState.images[cleanName] = { id: 'a588b39a7b9c', size: '75.2MB', created: '1 day ago' };
                updateSandboxVisuals();
            });
            return;
        }

        // docker push
        if (normalizedCmd.startsWith('docker push ')) {
            const imgName = cmd.substring(12).trim();
            if (!imgName) {
                printLine('Erro: Especifique a imagem. Ex: docker push usuario/app:1.0', 'cmd-error');
                return;
            }
            if (!systemState.images[imgName] && !systemState.images[`${imgName}:latest`]) {
                printLine(`Erro: Imagem ${imgName} não encontrada localmente. Use "docker images" para ver as imagens salvas.`, 'cmd-error');
                return;
            }
            if (!systemState.dockerLoggedIn) {
                printLine(`docker: Error response from daemon: push access denied for ${imgName}, repository does not exist or may require 'docker login'.`, 'cmd-error');
                return;
            }
            const lines = [
                [`The push refers to repository [docker.io/${imgName}]`, 'cmd-output'],
                ['5f70bf18a086: Preparing', 'cmd-output'],
                ['8a6dc5f7396c: Preparing', 'cmd-output'],
                ['e02b32b14486: Pushing [==========================>]  15.2MB/15.2MB', 'cmd-output'],
                ['5f70bf18a086: Pushed', 'cmd-output'],
                ['8a6dc5f7396c: Pushed', 'cmd-output'],
                [`latest: digest: sha256:4fd910c2830f3fb262eb0209c12b7f7e279f5be637dbf20c29f64bf5d3989c size: 948`, 'cmd-success']
            ];
            simulateProgress(lines);
            return;
        }

        // docker tag
        if (normalizedCmd.startsWith('docker tag ')) {
            const parts = cmd.substring(11).trim().split(/\s+/);
            if (parts.length < 2) {
                printLine('Erro: Use a sintaxe correta: docker tag <imagem_local> <imagem_nova>', 'cmd-error');
                return;
            }
            const src = parts[0];
            const dest = parts[1];
            const foundKey = Object.keys(systemState.images).find(img => img === src || img.split(':')[0] === src);
            if (!foundKey) {
                printLine(`Erro: Imagem local "${src}" não encontrada no sistema.`, 'cmd-error');
                return;
            }
            systemState.images[dest] = { ...systemState.images[foundKey], created: 'Just now' };
            printLine(`Tag da imagem criada com sucesso: ${dest}`, 'cmd-success');
            updateSandboxVisuals();
            return;
        }

        // docker run
        if (normalizedCmd.startsWith('docker run ')) {
            const isInteractive = normalizedCmd.includes('-it') || normalizedCmd.includes('-i') || normalizedCmd.includes('-t');
            
            // Detectar qual imagem o usuário quer rodar
            let matchedImage = null;
            Object.keys(systemState.images).forEach(img => {
                if (cmd.includes(img) || cmd.includes(img.split(':')[0])) {
                    matchedImage = img;
                }
            });

            // Se o usuário digitou "docker run hello-world" ou "hello world"
            if (normalizedCmd.includes('hello world') || normalizedCmd.includes('hello-world')) {
                const lines = [
                    ['', 'cmd-output'],
                    ['Hello from Docker!', 'cmd-success'],
                    ['This message shows that your installation appears to be working correctly.', 'cmd-output'],
                    ['', 'cmd-output'],
                    ['To generate this message, Docker took the following steps:', 'cmd-output'],
                    [' 1. The Docker client contacted the Docker daemon.', 'cmd-output'],
                    [' 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.', 'cmd-output'],
                    [' 3. The Docker daemon created a new container from that image.', 'cmd-output'],
                    [' 4. The Docker daemon streamed that output to the Docker client.', 'cmd-output'],
                    ['', 'cmd-output']
                ];
                simulateProgress(lines);
                return;
            }

            if (isInteractive) {
                // Roda shell interativa (Ubuntu por exemplo)
                if (normalizedCmd.includes('ubuntu')) {
                    // Se não tiver a imagem do ubuntu localmente, puxa ela primeiro!
                    if (!systemState.images['ubuntu'] && !systemState.images['ubuntu:latest']) {
                        printLine("Unable to find image 'ubuntu:latest' locally", 'cmd-warning');
                        const lines = [
                            ['latest: Pulling from library/ubuntu', 'cmd-output'],
                            ['5f70bf18a086: Pull complete', 'cmd-output'],
                            ['Digest: sha256:82c7d2c1c3c9bf1814e82bd89283f5c86c12b7f7e279', 'cmd-output'],
                            ['Status: Downloaded newer image for ubuntu:latest', 'cmd-success']
                        ];
                        simulateProgress(lines, () => {
                            systemState.images['ubuntu:latest'] = { id: 'a588b39a7b9c', size: '75.2MB', created: '1 day ago' };
                            enterSubshell();
                        });
                        return;
                    }
                    enterSubshell();
                    return;
                }

                printLine('Erro: Apenas o container "ubuntu" oferece terminal interativo no DockerLab. Tente: docker run -it ubuntu bash', 'cmd-error');
                return;
            }

            // Se não for interativo, deve ser background ou run simples
            if (!matchedImage) {
                printLine('Erro: Especifique uma imagem válida ou uma criada/baixada por você. Use "docker images" para listar.', 'cmd-error');
                return;
            }

            // Extrair portas com regex
            let ports = '8080:80';
            const portMatch = cmd.match(/-p\s+([^\s]+)/i);
            if (portMatch) {
                ports = portMatch[1].split(':')[0];
            }

            // Extrair nome do container
            let cName = 'container-' + Math.random().toString(36).substring(2, 6);
            const nameMatch = cmd.match(/--name\s+([^\s]+)/i);
            if (nameMatch) {
                cName = nameMatch[1];
            }

            // Checar se já roda na mesma porta ou com o mesmo nome
            const exists = Object.values(systemState.containers).some(c => c.name === cName && c.status === 'running');
            if (exists) {
                printLine(`docker: Error response from daemon: Conflict. The container name "${cName}" is already in use.`, 'cmd-error');
                return;
            }

            const cId = Math.random().toString(16).substring(2, 14);
            systemState.containers[cId] = {
                id: cId,
                name: cName,
                image: matchedImage,
                ports: ports,
                status: 'running'
            };

            printLine(cId + '87ab919cf6510a2bd7289547d2a5dc588523c9103de3fb262', 'cmd-success');
            printLine(`Container "${cName}" iniciado em segundo plano na porta http://localhost:${ports.split(':')[0]}`, 'cmd-success');
            updateSandboxVisuals();

            if (currentGuideStep === 3) {
                updateGuideStep(4);
            }
            return;
        }

        function enterSubshell() {
            systemState.inSubshell = true;
            promptEl.textContent = 'root@ubuntu-container:/# ';
            printLine('root@ubuntu-container:/#', 'cmd-output');
            printLine('Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-generic x86_64)', 'cmd-output');
            printLine('You are now inside the virtual Ubuntu container. Type "exit" to leave.', 'cmd-output');
        }

        // docker ps
        if (normalizedCmd === 'docker ps') {
            const active = Object.values(systemState.containers).filter(c => c.status === 'running');
            printLine('CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                  NAMES', 'cmd-output');
            active.forEach(c => {
                const idCol = c.id.substring(0, 12).padEnd(20, ' ');
                const imgCol = c.image.padEnd(20, ' ');
                const cmdCol = '"/docker-entrypoint.…"'.padEnd(25, ' ');
                const createdCol = 'Just now'.padEnd(20, ' ');
                const statusCol = 'Up 1 second'.padEnd(20, ' ');
                const portsCol = `0.0.0.0:${c.ports}->80/tcp`.padEnd(23, ' ');
                printLine(`${idCol}${imgCol}${cmdCol}${createdCol}${statusCol}${portsCol}${c.name}`, 'cmd-output');
            });
            if (active.length === 0) {
                printLine('(nenhum container em execução)', 'cmd-output');
            }
            if (currentGuideStep === 4 && active.length > 0) {
                printLine('🚀 PARABÉNS! Você rodou um container de forma bem-sucedida no simulador!', 'cmd-success');
            }
            return;
        }

        // docker ps -a
        if (normalizedCmd === 'docker ps -a') {
            printLine('CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                  NAMES', 'cmd-output');
            Object.values(systemState.containers).forEach(c => {
                const idCol = c.id.substring(0, 12).padEnd(20, ' ');
                const imgCol = c.image.padEnd(20, ' ');
                const cmdCol = '"/docker-entrypoint.…"'.padEnd(25, ' ');
                const createdCol = 'Just now'.padEnd(20, ' ');
                const statusCol = (c.status === 'running' ? 'Up 1 second' : 'Exited (0) Just now').padEnd(20, ' ');
                const portsCol = (c.status === 'running' ? `0.0.0.0:${c.ports}->80/tcp` : '').padEnd(23, ' ');
                printLine(`${idCol}${imgCol}${cmdCol}${createdCol}${statusCol}${portsCol}${c.name}`, 'cmd-output');
            });
            if (Object.keys(systemState.containers).length === 0) {
                printLine('(nenhum container registrado)', 'cmd-output');
            }
            return;
        }

        // docker stop
        if (normalizedCmd.startsWith('docker stop ')) {
            const target = cmd.substring(12).trim();
            const found = Object.values(systemState.containers).find(c => c.id.startsWith(target) || c.name === target);
            if (found) {
                found.status = 'stopped';
                printLine(target, 'cmd-success');
                updateSandboxVisuals();
                if (currentGuideStep === 4) {
                    updateGuideStep(3);
                }
            } else {
                printLine(`docker: Error: No such container: ${target}`, 'cmd-error');
            }
            return;
        }

        // docker rm
        if (normalizedCmd.startsWith('docker rm ')) {
            const target = cmd.substring(10).trim();
            const foundKey = Object.keys(systemState.containers).find(id => id.startsWith(target) || systemState.containers[id].name === target);
            if (foundKey) {
                if (systemState.containers[foundKey].status === 'running') {
                    printLine(`docker: Error response from daemon: You cannot remove a running container ${target}. Stop the container before attempting removal.`, 'cmd-error');
                } else {
                    delete systemState.containers[foundKey];
                    printLine(target, 'cmd-success');
                    updateSandboxVisuals();
                }
            } else {
                printLine(`docker: Error: No such container: ${target}`, 'cmd-error');
            }
            return;
        }

        // docker rmi
        if (normalizedCmd.startsWith('docker rmi ')) {
            const target = cmd.substring(11).trim();
            const foundImg = Object.keys(systemState.images).find(img => img === target || img.split(':')[0] === target);
            if (foundImg) {
                // Checar se há containers usando a imagem
                const inUse = Object.values(systemState.containers).some(c => c.image === foundImg);
                if (inUse) {
                    printLine(`docker: Error response from daemon: conflict: unable to delete ${target} - image is being used by active or stopped container`, 'cmd-error');
                } else {
                    delete systemState.images[foundImg];
                    printLine(`Untagged: ${target}`, 'cmd-output');
                    printLine(`Deleted: sha256:${foundImg === 'nginx:alpine' ? '3c44249a5b3a' : '4fd910c2830f'}`, 'cmd-success');
                    updateSandboxVisuals();
                }
            } else {
                printLine(`docker: Error: No such image: ${target}`, 'cmd-error');
            }
            return;
        }

        // docker system prune
        if (normalizedCmd.startsWith('docker system prune')) {
            let deletedCount = 0;
            Object.keys(systemState.containers).forEach(id => {
                if (systemState.containers[id].status === 'stopped') {
                    delete systemState.containers[id];
                    deletedCount++;
                }
            });
            const lines = [
                ['WARNING! This will remove:', 'cmd-output'],
                ['  - all stopped containers', 'cmd-output'],
                ['  - all networks not used by at least one container', 'cmd-output'],
                ['  - all dangling images', 'cmd-output'],
                ['Are you sure you want to continue? [y/N] y', 'cmd-output'],
                [`Deleted ${deletedCount} containers.`, 'cmd-success'],
                ['Total reclaimed space: 12.5MB', 'cmd-success']
            ];
            simulateProgress(lines, () => {
                updateSandboxVisuals();
            });
            return;
        }

        // Caso comando não reconhecido
        printLine(`bash: ${cmd.split(' ')[0]}: comando não encontrado. Digite 'help' para ver os comandos disponíveis.`, 'cmd-error');
    }

    // 5. Explicações do Explicador de Sintaxe Interativo (Aba Escrevendo Docker)
    const explanations = {
        // Dockerfile Keys
        'df-from': '<strong>FROM node:18-alpine</strong><br>Define a imagem base para o container. O Docker não cria tudo do zero; aqui ele obtém uma imagem pré-configurada contendo o Node.js v18 rodando em cima da distribuição Linux Alpine, que é extremamente leve (cerca de 5MB) e segura.',
        'df-workdir': '<strong>WORKDIR /usr/src/app</strong><br>Define o diretório de trabalho padrão dentro do container. Qualquer comando subsequente (como COPY, RUN, CMD) será executado a partir desta pasta. Se o diretório não existir, o Docker cria ele automaticamente.',
        'df-copy-dep': '<strong>COPY package*.json ./</strong><br>Copia apenas os arquivos de dependências (package.json e package-lock.json) para o diretório de trabalho atual. Fazer isso antes de copiar o resto do código permite que o Docker armazene as dependências em cache, acelerando muito os builds futuros.',
        'df-run': '<strong>RUN npm ci --only=production</strong><br>Executa comandos do sistema durante a compilação da imagem. Aqui, ele instala as dependências do Node de forma limpa (ci) e rápida, excluindo bibliotecas de desenvolvimento.',
        'df-copy-all': '<strong>COPY . .</strong><br>Copia todo o código-fonte do diretório local para dentro do diretório de trabalho do container. Note que ele respeita as regras do arquivo <code>.dockerignore</code> para não copiar pastas indesejadas (como node_modules).',
        'df-env': '<strong>ENV PORT=3000</strong><br>Define variáveis de ambiente persistentes dentro do container. Podem ser lidas pela aplicação (como process.env.PORT no Node) e alteradas ao iniciar o container com <code>docker run -e</code>.',
        'df-user': '<strong>USER node</strong><br>Define o usuário do sistema que executará o container. Por boas práticas de segurança, evitamos rodar como "root". O usuário "node" é criado por padrão na imagem base do Node.',
        'df-expose': '<strong>EXPOSE 3000</strong><br>Documenta qual porta de rede o container escuta internamente. Atenção: este comando serve apenas como metadado documental, ele não realiza o mapeamento de portas na sua máquina física por si só.',
        'df-volume': '<strong>VOLUME /usr/src/app/data</strong><br>Cria um ponto de montagem para volumes persistentes. Informa ao Docker que os dados salvos nesta pasta interna devem ser preservados fora do ciclo de vida volátil do container.',
        'df-cmd': '<strong>CMD ["node", "server.js"]</strong><br>Define o comando padrão que será executado quando o container for instanciado. Diferente do RUN, o CMD não roda durante o build, e sim ao iniciar o container. Só pode haver um CMD por Dockerfile.',

        // docker-compose.yml Keys
        'dc-version': '<strong>version: \'3.8\'</strong><br>Informa a versão de especificação da sintaxe do arquivo Docker Compose que está sendo utilizada. Permite garantir compatibilidade com os recursos do Docker Engine local.',
        'dc-services': '<strong>services:</strong><br>Inicia a definição dos serviços (containers) que farão parte da sua aplicação orquestrada. Cada item abaixo deste bloco se comportará como um container isolado.',
        'dc-service-name': '<strong>web-app:</strong><br>O nome amigável do serviço. O Compose usará este nome para rotular o container e criar uma entrada de DNS interna na rede virtual para que os serviços conversem entre si.',
        'dc-build': '<strong>build: .</strong><br>Instrui o Compose a compilar localmente um <code>Dockerfile</code> localizado no diretório atual (representado pelo ponto <code>.</code>). O Compose se encarrega de construir a imagem automaticamente.',
        'dc-image': '<strong>image: meu-app-node:latest</strong><br>Define o nome e a tag da imagem a ser criada a partir do build local (ou baixada do Docker Hub caso a propriedade \'build\' não seja especificada).',
        'dc-ports': '<strong>ports:</strong><br>Inicia a lista de mapeamento de portas de rede entre a máquina hospedeira (host) e o container.',
        'dc-ports-val': '<strong>- "8080:3000"</strong><br>Mapeia a porta 8080 da sua máquina local (Host) para a porta 3000 de dentro do container. Acessar <code>http://localhost:8080</code> no navegador vai direcionar para a porta 3000 do container.',
        'dc-environment': '<strong>environment:</strong><br>Inicia o bloco de declaração de variáveis de ambiente personalizadas que serão injetadas dentro do container em tempo de execução.',
        'dc-env-val': '<strong>- DB_HOST=db</strong><br>Declara uma variável chamada DB_HOST com valor \'db\'. Desta forma, a aplicação sabe que o host do banco de dados atende pelo nome do serviço \'db\' na mesma rede.',
        'dc-volumes': '<strong>volumes:</strong><br>Inicia a seção de mapeamento de volumes persistentes ou montagem de pastas compartilhadas (bind mounts).',
        'dc-volumes-val': '<strong>- .:/usr/src/app</strong><br>Mapeia a pasta local atual (Host) para <code>/usr/src/app</code> no container. Isso permite "hot-reload", onde alterar um código local altera o arquivo no container em tempo real.',
        'dc-restart': '<strong>restart: unless-stopped</strong><br>Política de reinicialização automática. Se o container falhar ou se o Docker for reiniciado, o container sobe sozinho, a menos que você o tenha parado manualmente via comando.',
        'dc-networks': '<strong>networks:</strong><br>Especifica em quais redes virtuais personalizadas do Docker este container estará conectado.',
        'dc-networks-val': '<strong>- rede-app</strong><br>Conecta o container à rede virtual \'rede-app\'. Todos os containers nesta mesma rede conseguem se comunicar livremente isolados do resto.',

        // .dockerignore Keys
        'di-node': '<strong>node_modules/</strong><br>Instrui o Docker a nunca copiar a pasta de dependências locais (node_modules) para dentro da imagem. Isso é crítico para evitar conflitos de arquitetura de compilação e builds gigantescos.',
        'di-git': '<strong>.git</strong><br>Impede o envio do histórico completo do repositório Git para o container. Mantém o container limpo e evita vazamento de dados de versionamento.',
        'di-logs': '<strong>*.log</strong><br>Evita copiar arquivos de log temporários gerados localmente que apenas ocupam espaço desnecessário no container.',
        'di-env': '<strong>.env</strong><br>Exclui o arquivo de credenciais e variáveis confidenciais locais. Isso previne que senhas e chaves privadas sejam inseridas na imagem pública do container.',
        'di-self': '<strong>Dockerfile</strong><br>Exclui o próprio arquivo de receita da imagem. Ele não é necessário para o funcionamento da aplicação interna rodando no container.',
        'di-ignore': '<strong>.dockerignore</strong><br>Exclui o próprio arquivo de ignore, mantendo a estrutura interna do container limpa.'
    };

    const interactiveLines = document.querySelectorAll('.interactive-line');

    interactiveLines.forEach(line => {
        line.addEventListener('click', () => {
            const expId = line.getAttribute('data-explanation');
            const explanationText = explanations[expId];
            
            // Descobrir em qual coluna está
            const parentContainer = line.closest('.syntax-container');
            const displayEl = parentContainer.querySelector('.explanation-display');
            
            // Remover 'active' de todas as linhas do mesmo container
            parentContainer.querySelectorAll('.interactive-line').forEach(l => l.classList.remove('active'));
            // Adicionar 'active' na linha clicada
            line.classList.add('active');
            
            // Atualizar o texto de explicação com animação suave
            displayEl.style.opacity = 0;
            setTimeout(() => {
                displayEl.innerHTML = explanationText;
                displayEl.style.opacity = 1;
            }, 150);
        });
    });
});
