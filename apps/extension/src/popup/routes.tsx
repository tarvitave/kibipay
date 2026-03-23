import { Routes, Route, Navigate } from 'react-router-dom';
import { useWalletState } from './hooks/useWallet.js';
import Welcome from './screens/Onboarding/Welcome.js';
import CreateWallet from './screens/Onboarding/CreateWallet.js';
import ConfirmMnemonic from './screens/Onboarding/ConfirmMnemonic.js';
import ImportWallet from './screens/Onboarding/ImportWallet.js';
import SetPassword from './screens/Onboarding/SetPassword.js';
import Unlock from './screens/Unlock.js';
import Dashboard from './screens/Dashboard/Dashboard.js';
import Send from './screens/Send/Send.js';
import SelectToken from './screens/Send/SelectToken.js';
import ReviewTransaction from './screens/Send/ReviewTransaction.js';
import Receive from './screens/Receive.js';
import Onramp from './screens/Onramp/Onramp.js';
import Settings from './screens/Settings/Settings.js';
import ConnectedApps from './screens/Settings/ConnectedApps.js';
import ConnectPrompt from './screens/DAppPrompts/ConnectPrompt.js';
import SignPrompt from './screens/DAppPrompts/SignPrompt.js';
import LoadingScreen from './components/LoadingScreen.js';

function RequireUnlocked({ children }: { children: React.ReactNode }) {
  const { state, loading } = useWalletState();
  if (loading) return <LoadingScreen />;
  if (!state?.hasVault) return <Navigate to="/onboarding/welcome" replace />;
  if (state?.isLocked) return <Navigate to="/unlock" replace />;
  return <>{children}</>;
}

export function AppRoutes() {
  const { state, loading } = useWalletState();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      {/* Onboarding */}
      <Route path="/onboarding/welcome" element={<Welcome />} />
      <Route path="/onboarding/create" element={<CreateWallet />} />
      <Route path="/onboarding/confirm" element={<ConfirmMnemonic />} />
      <Route path="/onboarding/import" element={<ImportWallet />} />
      <Route path="/onboarding/set-password" element={<SetPassword />} />

      {/* Unlock */}
      <Route path="/unlock" element={<Unlock />} />

      {/* Main app */}
      <Route path="/dashboard" element={<RequireUnlocked><Dashboard /></RequireUnlocked>} />
      <Route path="/send" element={<RequireUnlocked><Send /></RequireUnlocked>} />
      <Route path="/send/select-token" element={<RequireUnlocked><SelectToken /></RequireUnlocked>} />
      <Route path="/send/review" element={<RequireUnlocked><ReviewTransaction /></RequireUnlocked>} />
      <Route path="/receive" element={<RequireUnlocked><Receive /></RequireUnlocked>} />
      <Route path="/onramp" element={<RequireUnlocked><Onramp /></RequireUnlocked>} />
      <Route path="/settings" element={<RequireUnlocked><Settings /></RequireUnlocked>} />
      <Route path="/settings/connected-apps" element={<RequireUnlocked><ConnectedApps /></RequireUnlocked>} />

      {/* dApp prompts (opened as popup windows) */}
      <Route path="/dapp/connect" element={<ConnectPrompt />} />
      <Route path="/dapp/sign" element={<SignPrompt />} />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              !state?.hasVault
                ? '/onboarding/welcome'
                : state?.isLocked
                ? '/unlock'
                : '/dashboard'
            }
            replace
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
