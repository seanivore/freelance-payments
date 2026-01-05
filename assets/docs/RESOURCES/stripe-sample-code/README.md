# Accept a Payment with Elements and the Checkout Sessions API

## Set Price ID

In the back end code, replace `{{PRICE_ID}}` with a Price ID (`price_xxx`) that you created.

## Running the sample

1. Build the server

~~~
pip3 install -r requirements.txt
~~~

2. Run the server

~~~
export FLASK_APP=server.py
python3 -m flask run --port=4242
~~~

3. Go to [http://localhost:4242/checkout.html](http://localhost:4242/checkout.html)