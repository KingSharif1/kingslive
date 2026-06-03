import { CtroomDashboard } from './components/CtroomDashboard';
import { CtroomProviders } from './components/CtroomProviders';

export default function CtroomPage() {
  return (
    <CtroomProviders>
      <CtroomDashboard />
    </CtroomProviders>
  );
}
