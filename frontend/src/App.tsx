import Navbar from './components/Navbar';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import GlobalStyle from './GlobalStyles';
import { AppContainer } from './AppElement';
import AuthContext from './context/AuthProvider';
import muiTheme from './theme/muiTheme';

import Home from './pages/index';
import Client from './pages/client';
import Report from './pages/report';
import Login from './pages/login';
import { useContext } from 'react';
import ClientModal from './pages/clientModal';


function App() {
  const { auth } = useContext(AuthContext);
  if (!auth.user) {
    return (
      <ThemeProvider theme={muiTheme}>
        <GlobalStyle />
        <Login />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <GlobalStyle />
      <AppContainer>
        <Navbar />
        <Routes>
          <Route path='/' element={<Navigate to='/home'></Navigate>} />
          <Route path='/home' element={<Home />} />
          <Route path='/client' element={<Client />}>
            <Route path=':id' element={<ClientModal />} />
          </Route>
          <Route path='/report' element={<Report />} />
          <Route path='*' element={<Navigate to='/home'></Navigate>} />
        </Routes>
      </AppContainer>
    </ThemeProvider>
  )
}

export default App
