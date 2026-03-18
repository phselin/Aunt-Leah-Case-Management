import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthProvider'
import { FaBars } from 'react-icons/fa';
import { Logo, Nav, NavLink, MenuToggle, NavMenu, NavBtn, NavBtnLink, MobileMenu } from './NavbarElement'
import api from "../../api";

const Navbar = () => {

  const { setAuth } = useContext(AuthContext)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/logout', {});
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      setAuth({});
      setMobileOpen(false);
      navigate('/');
    }
  };

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <div>
      <Nav>
        <Logo>
          <img src="/auntleahslogo.svg" alt="Aunt Leah's Logo" />
        </Logo>
        <MenuToggle
          type="button"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <FaBars />
        </MenuToggle>
        <NavMenu>
          <NavLink to="/home">
            Home
          </NavLink>
          <NavLink to="/client">
            Client
          </NavLink>
          <NavLink to="/report">
            Report
          </NavLink>
        </NavMenu>
        <NavBtn>
          <NavBtnLink onClick={handleLogout}>Log Out</NavBtnLink>
        </NavBtn>
        <MobileMenu $open={mobileOpen}>
          <NavLink to="/home" onClick={closeMobileMenu}>
            Home
          </NavLink>
          <NavLink to="/client" onClick={closeMobileMenu}>
            Client
          </NavLink>
          <NavLink to="/report" onClick={closeMobileMenu}>
            Report
          </NavLink>
          <NavBtnLink onClick={handleLogout}>Log Out</NavBtnLink>
        </MobileMenu>
      </Nav>
    </div>
  )
}

export default Navbar
