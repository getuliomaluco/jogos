#!/usr/bin/env python3
import time
import os
import sys
from datetime import datetime
import uinput   # <<< envia teclas reais como teclado físico

# ============================================================
# CONFIGURAÇÃO DO TECLADO VIRTUAL (uinput)
# ============================================================

device = uinput.Device([
    uinput.KEY_5,
    uinput.KEY_6,
    uinput.KEY_9,
    uinput.KEY_RIGHT,
    uinput.KEY_LEFT
])

def tecla(key):
    """Envia uma tecla real via uinput."""
    device.emit_click(key)

# ============================================================
# CONFIGURAÇÃO DE TEMPOS
# ============================================================

TEMPOS = {
    '9': 2.1,
    '5_1': 2.5,
    '5_2': 2.2,
    '5_3': 2.3,
    '5_4': 2.35,
    '5_5': 2.22,
    'right': 1.2,
    'left': 1.2,
    '6_1': 1.1,
    '6_2': 1.2,
    '6_3': 1.3,
    '6_4': 1.2,
    '6_5': 1.16,
    'espera_longa': 220
}

REPETICOES_CICLO = 5
CICLOS_TOTAIS = 12
PAUSA_ENTRE_CICLOS = 5

inicio_geral = None
executando = True
ciclo_principal = 0

# ============================================================
# LOG
# ============================================================

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    print(f"[{ts}] {msg}")
    with open("/tmp/tibia.log", "a") as f:
        f.write(f"[{ts}] {msg}\n")

def atualizar_status(txt):
    with open("/tmp/tibia_status", "w") as f:
        f.write(txt)

# ============================================================
# VERIFICA STOP
# ============================================================

def verificar_stop():
    global executando
    if os.path.exists("/tmp/tibia_stop"):
        os.remove("/tmp/tibia_stop")
        executando = False
        log("🛑 STOP recebido")
        return True
    return False

# ============================================================
# ENVIO DE TECLAS VIA UINPUT (SEM XDOTOOL)
# ============================================================

def pressionar_tecla(nome, delay, descricao=""):
    global executando
    if not executando:
        return False

    if descricao:
        log(descricao)

    if verificar_stop():
        return False

    # envia tecla real
    if nome == '5':
        tecla(uinput.KEY_5)
    elif nome == '6':
        tecla(uinput.KEY_6)
    elif nome == '9':
        tecla(uinput.KEY_9)
    elif nome == 'Right':
        tecla(uinput.KEY_RIGHT)
    elif nome == 'Left':
        tecla(uinput.KEY_LEFT)

    time.sleep(delay)
    return True

# ============================================================
# CICLO INTERNO
# ============================================================

def executar_ciclo_interno(n):
    log(f"🔁 Iniciando ciclo interno {n}")

    for r in range(REPETICOES_CICLO):
        if verificar_stop():
            return False

        log(f"↻ Repetição {r+1}/{REPETICOES_CICLO}")

        pressionar_tecla('5', TEMPOS['5_1'], "5 (1/5)")
        pressionar_tecla('5', TEMPOS['5_2'], "5 (2/5)")
        pressionar_tecla('5', TEMPOS['5_3'], "5 (3/5)")
        pressionar_tecla('5', TEMPOS['5_4'], "5 (4/5)")
        pressionar_tecla('5', TEMPOS['5_5'], "5 (5/5)")

        pressionar_tecla('Right', TEMPOS['right'], "➡️ Seta direita")

        pressionar_tecla('6', TEMPOS['6_1'], "6 (1/5)")
        pressionar_tecla('6', TEMPOS['6_2'], "6 (2/5)")
        pressionar_tecla('6', TEMPOS['6_3'], "6 (3/5)")
        pressionar_tecla('6', TEMPOS['6_4'], "6 (4/5)")
        pressionar_tecla('6', TEMPOS['6_5'], "6 (5/5)")

        pressionar_tecla('Left', TEMPOS['left'], "⬅️ Seta esquerda")

        log("⏳ Espera longa: 220s")
        for i in range(220):
            if verificar_stop():
                return False
            time.sleep(1)

    return True

# ============================================================
# MAIN — AGORA COM DELAY INICIAL DE 5s
# ============================================================

def main():
    global ciclo_principal, inicio_geral, executando

    print("====================================================")
    print("🤖 MACRO TIBIA — VERSÃO UINPUT (FUNCIONA EM QUALQUER JANELA)")
    print("====================================================")

    # 🔥 DELAY DE 5 SEGUNDOS ANTES DE COMEÇAR
    log("⏳ Aguarde 5 segundos antes do macro iniciar...")
    for i in range(5, 0, -1):
        print(f"Iniciando em {i}...")
        time.sleep(1)
    print("🚀 Macro iniciado!")
    log("🚀 Macro iniciado!")

    inicio_geral = datetime.now()
    executando = True

    while ciclo_principal < CICLOS_TOTAIS and executando:
        ciclo_principal += 1
        log(f"▶️ Iniciando ciclo principal {ciclo_principal}/{CICLOS_TOTAIS}")

        pressionar_tecla('9', TEMPOS['9'], "9 (inicial)")

        if executar_ciclo_interno(ciclo_principal):
            log(f"✅ Ciclo {ciclo_principal} concluído")
            if ciclo_principal < CICLOS_TOTAIS:
                log(f"⏸️ Pausa entre ciclos: {PAUSA_ENTRE_CICLOS}s")
                for i in range(PAUSA_ENTRE_CICLOS):
                    if verificar_stop():
                        break
                    time.sleep(1)
        else:
            log("⏸️ Ciclo interrompido")
            break

    log("🎉 Macro finalizado")

# ============================================================
# EXECUÇÃO
# ============================================================

if __name__ == "__main__":
    main()
