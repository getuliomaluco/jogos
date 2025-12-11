import requests
import csv

URL = "https://api.tibiamarket.top/market_values?server=Menera&limit=5000"
OUTPUT_FILE = "tibiamarket_menera.csv"

print("📥 Baixando dados do TibiaMarket (Menera)...")
response = requests.get(URL)

if response.status_code != 200:
    print("❌ Erro ao acessar API:", response.status_code)
    print(response.text)
    exit(1)

data = response.json()

# garantir que é uma lista
if not isinstance(data, list):
    print("❌ API não retornou lista de dados!")
    print(data)
    exit(1)

print(f"✔ {len(data)} registros recebidos do mundo Menera")

# descobrir todas as colunas automaticamente
columns = set()
for item in data:
    columns.update(item.keys())
columns = sorted(columns)

print("📝 Colunas detectadas:")
print(columns)

# gerar CSV
with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=columns)
    writer.writeheader()
    for row in data:
        writer.writerow(row)

print(f"\n💾 Arquivo CSV gerado com sucesso:")
print(f"➡ {OUTPUT_FILE}")
