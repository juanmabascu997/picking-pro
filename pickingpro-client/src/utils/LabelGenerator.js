import ZebraBrowserPrintWrapper from "zebra-browser-print-wrapper";

export const generateLabelInfo = async (orderInfo, shippingMethod) => {

    const hoy = new Date();
    const fecha_hoy = formatoFecha(hoy, 'dd/mm/yy');
    const shipping_address = orderInfo.shipping_address[0];

    let labelData = {
        store_name: orderInfo.store_name + ' (Orden: ' + orderInfo.number + ')',
        created_at: fecha_hoy,
        name: shipping_address.name,
        address: shipping_address.address + ' ' + shipping_address.number + ' ' + shipping_address.floor,
        zipcode: shipping_address.zipcode,
        city: shipping_address.city + ' ' + shipping_address.locality,
        reference: ' '
    }

    if (shippingMethod === 'cod')
        labelData.reference = 'Cobrar ' + orderInfo.total;

    if (orderInfo.note)
        labelData.reference += (' ' + orderInfo.note);


    labelData.reference += (' Cel.: ' + shipping_address.phone);

    console.log(labelData.reference);

    return labelData;
}

export const generateLabel = async (orderInfo, shippingMethod) => {

    const hoy = new Date();
    const fecha_hoy = formatoFecha(hoy, 'dd/mm/yy');
    const shipping_address = orderInfo.shipping_address[0];

    let labelData = {
        store_name: orderInfo.store_name + ' (Orden: ' + orderInfo.number + ')',
        created_at: fecha_hoy,
        name: shipping_address.name,
        address: shipping_address.address + ' ' + shipping_address.number + ' ' + shipping_address.floor,
        zipcode: shipping_address.zipcode,
        city: shipping_address.city + ' ' + shipping_address.locality,
        reference: ' '
    }

    if (shippingMethod === 'cod')
        labelData.reference = 'Cobrar ' + orderInfo.total;

    if (orderInfo.note)
        labelData.reference += (' ' + orderInfo.note);


    labelData.reference += (' Cel.: ' + shipping_address.phone);

    console.log(labelData.reference);

    const ZPLlabel = `
        ^XA
        
        ~TA000
        ~JSN
        ^LT0
        ^MNW
        ^MTT
        ^PON
        ^PMN
        ^LH0,0
        ^JMA
        ^PR8,8
        ~SD15
        ^JUS
        ^LRN
        ^CI27
        ^PA0,1,1,0
        ^MMT
        ^PW799
        ^LL1199
        ^LS0
        ^FO195,6^GB468,1189,4^FS
        ^FO267,2^GB0,1193,4^FS
        ^FO341,8^GB0,1187,4^FS
        ^FO418,9^GB0,1184,4^FS
        ^FO575,12^GB0,1181,4^FS
        ^FO496,9^GB0,1184,4^FS

        ^FT239,1186^A0B,45,46^FH\^CI28^FDFecha:^FS^CI27
        ^FT322,1186^A0B,45,46^FH\^CI28^FDRemitente:^FS^CI27
        ^FT399,1186^A0B,45,46^FH\^CI28^FDDestinatario:^FS^CI27
        ^FT476,1186^A0B,45,46^FH\^CI28^FDDomicilio:^FS^CI27
        ^FT550,1186^A0B,45,46^FH\^CI28^FDCP:^FS^CI27
        ^FT550,633^A0B,45,46^FH\^CI28^FDLocalidad:^FS^CI27
        ^FO500,663^GB75,0,4^FS
        ^FT635,1186^A0B,45,46^FH\^CI28^FDReferencia:^FS^CI27
        ^FT119,1199^A0B,45,46^FB1196,1,12,C^FH\^CI28^FD${labelData.store_name}^FS^CI27
        
        ^FT236,1040^A0B,34,33^FH\^CI28^FD${labelData.created_at}^FS^CI27
        ^FT319,964^A0B,34,33^FH\^CI28^FD${labelData.store_name}^FS^CI27
        ^FT396,928^A0B,34,33^FH\^CI28^FD${labelData.name}^FS^CI27
        ^FT474,975^A0B,34,33^FH\^CI28^FD${labelData.address}^FS^CI27
        ^FT547,1107^A0B,34,33^FH\^CI28^FD${labelData.zipcode}^FS^CI27
        ^FT547,420^A0B,34,33^FH\^CI28^FD${labelData.city}^FS^CI27
        ^FT633,951^A0B,36,35^FH\^CI28^FD${labelData.reference}^FS^CI27
        
        
        ^XZ
        `
    return ZPLlabel;
}

export const printLabel = async (myOrder, shippingMethod) => {
    try {
        // Create a new instance of the object
        const browserPrint = new ZebraBrowserPrintWrapper();

        // Select default printer
        const defaultPrinter = await browserPrint.getDefaultPrinter();

        // Set the printer
        browserPrint.setPrinter(defaultPrinter);

        // Check printer status
        const printerStatus = await browserPrint.checkPrinterStatus();

        // Check if the printer is ready
        if (printerStatus.isReadyToPrint) {

            // ZPL script to print a simple barcode
            const zpl = await generateLabel(myOrder, shippingMethod);
            console.log(zpl);
            browserPrint.print(zpl);
        } else {
            console.log("Error/s", printerStatus.errors);
        }

    } catch (error) {
        throw new Error(error);
    }
}


export const formatoFecha = (fecha, formato) => {
    const map = {
        dd: fecha.getDate(),
        mm: fecha.getMonth() + 1,
        yy: fecha.getFullYear().toString().slice(-2),
        yyyy: fecha.getFullYear()
    }

    return formato.replace(/dd|mm|yy|yyy/gi, matched => map[matched])
}