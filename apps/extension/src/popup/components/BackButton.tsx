import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackButton({ to }: { to?: string }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Go back"
    >
      <ArrowLeft size={20} />
    </button>
  );
}
