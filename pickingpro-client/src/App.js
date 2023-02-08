import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Config from './pages/Config'
import Login from './pages/Login'
import Packing from './pages/Packing'
import Picking from './pages/Picking'
import Register from './pages/Register'
import ErrorNotDefined from './pages/ErrorNotDefined'
import MuiNavbar from './components/MuiNavbar'
import "react-toastify/dist/ReactToastify.css";
import Problems from './pages/Problems'
import Revision from './pages/Revision'

function App() {
  return (
    <>
      <BrowserRouter>
        <MuiNavbar />
        <Routes>
          <Route path='/' element={<Dashboard />} />
          <Route path='/config' element={<Config />} />
          <Route path='/login' element={<Login />} />
          <Route path='/packing' element={<Packing />} />
          <Route path='/picking' element={<Picking />} />
          <Route path='/register' element={<Register />} />
          <Route path='/problems' element={<Problems />} />
          <Route path='/check-orders' element={<Revision />} />
          <Route path='*' element={<ErrorNotDefined />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
