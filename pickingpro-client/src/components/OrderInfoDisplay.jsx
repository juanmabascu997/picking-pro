import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { formatoFecha } from '../utils/LabelGenerator';

const OrderInfoDisplay = (props) => {
    return (
        <Box sx={{ width: '100%', maxWidth: 360 }}>
            <Typography variant="h5" align='center' >
                {props.order.shipping_address[0].name + ' - #' + props.order.number}
            </Typography>
            <Divider variant="middle" />
            <Typography variant="body1" mt={2}>
                <b>Fecha: </b>{formatoFecha(new Date(props.order.created_at), 'dd/mm/yy')}
            </Typography>
            <Typography variant="body1" mt={0.5}>
                <b>Tienda: </b>{props.order.store_name}
            </Typography>
            <Typography variant='body1' mt={0.5}>
                <b>Subtotal:</b> {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(props.order.subtotal)}
            </Typography>
            <Typography variant='body1' mt={0.5}>
                <b>Envio:</b> {props.order.shipping_cost_customer
                    ? (new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(props.order.shipping_cost_customer))
                    : 'Gratis'
                }
            </Typography>
            <Typography color="text.secondary" variant="body2" mt={2}>
                {props.order.note
                    ? ('Notas del comprador: ' + props.order.note)
                    : ('No existen notas del comprador.')
                }
            </Typography>

            <Box mt={0.5}>
                <Divider variant="middle" />
            </Box>

            <Typography color="text.secondary" variant="body2" mt={0.5}>
                {props.order.owner_note
                    ? ('Notas de atención al cliente: ' + props.order.owner_note)
                    : ('No existen notas de atención al cliente.')
                }
            </Typography>
        </Box>
    )
}

export default OrderInfoDisplay