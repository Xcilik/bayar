import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const BACKEND = "https://backend.saweria.co";
const FRONTEND = "https://saweria.co";

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
};

function insertPlusInEmail(email, insertStr) {
  return email.replace("@", `+${insertStr}@`);
}

app.post("/", async (req, res) => {
  const { username, amount, sender, email, pesan } = req.body;

  if (!username || !amount || !sender || !email || !pesan) {
    return res.status(400).json({ error: "Parameter is missing" });
  }

  if (amount < 1000) {
    return res.status(400).json({ error: "Minimum amount is 10000" });
  }

  try {
    // Fetch halaman Saweria untuk ambil user_id
    const html = await fetch(`${FRONTEND}/${username}`, { headers }).then((r) =>
      r.text()
    );

    const match = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/
    );

    if (!match || !match[1]) {
      return res.status(404).json({ error: "Saweria account not found" });
    }

    const nextData = JSON.parse(match[1]);
    const userId = nextData?.props?.pageProps?.data?.id;

    if (!userId) {
      return res.status(404).json({ error: "User ID not found" });
    }

    // Payload payment
    const payload = {
      agree: true,
      notUnderage: true,
      message: pesan,
      amount: Number(amount),
      payment_type: "qris",
      currency: "IDR",
      customer_info: {
        first_name: sender,
        email: insertPlusInEmail(email, sender),
        phone: "",
      },
    };

    // Request payment
    const result = await fetch(`${BACKEND}/donations/${userId}`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }).then((r) => r.text());

    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
