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

    /Client Search page/
  .clientSearchPage{
    min-height: 100vh;
    background: #f6f6f7;
    padding: 24px;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }

  .clientSearchHeaderRow{
    max-width: 1050px;
    margin: 0 auto 14px auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .clientSearchTitle{
    margin-top: 20px;
    font-size: 50px;
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
  .clientSearchTableCard{
    max-width: 1050px;
    margin: 0 auto;
    background: white;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  }

  .clientSearchTableHeader{
    background: #3f1622;
    color: white;
    padding: 14px 16px;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr 1.3fr 1fr 0.9fr 0.6fr;
    gap: 10px;
    font-size: 13px;
    font-weight: 800;
  }

  .clientSearchTableRow{
    padding: 14px 16px;
    display: grid;
    grid-template-columns: 1.1fr 0.9fr 1.3fr 1fr 0.9fr 0.6fr;
    gap: 10px;
    align-items: center;
    font-size: 13px;
    color: #333;
    border-bottom: 1px solid #eee;
  }

  .clientSearchTableRow:hover{
    background: #fafafa;
  }

  .clientSearchName{
    font-weight: 700;
    color: #d45b6f;
  }

  .clientSeachActions{
    display: flex;
    gap: 10px;
  }


  .clientSearchActions button{
    background: transparent;
    border: none;
    padding: 0;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.9;
  }

  .clientSearchActions button:hover{
    opacity: 1;
    border-color: transparent;
    transform: translateY(-1px);
  }

  .clientSearchTableFooter{
    padding: 10px 16px;
    font-size: 12px;
    color: #666;
    background: #fff;
  }

  .clientSeachEmpty{
    padding: 60px 16px;
    text-align: center;
  }
  .clientSearchEmptyIcon{
    font-size: 34px;
    opacity: 0.35;
    margin-bottom: 10px;
  }
  .clientSearchEmptyTitle{
    font-weight: 800;
    color: #555;
    margin-bottom: 6px;
  }
  .clientSearchEmptySub{
    color: #888;
    font-size: 13px;
  }

  /* Responsive */
  @media (max-width: 900px){
    .clientSearchTableHeader{
      display: none;
    }

    .clientSearchTableRow{
      grid-template-columns: 1fr;
      gap: 6px;
    }

    .clientSearchTableRow > div{
      display: flex;
      justify-content: space-between;
    }

    .clientSearchActions{
      justify-content: flex-end;
    }
  }

  /* Report page (Goal Progress) */
  .reportPage{
    padding: 24px;
    background: #f7f8f7;
    min-height: calc(100vh - 70px);
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }

  .reportHeaderRow{
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    max-width: 1120px;
    margin: 0 auto 16px auto;
  }

  @media (max-width: 720px) {
    .reportHeaderRow{
      align-items: flex-start;
      flex-direction: column;
    }
  }

  .reportTitle{
    margin: 0;
    font-size: 34px;
    letter-spacing: -0.02em;
    color: #4d1e31;
  }

  .reportSubTitle{
    margin: 6px 0 0 0;
    color: #5a5a5a;
    font-size: 14px;
  }

  .reportControls{
    display: grid;
    gap: 6px;
    min-width: 260px;
  }

  .reportLabel{
    font-size: 12px;
    font-weight: 700;
    color: #5a5a5a;
  }

  .reportSelect{
    height: 40px;
    border-radius: 12px;
    border: 1px solid #e2e2e2;
    background: white;
    padding: 0 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
    outline: none;
  }

  .reportErrorBox{
    max-width: 1120px;
    margin: 0 auto 14px auto;
    background: #fff3f4;
    border: 1px solid #ffd0d6;
    color: #7a0b1e;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 13px;
  }

  .reportStatsGrid{
    max-width: 1120px;
    margin: 0 auto 18px auto;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  @media (max-width: 1120px) {
    .reportStatsGrid{
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 860px) {
    .reportStatsGrid{
      grid-template-columns: 1fr;
    }
  }

  .reportChartsGrid{
    max-width: 1120px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  @media (max-width: 980px) {
    .reportChartsGrid{
      grid-template-columns: 1fr;
    }
  }

  .reportCard{
    background: white;
    border: 1px solid #ececec;
    border-radius: 14px;
    padding: 14px 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  }

  .reportChartCard{
    padding: 14px 14px 12px 14px;
  }

  .reportStatLabel{
    font-size: 12px;
    font-weight: 800;
    color: #6b6b6b;
  }

  .reportStatValue{
    margin-top: 8px;
    font-size: 30px;
    font-weight: 900;
    color: #222;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .reportCardTitle{
    font-weight: 900;
    color: #2b2b2b;
    font-size: 14px;
  }

  .reportCardHint{
    margin-top: 4px;
    color: #6b6b6b;
    font-size: 12px;
  }

  .reportEmptyState{
    margin-top: 12px;
    padding: 14px;
    border-radius: 12px;
    border: 1px dashed #e2e2e2;
    color: #6b6b6b;
    font-size: 13px;
  }

  /* Bar list */
  .reportBarList{
    margin-top: 12px;
    display: grid;
    gap: 10px;
  }

  .reportBarRow{
    display: grid;
    grid-template-columns: 120px 1fr 44px;
    align-items: center;
    gap: 10px;
  }

  .reportBarLabel{
    font-size: 12px;
    color: #2b2b2b;
    font-weight: 700;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .reportBarTrack{
    height: 10px;
    border-radius: 999px;
    background: #f0f0f0;
    overflow: hidden;
  }

  .reportBarFill{
    height: 100%;
    border-radius: 999px;
  }

  .reportBarValue{
    font-size: 12px;
    color: #2b2b2b;
    font-weight: 900;
    text-align: right;
  }

  /* Pie chart */
  .reportPieLayout{
    margin-top: 12px;
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 12px;
    align-items: center;
  }

  @media (max-width: 980px) {
    .reportPieLayout{
      grid-template-columns: 1fr;
    }
  }

  .reportPieSvg{
    width: 180px;
    height: 180px;
    display: block;
    margin: 0 auto;
  }

  .reportLegend{
    display: grid;
    gap: 8px;
  }

  .reportLegendRow{
    display: grid;
    grid-template-columns: 12px 1fr auto;
    gap: 8px;
    align-items: center;
  }

  .reportLegendSwatch{
    width: 12px;
    height: 12px;
    border-radius: 4px;
    display: inline-block;
  }

  .reportLegendText{
    font-size: 12px;
    font-weight: 700;
    color: #2b2b2b;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .reportLegendValue{
    font-size: 12px;
    font-weight: 900;
    color: #2b2b2b;
    text-align: right;
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