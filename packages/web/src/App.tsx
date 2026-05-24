//import { useState } from 'react'
import { Routes, BrowserRouter as Router, Route } from 'react-router';
import AppLayout from './components/AppLayout';
import Home from './pages/Home';
import './App.css'
import LabelProvider from './context/LabelProvider';


function App() {
  //const [count, setCount] = useState(0)

  return (
    <LabelProvider>
      <Router>
        <Routes>
          <Route element={<AppLayout />} >
            <Route path="/" element={<Home />} />
          </Route>
        </Routes>
      </Router>
    </LabelProvider>
  )
}

export default App
