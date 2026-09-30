from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)


# ---------------- DATABASE ----------------

def init_db():
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL
        )
    """)

    conn.commit()
    conn.close()


# ---------------- VALIDATION ----------------

def validate_product(data):

    if "name" not in data or data["name"].strip() == "":
        return "Name is required"

    if "category" not in data or data["category"].strip() == "":
        return "Category is required"

    if "quantity" not in data:
        return "Quantity is required"

    if "price" not in data:
        return "Price is required"

    try:
        quantity = int(data["quantity"])
        price = float(data["price"])
    except (ValueError, TypeError):
        return "Quantity must be an integer and price must be a number"

    if quantity < 0:
        return "Quantity cannot be negative"

    if price < 0:
        return "Price cannot be negative"

    return None


# ---------------- HOME ----------------

@app.route("/")
def home():
    return render_template("index.html")


# ---------------- ADD PRODUCT ----------------

@app.route("/products", methods=["POST"])
def add_product():

    data = request.get_json()

    error = validate_product(data)

    if error:
        return jsonify({
            "message": error
        }), 400

    name = data["name"]
    category = data["category"]
    quantity = int(data["quantity"])
    price = float(data["price"])

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO products (name, category, quantity, price)
        VALUES (?, ?, ?, ?)
    """, (name, category, quantity, price))

    conn.commit()
    conn.close()

    return jsonify({
        "message": "Product added successfully"
    }), 201


# ---------------- VIEW ALL PRODUCTS ----------------

@app.route("/products", methods=["GET"])
def get_products():

    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    cursor.execute("SELECT * FROM products")

    products = cursor.fetchall()

    conn.close()

    return jsonify([dict(product) for product in products])


# ---------------- SEARCH PRODUCTS ----------------

@app.route("/products/search", methods=["GET"])
def search_products():

    query = request.args.get("q", "").strip()

    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row

    cursor = conn.cursor()

    if query == "":
        cursor.execute("SELECT * FROM products")

    else:
        cursor.execute("""
            SELECT * FROM products
            WHERE name LIKE ?
               OR category LIKE ?
               OR CAST(id AS TEXT) LIKE ?
        """, (
            f"%{query}%",
            f"%{query}%",
            f"%{query}%"
        ))

    products = cursor.fetchall()

    conn.close()

    return jsonify([dict(product) for product in products])


# ---------------- UPDATE PRODUCT ----------------

@app.route("/products/<int:id>", methods=["PUT"])
def update_product(id):

    data = request.get_json()

    error = validate_product(data)

    if error:
        return jsonify({
            "message": error
        }), 400

    name = data["name"]
    category = data["category"]
    quantity = int(data["quantity"])
    price = float(data["price"])

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE products
        SET name = ?, category = ?, quantity = ?, price = ?
        WHERE id = ?
    """, (name, category, quantity, price, id))

    conn.commit()

    if cursor.rowcount == 0:
        conn.close()

        return jsonify({
            "message": "Product not found"
        }), 404

    conn.close()

    return jsonify({
        "message": "Product updated successfully"
    })


# ---------------- DELETE PRODUCT ----------------

@app.route("/products/<int:id>", methods=["DELETE"])
def delete_product(id):

    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM products WHERE id = ?",
        (id,)
    )

    conn.commit()

    if cursor.rowcount == 0:
        conn.close()

        return jsonify({
            "message": "Product not found"
        }), 404

    conn.close()

    return jsonify({
        "message": "Product deleted successfully"
    })


# ---------------- RUN APPLICATION ----------------

if __name__ == "__main__":
    init_db()
    app.run(debug=True)