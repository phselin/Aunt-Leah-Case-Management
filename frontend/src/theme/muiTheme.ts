import { createTheme } from '@mui/material/styles';

const POPPINS = "'Poppins', sans-serif";

const muiTheme = createTheme({
  typography: {
    fontFamily: POPPINS,
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { fontWeight: 400 },
    body2: { fontWeight: 400 },
    button: { fontWeight: 600 },
  },
});

export default muiTheme;
