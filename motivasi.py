"""
motivasi.py — Tampilkan quotes motivasi acak di terminal.
"""

import random

quotes = [
    ("Bukan tentang seberapa keras kamu jatuh, tapi seberapa cepat kamu bangkit.", "Rocky Balboa"),
    ("Impian tanpa aksi hanyalah harapan kosong.", "Antoine de Saint-Exupéry"),
    ("Orang yang tidak pernah membuat kesalahan adalah orang yang tidak pernah mencoba hal baru.", "Albert Einstein"),
    ("Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.", "Colin Powell"),
    ("Jangan takut gagal. Takutlah tidak pernah mencoba.", "Michael Jordan"),
    ("Hidup bukan tentang menemukan dirimu sendiri. Hidup adalah tentang menciptakan dirimu sendiri.", "George Bernard Shaw"),
    ("Satu-satunya cara untuk melakukan pekerjaan yang hebat adalah dengan mencintai apa yang kamu lakukan.", "Steve Jobs"),
    ("Mulailah dari mana kamu berada. Gunakan apa yang kamu punya. Lakukan apa yang kamu bisa.", "Arthur Ashe"),
]

def tampilkan_quote():
    quote, author = random.choice(quotes)
    garis = "-" * 60
    print(f"\n{garis}")
    print(f"  \"{quote}\"")
    print(f"\n  — {author}")
    print(f"{garis}\n")

if __name__ == "__main__":
    print("=== QUOTES MOTIVASI HARI INI ===")
    tampilkan_quote()
