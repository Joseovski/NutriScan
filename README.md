### **NutriScan**

### 🥗 Introdução

O **NutriScan** foi pensado para atender pessoas que desejam ter uma vida mais saudável, mas muitas vezes encontram dificuldade para saber **quais produtos escolher**. No dia a dia, existem diversas opções de produtos com informações nutricionais diferentes, e nem sempre o consumidor consegue interpretar esses dados rapidamente ou entender qual opção pode ser mais adequada para seus objetivos.

A partir dessa necessidade, o NutriScan busca **auxiliar o usuário na escolha dos produtos**, permitindo que ele escaneie o código de barras e consulte suas informações nutricionais de forma simples e rápida. Dessa maneira, o aplicativo procura tornar a análise dos produtos mais acessível e ajudar o usuário a tomar decisões mais conscientes durante suas compras.

O projeto também foi pensado para evoluir além da análise individual. Entre as funcionalidades que estamos estudando para futuras atualizações está um **sistema de comparação de produtos**, permitindo que o usuário selecione dois ou mais produtos e visualize suas informações nutricionais lado a lado. Dessa forma, será possível facilitar a identificação das diferenças entre produtos semelhantes durante o processo de escolha.

Também pretendemos implementar um **sistema de pastas e listas**, permitindo que o usuário organize os produtos já escaneados de diferentes maneiras. Ele poderá, por exemplo, criar uma **lista de compras do mês**, separar produtos por categorias ou organizar produtos que deseja consultar posteriormente. Outra possibilidade é permitir que essas listas sejam compartilhadas com uma **nutricionista**, facilitando o acompanhamento e a orientação profissional.

O NutriScan ainda está em desenvolvimento, e novas ideias e funcionalidades estão sendo estudadas para ampliar as possibilidades do aplicativo e tornar a experiência do usuário cada vez mais completa.

### 💡 A dor do projeto

> **“Quero ter uma alimentação mais saudável, mas não sei quais produtos escolher, como interpretar suas informações nutricionais ou qual opção é melhor quando encontro produtos semelhantes.”**

O NutriScan busca diminuir essa dificuldade oferecendo **informação, organização e ferramentas de comparação** para auxiliar o usuário durante suas escolhas.

````markdown
## 📱 Estrutura do Aplicativo

O NutriScan foi desenvolvido seguindo uma arquitetura organizada em telas, serviços, banco de dados local e integração com serviços externos.

### 🔄 Fluxo principal

┌─────────────────────┐
│   Login / Cadastro  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     Tela Inicial    │
│       (Home)        │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Escanear Produto  │
│   Código de Barras  │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│   Buscar Produto    │
└──────────┬──────────┘
           ↓
      ┌────┴─────┐
      ↓          ↓
   SQLite     Supabase
   (local)     (nuvem)
      │          │
      └────┬─────┘
           ↓
   ┌───────────────┐
   │ Open Food     │
   │ Facts (API)   │
   └───────┬───────┘
           ↓
     ┌───────────┐
     │ Encontrou?│
     └─────┬─────┘
       Sim │ Não
           │
      ↓    │    ↓
┌──────────┐  ┌──────────────────┐
│ Produto  │  │ Cadastro Manual  │
│encontrado│  │     do Produto   │
└────┬─────┘  └────────┬─────────┘
     └──────────┬──────┘
                ↓
┌─────────────────────────┐
│ Classificação Nutricional│
│  🟢 Saudável             │
│  🟡 Moderado             │
│  🔴 Evitar               │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│   Resultado da Análise  │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Armazenamento no SQLite │
└────────────┬────────────┘
             ↓
       ┌─────┴─────┐
       │ Está online?│
       └─────┬─────┘
          Sim│Não
             │
      ↓      │      ↓
┌──────────┐ │ ┌───────────────┐
│Supabase  │ │ │ Continua salvo│
│Sincroniza│ │ │ localmente    │
└────┬─────┘ │ └───────┬───────┘
     └───────┬┴─────────┘
             ↓
┌─────────────────────────┐
│        Histórico        │
└─────────────────────────┘
````

### 🧩 Principais etapas

**1. Login e Cadastro**

O usuário pode criar uma conta ou entrar em uma conta existente. A autenticação é realizada utilizando o Supabase.

**2. Tela Inicial**

Após o login, o usuário acessa a tela principal do NutriScan, onde pode iniciar uma nova análise, consultar o histórico ou acessar sua conta.

**3. Leitura do Código de Barras**

A câmera do dispositivo é utilizada para identificar o código de barras do produto.

**4. Busca do Produto**

Após identificar o código, o aplicativo procura as informações do produto seguindo uma ordem:

1. SQLite — banco de dados local;
2. Supabase — banco de dados em nuvem;
3. Open Food Facts — API externa;
4. Cadastro manual — caso o produto não seja encontrado.

**5. Classificação Nutricional**

Com as informações nutricionais disponíveis, o sistema analisa:

* Açúcares;
* Sódio;
* Gorduras saturadas.

A partir desses dados, o produto recebe uma classificação:

* 🟢 **Saudável**
* 🟡 **Moderado**
* 🔴 **Evitar**

**6. Resultado**

O usuário visualiza as informações nutricionais, o resultado da classificação e os dados do produto.

**7. Armazenamento e Sincronização**

As análises são armazenadas localmente no SQLite. Quando existe conexão com a internet, os dados podem ser sincronizados com o Supabase.

**8. Histórico**

O usuário pode consultar as análises realizadas anteriormente e visualizar novamente os resultados.

---

## 📁 Estrutura de Pastas

```text
NutriScan/
│
├── assets/
│   └── Imagens e recursos do aplicativo
│
├── src/
│   │
│   ├── config/
│   │   └── supabase.js
│   │
│   ├── database/
│   │   └── db.js
│   │
│   ├── navigation/
│   │   └── AppNavigator.js
│   │
│   ├── screens/
│   │   ├── AccountScreen.js
│   │   ├── BarcodeScannerScreen.js
│   │   ├── CadastroProdutoScreen.js
│   │   ├── CameraScreen.js
│   │   ├── HistoryScreen.js
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── ResultScreen.js
│   │   └── SignupScreen.js
│   │
│   ├── services/
│   │   ├── barcodeService.js
│   │   ├── classificationService.js
│   │   ├── ocrService.js
│   │   ├── parserService.js
│   │   ├── produtoService.js
│   │   └── syncService.js
│   │
│   └── utils/
│
├── .env
├── .env.example
├── .gitignore
├── App.js
├── app.config.js
├── eas.json
├── package.json
├── package-lock.json
└── README.md
```

### ⚙️ Responsabilidade das principais pastas

| Pasta/Arquivo   | Responsabilidade                         |
| --------------- | ---------------------------------------- |
| `screens/`      | Telas e interfaces do aplicativo         |
| `services/`     | Regras de negócio e comunicação com APIs |
| `database/`     | Banco de dados SQLite e operações locais |
| `config/`       | Configurações de serviços externos       |
| `navigation/`   | Navegação entre as telas                 |
| `utils/`        | Funções auxiliares                       |
| `App.js`        | Inicialização do aplicativo              |
| `app.config.js` | Configurações do Expo                    |
| `eas.json`      | Configurações para builds do EAS         |
| `.env`          | Variáveis de ambiente privadas           |
| `.env.example`  | Modelo das variáveis necessárias         |

---

## 🗄️ Arquitetura de Dados

📡 Offline-First

O conceito de Offline-First complementa essa arquitetura ao permitir que o aplicativo continue funcionando mesmo quando o dispositivo estiver sem conexão com a internet.

No NutriScan, as informações são armazenadas localmente (Local-First) no SQLite e podem continuar sendo consultadas posteriormente. Quando uma conexão com a internet estiver disponível, os dados pendentes podem ser sincronizados com o Supabase.

                 ┌─────────────────┐
                 │   Nova análise  │
                 └────────┬────────┘
                          ↓
                 ┌─────────────────┐
                 │      SQLite     │
                 │  Salva localmente│
                 └────────┬────────┘
                          ↓
                    ┌───────────┐
                    │ Está      │
                    │ online?   │
                    └─────┬─────┘
                      ┌───┴───┐
                    Sim       Não
                     ↓         ↓
              ┌──────────┐  ┌──────────────┐
              │ Supabase │  │ Continua     │
              │Sincroniza│  │ funcionando  │
              └────┬─────┘  │ offline      │
                   │        └──────┬───────┘
                   │               │
                   └───────┬───────┘
                           ↓
                     Dados disponíveis
                       no aplicativo
🔄 Estratégia de sincronização

O funcionamento pode ser resumido da seguinte maneira:

O usuário realiza uma análise.
Os dados são armazenados primeiro no SQLite.
A análise pode ser utilizada mesmo sem conexão com a internet.
Quando houver conexão, o aplicativo verifica os dados pendentes.
Os dados são enviados para o Supabase.
Após a sincronização, o registro local é marcado como sincronizado.

Essa abordagem busca proporcionar maior disponibilidade, menor dependência da internet e uma experiência mais consistente para o usuário.

Essa estrutura permite que o aplicativo continue utilizando os dados armazenados localmente mesmo quando o dispositivo estiver sem conexão com a internet.

---

## 🚀 Funcionalidades Futuras

O projeto ainda está em desenvolvimento e possui algumas funcionalidades planejadas:

### 📊 Comparação de Produtos

Permitir selecionar dois ou mais produtos e visualizar suas informações nutricionais lado a lado.

### 📁 Pastas e Listas

Permitir organizar produtos em categorias ou listas, como:

* Lista de compras;
* Produtos favoritos;
* Produtos para consultar posteriormente;
* Categorias de produtos.

### 🛒 Lista de Compras

Utilizar os produtos já cadastrados para montar uma lista de compras mensal.

### 👩‍⚕️ Compartilhamento com Nutricionista

Possibilidade de compartilhar listas de produtos com uma nutricionista para facilitar o acompanhamento e a orientação profissional.

