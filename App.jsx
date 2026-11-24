import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewTrip from './pages/NewTrip';
import TripPlanner from './pages/TripPlanner';
import BudgetPlanner from './pages/BudgetPlanner';
import Explore from './pages/Explore';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="trips/new" element={<NewTrip />} />
        <Route path="planner" element={<TripPlanner />} />
        <Route path="budget" element={<BudgetPlanner />} />
        <Route path="explore" element={<Explore />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
