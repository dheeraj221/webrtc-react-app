import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import CustomRoutes from './routes'

const Routes = () => {
  return (
    <Router>
      <CustomRoutes />
    </Router>
  )
}

export default Routes
