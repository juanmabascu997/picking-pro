import { Button, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import CookieVerification from '../components/CookieVerification'
import { getProblemsRoute, solveProblemRoute } from '../utils/APIRoutes'
import axios from 'axios';

const Problems = () => {

    const [orderProblems, setOrderProblems] = useState([]);

    useEffect(() => {
        getProblems();
    }, []);

    const getProblems = async () => {
        try {
            const { data } = await axios.get(getProblemsRoute);
            if (data.err)
                console.log(data.err);
            else
                setOrderProblems(data);
            console.log(data);
        } catch (e) {
            console.log(e);
        }
    }

    const solveProblem = async (idSolved) => {
        try {
            const { data } = await axios.post(solveProblemRoute, { id: idSolved });
            if (data.err)
                console.log(data.err);
            else
                getProblems();
        } catch (error) {
            console.log(error);
        }

    }

    const handleCorregir = (e) => {
        //Devuelve el id de la fila en cuestión.
        const idToSolve = e.target.id;
        console.log(idToSolve);

        //Soluciono problema
        solveProblem(idToSolve);
    }

    return (
        <Container sx={{ p: 3 }}>
            <CookieVerification />
            <h1>Pedidos con problemas</h1>
            <TableContainer>
                <Table sx={{ minWidth: 650 }} aria-label="simple-table">
                    <TableHead>
                        <TableCell>Descripcion</TableCell>
                        <TableCell align='right'>Orden</TableCell>
                        <TableCell align='right'>Tienda</TableCell>
                        <TableCell align='right'>Empaquetada?</TableCell>
                        <TableCell align='right'>Accion</TableCell>
                    </TableHead>
                    <TableBody>
                        {
                            orderProblems.map((order, index) => {
                                return (
                                    <TableRow>
                                        <TableCell>{order.order_problem}</TableCell>
                                        <TableCell align='right'>{order.number}</TableCell>
                                        <TableCell align='right'>{order.store_id}</TableCell>
                                        <TableCell align='right'>{(order.shipping_status == "shipped" || order.next_action == "waiting_shipment") ? (<div>✅</div>) : (<div>❌</div>)}</TableCell>
                                        <TableCell align='right'><Button id={order.id} onClick={handleCorregir}>Corregir</Button></TableCell>
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

export default Problems