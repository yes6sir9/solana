import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Landing } from "./pages/Landing";
import { MyPets } from "./pages/MyPets";
import { PetProfile } from "./pages/PetProfile";
import { Inventory } from "./pages/Inventory";
import { MiniGames } from "./pages/MiniGames";
import { Quests } from "./pages/Quests";
import { Marketplace } from "./pages/Marketplace";
import { Leaderboard } from "./pages/Leaderboard";
import { Profile } from "./pages/Profile";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pets" element={<MyPets />} />
        <Route path="/pets/:id" element={<PetProfile />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/games" element={<MiniGames />} />
        <Route path="/quests" element={<Quests />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Layout>
  );
}

export default App;
