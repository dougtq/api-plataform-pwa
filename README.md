# API Platform PWA & Desktop

Uma plataforma robusta para testes de API, inspirada no Postman e Insomnia, desenvolvida como uma Progressive Web App (PWA) e aplicação Desktop nativa via Electron. 

O projeto foca em **Local-First Persistence**, **Zero CORS Issues** (no desktop) e uma experiência de desenvolvedor premium com VS Code-like aesthetics.

---

## 🚀 Tecnologias (Stack)

O projeto utiliza o que há de mais moderno no ecossistema JavaScript/TypeScript:

| Área | Tecnologia | Motivo |
| :--- | :--- | :--- |
| **Core** | [React 19](https://react.dev/) | UI reativa e componentes performáticos. |
| **Build & Dev** | [Vite 6](https://vitejs.dev/) | Hot Module Replacement (HMR) instantâneo e build ultra rápido. |
| **Desktop** | [Electron](https://www.electronjs.org/) | Encapsula a web app como um app nativo, permitindo acesso ao SO. |
| **PWA** | [Vite PWA Plugin](https://vite-pwa-org.netlify.app/) | Service Workers para offline e instalação como app no navegador. |
| **Estado** | [Zustand](https://zustand-demo.pmnd.rs/) | Gerenciamento de estado simples, escalável e persistente. |
| **Banco de Dados** | [Dexie.js](https://dexie.org/) | Wrapper amigável para IndexedDB (banco local do navegador). |
| **Editor de Código** | [Monaco Editor](https://microsoft.github.io/monaco-editor/) | O mesmo motor do VS Code para edição de JSON/Body. |
| **Estilização** | [Tailwind CSS 4](https://tailwindcss.com/) | Design utilitário rápido e consistente. |
| **Testes** | [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/) | Testes unitários rápidos e testes E2E robustos. |

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- Node.js (v18 ou superior)
- npm ou yarn

### 1. Instalação
```bash
npm install
```

### 2. Desenvolvimento (Modo Híbrido)
Este comando inicia o servidor Vite para a Web e abre a janela do Electron simultaneamente.
```bash
npm run dev
```

### 3. Build (Desktop & PWA)
Gera os arquivos otimizados na pasta `dist/`.
```bash
npm run build
```

### 4. Preview da PWA
Simula o ambiente de produção da PWA (servindo os arquivos estáticos built).
```bash
npm run preview
```

### 5. Testes
- **Unitários/Integração (Vitest):**
  ```bash
  npm test
  ```
- **E2E (Playwright - Electron):**
  ```bash
  npm run test:e2e
  ```

---

## 🏗️ Como o código funciona?

Se você está começando agora, aqui está o "mapa da mina" para entender este projeto:

### 1. A Arquitetura Electron (O Coração do App)
O Electron divide o app em três partes principais:
- **Main Process (`src/main/`)**: É o "cérebro". Ele tem acesso total ao seu computador (arquivos, rede sem restrição de CORS). Ele cria a janela do navegador.
- **Renderer Process (`src/renderer/`)**: É o que você vê (React). Ele roda como uma página web comum.
- **Preload Script (`src/preload/`)**: É a "ponte" segura. O Renderer não pode acessar o computador diretamente por segurança. O Preload expõe funções específicas (via `contextBridge`) para o Renderer conversar com o Main.

### 2. O Fluxo de uma Requisição (O Caminho do "Send")
Quando você clica no botão **Send**, acontece essa viagem:
1. **UI (`RequestPanel.tsx`)**: O componente chama a action `sendRequest()` do Zustand.
2. **Store (`useStore.ts`)**: A store organiza os Headers, Params e Auth e chama o `ApiService`.
3. **Service (`ApiService.ts`)**: 
   - Se estiver no **Browser (PWA)**: Usa `fetch` padrão (sujeito a bloqueios de CORS).
   - Se estiver no **Desktop (Electron)**: Envia o pedido via IPC (Inter-Process Communication) para o Main Process.
4. **Main (`src/main/index.ts`)**: Recebe o pedido, usa a biblioteca `axios` para fazer a chamada (que no Node.js não tem problemas de CORS) e devolve a resposta para o React.

### 3. Persistência Local (Local-First)
Não temos um banco de dados no servidor (PostgreSQL, MongoDB). Tudo o que você cria (Coleções, Requisições, Histórico) é salvo no **IndexedDB** do seu próprio navegador/computador usando o **Dexie.js**. 
- **Update V2/V3:** Quando mudamos a estrutura dos dados, incrementamos a versão no `db.ts` para que o Dexie saiba como migrar os dados antigos.

### 4. Sincronização Mágica (URL vs Params)
No `RequestPanel.tsx`, usamos um `useEffect` e funções de sincronização. Se você digita `?id=123` na URL, o projeto quebra isso e preenche a tabela de Params automaticamente. Se você altera o valor na tabela, a URL se reconstrói. 

---

## 📂 Estrutura de Pastas

- `src/main`: Código do processo principal do Electron.
- `src/preload`: Scripts de ponte entre Main e Renderer.
- `src/renderer`: Toda a aplicação React (UI).
  - `/components`: Botões, Sidebars, Paineis.
  - `/db`: Configuração do Dexie.js.
  - `/store`: Estado global com Zustand.
  - `/services`: Lógica de API e Importer do Postman.
- `tests`: Testes de ponta a ponta (E2E) com Playwright.

---

## 💎 Destaques do Design
- **Key-Value Editor**: Gera linhas infinitas conforme você digita.
- **Postman Importer**: Importa coleções complexas com pastas aninhadas de forma recursiva.
- **VS Code Syntax**: O Monaco Editor traz cores e validação para o seu JSON.

---
Desenvolvido com ❤️ por Antigravity (Pair Programming Assistant)