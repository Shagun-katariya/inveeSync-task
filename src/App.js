import "./App.css";
import Dashboard from "./components/dashboard/Dashboard";
//for notification
import { ToastContainer } from "react-toastify";

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Dashboard />
    </>
  );
}

export default App;
