import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/AuthProvider'
import {Logo, Nav,NavLink, Bars, NavMenu, NavBtn, NavBtnLink} from './NavbarElement'
import { useActiveClient } from '../../context/ActiveClientProvider';

const Navbar = () => {

  const { setAuth } = useContext(AuthContext)
  const navigate = useNavigate()
  const {activeClientId} = useActiveClient();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/logout', {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setAuth({});
      navigate('/');
    }
  };

  return (
    <div>
      <Nav>
        <Logo>
            <h1>Client Manager</h1>
        </Logo>
        <Bars/>
        <NavMenu>
            <NavLink to = "/home">
            Home
            </NavLink>
            <NavLink to = {activeClientId ? `/client/${activeClientId}` : "/client"}>
            Client
            </NavLink>
            <NavLink to = "/report">
            Report
            </NavLink>
        </NavMenu>
        <NavBtn>
            <NavBtnLink onClick={handleLogout}>Log Out</NavBtnLink>
        </NavBtn>
      </Nav>
    </div>
  )
}

export default Navbar
