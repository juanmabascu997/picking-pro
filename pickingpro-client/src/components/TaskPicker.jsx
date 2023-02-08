
import React, { useState } from "react";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import { FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup } from "@mui/material";
import { useNavigate } from "react-router-dom";

const defaultValues = {
    tarea: "picking",
    pedidos: 20,
    envio: "same-day"
};


const TaskPicker = () => {

    const [formValues, setFormValues] = useState(defaultValues);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormValues({
            ...formValues,
            [name]: value,
        });
    };


    const handleSubmit = (event) => {
        //Prevenimos evento inicial
        event.preventDefault();

        //Guardamos en el local storage CORREGIR
        localStorage.setItem('dataTask', JSON.stringify(formValues));

        //Redireccionamos
        if (formValues.tarea == 'picking')
            navigate("/picking");
        if (formValues.tarea == 'packing')
            navigate("/packing");
    };


    return (
        <form onSubmit={handleSubmit}>

            <Grid item sx={{ pt: 2 }}>
                <FormControl fullWidth>
                    <FormLabel>Tarea</FormLabel>
                    <RadioGroup
                        value={formValues.tarea}
                        name="tarea"
                        onChange={handleInputChange}
                    >
                        <FormControlLabel key="picking" value="picking" control={<Radio />} label="Quiero Pickear" />
                        <FormControlLabel key="packing" value="packing" control={<Radio />} label="Quiero Empaquetar" />
                    </RadioGroup>
                    <FormHelperText>Picking para recoger productos, packing para empaquetar</FormHelperText>
                </FormControl>
            </Grid>

            <Grid item sx={{ pt: 2 }}>
                <FormControl fullWidth>
                    <FormLabel>Pedidos</FormLabel>
                    <TextField
                        id="q-input"
                        name="pedidos"
                        type="number"
                        value={formValues.pedidos}
                        onChange={handleInputChange}
                    />
                    <FormHelperText>Cantidad de pedidos a recibir</FormHelperText>
                </FormControl>
            </Grid>

            <Grid item sx={{ pt: 2 }}>
                <FormControl fullWidth>
                    <FormLabel>Envio</FormLabel>
                    <RadioGroup
                        value={formValues.envio}
                        name="envio"
                        onChange={handleInputChange}
                    >
                        <FormControlLabel key="same-day" value="same-day" control={<Radio />} label="Envio en el día" />
                        <FormControlLabel key="bluemail" value="bluemail" control={<Radio />} label="Bluemail" />
                        <FormControlLabel key="cod" value="cod" control={<Radio />} label="Pago Contraentrega" />
                    </RadioGroup>
                    <FormHelperText>Método de envío a empaquetar</FormHelperText>
                </FormControl>
            </Grid>

            <Grid container justifyContent="center" sx={{ pt: 2 }}>
                <Button variant="contained" color="primary" type="submit" >
                    Comenzar Tarea
                </Button>
            </Grid>
        </form >
    )
}

export default TaskPicker