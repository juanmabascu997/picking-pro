import { Modal } from '@mui/material'
import React from 'react'
import { useReactToPrint } from 'react-to-print'

import { Box } from '@mui/system';

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

export const PDFModal = ({ UrlToRender, printPDF, setPrintPDF }) => {

  const handleClose = () => setPrintPDF(false);

  return (
    <div>
      <Modal
        open={printPDF}
        onClose={handleClose}
      >
        <Box sx={style}>

        </Box>
      </Modal>

    </div>
  )
}
