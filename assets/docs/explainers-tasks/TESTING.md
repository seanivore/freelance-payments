
## 🧪 Testing

### Test 1: Push Test JSON File

1. Push one of the test JSON files to GitHub
2. Check GitHub Actions - should run workflow
3. Check Stripe Dashboard - should see new Products
4. Check JSON file - should have Stripe IDs added

### Test 2: Payment Flow

1. Visit your site: `https://your-project.vercel.app`
2. Enter test lookup: Last Name `Single`, Keyword `single-payment-test`
3. Should route to contract page
4. Sign contract (will call `/api/sign-contract`)
5. Should route to invoice
6. Click "Pay Now" → Stripe checkout
7. Use test card: `4242 4242 4242 4242`
8. Complete payment
9. Webhook should trigger → Update JSON → Route to completion

### Test 3: Edge Cases

Test all 8 test JSON files:
- Single payment
- Multi-payment
- Already signed
- Partially paid
- All paid
- Special characters
- Long descriptions
- Four payments

---

## 🔍 Troubleshooting

### GitHub Actions Not Running
- Check branch name matches workflow
- Verify `STRIPE_SECRET_KEY` secret exists
- Check workflow file path: `.github/workflows/process-job.yml`

### Vercel Functions Not Working
- Check environment variables are set
- Check function logs: `vercel logs`
- Verify Stripe keys are correct

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Test webhook in Stripe Dashboard → "Send test webhook"

### Payment Intent Creation Fails
- Check Stripe secret key is correct
- Verify `price_id` exists in Stripe
- Check Vercel function logs for errors

---

## 📝 Next Steps After Setup

1. ✅ Test with all 8 test JSON files
2. ✅ Verify Stripe products created correctly
3. ✅ Test payment flow end-to-end
4. ✅ Test contract signing flow
5. ✅ Test webhook updates
6. ✅ Test edge cases (special chars, long descriptions)
7. ✅ Clean up test files before production use

---

## 🎯 Key Files Reference

- **Workflow**: `.github/workflows/process-job.yml`
- **Stripe Script**: `.github/scripts/process_stripe_products.py`
- **Vercel Config**: `vercel.json`
- **Setup Guide**: `VERCEL_SETUP.md`
- **Architecture**: `WORKFLOW_ARCHITECTURE.md`
- **Test Guide**: `TEST_JOBS_README.md`

---

**Status**: All code complete! Ready for deployment and testing. 🚀
