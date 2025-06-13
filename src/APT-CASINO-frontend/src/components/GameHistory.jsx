import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

const GameHistory = ({ hotNumbers, coldNumbers }) => {
  const recentNumbers = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  
  const NumberBall = ({ number, size = 32, opacity = 1 }) => (
    <Box 
      sx={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: number === 0 ? '#14D854' : 
          [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(number) ? '#d82633' : '#333',
        color: 'white',
        fontWeight: 'bold',
        fontSize: `${size * 0.025}rem`,
        opacity,
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.1)',
          cursor: 'pointer'
        }
      }}
    >
      {number}
    </Box>
  );

  return (
    <Paper 
      sx={{ 
        p: 3, 
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" gutterBottom color="white">Recent Game Results</Typography>
      <Typography variant="body1" paragraph color="white">
        Track the results of previous spins and identify patterns. This data is updated in real-time.
      </Typography>
      
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1, 
          my: 3,
          justifyContent: 'center'
        }}
      >
        {recentNumbers.map((num, idx) => (
          <NumberBall 
            key={idx} 
            number={num} 
            opacity={idx < 20 ? 1 : 0.5}
          />
        ))}
      </Box>
      
      <Typography variant="h6" gutterBottom color="white">Hot and Cold Numbers</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Typography variant="subtitle1" color="error.main" gutterBottom>Hot Numbers</Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {hotNumbers.map((num, idx) => (
                <NumberBall key={idx} number={num} size={36} />
              ))}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box 
            sx={{ 
              p: 2, 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: 2,
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)'
              }
            }}
          >
            <Typography variant="subtitle1" color="info.main" gutterBottom>Cold Numbers</Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              {coldNumbers.map((num, idx) => (
                <NumberBall key={idx} number={num} size={36} />
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default React.memo(GameHistory); 