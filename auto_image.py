import os
import time

import psycopg2
from duckduckgo_search import DDGS


def load_env(path=".env.production"):
    """Baca file env sederhana (KEY=VALUE) tanpa dependensi tambahan."""
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env()
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    raise SystemExit("DATABASE_URL tidak ditemukan di environment / .env.production")

conn = psycopg2.connect(db_url)
cur = conn.cursor()

cur.execute("SELECT id, nama_barang FROM products")
products = cur.fetchall()

ddgs = DDGS()

updated = 0
for pid, nama in products:
    print(f"Mencari: {nama}")
    try:
        # Tambahkan kata 'produk' agar lebih akurat mencari barang
        results = ddgs.images(f"produk {nama}", max_results=1)
        if results:
            cur.execute(
                "UPDATE products SET image_url = %s WHERE id = %s",
                (results[0]["image"], pid),
            )
            conn.commit()
            updated += 1
        time.sleep(1.5)  # hindari rate limit
    except Exception as e:
        conn.rollback()
        print(f"  Gagal: {e}")

print(f"Selesai. {updated} produk diperbarui.")
cur.close()
conn.close()
