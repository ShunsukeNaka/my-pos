import sqlite3

def init_db(contents, product_list):
    conn = sqlite3.connect("local.db")
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS reservations")
    cur.execute("DROP TABLE IF EXISTS contents")
    cur.execute("DROP TABLE IF EXISTS categories")
    cur.execute("DROP TABLE IF EXISTS products")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS contents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            explanation TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_id INTEGER NOT NULL,
            time TEXT NOT NULL,
            done_flg INTEGER NOT NULL,
            FOREIGN KEY (content_id) REFERENCES contents(id)
        )
    """)


    cur.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            stock INTEGER NOT NULL,
            price INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    """)

    conn.commit()

    for content in contents:
        cur.execute("INSERT INTO contents (name, explanation) VALUES (?, ?)", (content["name"], content["explanation"]))
        conn.commit()
    
    for product in product_list:
        cur.execute("INSERT INTO products (name, stock, price, category_id) VALUES (?, ?, ?, ?)", (product["name"], product["stock"], product["price"], product["category_id"]))
        conn.commit()

    conn.close()


content_name = [
    {"name":"なんか１", "explanation": "なんか１の説明"},
    {"name":"なんか２", "explanation": "なんか２の説明"}
]

product_list = [
    {"name": "キーホルダー１", "stock": 6, "price": 400, "category_id": 1},
    {"name": "キーホルダー２", "stock": 2, "price": 400,  "category_id": 1},
    {"name": "キーホルダー３", "stock": 5, "price": 400,  "category_id": 1},
    {"name": "基盤１", "stock": 4, "price": 400,  "category_id": 2}
]

init_db(content_name, product_list)