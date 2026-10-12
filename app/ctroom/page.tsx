import { CtroomDashboard } from './components/CtroomDashboard';
import { CtroomProviders } from './components/CtroomProviders';
import './styles/paper-theme.css';

export default function CtroomPage() {
  return (
    <CtroomProviders>
      <div className="paper-theme">
        <CtroomDashboard />
      </div>
    </CtroomProviders>
  );
}
