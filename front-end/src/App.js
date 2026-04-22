import './App.css';
import Main from "./components/Main";
import Swap from './components/Swap';

function App() {

  return (
    <div className="app-shell">

      <Main />
      <div className="app-title-section">
        <h2 className="app-title">Enhanced Dex Aggregator</h2>
        <p className="app-subtitle">
          Compare swap quotes across major DEXs and track transaction activity in one place.
        </p>
      </div>
      <Swap />
    </div>
  );
}

export default App;
