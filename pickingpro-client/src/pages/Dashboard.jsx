import React from "react";
import Container from "@mui/material/Container"
import { Box, Button, Card, CardContent, Grid } from "@mui/material";
import TaskPicker from "../components/TaskPicker";
import CookieVerification from "../components/CookieVerification";
import ZebraBrowserPrintWrapper from "zebra-browser-print-wrapper";
import CardInfo from "../components/CardInfo";
import { useEffect } from "react";


function Dashboard() {

  return (
    <>
      <CookieVerification />
      <Container maxWidth='md' sx={{ pt: 3 }} >
        <CardInfo />
        <h1>¿Qué desearía hacer?</h1>
        <Box sx={{ boxShadow: 3, p: 3 }}>
          <TaskPicker />
        </Box>
      </Container >
    </>
  )
}

export default Dashboard