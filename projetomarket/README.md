\# Tibia Market RPA



Automação (RPA) para coleta, processamento e análise de dados do market do Tibia.



\## Estrutura do Projeto



projetomarket/

├── src/

│ └── tibia\_market/

│ ├── run.py

│ ├── market\_flow.py

│ ├── items\_loader.py

│ ├── statistics\_parser.py

│ ├── storage.py

│ ├── mouse.py

│ ├── mouse\_pos.py

│ └── regions.py

├── data/

├── logs/

├── requirements.txt

└── README.md





\## Como executar



```bash

python src/tibia\_market/run.py





\## Requisitos de configuração do jogo



PID DO TIBIA xdotool search --onlyvisible --class tibia

83886119





, depois de selecionar item, clique em  DETAILS que fica aqui: x:1249 y:838, 

depois disso clica no STATS\_FOCUS\_POS com o 

botao direitodo do mouse aqui (foco box statistics) x=768 x=531, 

depois clica botao esquerdo (selectall) x=795 y=531 

aí então clica em botao direito em (foco no box statistics selecionado)x=764 y=529 

aí depois botao esquerdo (copy)x:794 y: 540 e vai estar no clipboard



\- Controle de mouse: \*\*Classic + Shift Right\*\*

\- Jogo \*\*NÃO roda em tela cheia\*\*

\- Jogo deve estar \*\*maximizado\*\*, com a barra inferior do Linux visível

\- Apenas \*\*2 sidebars à direita\*\*

\- Apenas \*\*1 linha de action bar\*\* na parte inferior

\- Depot deve estar visível no \*\*canto inferior direito\*\*

\- Personagem deve estar no \*\*último depot da esquerda em Venore\*\*



\## Funcionamento do script



\- Aguarda 1 segundo antes de iniciar

\- Abre o depot

\- Abre o Market

\- Valida se o Market está aberto usando OCR do texto "Market"

\- Se o Market não for detectado, o script encerra imediatamente

\- Coleta estatísticas copiando o texto diretamente (sem OCR de números)

\- Gera CSV com data (YYYY-MM-DD), item e estatísticas







\# Tibia Market Bot (Linux)



Bot para coleta automatizada de dados do \*\*Market do Tibia\*\*, utilizando interação direta com o cliente do jogo (mouse + clipboard), sem OCR para estatísticas — garantindo maior confiabilidade mesmo com FPS baixo.



---



\## ⚙️ PRÉ-REQUISITOS DE CONFIGURAÇÃO DO JOGO



Antes de rodar o script, o jogo \*\*DEVE\*\* estar configurado exatamente assim:



\### 🎮 Controles

\- Mouse configurado como \*\*Classic\*\*

\- Loot configurado como \*\*Shift + Right Click\*\*



\### 🧱 Layout da Interface

\- \*\*Depot visível no canto inferior direito\*\*

\- \*\*Apenas 2 sidebars à direita\*\*

\- \*\*Apenas 1 linha de action bar\*\* na parte inferior

\- Jogo \*\*NÃO\*\* deve estar em tela cheia  

&nbsp; - Deve estar \*\*maximizado\*\*, com a barra inferior do Linux visível



\### 📍 Posição do Personagem

\- O personagem deve estar:

&nbsp; - \*\*Em Venore\*\*

&nbsp; - \*\*No último depot da esquerda\*\*



---



\## 🗺️ Posições Fixas Usadas pelo Script



O script depende de coordenadas fixas de tela:



\- Abrir Depot (Right Click): `x=781 y=516`

\- Abrir Market (Right Click): `x=1881 y=989`



---



\## 🧠 Funcionamento Geral



1\. O script aguarda \*\*1 segundo\*\* antes de iniciar

2\. Abre o \*\*Depot\*\*

3\. Abre o \*\*Market\*\*

4\. Valida se o Market está aberto

5\. Para cada item configurado:

&nbsp;  - Pesquisa o item

&nbsp;  - Abre Details

&nbsp;  - Copia estatísticas via \*\*Select All + Copy\*\*

&nbsp;  - Parseia texto do clipboard

&nbsp;  - Armazena dados em CSV

6\. Caso não seja mais possível obter informações (ex: desconexão), o script:

&nbsp;  - Encerra imediatamente



---



\## 📦 Itens Monitorados (atualmente)



\- Spiritthorn Armor

\- Glacier Robe

\- Bonebreaker



---



\## 🐧 Ambiente



\- Linux (testado em Linux Mint / Ubuntu)

\- xdotool

\- xclip

\- Python 3.x

\- Não compatível com Windows ou macOS



---



\## ⚠️ Observações Importantes



\- Qualquer mudança no layout do jogo \*\*quebra o script\*\*

\- O bot não tenta se recuperar de erros críticos

\- Se algo sair do esperado (ex: Market não abrir), o script \*\*encerra por segurança\*\*



