import Navbar from './components/Navbar';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GlobalStyle from './GlobalStyles';
import { AppContainer } from './AppElement';

//pages
import Home from './pages/index';
import Client from './pages/client';
import Report from './pages/report';


function App() {
     return (
       <Router>
         <GlobalStyle />
         <AppContainer>
           <Navbar/>
           <Routes>
            <Route path = '/home' element={<Home/>}/>
            <Route path = '/client' element={<Client/>}/>
            <Route path = '/report' element={<Report/>}/>
           </Routes>
         </AppContainer>
       </Router>
     )
   }
export default App
