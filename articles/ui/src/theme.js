import { createTheme } from '@mui/material/styles';

export const berryTheme = createTheme({
  palette: {
    primary: {
      main: '#A83F52', // Berry Red
      light: '#D98291', // Rose Pink
      dark: '#7A2C3A',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#879B79', // Leaf Green
      light: '#A7BCA0',
      dark: '#5A6F4E',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFF8F5', // Cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#34343A', // Charcoal
      secondary: '#66666E',
    },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(168, 63, 82, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(52, 52, 58, 0.06)',
          border: '1px solid rgba(168, 63, 82, 0.08)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 28px rgba(168, 63, 82, 0.12)',
          },
        },
      },
    },
  },
});
