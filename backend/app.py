from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import sqlite3
import csv
import threading
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# --- DB操作 ---
def get_reservations():
    conn = sqlite3.connect("local.db")
    cur = conn.cursor()
    cur.execute("SELECT id, content_id, time, done_flg FROM reservations")
    data = [{"id": row[0], "content_id": row[1], "time": row[2], "done_flg": row[3]} for row in cur.fetchall()]
    conn.close()
    return data

def get_contents():
    conn = sqlite3.connect("local.db")
    cur = conn.cursor()
    cur.execute("SELECT * FROM contents")
    data = [dict(zip([col[0] for col in cur.description], row)) for row in cur.fetchall()]
    conn.close()
    return data

# --- 30分刻み自動ブロードキャスト ---
last_slot = None

def broadcast_time_slot_loop():
    global last_slot
    while True:
        now = datetime.now()
        total_min = now.hour * 60 + now.minute
        slot = total_min // 30

        if slot != last_slot:
            last_slot = slot
            start_hour = (slot * 30) // 60
            start_min = (slot * 30) % 60
            print(f"🕒 新しい30分枠: {now.strftime('%H:%M')}")

            socketio.emit("time_slot", {
                "slot": slot,
                "start_time": f"{start_hour:02d}:{start_min:02d}",
                "current_time": now.strftime("%H:%M:%S")
            })
            socketio.emit("reservations_data", get_reservations())

        time.sleep(1)


def get_products():
    conn = sqlite3.connect("local.db")
    cur = conn.cursor()
    cur.execute("SELECT * FROM products")
    data = [dict(zip([col[0] for col in cur.description], row)) for row in cur.fetchall()]
    conn.close()
    return data



# --- SocketIO イベント ---
@socketio.on("get_reservations")
def handle_get_reservations():
    emit("reservations_data", get_reservations())

@socketio.on("get_contents")
def handle_get_contents():
    emit("contents_data", get_contents())

@socketio.on("add_reservation")
def handle_add_reservation(data):
    content_id = data.get("content_id")
    time_val = data.get("time")
    done_flg = data.get("done_flg", 0)
    conn = sqlite3.connect("local.db")
    cur = conn.cursor()
    cur.execute("INSERT INTO reservations (content_id, time, done_flg) VALUES (?, ?, ?)", 
                (content_id, time_val, done_flg))
    conn.commit()
    conn.close()
    # 追加後に全クライアントに最新データ送信
    socketio.emit("reservations_data", get_reservations())

@socketio.on("update_done_flg")
def handle_update_done_flg(data):
    reservation_id = data.get("id")
    done_flg = data.get("done_flg", 1)
    conn = sqlite3.connect("local.db")
    cur = conn.cursor()
    cur.execute("UPDATE reservations SET done_flg = ? WHERE id = ?", (done_flg, reservation_id))
    conn.commit()
    conn.close()
    socketio.emit("reservations_data", get_reservations())

@socketio.on("get_time_slot")
def handle_get_time_slot():
    now = datetime.now()
    total_min = now.hour * 60 + now.minute
    slot = total_min // 30
    start_hour = (slot * 30) // 60
    start_min = (slot * 30) % 60
    emit("time_slot", {
        "slot": slot,
        "start_time": f"{start_hour:02d}:{start_min:02d}",
        "current_time": now.strftime("%H:%M:%S")
    })
    emit("reservations_data", get_reservations())

@socketio.on("get_products")
def handle_get_products():
    emit("products_data", get_products())



def get_products():
    conn = sqlite3.connect("local.db")
    cur = conn.cursor()
    cur.execute("SELECT id, name, stock, price, category_id FROM products")
    products = [
        {"id": row[0], "name": row[1], "stock": row[2], "price": row[3], "category_id": row[4]}
        for row in cur.fetchall()
    ]
    conn.close()
    return products

@app.route("/reservations", methods=["GET"])
def reservations():
    """予約一覧をJSONで返す"""
    try:
        conn = sqlite3.connect("local.db")
        cur = conn.cursor()
        cur.execute("SELECT id, content_id, time, done_flg FROM reservations")
        data = [
            {"id": row[0], "content_id": row[1], "time": row[2], "done_flg": row[3]}
            for row in cur.fetchall()
        ]
        conn.close()
        return jsonify(data)
    except Exception as e:
        print("❌ Error fetching reservations:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/products", methods=["GET"])
def products():
    return jsonify(get_products())

@app.route("/purchase", methods=["POST"])
def purchase():
    try:
        data = request.get_json()
        if not data or "items" not in data:
            return jsonify({"error": "Invalid request"}), 400

        conn = sqlite3.connect("local.db")
        cur = conn.cursor()

        purchased_items = []

        for item in data["items"]:
            product_id = item["id"]
            quantity = item["quantity"]

            # 在庫確認
            cur.execute("SELECT name, stock, price FROM products WHERE id = ?", (product_id,))
            result = cur.fetchone()
            if not result:
                conn.close()
                return jsonify({"error": f"Product ID {product_id} not found"}), 404

            name, stock, price = result
            if stock < quantity:
                conn.close()
                return jsonify({"error": f"Insufficient stock for product ID {product_id}"}), 400

            # 在庫を減らす
            cur.execute(
                "UPDATE products SET stock = stock - ? WHERE id = ?",
                (quantity, product_id),
            )

            purchased_items.append({
                "id": product_id,
                "name": name,
                "price": price,
                "quantity": quantity,
                "total": price * quantity
            })

        conn.commit()
        conn.close()

        # CSVに購入履歴を追記
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        csv_filename = "purchase_history.csv"

        with open(csv_filename, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            # ファイルが空ならヘッダーを書き込む
            if f.tell() == 0:
                writer.writerow(["datetime", "product_id", "name", "price", "quantity", "total"])
            for item in purchased_items:
                writer.writerow([now, item["id"], item["name"], item["price"], item["quantity"], item["total"]])

        return jsonify({"success": True, "message": "購入が完了しました", "items": purchased_items})

    except Exception as e:
        print("❌ Error in purchase:", e)
        return jsonify({"error": str(e)}), 500



# --- アプリ起動 ---
if __name__ == "__main__":
    threading.Thread(target=broadcast_time_slot_loop, daemon=True).start()
    socketio.run(app, host="0.0.0.0", port=54321, debug=True)
