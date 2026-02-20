import Navbar from './components/Navbar';
import {Route, Routes, Navigate } from 'react-router-dom';
import GlobalStyle from './GlobalStyles';
import { AppContainer } from './AppElement';
import AuthContext from './context/AuthProvider';

//pages
import Home from './pages/index';
import Client from './pages/client';
import Report from './pages/Report';
import Login from  './pages/login';
import { useContext } from 'react';


function App() {
    const {auth} = useContext(AuthContext);
    console.log(auth.user)
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
              <Route path = '/client' element={<Client/>}/>
              <Route path = '/report' element={<Report/>}/>
           </Routes>
         </AppContainer>
      </>
     )
   }

export default App
