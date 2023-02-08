import { TableCell, TableContainer, TableHead, TableBody, Container, Table, TableRow, Button } from '@mui/material'
import React from 'react'
import { useEffect } from 'react'
import CookieVerification from '../components/CookieVerification'
import { getOrdersToShip } from '../utils/APIRoutes'
import axios from 'axios'
import { useState } from 'react'

const Revision = () => {

    const [ordersToTable, setOrdersToTable] = useState([]);

    useEffect(() => {
        getOrdersToTable();
    }, []);

    const getOrdersToTable = async () => {
        const {data} = await axios.get(getOrdersToShip);
        setOrdersToTable(data);
    }

    return (
        <Container sx={{ p: 3 }}>
            <CookieVerification />
            <h1>Pedidos empaquetados</h1>
            <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="simple-table">
                    <TableHead>
                        <TableCell>Tipo de envío</TableCell>
                        <TableCell align='right'>Orden</TableCell>
                        <TableCell align='right'>Tienda</TableCell>
                        <TableCell align='right'>Monto</TableCell>
                        <TableCell align='right'>Empaquetada?</TableCell>
                        <TableCell align='right'>Accion</TableCell>
                    </TableHead>
                    <TableBody>
                        {
                            ordersToTable.map((order, index) => {
                                return (
                                    <TableRow>
                                        <TableCell>{order.shipping_option}</TableCell>
                                        <TableCell align='right'>{order.number}</TableCell>
                                        <TableCell align='right'>{order.store_id}</TableCell>
                                        <TableCell align='right'>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(order.total)}</TableCell>
                                        <TableCell align='right'>{(order.shipping_status == "shipped" || order.next_action == "waiting_shipment") ? (<div>✅</div>) : (<div>❌</div>)}</TableCell>
                                        <TableCell align='right'><Button id={order.id} onClick={console.log("clicked")}>Verificar</Button></TableCell>
                                    </TableRow>
                                )
                            })
                        }

                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    )
}

export default Revision