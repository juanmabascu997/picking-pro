import * as React from 'react';

import { Avatar, Box, Checkbox } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';


const columns = [
    {
        field: 'image',
        headerName: 'Imagen',
        width: 150,
        renderCell: (params) => <Avatar src={params.value} sx={{ width: 140, height: 140 }} />
    },
    {
        field: 'name',
        headerName: 'Nombre',
        width: 600,
    },
    {
        field: 'sku',
        headerName: 'SKU',
        width: 150,
    },
    {
        field: 'quantity',
        headerName: 'Cantidad',
        type: 'number',
        width: 110,
        renderCell: (params) => <h1>{params.value}</h1>
    }
]

export default function PackingTable(props) {


    const generateRows = () => {
        const row = props.product.map((product, index) => {
            return ({
                id: index,
                image: product.image.src,
                name: product.name,
                sku: product.sku,
                quantity: product.quantity
            })
        })

        return row;
    }



    return (
        <Box sx={{ boxShadow: 3, height: 700, width: '100%' }}>
            <DataGrid
                rows={generateRows()}
                columns={columns}
                pageSize={15}
                rowsPerPageOptions={[15]}
                checkboxSelection
                disableSelectionOnClick
                experimentalFeatures={{ newEditingApi: true }}
                rowHeight={150}
            />
        </Box>
    )

}