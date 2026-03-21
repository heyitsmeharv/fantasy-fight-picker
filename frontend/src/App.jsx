import AppRoutes from "./routes/AppRoutes";
import { PicksProvider } from "./context/PicksContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ResultsProvider } from "./context/ResultsContext";
import Toaster from "./components/ui/toaster";

const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ResultsProvider>
          <PicksProvider>
            <AppRoutes />
            <Toaster />
          </PicksProvider>
        </ResultsProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;