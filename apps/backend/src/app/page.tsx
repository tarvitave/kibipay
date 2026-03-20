export default function Page() {
  return (
    <main style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>KibiPay API</h1>
      <p>Available endpoints:</p>
      <ul>
        <li>POST /api/stripe/session — Create Stripe on-ramp session</li>
        <li>POST /api/stripe/webhook — Stripe webhook handler</li>
      </ul>
    </main>
  );
}
