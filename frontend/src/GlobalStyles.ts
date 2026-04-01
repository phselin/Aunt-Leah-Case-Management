import { createGlobalStyle } from 'styled-components';
import { palette } from './theme/palette';

import PoppinsRegular from './assets/Poppins/Poppins-Regular.ttf';
import PoppinsSemiBold from './assets/Poppins/Poppins-SemiBold.ttf';

const GlobalStyle = createGlobalStyle`
  @font-face {
    font-family: 'Poppins';
    src: url(${PoppinsRegular}) format('truetype');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }

  @font-face {
    font-family: 'Poppins';
    src: url(${PoppinsSemiBold}) format('truetype');
    font-weight: 600;
    font-style: normal;
    font-display: swap;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    font-family: 'Poppins', sans-serif;
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
    background-color: #f8f9fa;
    font-family: 'Poppins', sans-serif;
    font-weight: 400;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
  }

  h1 {
    font-size: 3.2em;
    line-height: 1.1;
  }

  a {
    font-weight: 500;
    color: ${palette.brightPeriwinkle};
    text-decoration: inherit;
  }

  a:hover {
    color: ${palette.brightPeriwinkle};
  }

  button {
    border-radius: 8px;
    border: 1px solid transparent;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
    background-color: #1a1a1a;
    color: white;
    cursor: pointer;
    transition: border-color 0.25s;
  }

  button:hover {
    border-color: ${palette.brightPeriwinkle};
  }

  button:focus,
  button:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }

    /Client Search page/
  .clientPage{
    min-height: 100vh;
    background: #f6f6f7;
    padding: 24px;
    font-family: 'Poppins', sans-serif;
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
  .addClientBtn, .exportClientsBtn {
    background: ${palette.magentaPink};
    color: white;
    border: 0;
    padding: 10px 14px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 700;
  }
  .addClientBtn:hover, .exportClientsBtn:hover:not(:disabled) {
    border-color: transparent;
    filter: brightness(0.98);
  }

  .exportClientsBtn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .clientSearchHeaderActions {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  @media (max-width: 768px) {
    .clientPage{
      padding: 16px;
    }

    .clientSearchHeaderRow{
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .clientSearchTitle{
      margin-top: 8px;
      font-size: 34px;
      line-height: 1.05;
    }

    .clientSearchHeaderActions{
      width: 100%;
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }

    .addClientBtn,
    .exportClientsBtn{
      width: 100%;
    }

    .clientSearchBar{
      flex-wrap: wrap;
    }

    .clientSearchTableHeader{
      display: none;
    }

    .clientSearchTableRow{
      grid-template-columns: 1fr;
      align-items: start;
    }

    .clientSearchActions{
      justify-self: end;
    }
  }

  .clientErrorBox {
    max-width: 1050px;
    margin: 20px auto 14px auto;
    background: #fff3f4;
    border: 1px solid #ffd0d6;
    color: #7a0b1e;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
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
    background: ${palette.deepRed};
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
    background: ${palette.white};
  }

  .clientSearchName{
    font-weight: 700;
    color: ${palette.magentaPink};
  }

  .clientSearchName:hover {
    cursor: pointer;
    color: ${palette.deepRed};
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

  /* Report page (Impact & milestones) */
  .reportSectionTitle{
    margin: 0 0 14px 0;
    font-size: 20px;
    font-weight: 900;
    color: #4d1e31;
  }

  .reportKpiSection{
    margin: 0 0 28px 0;
  }

  .reportMilestoneSection{
    margin: 0;
  }

  .reportKpiGrid{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
    margin-bottom: 14px;
  }

  .reportKpiTile{
    background: white;
    border: 1px solid #ececec;
    border-radius: 14px;
    padding: 14px 14px 12px 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    min-height: 120px;
    display: flex;
    flex-direction: column;
  }

  .reportKpiTileTitle{
    font-size: 12px;
    font-weight: 800;
    color: #6b6b6b;
    line-height: 1.35;
  }

  .reportKpiTileValue{
    margin-top: 10px;
    font-size: 22px;
    font-weight: 900;
    color: #222;
    line-height: 1.2;
  }

  .reportKpiTileHint{
    margin-top: 8px;
    font-size: 11px;
    color: #6b6b6b;
    line-height: 1.4;
  }

  .reportKpiTileFoot{
    margin-top: auto;
    padding-top: 6px;
    font-size: 10px;
    color: #888;
    line-height: 1.35;
  }

  .reportKpiAgeCard{
    margin-top: 4px;
  }

  .reportPage{
    padding: 24px;
    background: ${palette.offWhite};
    min-height: calc(100vh - 70px);
    font-family: 'Poppins', sans-serif;
  }

  .reportHeaderRow{
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin: 0 0 16px 0;
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

  .reportControlsRow{
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
    justify-content: flex-end;
  }

  .reportControls{
    display: grid;
    gap: 6px;
    min-width: 220px;
  }

  .reportMilestoneCategoryBlock{
    margin-top: 16px;
  }

  .reportMilestoneCategoryBlock:first-of-type{
    margin-top: 0;
  }

  .reportMilestoneCategoryTitle{
    font-size: 13px;
    font-weight: 800;
    color: #4d1e31;
    margin-bottom: 8px;
    letter-spacing: 0.02em;
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
    margin: 0 0 14px 0;
    background: #fff3f4;
    border: 1px solid #ffd0d6;
    color: #7a0b1e;
    padding: 12px 14px;
    border-radius: 12px;
    font-size: 13px;
  }

  .reportStatsGrid{
    margin: 0 0 18px 0;
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
    margin: 0;
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
    font-size: 24px;
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
      color: ${palette.brightPeriwinkle};
    }
    
    button {
      background-color: #f9f9f9;
    }
  }
`;

export default GlobalStyle;