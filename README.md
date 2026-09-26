# 🥗 NutriScan

Aplicativo mobile desenvolvido em **React Native + Expo** para análise de
informações nutricionais de produtos alimentícios.

O usuário fotografa a tabela nutricional de um produto utilizando a câmera do
celular. O aplicativo utiliza **OCR** para reconhecer o texto da imagem,
interpreta os principais valores nutricionais e classifica o produto em:

- 🟢 **Saudável**
- 🟡 **Moderado**
- 🔴 **Evitar**

As análises são armazenadas localmente utilizando **Expo SQLite** e
sincronizadas com **Supabase/PostgreSQL** quando existe conexão com a
internet, permitindo que o histórico continue disponível mesmo em situações
offline.

> 📚 Projeto acadêmico desenvolvido para o curso de Engenharia de Software,
> com foco em Visão Computacional, armazenamento local e computação
> offline-first.

---

# 📱 Demonstração

O fluxo principal do aplicativo é:

```text
Login / Cadastro
       ↓
     Câmera
       ↓
 Fotografia do rótulo
       ↓
      OCR
       ↓
 Interpretação dos dados
       ↓
   Classificação
       ↓
     SQLite
       ↓
  ┌────┴────┐
  │         │
Offline   Online
  │         │
  │      Supabase
  │         │
  └────┬────┘
       ↓
    Histórico

Funcionalidades
🔐 Autenticação
Cadastro de novos usuários
Login com e-mail e senha
Persistência da sessão
Identificação individual dos usuários
Dados separados por usuário

A autenticação é realizada utilizando Supabase Auth.

🔎 OCR

O reconhecimento óptico de caracteres é realizado utilizando a
OCR.space API.

O OCR transforma a imagem da tabela nutricional em texto que posteriormente é
processado pelo parser do aplicativo.

Exemplo simplificado:

INFORMAÇÃO NUTRICIONAL

Valor energético 492 kcal
Açúcares 3,3 g
Gorduras saturadas 24 g
Sódio 2050 mg

O parser transforma essas informações em dados estruturados utilizados pelo
sistema.

🧮 Classificação nutricional

Após a extração dos valores nutricionais, o aplicativo utiliza regras
definidas em:

src/services/classificationService.js

para determinar a classificação do produto.

Valores nutricionais
        ↓
Regras de classificação
        ↓
┌────────────┬────────────┬────────────┐
│ Saudável   │  Moderado  │   Evitar   │
└────────────┴────────────┴────────────┘

Os critérios utilizados são simplificados e foram definidos para fins
acadêmicos.

⚠️ A classificação apresentada pelo NutriScan possui finalidade educacional
e não substitui avaliação ou orientação de um profissional de nutrição.

💾 Funcionamento Offline-First

Uma das características principais do NutriScan é o funcionamento
offline-first.

As análises são inicialmente armazenadas no banco local do dispositivo através
do Expo SQLite.

Quando existe conexão com a internet, o aplicativo pode sincronizar os dados
com o Supabase.

Com internet
Nova análise
     ↓
   SQLite
     ↓
 Supabase
Sem internet
Nova análise
     ↓
   SQLite
     ↓
Histórico disponível
Internet restaurada
Análises pendentes
       ↓
Sincronização
       ↓
    Supabase

Isso permite que o histórico continue acessível mesmo quando o dispositivo
estiver temporariamente sem conexão.

☁️ Supabase

O Supabase é utilizado como backend da aplicação.

Funções utilizadas:

Supabase Auth → autenticação
PostgreSQL → banco de dados
Row Level Security (RLS) → segurança dos dados
API do Supabase → comunicação entre aplicativo e banco

Cada análise possui um user_id associado ao usuário que realizou a análise.

Isso permite que o histórico seja separado entre diferentes contas.

🔐 Segurança dos dados

A tabela de análises utiliza Row Level Security (RLS).

As políticas configuradas restringem o acesso para que cada usuário possa
consultar e manipular somente suas próprias análises.

Conceitualmente:

Usuário autenticado
       ↓
    auth.uid()
       ↓
     user_id
       ↓
Somente suas análises

As credenciais utilizadas pelo aplicativo são configuradas através de
variáveis de ambiente.

⚠️ O arquivo .env não deve ser enviado ao GitHub.

🗃️ Banco de dados local

O banco local é criado utilizando Expo SQLite.

Arquivo principal:

src/database/db.js

A tabela utilizada é:

analises_nutricionais

Principais campos:

Campo	Descrição
id	Identificador único
user_id	Usuário responsável pela análise
nome_produto	Nome identificado para o produto
calorias	Valor energético
acucares	Quantidade de açúcares
sodio	Quantidade de sódio
gorduras_saturadas	Quantidade de gorduras saturadas
status	Classificação do produto
texto_bruto_ocr	Texto retornado pelo OCR
imagem_uri	Localização da imagem no dispositivo
criado_em	Data e hora da análise
sincronizado	Indica o estado de sincronização
🧱 Arquitetura

A aplicação está organizada em camadas:

┌──────────────────────────────────────┐
│              Interface               │
│        React Native + Expo           │
├──────────────────────────────────────┤
│              Navegação               │
│         React Navigation             │
├──────────────────────────────────────┤
│              Serviços                │
│ OCR / Parser / Classificação / Sync  │
├──────────────────────────────────────┤
│          Banco local                 │
│             SQLite                   │
├──────────────────────────────────────┤
│          Backend remoto              │
│       Supabase / PostgreSQL          │
└──────────────────────────────────────┘
🛠️ Tecnologias utilizadas
Tecnologia	Utilização
React Native	Desenvolvimento do aplicativo mobile
Expo	Ambiente de desenvolvimento
Expo Camera	Captura das imagens
Expo SQLite	Banco de dados local
OCR.space	Reconhecimento óptico de caracteres
Supabase Auth	Autenticação
Supabase	Backend
PostgreSQL	Banco de dados remoto
React Navigation	Navegação
NetInfo	Detecção da conexão de rede
JavaScript	Linguagem principal
📂 Estrutura do projeto
nutriscan/
│
├── App.js
├── app.config.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
│
└── src/
    │
    ├── config/
    │   ├── supabase.js
    │   └── ocr.js
    │
    ├── database/
    │   └── db.js
    │
    ├── navigation/
    │   └── AppNavigator.js
    │
    ├── screens/
    │   ├── CameraScreen.js
    │   ├── HistoryScreen.js
    │   ├── ResultScreen.js
    │   ├── LoginScreen.js
    │   └── SignupScreen.js
    │
    ├── services/
    │   ├── ocrService.js
    │   ├── parserService.js
    │   ├── classificationService.js
    │   └── syncService.js
    │
    └── utils/
        └── uuid.js
🔄 Pipeline de processamento

O processo de análise pode ser dividido nas seguintes etapas:

1. Aquisição da imagem

Arquivo:

src/screens/CameraScreen.js

A câmera captura a tabela nutricional do produto.

2. OCR

Arquivo:

src/services/ocrService.js

A imagem é enviada para o OCR.space.

3. Processamento do texto

Arquivo:

src/services/parserService.js

O texto reconhecido é analisado procurando palavras-chave e valores
numéricos relacionados aos nutrientes.

4. Classificação

Arquivo:

src/services/classificationService.js

Os valores encontrados são utilizados pelas regras de classificação.

5. Armazenamento

Arquivo:

src/database/db.js

A análise é salva no SQLite.

6. Sincronização

Arquivo:

src/services/syncService.js

Quando há conexão, os dados pendentes podem ser enviados ao Supabase.

🎓 Objetivo acadêmico

O projeto foi desenvolvido para demonstrar a aplicação prática de conceitos
relacionados a:

Visão Computacional;
Reconhecimento Óptico de Caracteres;
Desenvolvimento mobile;
Bancos de dados;
Persistência local;
Computação offline-first;
APIs;
Autenticação;
Segurança de dados;
Sincronização entre armazenamento local e remoto.
👨‍💻 Autor

Lucas Ramos Silva

Projeto desenvolvido para fins acadêmicos no curso de Engenharia de
Software — Uni-FACEF.

📋 Telas
Login

Permite que usuários existentes entrem na aplicação.

Cadastro

Permite criar uma nova conta utilizando e-mail e senha.

Câmera

Tela principal para captura da tabela nutricional.

Resultado

Exibe:

Produto identificado;
Classificação;
Calorias;
Açúcares;
Sódio;
Gorduras saturadas;
Imagem capturada.
Histórico

Exibe as análises realizadas anteriormente.

Também apresenta o estado da sincronização:

Conectado

ou:

Offline — sincroniza quando houver conexão
📥 Como baixar o projeto
Opção 1 — Git

É necessário ter o Git instalado.

Clone o repositório:

git clone https://github.com/SEU-USUARIO/nutriscan.git

Entre na pasta:

cd nutriscan

⚙️ Requisitos

Antes de executar o projeto, instale:

Node.js 18 ou superior
npm
Git (caso utilize clone)
Expo Go no celular

Para verificar o Node.js:

node --version

Para verificar o npm:

npm --version

Para verificar o Git:

git --version
📦 Instalação

Depois de baixar o projeto, execute:

npm install

Esse comando instala todas as dependências presentes no
package.json.

🔑 Configuração das variáveis de ambiente

Na raiz do projeto existe um arquivo:

.env.example

Crie uma cópia chamada:

.env

O arquivo deve conter:

OCR_SPACE_API_KEY=sua_chave_aqui
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_aqui
Importante

O arquivo:

.env

está incluído no .gitignore e não deve ser enviado para o GitHub.

🔎 Obtendo a chave do OCR.space
Acesse o site do OCR.space;
Crie uma conta;
Gere uma API Key;
Copie a chave;
Coloque no arquivo .env:

☁️ Configurando o Supabase
Crie uma conta no Supabase;
Crie um novo projeto;
Acesse as configurações da API;
Copie a Project URL;
Copie a chave anon public;
Coloque os valores no .env.

▶️ Como executar

Depois da instalação e configuração:

npx expo start

O Expo exibirá um QR Code no terminal.

Android
Instale o Expo Go;
Conecte o celular à mesma rede do computador;
Abra o Expo Go;
Escaneie o QR Code.
iOS
Instale o Expo Go;
Abra o aplicativo;
Escaneie o QR Code utilizando a câmera do dispositivo.
📱 Executando em desenvolvimento

Também é possível utilizar:

npx expo start --android

ou:

npx expo start --ios

🔒 Privacidade e credenciais

Nunca coloque diretamente no código:

API Keys
Senhas
Tokens privados
Credenciais do Supabase

Utilize o arquivo:

.env

O repositório contém apenas:

.env.example

com os nomes das variáveis necessárias.
