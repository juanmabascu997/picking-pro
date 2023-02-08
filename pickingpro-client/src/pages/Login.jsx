import { Box, Button, Container, FormControl, FormLabel, Grid, TextField } from '@mui/material';
import React from 'react'
import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { loginRoute } from '../utils/APIRoutes';
import { useCookies } from "react-cookie";
import { useEffect } from 'react';
import axios from "axios";

function Login() {
  
  //const [cookies] = useCookies([]);
  const navigate = useNavigate();
  /*useEffect(() => {
    if (cookies.jwt) {
      navigate("/");
    }
  }, []);*/

  const [values, setValues] = useState({ email: "", password: "" });

  const generateError = (error) =>
    toast.error(error, {
      position: "bottom-right",
    });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await axios.post(loginRoute,
        {
          ...values,
        },
        { withCredentials: true }
      );
      if (data) {
        if (data.errors) {
          const { email, password } = data.errors;
          if (email) generateError(email);
          else if (password) generateError(password);
        } else {
          //Guardamos en el local storage datos de la cuenta
          localStorage.setItem('userData', JSON.stringify(data));
          navigate("/");
        }
      }
    } catch (ex) {
      console.log(ex);
    }
  };

  return (
    <Container maxWidth='md'>
      <h2>Inicia sesión en tu cuenta</h2>
      <Box sx={{ boxShadow: 3, p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid item sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <FormLabel>Email</FormLabel>
              <TextField
                id="email"
                name="email"
                type="email"
                value={values.email}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })}
              />
            </FormControl>
          </Grid>

          <Grid item sx={{ pt: 2 }}>
            <FormControl fullWidth>
              <FormLabel>Contraseña</FormLabel>
              <TextField
                id="password"
                name="password"
                type="password"
                value={values.password}
                onChange={(e) =>
                  setValues({ ...values, [e.target.name]: e.target.value })}
              />
            </FormControl>
          </Grid>

          <Grid container justifyContent="center" sx={{ pt: 2 }}>
            <Button variant="contained" color="primary" type="submit" >
              Iniciar sesión
            </Button>
          </Grid>

          <Grid container justifyContent="center" sx={{ pt: 2 }}>
            <p>No tenés una cuenta? <Link to="/register"> Registrarse </Link></p>
          </Grid>
        </form>
      </Box>
      <ToastContainer />
    </Container >
  )
}

export default Login