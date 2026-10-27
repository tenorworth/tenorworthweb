import { Routes, Route } from 'react-router-dom';
import Shell from './components/Shell';
import Account from './pages/Account';
import Accounts from './pages/Accounts';
import Events from './pages/Events';
import Home from './pages/Home';
import Login from './pages/Login';
import Pipeline from './pages/Pipeline';
import Prospect from './pages/Prospect';
import ProspectNew from './pages/ProspectNew';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route element={<Shell />}>
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/pipeline/new" element={<ProspectNew />} />
        <Route path="/pipeline/:id" element={<Prospect />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<Account />} />
        <Route path="/events" element={<Events />} />
      </Route>
    </Routes>
  );
}
