import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useEffect } from 'react';
import axios from 'axios';
import { storeRoute } from '../utils/APIRoutes';


export default function StoreTable() {

    const [connectedStores, setConnectedStores] = React.useState([]);

    useEffect(() => {
        getStores();
    }, [])  //Con el parametros corchetes solo se ejecuta una vez!

    const getStores = async () => {
        const { data } = await axios.get(storeRoute);
        if (data)
            setConnectedStores(data);
    }


    return (
        <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
                <TableHead>
                    <TableRow>
                        <TableCell>Nombre</TableCell>
                        <TableCell align="right">User id</TableCell>
                        <TableCell align="right">Access Token</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {connectedStores.map((store) => (
                        <TableRow
                            key={store.nombre}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                            <TableCell component="th" scope="row">
                                {store.nombre}
                            </TableCell>
                            <TableCell align="right">{store.user_id}</TableCell>
                            <TableCell align="right">{store.access_token}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
