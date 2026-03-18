import styled from 'styled-components'
import { NavLink as Link } from 'react-router-dom'
import { palette } from '../../theme/palette'

export const Nav = styled.nav`
    background: ${palette.magentaPink};
    height: 80px;
    position: relative;
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

    @media screen and (max-width: 850px) {
        width: 100%;
        height: auto;
        padding: 12px 0;
        justify-content: flex-start;
    }
` 

export const MenuToggle = styled.button`
    display: none;
    background: transparent;
    border: none;
    color: #fff;
    padding: 0;
    margin-left: auto;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;

    @media screen and (max-width: 850px) {
        display: inline-flex;
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

export const MobileMenu = styled.div<{ $open: boolean }>`
    display: none;

    @media screen and (max-width: 850px) {
        display: ${({ $open }) => ($open ? 'flex' : 'none')};
        flex-direction: column;
        gap: 8px;
        position: absolute;
        top: 80px;
        left: 0;
        right: 0;
        background: ${palette.magentaPink};
        padding: 12px 16px 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
        z-index: 20;

        a,
        button {
            width: 100%;
        }
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

@media screen and (max-width: 850px) {
    width: 100%;
    text-align: left;
}
`
