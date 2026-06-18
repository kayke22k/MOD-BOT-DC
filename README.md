# 🎮 SPRP — Bot de Moderação

---

## ✅ Funcionalidades

| Módulo | Comandos / Funções |
|---|---|
| **Punições** | `!ban` `!tempban` `!unban` `!kick` |
| **Advertências** | `!warn` `!warns` `!unwarn` (3 warns = ban auto) |
| **Staff** | `!warnstaff` `!warnsstaf` |
| **Castigo** | `!castigo` `!uncastigo` (com duração automática) |
| **Anti-Alt** | `!altban` `!linkalts` `!alts` `!containfo` |
| **Utilitários** | `!clean` `!tp` `!perms` `!help` |
| **AutoMod** | Anti-link, Anti-invite, Anti-flood, Anti-bot, Anti-alt |

---

## 🚀 Instalação

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar o bot
Edite o arquivo `config.json`:

```json
{
  "token": "SEU_TOKEN_AQUI",
  "guildId": "ID_DO_SEU_SERVIDOR",
  "channels": {
    "logs":      "ID_CANAL_DE_LOGS",
    "stafflogs": "ID_CANAL_LOGS_DA_STAFF"
  },
  "roles": {
    "staff":   ["ID_CARGO_ADM", "ID_CARGO_MOD"],
    "castigo": "ID_CARGO_CASTIGO"
  }
}
```

### 3. Criar o token do bot
1. Acesse: https://discord.com/developers/applications
2. Crie um novo aplicativo
3. Vá em **Bot** > **Reset Token** e copie o token
4. Ative os **Privileged Gateway Intents**:
   - ✅ Server Members Intent
   - ✅ Message Content Intent

### 4. Convidar o bot
Use o OAuth2 URL Generator com as permissões:
- `Administrator` (ou manual: ban, kick, manage roles, manage messages)

### 5. Iniciar
```bash
npm start
```

---

## ☁️ Deploy na Square Cloud

1. Comprima todos os arquivos em um `.zip` (sem incluir a pasta `node_modules`)
2. Acesse https://squarecloud.app
3. Faça upload do `.zip`
4. O `squarecloud.app` já está configurado

---

## ⚙️ Sistema Anti-Alt

O bot detecta contas suspeitas automaticamente na entrada:

| Situação | Ação |
|---|---|
| Alt cadastrada com `!altban` | 🔨 Ban automático imediato |
| Conta com menos de 7 dias | 🚫 Kick automático + alerta staff |
| Conta com menos de 30 dias | ⚠️ Alerta para a staff |
| Sem foto de perfil | ⚠️ Flag no alerta |

Para desativar o kick automático de contas novas, defina no `config.json`:
```json
"antialt": {
  "autoKickNewAccounts": false
}
```

---

## 📁 Estrutura de arquivos

```
gta-rp-bot/
├── index.js          ← Arquivo principal
├── config.json       ← Configurações do servidor
├── package.json
├── squarecloud.app   ← Deploy Square Cloud
├── commands/         ← Todos os comandos
└── data/             ← Dados persistidos (warns, bans, etc.)
    ├── warns.json
    ├── staffwarns.json
    ├── tempbans.json
    ├── castigados.json
    ├── alts.json
    └── permissions.json
```

---

## 🔑 Sistema de Permissões

O bot possui um sistema de permissões **que sobrescreve as nativas do Discord**.

```
!perms set @mod ban true       → Permite que @mod use !ban
!perms set @mod kick false     → Impede @mod de usar !kick
!perms list @mod               → Lista permissões customizadas
!perms reset @mod              → Volta ao padrão do cargo
```

Permissões disponíveis: `ban` `tempban` `unban` `kick` `warn` `warnstaff` `clean` `castigo` `tp` `warns` `unwarn`
