import './App.css';

import { BrowserRouter, Routes, Route  } from 'react-router-dom';
import { Box } from '@mui/material'
import ReservationShow from './pages/ReservationShow';
import ReservationManagement from './pages/ReservationManagement';
import ReservationCall from './pages/ReservationCall';
import Header from './component/header';
import Purchase from './pages/Purchase';

function App() {
  return (
    <div>
      <BrowserRouter>
        <Header />
        <Box sx={{marginBottom: "40px"}}></Box>
        <Routes>
          <Route path='/Reservation_Show' element={<ReservationShow />}/>
          <Route path='/Reservation_Management' element={<ReservationManagement />}/>
          <Route path='/Call' element={<ReservationCall />}/>
          <Route path='/Purchase' element={<Purchase />}/>
        </Routes>
      </BrowserRouter>

    </div>
  );
}

export default App;
