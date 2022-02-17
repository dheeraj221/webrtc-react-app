import React from 'react'
import PropTypes from 'prop-types'
import { Home } from '../pages/Home/Home'

const RouteValidator = ({ hasNavbar, component: Component, ...props }) => {
  if (hasNavbar) {
    return (
      <>
        <Component />
      </>
    )
  }
  return <Home />
}

RouteValidator.propTypes = {
  component: PropTypes.elementType.isRequired,
  hasNavbar: PropTypes.bool.isRequired,
  path: PropTypes.string.isRequired
}

export default RouteValidator
