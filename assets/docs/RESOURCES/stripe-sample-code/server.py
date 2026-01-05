#! /usr/bin/env python3.6

"""
server.py
Stripe Sample.
Python 3.6 or newer required.
"""
from flask import Flask, jsonify, request

import stripe
# This is your test secret API key.
stripe.api_key = 'sk_test_51Sbjhg9fljwH26CP5dqLjALcPFtHBhftOCYTqkIGvmZwDN33dismfwKzDQLyKb4QXynGFdrblhEpi89fiK3bQ0TM00mxCMX98p'
stripe.api_version = '2025-12-15.clover'

app = Flask(__name__,
            static_url_path='',
            static_folder='public')

YOUR_DOMAIN = 'http://localhost:4242'

@app.route('/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        session = stripe.checkout.Session.create(
            ui_mode = 'custom',
            line_items=[
                {
                    # Provide the exact Price ID (for example, price_1234) of the product you want to sell
                    'price': '{{PRICE_ID}}',
                    'quantity': 1,
                },
            ],
            mode='payment',
            return_url=YOUR_DOMAIN + '/complete.html?session_id={CHECKOUT_SESSION_ID}',
            automatic_tax={'enabled': True},
        )
    except Exception as e:
        return str(e)

    return jsonify(clientSecret=session.client_secret)

@app.route('/session-status', methods=['GET'])
def session_status():
  session = stripe.checkout.Session.retrieve(request.args.get('session_id'), expand=["payment_intent"])

  return jsonify(status=session.status, payment_status=session.payment_status, payment_intent_id=session.payment_intent.id, payment_intent_status=session.payment_intent.status)

if __name__ == '__main__':
    app.run(port=4242)