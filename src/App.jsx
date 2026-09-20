import { AppRouter } from "./app/router/AppRouter.jsx";
import { AuthInitializer } from "./modules/auth/components/AuthInitializer.jsx";

function App() {
  return (
    <AuthInitializer>
      <AppRouter />
    </AuthInitializer>
  );
}

export default App;
