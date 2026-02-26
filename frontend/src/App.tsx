import Navbar from './components/Navbar';
import {Route, Routes, Navigate } from 'react-router-dom';
import GlobalStyle from './GlobalStyles';
import { AppContainer } from './AppElement';
import AuthContext from './context/AuthProvider';

//pages
import Home from './pages/index';
import Client from './pages/client';
import Report from './pages/report';
import Login from  './pages/login';
import { useContext } from 'react';
import ClientModal from './pages/clientModal';
import CaseManagementView from './pages/CaseManagementView';


function App() {
    const {auth} = useContext(AuthContext);
    if (!auth.user) {
      return (
        <>
          <GlobalStyle />
          <Login />
        </>
      )
    }

     return (
      <>
       <GlobalStyle />
         <AppContainer>
           <Navbar/>
           <Routes>
              <Route path = '/' element={<Navigate to='/home'></Navigate>}/>
              <Route path = '/home' element={<Home/>}/>
              <Route path='/client' element={<Client />}>
                <Route path=':id' element={<ClientModal />} />
                <Route path=':id/casenotes' element={<CaseManagementView />} />
              </Route>
              <Route path = '/report' element={<Report/>}/>
              <Route path = '*' element={<Navigate to='/home'></Navigate>}/>
           </Routes>
         </AppContainer>
      </>
     )
   }

export default App
