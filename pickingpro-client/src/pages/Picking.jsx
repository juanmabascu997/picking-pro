import { Container, Grid } from '@mui/material'
import React from 'react'
import { useEffect } from 'react'
import PickingCard from '../components/PickingCard'
import axios from 'axios';
import { pickingProductsRoute } from '../utils/APIRoutes';
import CookieVerification from '../components/CookieVerification';
import { useState } from 'react';



function Picking() {

  const [productsToPick, setProductsToPick] = useState([]);

  useEffect(() => {
    getItems();
  }, [])

  const getItems = async () => {
    try {
      const myUser = await JSON.parse(localStorage.getItem("userData"));
      const myData = await JSON.parse(localStorage.getItem("dataTask"));
      const myRequest = {
        form: myData,
        token: myUser.token
      };

      console.log(myRequest);
      //localStorage.removeItem("dataTask");

      const { data } = await axios.get(pickingProductsRoute, {
        params: myRequest
      });
      if (data.err)
        console.log(data.err);
      else
        setProductsToPick(data);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <Container sx={{ p: 3 }} >
      <CookieVerification />
      <h1>Productos a pickear</h1>
      <Grid container spacing={3}>
        {productsToPick.map(product => {
          return (
            <Grid item xs={6} md={4} lg={3}>
              <PickingCard productToCard={product} />
            </Grid>
          );
        })}
      </Grid>
    </Container>
  )
}

export default Picking