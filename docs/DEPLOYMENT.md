# Guia de implantação — OBJ_TO Time Tracker

Este guia cobre a implantação do **servidor** (API de sincronização + interface
web). O app desktop é distribuído como instalador gerado pelo Tauri e não exige
servidor — a sincronização é opcional.

> Todos os comandos assumem a **raiz do repositório** como diretório de trabalho.

---

## 1. Visão geral

O servidor é um processo Node único que:

- Persiste os dados em um arquivo **SQLite** (modo WAL).
- Expõe a API REST (`/api/data`, `/sync`, `/health`).
- Serve o build estático do React (SPA) a partir de `/app/public` no container.

Tudo roda em **um container**. O banco fica em um volume nomeado; o SPA é montado
como volume somente-leitura a partir de `./dist`.

---

## 2. Pré-requisitos

- **Docker** + **Docker Compose** (v2).
- **Node 20+** na máquina de build (apenas para gerar `./dist`).
- Para implantação sem Docker: Node 20+ e toolchain de compilação nativa
  (`python3`, `make`, `g++`) para o `better-sqlite3`.

---

## 3. Implantação com Docker (recomendado)

### 3.1. Build do SPA

O `docker-compose.yml` monta `./dist` como `/app/public:ro`. Portanto gere o
build do cliente **antes** de subir o container:

```bash
npm install
npm run build        # produz ./dist
```

### 3.2. Configurar o ambiente

```bash
cp .env.example .env
```

`.env`:

```ini
PORT=3001              # porta exposta no host
DB_PATH=/data/objto.db # caminho do SQLite dentro do container (não alterar)
```

### 3.3. Subir

```bash
docker compose up -d --build
```

Verifique:

```bash
curl http://localhost:3001/health     # {"ok":true,"ts":...}
```

Abra `http://localhost:3001` no navegador.

### 3.4. O que o compose faz

```yaml
services:
  server:
    build: ./server
    container_name: objto-server
    restart: unless-stopped
    ports:
      - "${PORT:-3001}:3001"
    environment:
      - PORT=3001
      - DB_PATH=/data/objto.db
    volumes:
      - ./dist:/app/public:ro       # SPA (somente leitura)
      - objto-data:/data            # banco persistente
```

- `objto-data` sobrevive a `docker compose down`. Para apagar os dados:
  `docker compose down -v`.
- Atualizou o SPA? Basta `npm run build` de novo e recarregar o navegador — como
  é um volume, **não precisa** reconstruir a imagem. (Reconstrua a imagem só
  quando mudar código do servidor.)

> **Nota sobre o build nativo:** o `Dockerfile` instala `python3 make g++` como
> dependências virtuais para compilar o `better-sqlite3` em Alpine/musl e as
> remove em seguida, mantendo a imagem enxuta.

---

## 4. Implantação sem Docker

```bash
# 1. Build do cliente
npm install && npm run build

# 2. Coloque o SPA onde o servidor o procura
mkdir -p server/public
cp -r dist/* server/public/

# 3. Suba o servidor
cd server
npm install                      # compila better-sqlite3
DB_PATH=/var/lib/objto/objto.db PORT=3001 npm start
```

O servidor procura o SPA em `server/public` (`path.join(__dirname, '../public')`).
Garanta que o diretório `DB_PATH` exista e seja gravável.

Para mantê-lo vivo, use um gerenciador de processos (systemd, pm2):

```ini
# /etc/systemd/system/objto.service
[Unit]
Description=OBJ_TO Time Tracker
After=network.target

[Service]
WorkingDirectory=/opt/objto/server
Environment=PORT=3001
Environment=DB_PATH=/var/lib/objto/objto.db
ExecStart=/usr/bin/node src/index.js
Restart=always
User=objto

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now objto
```

---

## 5. Segurança ⚠️

O servidor foi desenhado para **uso pessoal (single-user)** e, no estado atual:

- **Não tem autenticação.** O usuário é apenas um parâmetro `?user=<nome>`.
  Qualquer um que adivinhe o nome lê/escreve/apaga os dados daquele usuário.
- **CORS aberto** (`app.use(cors())`) — aceita requisições de qualquer origem.
- **Sem rate limiting.**

Recomendações antes de expor fora da sua máquina:

1. **Não publique a porta direto na internet.** Mantenha o bind em `localhost`
   e coloque atrás de um **proxy reverso** (nginx/Caddy) com **TLS**.
2. Adicione **autenticação na borda** — Basic Auth no proxy, ou um túnel
   privado (Tailscale/WireGuard), ou OAuth via proxy.
3. Se precisar de CORS restrito, configure a origem permitida explicitamente no
   `cors()`.

Exemplo de proxy Caddy com Basic Auth + TLS automático:

```
objto.seudominio.com {
    basicauth {
        usuario JD2y...hash    # caddy hash-password
    }
    reverse_proxy localhost:3001
}
```

---

## 6. Backup e restauração

O banco é um único arquivo SQLite no volume `objto-data` (ou em `DB_PATH`).
Como usa WAL, faça o backup com o servidor parado **ou** copie os três arquivos
(`objto.db`, `objto.db-wal`, `objto.db-shm`).

**Backup (Docker):**

```bash
docker compose stop server
docker run --rm -v objto-data:/data -v "$PWD":/backup alpine \
  sh -c 'cp /data/objto.db* /backup/'
docker compose start server
```

**Restauração:**

```bash
docker compose stop server
docker run --rm -v objto-data:/data -v "$PWD":/backup alpine \
  sh -c 'cp /backup/objto.db* /data/'
docker compose start server
```

Sem Docker: pare o serviço e copie `$DB_PATH*`.

---

## 7. Atualizações

| Mudou… | Faça |
|--------|------|
| Só o cliente (React) | `npm run build` → recarregue o navegador (volume) |
| Código do servidor | `docker compose up -d --build` |
| Schema do banco | As tabelas usam `CREATE TABLE IF NOT EXISTS`; novas colunas exigem migração manual (`ALTER TABLE`) — o schema atual não versiona migrações. |

---

## 8. Solução de problemas

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `/health` ok mas página em branco | SPA não montado | Confirme que `./dist` existe e o volume `:/app/public:ro` está no compose |
| Sessões "Não classificado" após recarregar (web) | Mapeamento de campos | Confirme que está rodando a versão com `rowToSession`/`rowToProject` corrigidos |
| Falha ao instalar `better-sqlite3` | Falta toolchain nativo | No host: instale `python3 make g++`. No Docker: já incluso no Dockerfile |
| Dados sumiram após `down` | Volume removido | Nunca use `down -v` em produção; restaure do backup |
| Porta em uso | Outro processo na `PORT` | Ajuste `PORT` no `.env` |

---

## 9. Referência rápida

```bash
# Build + subir
npm run build
docker compose up -d --build

# Logs
docker compose logs -f server

# Parar / iniciar
docker compose stop server
docker compose start server

# Derrubar (mantém dados)
docker compose down

# Saúde
curl http://localhost:3001/health
```
