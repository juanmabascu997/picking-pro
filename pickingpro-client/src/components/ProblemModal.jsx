import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import { FormControl, FormLabel, TextField } from '@mui/material';
import { useState } from 'react';
import axios from 'axios';
import { reportProblemRoute } from '../utils/APIRoutes';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function ProblemModal({ open, setOpen, id, errorReported, setErrorReported }) {

    const [value, setValue] = useState();
    const handleClose = () => setOpen(false);

    const handleSubmit = async (event) => {
        try {
            event.preventDefault();
            const { data } = await axios.post(reportProblemRoute, { id: id, value });
            console.log(data);
            setErrorReported(true);
            setOpen(false);
        } catch (error) {
            console.log(error.data);
            setOpen(false);
        }
    }

    return (
        <div>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <form onSubmit={handleSubmit}>
                        <FormControl fullWidth>
                            <FormLabel>Ingese el problema</FormLabel>
                            <TextField
                                id='problem'
                                name='problem'
                                onChange={(e) => setValue(e.target.value)}
                            />

                        </FormControl>
                        <Button
                            variant='contained'
                            color='primary'
                            type='submit'
                        >
                            Enviar
                        </Button>
                    </form>
                </Box>
            </Modal>
        </div>
    );
}
