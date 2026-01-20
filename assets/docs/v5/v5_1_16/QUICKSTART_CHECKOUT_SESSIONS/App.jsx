import React, { useMemo } from "react";
import {loadStripe} from '@stripe/stripe-js';
import {
  CheckoutProvider
} from '@stripe/react-stripe-js/checkout';
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import CheckoutForm from './CheckoutForm';
import Complete from './Complete';

import "./App.css";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe("pk_test_51Sbjhg9fljwH26CPk5PQKftpMaVQ7D7kIH3O3tYVEFSkOzVdqI5DWtT7EMcJDUqQLKEgIosx7q4nfgjrB1KMf85100WsuWFKNr");

const App = () => {
  const promise = useMemo(() => {
    return fetch('/create-checkout-session', {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => data.clientSecret);
  }, []);

  const appearance = {
    theme: 'stripe',
  };

  return (
    <div className="App">
      <Router>
        <CheckoutProvider
          stripe={stripePromise}
          options={{
            clientSecret: promise,
            elementsOptions: {appearance},
          }}
        >
          <Routes>
            <Route path="/checkout" element={<CheckoutForm />} />
            <Route path="/complete" element={<Complete />} />
          </Routes>
        </CheckoutProvider>
      </Router>
    </div>
  )
}

export default App;