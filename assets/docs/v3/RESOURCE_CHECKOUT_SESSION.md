Use Stripe Checkout by creating a new Session at pay time; don’t reuse expired ones.

You can’t show Stripe’s hosted cart/line-items UI without a Checkout Session—the page itself is created and customized from the session. So the clean pattern is: render your own contract/invoice UX, then create a Checkout Session when the user clicks Pay. If they come back days later, the first session will have expired; just create a fresh session with the same customer, prices, quantities, and discount settings. This is the intended flow, and Stripe’s APIs make repeating that deterministic. ​⁠https://docs.stripe.com/payments/checkout/how-checkout-works

There are two helpful options for the “return later” case:

- Enable after-expiration recovery on the session. With after_expiration.recovery.enabled, Stripe can redirect the expired URL to a newly generated session that preserves line items and discounts, reducing your need to rebuild state. ​⁠https://docs.stripe.com/payments/checkout/abandoned-carts

- Or simply create a new session yourself on return and ignore the old one. Sessions are cheap and designed to be ephemeral; you can also expire one immediately via the expire endpoint if you need to kill it on your timing. ​⁠https://docs.stripe.com/api/checkout/sessions/expire

If your flow is more invoice-driven (for one-off contracts), Stripe Billing’s invoice pages also show line items and discounts and can be paid directly; the first invoice stays “open” for about 23 hours, and if payment isn’t made, you generally generate a new charge flow later. But for a consistent “cart” UX, Checkout is simpler. ​⁠https://docs.stripe.com/billing/subscriptions/overview

Recommended implementation flow:

1. Host contract + invoice review on your site; maintain exact items/discounts in your backend.

2. On Pay, create a Checkout Session (mode=payment), pass customer, line_items or price IDs, discounts/promotion codes, and set expires_at if you want a specific window; redirect to the session’s URL. ​⁠https://docs.stripe.com/payments/checkout/how-checkout-works

3. If the user returns later and the URL is expired, either rely on after_expiration recovery or create a new session with the same parameters. Listen for checkout.session.completed for fulfillment. ​⁠https://docs.stripe.com/payments/checkout/abandoned-carts

This gives you a tight, repeatable bridge from “signed the contract” to a Stripe-hosted cart with accurate line items and discounts, without wrestling with session reuse rules.