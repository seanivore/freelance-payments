# BUG: Checkout Session Issue 

* **API Call Creates Checkout Session, Never Loads Payment Processor**

1. Console after login while payment session was called but never loads 

uid-ltt-725:1  GET https://payments.august.style/uid-ltt-725 404 (Not Found)
lockdown-install.js:1 SES Removing unpermitted intrinsics
job-DpddM6-q.js:59 Vite: job.tsx loaded
job-DpddM6-q.js:1 ✅ Loaded job data for uid-ltt-725: {logged_in: '2026-02-21T21:59:36.824Z', contract_signed: '2026-02-21T22:06:01.612Z', invoice: '2026-02-21T22:06:04.424Z', payment_1: null, balance: null, …}balance: nullcontract_signed: "2026-02-21T22:06:01.612Z"invoice: "2026-02-21T22:06:04.424Z"logged_in: "2026-02-21T21:59:36.824Z"payment_1: nullpayment_2: null[[Prototype]]: Object
lockdown-install.js:1 SES Removing unpermitted intrinsics
lockdown-install.js:1 SES Removing unpermitted intrinsics
job-DpddM6-q.js:59 Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'match')
    at cm (job-DpddM6-q.js:59:10367)
    at job-DpddM6-q.js:59:11055
cm @ job-DpddM6-q.js:59
(anonymous) @ job-DpddM6-q.js:59
Promise.then
hm @ job-DpddM6-q.js:59
(anonymous) @ job-DpddM6-q.js:59

2. IDK if this is helpful but it came from the Chrome React Inspector app

[
  {
    "name": "Memo",
    "value": {
      "tag": "async",
      "stripePromise": "Promise"
    },
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 2959
    }
  },
  {
    "name": "State",
    "value": {
      "type": "loading",
      "sdk": null
    },
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 3004
    }
  },
  {
    "name": "State",
    "value": null,
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 3068
    }
  },
  {
    "name": "Ref",
    "value": false,
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 3111
    }
  },
  {
    "name": "Effect",
    "value": "() => {}",
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 3124
    }
  },
  {
    "name": "ji",
    "subHooks": [
      {
        "name": "Ref",
        "value": "Promise",
        "subHooks": [],
        "debugInfo": null,
        "hookSource": {
          "lineNumber": 59,
          "functionName": "ji",
          "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
          "columnNumber": 965
        }
      },
      {
        "name": "Effect",
        "value": "() => {}",
        "subHooks": [],
        "debugInfo": null,
        "hookSource": {
          "lineNumber": 59,
          "functionName": "ji",
          "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
          "columnNumber": 984
        }
      }
    ],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "columnNumber": 3800,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js"
    }
  },
  {
    "name": "Effect",
    "value": "() => {}",
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 3808
    }
  },
  {
    "name": "ji",
    "subHooks": [
      {
        "name": "Ref",
        "value": {
          "clientSecret": "Promise",
          "elementsOptions": "{appearance: {…}}"
        },
        "subHooks": [],
        "debugInfo": null,
        "hookSource": {
          "lineNumber": 59,
          "functionName": "ji",
          "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
          "columnNumber": 965
        }
      },
      {
        "name": "Effect",
        "value": "() => {}",
        "subHooks": [],
        "debugInfo": null,
        "hookSource": {
          "lineNumber": 59,
          "functionName": "ji",
          "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
          "columnNumber": 984
        }
      }
    ],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "columnNumber": 3983,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js"
    }
  },
  {
    "name": "Effect",
    "value": "() => {}",
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 3991
    }
  },
  {
    "name": "Effect",
    "value": "() => {}",
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 4400
    }
  },
  {
    "name": "Memo",
    "value": {
      "stripe": null,
      "checkoutState": "{sdk: null, type: \"loading\"}"
    },
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "Al",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 4441
    }
  }
]


----

{
  "price": {
    "count": 1,
    "currency": "usd",
    "unit_amount": 537500,
    "active": true,
    "billing_scheme": "per_unit",
    "pay_by": "start of work",
    "nickname": "Initial Payment",
    "product": "{products: Array(1)}",
    "id": "price_1SvIbP4zGcNmpOAwCpXvfPw2"
  },
  "coupon": {
    "amount_off": 497500,
    "applies_to": "{products: Array(1)}",
    "currency": "usd",
    "duration": "once",
    "id": "cou-ltt-725",
    "max_redemptions": 1,
    "name": "EMYS-DISCOUNT"
  }
}

----

[
  {
    "name": "State",
    "value": null,
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "fm",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 11133
    }
  },
  {
    "name": "State",
    "value": false,
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "fm",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 11156
    }
  },
  {
    "name": "Yp",
    "subHooks": [
      {
        "name": "CheckoutContext",
        "value": {
          "stripe": null,
          "checkoutState": "{sdk: null, type: \"loading\"}"
        },
        "subHooks": [],
        "debugInfo": null,
        "hookSource": {
          "lineNumber": 59,
          "functionName": "Yp",
          "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
          "columnNumber": 5247
        }
      }
    ],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "columnNumber": 11171,
      "functionName": "fm",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js"
    }
  },
  {
    "name": "Memo",
    "value": 400,
    "subHooks": [],
    "debugInfo": null,
    "hookSource": {
      "lineNumber": 59,
      "functionName": "fm",
      "fileName": "https://payments.august.style/assets/job-DpddM6-q.js",
      "columnNumber": 11180
    }
  }
]
