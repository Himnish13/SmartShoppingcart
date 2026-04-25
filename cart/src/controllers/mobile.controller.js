let mobileStatus = "idle"; // "idle" | "importing" | "success"
let missingItems = [];
let ambiguousItems = [];

const db = require("../config/sqlite");
const os = require("os");

// GET /mobile/status — cart frontend polls this
exports.getStatus = (req, res) => {
  res.json({ status: mobileStatus, missingItems, ambiguousItems });
};

// POST /mobile/status — mobile page updates this
exports.setStatus = (req, res) => {
  const { status } = req.body;
  if (["idle", "importing", "success"].includes(status)) {
    mobileStatus = status;
    if (status === "idle") {
      missingItems = [];
      ambiguousItems = [];
    }
  }
  res.json({ ok: true });
};

// POST /mobile/submit — mobile page sends the pasted list text
exports.submitList = (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ message: "No list text provided" });
  }

  // Parse lines like "Milk 2", "Banana 1 dozen", "Bread"
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    mobileStatus = "success";
    return res.json({ message: "Empty list" });
  }

  mobileStatus = "importing";
  missingItems = [];
  ambiguousItems = [];

  // Parse each line into { name, qty }
  const parsed = lines.map((line) => {
    const match = line.match(/^(.*?)[\s]+(\d+)\s*$/);
    return {
      name: (match ? match[1] : line).trim(),
      qty: match ? parseInt(match[2], 10) : 1,
    };
  });

  // Use db.serialize() so every operation runs one-after-another (no race conditions)
  db.serialize(() => {
    // Clear the current list first to start a new session
    db.run(`DELETE FROM shopping_list`);
    db.run(`DELETE FROM cart_items`);

    let completed = 0;
    const total = parsed.length;

    parsed.forEach(({ name, qty }) => {
      // Step 1: find matching products
      db.all(
        `SELECT product_id, name, price, image_url FROM products WHERE LOWER(name) LIKE LOWER(?)`,
        [`%${name}%`],
        (err, matches) => {
          if (err || !matches || matches.length === 0) {
            missingItems.push({ name, qty });
          } else if (matches.length === 1) {
            const product = matches[0];
            db.get(
              `SELECT stock FROM products WHERE product_id = ?`,
              [product.product_id],
              (err2, stockRow) => {
                if (!err2 && stockRow && stockRow.stock > 0) {
                  db.run(
                    `INSERT INTO shopping_list (product_id, quantity, picked_quantity, picked) VALUES (?, ?, 0, 0)`,
                    [product.product_id, qty]
                  );
                } else {
                  missingItems.push({ name, qty, reason: "out_of_stock" });
                }
              }
            );
          } else {
            // Multiple matches! Check for an exact match first
            const exactMatch = matches.find(m => m.name.toLowerCase() === name.toLowerCase());
            if (exactMatch) {
              db.get(
                `SELECT stock FROM products WHERE product_id = ?`,
                [exactMatch.product_id],
                (err2, stockRow) => {
                  if (!err2 && stockRow && stockRow.stock > 0) {
                    db.run(
                      `INSERT INTO shopping_list (product_id, quantity, picked_quantity, picked) VALUES (?, ?, 0, 0)`,
                      [exactMatch.product_id, qty]
                    );
                  } else {
                    missingItems.push({ name, qty, reason: "out_of_stock" });
                  }
                }
              );
            } else {
              ambiguousItems.push({
                enteredName: name,
                qty: qty,
                matches: matches
              });
            }
          }

          completed++;
          if (completed === total) {
            mobileStatus = "success";
          }
        }
      );
    });
  });

  res.json({ message: "Processing list" });
};



// GET /mobile — serve the mobile-facing web page
exports.serveMobilePage = (req, res) => {
  // Reset status when mobile page is loaded
  mobileStatus = "importing";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Smart Cart – Import List</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      background: linear-gradient(135deg, #5b5bd6 0%, #4141a8 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Segoe UI', system-ui, sans-serif;
      padding: 24px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 32px 28px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }
    .logo {
      font-size: 22px;
      font-weight: 700;
      color: #5b5bd6;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 20px;
      font-weight: 600;
      color: #1f1f2e;
      margin-bottom: 8px;
    }
    p.hint {
      font-size: 14px;
      color: #888;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    textarea {
      width: 100%;
      height: 220px;
      border: 1.5px solid #ddd;
      border-radius: 12px;
      padding: 14px;
      font-size: 15px;
      resize: none;
      outline: none;
      transition: border-color 0.2s;
      font-family: inherit;
      line-height: 1.6;
    }
    textarea:focus { border-color: #5b5bd6; }
    .hint-list {
      font-size: 13px;
      color: #aaa;
      margin: 10px 0 20px;
      list-style: none;
    }
    .hint-list li::before { content: "• "; }
    button {
      width: 100%;
      padding: 14px;
      background: #5b5bd6;
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    }
    button:active { transform: scale(0.98); }
    button:hover { background: #4141a8; }
    .success-view {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      text-align: center;
      padding: 24px;
    }
    .success-icon {
      width: 72px;
      height: 72px;
      background: #e6f9ed;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
    }
    .success-view h2 { font-size: 22px; color: #1f1f2e; }
    .success-view p { font-size: 14px; color: #888; }
  </style>
</head>
<body>
  <div class="card">
    <div id="input-view">
      <div class="logo">🛒 Smart Cart</div>
      <h1>Paste Your Shopping List</h1>
      <p class="hint">Type or paste your list below. One item per line.</p>
      <textarea id="listInput" placeholder="Example:
Milk 2
Bread 1
Bananas 6
Eggs"></textarea>
      <ul class="hint-list">
        <li>Add quantity after the item name (optional)</li>
        <li>One item per line</li>
      </ul>
      <button id="submitBtn" onclick="submitList()">Submit List ✓</button>
    </div>
    <div class="success-view" id="success-view">
      <div class="success-icon">✓</div>
      <h2>List Sent!</h2>
      <p>Your shopping list has been imported to the Smart Cart. You can close this page.</p>
    </div>
  </div>
  <script>
    async function submitList() {
      const text = document.getElementById('listInput').value;
      if (!text.trim()) return;
      document.getElementById('submitBtn').disabled = true;
      document.getElementById('submitBtn').textContent = 'Sending...';
      try {
        await fetch('/mobile/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        document.getElementById('input-view').style.display = 'none';
        document.getElementById('success-view').style.display = 'flex';
      } catch(e) {
        document.getElementById('submitBtn').disabled = false;
        document.getElementById('submitBtn').textContent = 'Submit List ✓';
        alert('Failed to send. Please try again.');
      }
    }
  </script>
</body>
</html>`;

  res.send(html);
};

// GET /system/ip — return the local network IP address
exports.getLocalIp = (req, res) => {
  const interfaces = os.networkInterfaces();
  let localIp = "localhost";

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
    if (localIp !== "localhost") break;
  }

  res.json({ ip: localIp });
};
