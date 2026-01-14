# build3.1

## Visao geral
Projeto de captura de tela no Linux com controle remoto e macros a partir de um cliente web no Windows.

## Estrutura
- build3.1/client: UI web (index.html, app.js, style.css)
- build3.1/server: servidor Python (websockets + mss + Pillow + xdotool)
- build3.1/setup.ps1: sincroniza cliente e servidor a partir deste repo
- build3.1/server/setup_systemd.sh: instala e habilita o service no Linux
- build3.1/config.env: configuracao usada pelo systemd
- build3.1/build3.1.md: referencia rapida
- build3.1/CHECKLIST.md: checklist de deploy/validacao

## Caminhos padrao
- Windows (cliente): E:\remote-client
- Linux (servidor): /home/getulio/build3.1

## Setup rapido (Windows)
1) Abra um PowerShell no repo
2) Rode:
   powershell -ExecutionPolicy Bypass -File build3.1\setup.ps1

## Setup Linux
1) No Linux, rode:
   bash /home/getulio/build3.1/install.sh

2) Para rodar manualmente:
   python3 /home/getulio/build3.1/server.py --port 8888 --verbose

3) Para usar systemd (automatizado):
   bash /home/getulio/build3.1/server/setup_systemd.sh
   bash /home/getulio/build3.1/server/setup_systemd.sh --restart

4) Para usar systemd (manual):
   - Edite build3.1/config.env e ajuste os valores
   - Copie build3.1/server/remote-control.service para /etc/systemd/system/
   - systemctl daemon-reload
   - systemctl enable --now remote-control.service

## Configuracao (config.env)
- RC_HOST, RC_PORT, RC_INTERVAL_MS, RC_JPEG_QUALITY
- RC_SERVER_PATH, RC_PYTHON, RC_DISPLAY, RC_XAUTHORITY
- RC_PYTHON padrao e /usr/bin/python3 (ajuste se usar venv)

## Uso do cliente
- Abra build3.1/client/index.html no navegador
- Informe IP do Linux e porta (8888) e clique Conectar

## Macros
- Editor permite delay (fixed/random), key (press/down/up), mouse (click/down/up), scroll e move (abs/rel)
- Gravacao funciona clicando no preview e usando o teclado
