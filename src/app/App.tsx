import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';
import { PushProvider } from '../hooks/usePush';
import { AreasProvider } from '../hooks/useAreas';
import { NotesProvider } from '../hooks/useNotes';
import { ToastProvider } from '../components/ui/ui';
import { PrefsProvider } from '../hooks/usePrefs';
import { basename } from './paths';
import AppRoutes from './router';

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <PrefsProvider>
        <ToastProvider>
          <AuthProvider>
            <PushProvider>
              <AreasProvider>
                <NotesProvider>
                  <AppRoutes />
                </NotesProvider>
              </AreasProvider>
            </PushProvider>
          </AuthProvider>
        </ToastProvider>
      </PrefsProvider>
    </BrowserRouter>
  );
}
