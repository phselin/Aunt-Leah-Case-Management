import styled from 'styled-components';
import { palette } from './theme/palette';

export const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* Keeps background full-height even if content is short */
  background-color: ${palette.offWhite}; /* A professional light-grey background */
  width: 100%;
`;