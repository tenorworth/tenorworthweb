import { Routes, Route } from 'react-router-dom';
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
      <Route path="/pipeline" element={<Pipeline />} />
      <Route path="/pipeline/new" element={<ProspectNew />} />
      <Route path="/pipeline/:id" element={<Prospect />} />
    </Routes>
  );
}
