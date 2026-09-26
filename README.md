# 🥗 NutriScan

Aplicativo mobile em **React Native + Expo** que fotografa a tabela nutricional de um produto, extrai o texto via **OCR**, interpreta os valores nutricionais e classifica o produto como:

- 🟢 **Saudável**
- 🟡 **Moderado**
- 🔴 **Evitar**

As análises ficam salvas localmente (**Expo SQLite**) e sincronizam com a nuvem (**Supabase/PostgreSQL**) quando há internet — o app funciona normalmente mesmo offline.

> 📚 Projeto acadêmico — curso de Engenharia de Software (Uni-FACEF), com foco em Visão Computacional, persistência local/remota e arquitetura offline-first.

---

## Índice

- [Como funciona](#como-funciona)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como rodar](#como-rodar)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Objetivo acadêmico](#objetivo-acadêmico)
- [Autor](#autor)

---

## Como funciona

O fluxo de uma análise, do início ao fim:

```
Login/Cadastro → Câmera → OCR → Parser → Classificação → SQLite (local) → Supabase (nuvem, se online)
```

**Exemplo prático:** o app fotografa um rótulo, o OCR devolve um texto bruto como:

```
INFORMAÇÃO NUTRICIONAL
Valor energético 492 kcal
Açúcares 3,3 g
Gorduras saturadas 24 g
Sódio 2050 mg
```

O parser transforma isso em dados estruturados, e o `classificationService.js` aplica as regras de classificação (Saudável/Moderado/Evitar).

> ⚠️ A classificação tem finalidade **educacional** e não substitui orientação de um profissional de nutrição. Os critérios foram simplificados para fins acadêmicos.

### Funcionamento offline-first

Toda análise é salva **primeiro no SQLite local** — o app nunca depende de internet para funcionar. Quando há conexão, os registros pendentes são enviados ao Supabase automaticamente:

| Situação | O que acontece |
|---|---|
| Com internet | Análise salva no SQLite → sincronizada com o Supabase |
| Sem internet | Análise salva no SQLite → fica disponível no histórico normalmente |
| Conexão restaurada | Análises pendentes são sincronizadas automaticamente com o Supabase |

---

## Funcionalidades

**🔐 Autenticação** (via Supabase Auth)
- Cadastro e login com e-mail/senha
- Sessão persistente
- Dados separados por usuário (cada análise pertence a um `user_id`)

**🔎 OCR**
- Reconhecimento de texto via [OCR.space API](https://ocr.space/ocrapi)

**🧮 Classificação nutricional**
- Regras definidas em `src/services/classificationService.js`

**💾 Histórico offline-first**
- Análises sempre acessíveis, mesmo sem internet
- Indicador de status: *"Conectado"* ou *"Offline — sincroniza quando houver conexão"*

---

## Arquitetura

```
Interface (React Native + Expo)
        ↓
Navegação (React Navigation)
        ↓
Serviços (OCR · Parser · Classificação · Sync)
        ↓
Banco local (SQLite)  ⇄  Backend remoto (Supabase/PostgreSQL)
```

### Segurança dos dados

A tabela de análises usa **Row Level Security (RLS)** no Supabase: cada usuário só acessa suas próprias análises, restringindo automaticamente por `auth.uid()` = `user_id`.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| React Native + Expo | Desenvolvimento e ambiente do app mobile |
| Expo Camera | Captura das imagens |
| Expo SQLite | Banco de dados local |
| OCR.space | Reconhecimento óptico de caracteres |
| Supabase Auth | Autenticação |
| Supabase / PostgreSQL | Backend e banco de dados remoto |
| React Navigation | Navegação entre telas |
| NetInfo | Detecção de conectividade |

---

## Estrutura do projeto

```
nutriscan/
├── App.js
├── app.config.js
├── package.json
├── .env.example
│
└── src/
    ├── config/          → supabase.js, ocr.js
    ├── database/        → db.js (SQLite)
    ├── navigation/       → AppNavigator.js
    ├── screens/          → Camera, History, Result, Login, Signup
    ├── services/         → ocrService, parserService, classificationService, syncService
    └── utils/            → uuid.js
```

### Pipeline de processamento (onde está cada etapa)

| Etapa | Arquivo |
|---|---|
| 1. Aquisição da imagem | `src/screens/CameraScreen.js` |
| 2. OCR | `src/services/ocrService.js` |
| 3. Processamento do texto | `src/services/parserService.js` |
| 4. Classificação | `src/services/classificationService.js` |
| 5. Armazenamento local | `src/database/db.js` |
| 6. Sincronização | `src/services/syncService.js` |

### Tabela do banco local — `analises_nutricionais`

| Campo | Descrição |
|---|---|
| `id` | Identificador único |
| `user_id` | Usuário responsável pela análise |
| `nome_produto` | Nome identificado do produto |
| `calorias`, `acucares`, `sodio`, `gorduras_saturadas` | Valores extraídos |
| `status` | Classificação (saudável/moderado/evitar) |
| `texto_bruto_ocr` | Texto bruto retornado pelo OCR |
| `imagem_uri` | Caminho da imagem no dispositivo |
| `criado_em` | Data e hora da análise |
| `sincronizado` | Estado de sincronização com o Supabase |

---

## Como rodar

### Pré-requisitos
- [Node.js](https://nodejs.org) 18 ou superior
- [Git](https://git-scm.com) (para clonar o repositório)
- App **Expo Go** instalado no celular

Verifique as versões instaladas:
```bash
node --version
npm --version
git --version
```

### 1. Clonar e instalar

```bash
git clone https://github.com/SEU-USUARIO/nutriscan.git
cd nutriscan
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

Preencha o `.env` com suas credenciais:
```env
OCR_SPACE_API_KEY=sua_chave_aqui
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_aqui
```

> ⚠️ O `.env` já está no `.gitignore` — nunca deve ser enviado ao GitHub.

**Obtendo a chave do OCR.space:** crie uma conta em [ocr.space/ocrapi](https://ocr.space/ocrapi), gere uma API Key gratuita e cole no `.env`.

**Obtendo as credenciais do Supabase:** crie um projeto em [supabase.com](https://supabase.com), acesse **Project Settings → API**, copie a **Project URL** e a chave **anon public**.

### 3. Executar

```bash
npx expo start
```

Escaneie o QR code exibido no terminal com o app **Expo Go** (Android: scanner do próprio app; iOS: câmera nativa).

Também é possível abrir direto em uma plataforma específica:
```bash
npx expo start --android
npx expo start --ios
```

---

## Segurança e privacidade

- Nunca commite API keys, senhas ou tokens diretamente no código.
- Todas as credenciais ficam no `.env` (ignorado pelo Git); o repositório expõe só o `.env.example`, com os nomes das variáveis necessárias.
- O acesso aos dados no Supabase é restrito por usuário via Row Level Security (RLS).

---

## Objetivo acadêmico

Projeto desenvolvido para demonstrar, na prática:

Visão Computacional · OCR · Desenvolvimento mobile · Bancos de dados locais e remotos · Arquitetura offline-first · Autenticação · Segurança de dados · Sincronização

---

## Autor

**Lucas Ramos Silva**
Projeto acadêmico — Engenharia de Software, Uni-FACEF
