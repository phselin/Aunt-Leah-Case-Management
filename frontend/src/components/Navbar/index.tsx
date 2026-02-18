import {Logo, Nav,NavLink, Bars, NavMenu, NavBtn, NavBtnLink} from './NavbarElement'

const Navbar = () => {
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
            <NavLink to = "/client">
            Client
            </NavLink>
            <NavLink to = "/report">
            Report
            </NavLink>
        </NavMenu>
        <NavBtn>
            <NavBtnLink to = '/'>Log Out</NavBtnLink>
        </NavBtn>
      </Nav>
    </div>
  )
}

export default Navbar
