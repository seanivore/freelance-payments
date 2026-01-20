// This is your test secret API key.
const stripe = require("stripe")("sk_test_51Sbjhg9fljwH26CP5dqLjALcPFtHBhftOCYTqkIGvmZwDN33dismfwKzDQLyKb4QXynGFdrblhEpi89fiK3bQ0TM00mxCMX98p");
const express = require("express");
const app = express();
app.use(express.static("public"));

const YOUR_DOMAIN = "http://localhost:3000";

app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    ui_mode: "custom",
    line_items: [
      {
        // Provide the exact Price ID (for example, price_1234) of the product you want to sell
        price: "price_1SoSfB9fljwH26CPuIxI5rvI",
        quantity: 1,
      },
    ],
    mode: 'payment',
    return_url: `${YOUR_DOMAIN}/complete?session_id={CHECKOUT_SESSION_ID}`,
  });

  res.send({ clientSecret: session.client_secret });
});

app.get("/session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ["payment_intent"] });

  res.send({
    status: session.status,
    payment_status: session.payment_status,
    payment_intent_id: session.payment_intent.id,
    payment_intent_status: session.payment_intent.status
  });
});

app.listen(4242, () => console.log("Running on port 4242"));