import React from 'react'
import Container from "@mui/material/Container"
import StoreTable from '../components/StoreTable'
import { Box, Button } from '@mui/material'
import CookieVerification from '../components/CookieVerification'

function Config() {
  return (
    <Container maxWidth='md' sx={{ p: 4 }} >
      <CookieVerification />
      <StoreTable />
      <Box mt={2}>
        <a href='https://www.tiendanube.com/apps/5385/authorize' underline="none">
          <Button variant="contained">
            Conectar
          </Button>
        </a>
      </Box>
    </Container>
  )
}

export default Config