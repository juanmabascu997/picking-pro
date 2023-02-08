import { Box, Button, Container, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import axios from 'axios'
import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import CookieVerification from '../components/CookieVerification'
import OrderInfoDisplay from '../components/OrderInfoDisplay'
import PackingTable from '../components/PackingTable'
import { labelRoute, packingProductsRoute, packOrderRoute } from '../utils/APIRoutes'
import ReceiptIcon from '@mui/icons-material/Receipt';
import { generateLabelInfo, printLabel } from '../utils/LabelGenerator';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ProblemModal from '../components/ProblemModal'
import { PDFModal } from '../components/PDFModal'
import { useRef } from 'react'
import ReactToPrint, { useReactToPrint } from 'react-to-print'
import '../App.css'

function Packing() {

  const [productToPack, setProductToPack] = useState([]);
  const [orderToPack, setOrderToPack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingOption, setWorkingOption] = useState();
  const [open, setOpen] = useState(false);
  const [printMethod, setPrintMethod] = useState("pdf");
  const [labelPrinted, setLabelPrinted] = useState(false);
  const [noOrderToPack, setNoOrderToPack] = useState(false);
  const [taskData, setTaskData] = useState();
  const [labelInfo, setLabelInfo] = useState();
  const [errorReported, setErrorReported] = useState(false);

  const componentRef = useRef(null);


  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: "@page { size: 3.93in 5.9in }"
  });


  /*---------- FUNCTIO -------------*/
  const initialConfig = async () => {

    //Coloco pantalla de carga
    setLoading(true);

    try {

      //Seteo como que hay ordenes para empaquetar
      setNoOrderToPack(false);

      //Obtengo datos del usuario
      const myUser = await JSON.parse(localStorage.getItem("userData"));

      //Obtengo datos de la tarea a realizar
      const myData = await JSON.parse(localStorage.getItem("dataTask"));
      const myRequest = {
        form: myData,
        token: myUser.token
      };

      //Seteo datos de la tarea
      setTaskData(myData);

      //localStorage.removeItem("dataTask");

      setWorkingOption(myRequest);    //VER.. Mepa que está al pedo.

      //Obtengo un pedido para empaquetar
      const { data } = await axios.get(packingProductsRoute, {
        params: myRequest
      });

      //Si no hay productos para empaquetar...
      if (data === 'No product to pack') {
        setNoOrderToPack(true);
        setLoading(false);
        return;
      }

      //Seteo el estado con la orden a empaquetar
      setOrderToPack(data);
      console.log(orderToPack);
      //si hibo error...
      if (data.err)
        console.log(data.err);
      else
        setProductToPack(data.products);

      //Elimino la carga
      setLoading(false);
    } catch (e) {
      console.log(e);
    }
  }

  const getItemToPack = async () => {
    try {
      setLoading(true);
      setNoOrderToPack(false);
      const { data } = await axios.get(packingProductsRoute, {
        params: workingOption
      });
      if (data === 'No product to pack') {
        setNoOrderToPack(true);
        setLoading(false);
        return;
      }
      setOrderToPack(data);
      if (data.err)
        console.log(data.err);
      else
        setProductToPack(data.products);
      setLoading(false);
    } catch (e) {
      console.log(e);
    }

  }

  function timeout(delay) {
    return new Promise(res => setTimeout(res, delay));
  }

  /*---------- EFFECTS -------------*/
  useEffect(() => {
    initialConfig();
  }, []);

  /*---------- HANDLERS -------------*/
  //Handler que controla el pedido de una nueva orden
  const onClickNewOrderButton = async () => {
    try {

      //Posteamos como empaquetada la orden que está en pantalla si no hubo error
      if (!errorReported) {
        const { data } = await axios.post(packOrderRoute, { id: orderToPack.id, store_id: orderToPack.store_id });
      }

      //Reportamos que hubo error y no marcamos como empaquetada
      if (errorReported) {
        console.log("Error reported!");
        setErrorReported(false);
      }

      //Ponemos la pagna a cargar
      setLoading(true);

      //Obtenemos un nuevo pedido para empaquetar
      await getItemToPack();

      //Eliminamos pagna de carga
      setLoading(false);

      //Avisamos que todavia no se imprimio la etiqueta
      setLabelPrinted(false);

    } catch (e) {
      console.log(e);
    }
  }

  //Handler que imprime la etiqueta
  const onClickLabelButton = async () => {
    try {

      //Seteamos a loading
      setLoading(true);

      //Seteamos a label printed
      setLabelPrinted(true);

      //Si es bluemail.. no importa el tipo de impresion
      if (taskData.envio == "bluemail") {

        //Preparo el request a mi API para obtener la etiqueta
        const myRequest = {
          store_id: orderToPack.store_id,
          id: orderToPack.id
        }

        //Obtengo la etiqueta con un método GET
        const { data } = await axios.get(labelRoute, {
          params: myRequest,
          responseType: 'blob'
        });

        //Genero la etiqueta
        const file = new Blob(
          [data],
          { type: 'application/pdf' }
        );

        //Creo un enlace con la etiqueta
        const fileURL = URL.createObjectURL(file);

        //Abro una nueva ventana con la etiqueta
        window.open(fileURL);

      }

      //Si el metodo de impresion es PDF
      if ((taskData.envio != "bluemail") && (printMethod == 'pdf')) {
        const myLabelInfo = await generateLabelInfo(orderToPack, taskData.envio);
        setLabelInfo(myLabelInfo);
        await timeout(100);
        handlePrint();
      }

      //Si el metodo de impresion es zebra y es envio en el dia
      if ((taskData.envio == "same-day") && (printMethod == 'zebra')) {
        await printLabel(orderToPack, 'same-day');
      }

      //Si el metodo de impresion es zebra y es cash on delivery
      if ((taskData.envio == 'cod') && (printMethod == 'zebra')) {
        await printLabel(orderToPack, 'cod');
      }

      setLoading(false);

    } catch (error) {
      console.log(error);
    }
  }

  //Handler que controla el pop-up de errores.
  const onClickError = async () => {
    console.log("problem clicked");
    setOpen(true);
  }

  //Handler que controla el tipo de impresion (Zebra, PDF)
  const handleChangePrintMethod = (event) => {
    setPrintMethod(event.target.value);
  }

  return (
    <Container maxWidth='xl' sx={{ pt: 3 }}>
      <CookieVerification />
      {noOrderToPack
        ? <h1>No hay pedidos para empaquetar</h1>
        : <>
          <h1>Packing</h1>
          {loading
            ? (<h1>Loading</h1>)
            :
            <Grid container spacing={2} >
              <Grid item xs={9}>
                <PackingTable product={productToPack} />
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ boxShadow: 3, p: 1 }}>
                  <OrderInfoDisplay order={orderToPack} />
                  <Box sx={{ pt: 3 }}>
                    <Button
                      fullWidth='true'
                      variant='contained'
                      endIcon={<ReceiptIcon />}
                      color="success"
                      size='large'
                      onClick={onClickLabelButton}
                    >
                      Imprimir etiqueta
                    </Button>
                  </Box>
                  {labelPrinted ? (<Typography gutterBottom variant="body">¡Atención! Ya imprimiste esta etiqueta.</Typography>) : ""}
                  <Box sx={{ pt: 2 }}>
                    <Button
                      fullWidth='true'
                      variant='contained'
                      endIcon={<ReceiptIcon />}
                      size='large'
                      onClick={onClickNewOrderButton}
                      disabled={(labelPrinted || errorReported) ? false : true}
                    >
                      Nuevo pedido
                    </Button>
                  </Box>

                  <Box sx={{ pt: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="print-method">Método de impresión</InputLabel>
                      <Select
                        labelId="print-method"
                        id="print-method-select"
                        value={printMethod}
                        label="Método de impresión"
                        onChange={handleChangePrintMethod}
                      >
                        <MenuItem value={"zebra"}>Zebra</MenuItem>
                        <MenuItem value={"pdf"}>PDF</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                <Box sx={{ boxShadow: 3, p: 1, mt: 2 }}>
                  <Typography gutterBottom variant="body" align='center'>
                    ¿Surgio algún inconveniente al momento de empaquetar? Clickeá en "Indicar problema".
                  </Typography>
                  <Box sx={{ pt: 2 }}>
                    <Button
                      fullWidth='true'
                      variant='contained'
                      endIcon={<ErrorOutlineIcon />}
                      color="error"
                      size='medium'
                      onClick={onClickError}
                    >
                      Indicar problema
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          }

          <ProblemModal
            open={open}
            setOpen={setOpen}
            id={orderToPack.id}
            errorReported={errorReported}
            setErrorReported={setErrorReported}
          />


          {/* Label a imprimir. PASAR A COMPONENTE!! */}
          {!labelInfo
            ? <></>
            :
            <div style={{ display: "none" }}>
              <div ref={componentRef}>
                <div className='label'>
                  <div className='rotate'>
                    <h2 style={{ textAlign: "center" }}>{labelInfo.store_name}</h2>
                    <table className='mylabel'>
                      <tbody>
                        <tr className='mylabeltr'>
                          <td className='mylabeltd' colSpan={2}> Fecha:  {labelInfo.created_at}</td>
                        </tr >
                        <tr className='mylabeltr'>
                          <td className='mylabeltd' colSpan={2}> Remitente: {labelInfo.store_name}</td>
                        </tr>
                        <tr className='mylabeltr'>
                          <td className='mylabeltd' colSpan={2}> Destinatario: {labelInfo.name}</td>
                        </tr>
                        <tr className='mylabeltr'>
                          <td className='mylabeltd' colSpan={2}> Domicilio: {labelInfo.address}</td>
                        </tr>
                        <tr className='mylabeltr'>
                          <td className='mylabeltd'> CP: {labelInfo.zipcode}</td>
                          <td className='mylabeltd'> Localidad: {labelInfo.city}</td>
                        </tr>
                        <tr className='mylabeltr'>
                          <td className='mylabeltd' colSpan={2}> Referencia: {labelInfo.reference}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          }
        </>
      }
    </Container>
  )
}

export default Packing