import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import RoomsPage from './pages/RoomsPage'

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#222222',
            color: '#f5f5f5',
            border: '1px solid #333333',
            borderRadius: '8px',
            fontSize: '13px',
            padding: '10px 14px',
          },
          success: {
            iconTheme: {
              primary: '#38bdf8',
              secondary: '#121212',
            },
          },
          error: {
            iconTheme: {
              primary: '#f87171',
              secondary: '#121212',
            },
          },
        }}
      />
      <RoomsPage />
    </AuthProvider>
  )
}
