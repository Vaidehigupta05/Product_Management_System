console.log("script.js is loaded");
const productForm = document.getElementById("productForm");

productForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("name").value;
    const category = document.getElementById("category").value;
    const quantity = document.getElementById("quantity").value;
    const price = document.getElementById("price").value;

    fetch("/products", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            category: category,
            quantity: quantity,
            price: price
        })
    })
    .then(response => response.json())
    .then(data => {

        document.getElementById("message").textContent = data.message;

        if (data.message === "Product added successfully") {
    productForm.reset();
    loadProducts();
}

    })
    .catch(error => {
        console.log(error);
        document.getElementById("message").textContent =
            "Something went wrong";
    });
});
function loadProducts() {

    fetch("/products")
        .then(response => response.json())
        .then(products => {

            const table = document.getElementById("productTable");
            const lowStockAlert = document.getElementById("lowStockAlert");

const lowStockProducts = products.filter(product => product.quantity <= 5);

if (lowStockProducts.length === 0) {
    lowStockAlert.textContent = "No low-stock products.";
} else {
    lowStockAlert.textContent =
        "Low Stock: " +
        lowStockProducts.map(product =>
            `${product.name} (${product.quantity} left)`
        ).join(", ");
}

            table.innerHTML = "";

            products.forEach(product => {

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>
    ${product.quantity}
    ${product.quantity <= 5 ? " (LOW STOCK)" : ""}
</td>
                    <td>₹${product.price}</td>
                    <td>
    <button onclick="editProduct(${product.id})">Edit</button>
    <button onclick="deleteProduct(${product.id})">Delete</button>
</td>
                `;

                table.appendChild(row);
            });
        })
        .catch(error => {
            console.log(error);
        });
}

loadProducts();
function searchProducts() {

    const query = document.getElementById("searchInput").value;

    fetch(`/products/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(products => {

            const table = document.getElementById("productTable");

            table.innerHTML = "";
            

            products.forEach(product => {

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${product.quantity}</td>
                    <td>₹${product.price}</td>
                    <td>
    <button onclick="editProduct(${product.id})">Edit</button>
    <button onclick="deleteProduct(${product.id})">Delete</button>
</td>
                `;

                table.appendChild(row);
            });
        })
        .catch(error => {
            console.log(error);
        });
}
window.deleteProduct = function(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) {
        return;
    }

    fetch(`/products/${id}`, {
        method: "DELETE"
    })
    .then(response => response.json())
    .then(data => {

        alert(data.message);

        loadProducts();
    })
    .catch(error => {
        console.log(error);
    });
};

let editingProductId = null;

window.editProduct = function(id) {

    editingProductId = id;

    fetch(`/products`)
        .then(response => response.json())
        .then(products => {

            const product = products.find(p => p.id === id);

            if (!product) {
                alert("Product not found");
                return;
            }

            document.getElementById("editName").value = product.name;
            document.getElementById("editCategory").value = product.category;
            document.getElementById("editQuantity").value = product.quantity;
            document.getElementById("editPrice").value = product.price;

            document.getElementById("editSection").style.display = "block";
        });
};
window.saveEdit = function() {

    const name = document.getElementById("editName").value;
    const category = document.getElementById("editCategory").value;
    const quantity = document.getElementById("editQuantity").value;
    const price = document.getElementById("editPrice").value;

    fetch(`/products/${editingProductId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            category: category,
            quantity: Number(quantity),
            price: Number(price)
        })
    })
    .then(response => response.json())
    .then(data => {

        alert(data.message);

        if (data.message === "Product updated successfully") {

            document.getElementById("editSection").style.display = "none";

            loadProducts();
        }
    })
    .catch(error => {
        console.log(error);
    });
};
window.cancelEdit = function() {

    document.getElementById("editSection").style.display = "none";

    editingProductId = null;
};
