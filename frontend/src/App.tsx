import Navbar from './components/Navbar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GlobalStyle from './GlobalStyles';
import { AppContainer } from './AppElement';
import { AuthProvider } from './context/AuthProvider';

//pages
import Home from './pages/index';
import Client from './pages/client';
import Report from './pages/report';
import Login from  './pages/login';


function App() {
     return (
      <AuthProvider>
        <Router>
         <GlobalStyle />
         <AppContainer>
           <Navbar/>
           <Routes>
            <Route path = '/' element={<Login />}/>
            <Route path = '/home' element={<Home/>}/>
            <Route path = '/client' element={<Client/>}/>
            <Route path = '/report' element={<Report/>}/>
           </Routes>
         </AppContainer>
       </Router>
      </AuthProvider>
     )
   }

export default App
