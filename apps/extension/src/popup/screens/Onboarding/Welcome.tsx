import { useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="screen items-center justify-center px-6 text-center">
      <div className="mb-8">
        <div className="text-6xl mb-4">💎</div>
        <h1 className="text-3xl font-bold text-white mb-2">KibiPay</h1>
        <p className="text-white/60 text-sm">Your secure Solana wallet</p>
      </div>

      <div className="w-full space-y-3">
        <button
          className="btn-primary"
          onClick={() => navigate('/onboarding/create')}
        >
          Create New Wallet
        </button>
        <button
          className="btn-secondary"
          onClick={() => navigate('/onboarding/import')}
        >
          Import Existing Wallet
        </button>
      </div>

      <p className="mt-6 text-xs text-white/30 px-4">
        By continuing, you agree to KibiPay's Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
