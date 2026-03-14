import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/navigation/Header'

function PublicLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}

export default PublicLayout
