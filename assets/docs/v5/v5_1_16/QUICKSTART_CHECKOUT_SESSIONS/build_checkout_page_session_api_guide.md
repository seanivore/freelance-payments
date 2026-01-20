# Build a checkout page with Checkout Sessions API

Build a checkout page on your website using Stripe Elements and the Checkout Sessions API, a front-end SDK that manages tax, discounts, shipping rates, and more.

- "Server"
  - `assets/docs/v5/QUICKSTART_CHECKOUT_SESSIONS/server.js`
- "Client"
  - `assets/docs/v5/QUICKSTART_CHECKOUT_SESSIONS/App.jsx`
  - `assets/docs/v5/QUICKSTART_CHECKOUT_SESSIONS/checkoutForm.jsx`
  - `assets/docs/v5/QUICKSTART_CHECKOUT_SESSIONS/complete.jsx`

**SEE `assets/docs/v5/QUICKSTART_CHECKOUT_SESSIONS/POST_API_CHECKOUT_SESSION_CREATE.md` FOR WORKBENCH CREATED API CALL, RESPONSE, AND REQUEST BODY FILLED IN EXACTLY FROM OUR `checkout_session_1` or `checkout_session_2` OBJECTS IN `assets/jobs/uid-ilt-036.json`**

---

## STEP 1: Set up the server

1. Install the Stripe Node library
   Install the package and import it in your code. Alternatively, if you’re starting from scratch and need a package.json file, download the project files using the Download link in the code editor.

`npm install --save stripe`

**`server.js` Line 1-2**

2. Create a Checkout Session
   Add an endpoint on your server that creates a Checkout Session, setting the ui_mode to custom.
   The Checkout Session response includes a client_secret, which the client uses to complete the payment. Return the client secret in your response.

**`server.js` Line 10-23**

3. Supply a return URL
   To define how Stripe redirects your customer after payment, specify the URL of the return page in the return_url parameter while creating the Checkout Session. After the payment attempt, Stripe directs your customer to the return page hosted on your website.
   Include the {CHECKOUT_SESSION_ID} template variable in the URL. Before redirecting your customer, Checkout replaces the variable with the Checkout Session ID. You’re responsible for creating and hosting the return page on your website.

**`server.js` Line 20**

4. Define a product to sell
   Define the products and prices for your Checkout Session. Typically, that means using a predefined product Price ID. However, if you need to set dynamic prices that can’t be known ahead of time, then use price_data.

**`server.js` Line 12-18**

5. Handle different transaction types
   To handle different transaction types, adjust the mode parameter:
   For one-time payments, use payment.
   If you have one or more recurring prices, use subscription.
   If you aren’t collecting an initial payment from a customer but want to save their payment details to charge them later, use setup.

**`server.js` Line 19**

---

## STEP 2: Build a checkout page on the client

1. Add Stripe to your React app
   To stay PCI-compliant by ensuring that payment details go directly to Stripe and never reach your server, install React Stripe.js.

`npm install --save @stripe/react-stripe-js @stripe/stripe-js`

**`App.jsx` Line 1-5**

2. Load Stripe.js
   To configure the Stripe library, call loadStripe() with your Stripe publishable API key.

**`App.jsx` Line 16-19**

3. Fetch a Checkout Session client secret
   Make a request to your server to create a Checkout Session and retrieve the client secret.

**`App.jsx` Line 22-28**

4. Initialize Checkout
   Render the Checkout Provider, passing clientSecret—the client secret string or Promise that resolves to the client secret.

**`App.jsx` Line 37-48**

5. Set up the state
   Initialize some state to keep track of the payment, show errors, and manage the user interface.

**`checkoutForm.jsx` Line 50-53**

6. Store a reference to Checkout
   Access the checkout object in your CheckoutForm component by using the useCheckout() hook. The checkout object acts as the backbone of your checkout page, containing data from the Checkout Session and methods to update it.

**`checkoutForm.jsx` Line 55-67**

7. Add the Payment Element
   Add the Payment Element to your payment form. It embeds an iframe with a dynamic form that collects payment details for a variety of payment methods. Your customer can pick a payment method type, and the form automatically collects all necessary payments details for their selection.

**`checkoutForm.jsx` Line 107**

8. (Optional) Style the Payment Element
   Customize the Payment Element UI by creating an Appearance object and passing it as an option to the Checkout Provider. Use your company’s color scheme and font to make it match with the rest of your checkout page. Use custom fonts (for example, from Google Fonts) by initializing Checkout with a font set.

   Make sure to open the preview on the right to see your changes live.

   Theme: stripe
   Primary color: #0570de
   Background color: #ffffff
   Text color: #30313d

   Note: Parts of this preview demo might not match your actual checkout page. These settings represent only a subset of the Appearance object’s variables, and the Appearance object only controls certain attributes of Stripe Elements. You’re responsible for styling the rest of your checkout page.

**`App.jsx` Line 30-32**

---

## STEP 3: Complete the payment on the client

1. Handle the submit event
   Listen to the form’s submit event to know when to confirm the payment through the Stripe API.

**`checkoutForm.jsx` Line 69-96**

2. Complete the payment
   Call confirm when the customer is ready to complete checkout, such as in response to clicking a pay button.

**`checkoutForm.jsx` Line 83**

3. Handle errors
   If there are any immediate errors (for example, your customer’s card is declined), Stripe.js returns an error. Show that error message to your customer so they can try again.

**`checkoutForm.jsx` Line 85-92**

---

## STEP 4: Show a return page

1. Create an endpoint to retrieve a Checkout Session
   Add an endpoint to retrieve a Checkout Session status.

**`server.js` Line 26-35**

2. Add a return component
   To display order information to your customer, add a new route and return component for the URL you provided as the Checkout Session return_url. Stripe redirects to this page after the customer completes the checkout.

**`app.jsx` Line 46**

3. Retrieve a Checkout session
   As soon as your return page loads, immediately make a request to the endpoint on your server. Use the Checkout Session ID in the URL to retrieve the status of the Checkout Session.

**`complete.jsx` Line 4-44**

4. Handle session
   Handle the result of the session by using its status:
   `complete`: The payment succeeded. Use the information from the Checkout Session to render a success page.
   `open`: The payment failed or was canceled. Remount Checkout so that your customer can try again.

**`complete.jsx` Line 46-80**

---

## STEP 5: Test your page

1. Run the application
   Start your server and go to http://localhost:3000/checkout.

`npm start`

2. Try it out
   Click the pay button to complete the payment, which redirects you to the specified return page.

   If you see the return page, and the payment in the list of successful payments in the Dashboard, your integration is successfully working. Use any of the following test cards to simulate a payment:

   Payment succeeds `4242 4242 4242 4242`
   Payment requires authentication `4000 0025 0000 3155`
   Payment is declined `4000 0000 0000 9995`

3. Congratulations!
   You have a basic Checkout integration working. Now learn how to customize the appearance of your checkout page, automate tax collection, and localize currencies.
