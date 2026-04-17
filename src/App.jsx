
import { AuthProvider } from "./context/AuthContext";
import MainRoute from "./routes/MainRoute";
import ToasterOptions from "./utils/ToasterOptions";

export default function App() {
  return (
    <AuthProvider>
      <MainRoute />
      <ToasterOptions />
    </AuthProvider>
  );
}
