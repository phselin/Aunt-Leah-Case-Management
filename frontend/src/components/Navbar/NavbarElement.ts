import styled from 'styled-components'
import { NavLink as Link } from 'react-router-dom'
import {FaBars} from 'react-icons/fa'
import { palette } from '../../theme/palette'

export const Nav = styled.nav`
    background: ${palette.magentaPink};
    height: 80px;
    display: flex;
    justify-content: space-between;
    padding: 0 2rem;
    z-index:10;
    width: 100%;
`

export const Logo = styled.div`
    color: #fff;
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: 0 1rem;
    height: 100%;
` 

export const NavLink = styled(Link)`
    color: #fff;
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: 0 1rem;
    height: 100%;
    cursor: pointer;
    
    &.active {
        text-decoration: underline;
    }
    
    &:hover {
        color: ${palette.deepRed}
    }
` 

export const Bars = styled(FaBars)`
    display: none;
    color: #fff;

    @media screen and (max-width: 850px) {
    display: block;
    position: absolute;
    top: 0;
    right: 0;
    transform: translate(-100%, 75%);
    font-size: 1.8rem;
    cursor: pointer;
    }
`

export const NavMenu = styled.div`
    display: flex;
    align-items: center;
    margin-right: -24px;

    @media screen and (max-width: 850px) {
    display: none;
    }
`

export const NavBtn = styled.nav`
    display: flex;
    align-items: center;
    margin-left: auto;
    margin-right: 24px;

    @media screen and (max-width: 850px) {
    display: none;
    }
`

export const NavBtnLink = styled.button`
border-radius: 4px;
background: ${palette.deepRed};
padding: 10px 22px;
color: #fff;
border: none;
outline: none;
cursor: pointer;
transition: all 0.2s ease-in-out;
text-decoration: none;

&:hover {
    transition: all 0.2s ease-in-out;
    background: #fff;
    color: ${palette.deepRed};
}
`
