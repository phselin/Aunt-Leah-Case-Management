import styled from 'styled-components'
import { NavLink as Link } from 'react-router-dom'
import { palette } from '../../theme/palette'

export const Nav = styled.nav`
    background: ${palette.magentaPink};
    height: 70px; /* Thinner but substantial bar */
    position: sticky;
    top: 0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0 4rem; /* Nudges the entire navbar content right */
    z-index: 10;
    width: 100%;

    @media screen and (max-width: 850px) {
        padding: 0 1.5rem;
    }
`

export const Logo = styled.div`
    display: flex;
    align-items: center;
    height: 100%;
    
    /* BIGGER GAP: Separates branding from the navigation group */
    margin-right: 60px; 
    
    img {
        height: 24px; /* Small, sleek logo */
        width: auto;
    }
` 

export const NavMenu = styled.div`
    display: flex;
    align-items: center;
    height: 100%;
    
    /* SMALLER GAP: Keeps the navigation titles grouped together */
    gap: 28px; 

    @media screen and (max-width: 850px) {
        display: none;
    }
`

export const NavLink = styled(Link)`
    /* Grayed out inactive state */
    color: rgba(255, 255, 255, 0.6); 
    display: flex;
    align-items: center;
    text-decoration: none;
    padding: 0 4px; /* Minimal padding so the NavMenu gap controls spacing */
    height: 100%;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    
    /* NO BOLDING: Weight stays consistent at 500 */
    font-weight: 500; 
    
    /* VERTICAL NUDGE: Aligns text optically with the logo center */
    transform: translateY(2px); 
    
    transition: color 0.2s ease-in-out;
    
    &.active {
        /* Active page pops in bright white */
        color: #ffffff;
        text-decoration: none;
    }
    
    &:hover {
        color: #ffffff;
    }

    @media screen and (max-width: 850px) {
        width: 100%;
        height: auto;
        padding: 12px 0;
        color: #fff;
        transform: none;
    }
` 

export const NavBtn = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto;

    @media screen and (max-width: 850px) {
        display: none;
    }
`

export const NavBtnLink = styled.button`
    border-radius: 4px;
    background: ${palette.deepRed};
    padding: 8px 20px;
    color: #fff;
    border: none;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 600;
    transition: 0.2s ease;

    &:hover {
        background: #fff;
        color: ${palette.deepRed};
    }
`

export const MenuToggle = styled.button`
    display: none;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;

    @media screen and (max-width: 850px) {
        display: block;
        margin-left: auto;
    }
`

export const MobileMenu = styled.div<{ $open: boolean }>`
    display: ${({ $open }) => ($open ? 'flex' : 'none')};
    flex-direction: column;
    position: absolute;
    top: 70px;
    left: 0;
    right: 0;
    background: ${palette.magentaPink};
    padding: 16px;
    z-index: 20;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
`