import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
    line-height: 1.5;
    font-weight: 400;

    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    background-color: #f8f9fa; /* Your AppContainer color */
  }

  h1 {
    font-size: 3.2em;
    line-height: 1.1;
  }

  a {
    font-weight: 500;
    color: #646cff;
    text-decoration: inherit;
  }

  a:hover {
    color: #535bf2;
  }

  button {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: #1a1a1a;
    cursor: pointer;
    transition: border-color 0.25s;
  }

  button:hover {
    border-color: #646cff;
  }

  button:focus,
  button:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }

    /Client page/
  .clientPage{
    min-height: 100vh;
    background: #f6f6f7;
    padding: 24px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }

  .clientHeaderRow{
    max-width: 1050px;
    margin: 0 auto 14px auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .clientTitle{
    font-size: 14px;
    font-weight: 700;
    color: #333;
  }

  /* override global button style for this button */
  .addClientBtn{
    background: #d45b6f;
    color: white;
    border: 0;
    padding: 10px 14px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 700;
  }
  .addClientBtn:hover{
    border-color: transparent;
    filter: brightness(0.98);
  }

  /* Search bar */
  .clientSearchBar{
    max-width: 1050px;
    margin: 0 auto 18px auto;
    display: flex;
    align-items: center;
    gap: 10px;
    background: white;
    border: 1px solid #e2e2e2;
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.06);
  }

  .searchIcon{
    opacity: 0.6;
  }

  .clientSearchBar input{
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
    background: transparent;
  }

  /* Table card */
  .clientTableCard{
    max-width: 1050px;
    margin: 0 auto;
    background: white;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  }

  .clientTableHeader{
    background: #3f1622;
    color: white;
    padding: 14px 16px;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr 1.3fr 1fr 0.9fr 1fr 0.6fr;
    gap: 10px;
    font-size: 13px;
    font-weight: 800;
  }

  .clientTableRow{
    padding: 14px 16px;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr 1.3fr 1fr 0.9fr 1fr 0.6fr;
    gap: 10px;
    align-items: center;
    font-size: 13px;
    color: #333;
    border-bottom: 1px solid #eee;
  }

  .clientTableRow:hover{
    background: #fafafa;
  }

  .clientName{
    font-weight: 700;
    color: #d45b6f;
  }

  .clientActions{
    display: flex;
    gap: 10px;
  }


  .clientActions button{
    background: transparent;
    border: none;
    padding: 0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.9;
  }

  .clientActions button:hover{
    opacity: 1;
    border-color: transparent;
    transform: translateY(-1px);
  }

  .clientTableFooter{
    padding: 10px 16px;
    font-size: 12px;
    color: #666;
    background: #fff;
  }

  .clientEmpty{
    padding: 60px 16px;
    text-align: center;
  }
  .clientEmptyIcon{
    font-size: 34px;
    opacity: 0.35;
    margin-bottom: 10px;
  }
  .clientEmptyTitle{
    font-weight: 800;
    color: #555;
    margin-bottom: 6px;
  }
  .clientEmptySub{
    color: #888;
    font-size: 13px;
  }

  /* Responsive */
  @media (max-width: 900px){
    .clientTableHeader{
      display: none;
    }

    .clientTableRow{
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .clientTableRow > div{
      display: flex;
      justify-content: space-between;
    }

    .clientActions{
      justify-content: flex-end;
    }
  }


  @media (prefers-color-scheme: light) {
    :root {
      color: #213547;
      background-color: #ffffff;
    }
    
    a:hover {
      color: #747bff;
    }
    
    button {
      background-color: #f9f9f9;
    }
  }
`;

export default GlobalStyle;