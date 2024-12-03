const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { getInfoByID } = require("../middlewares/infoMiddleware");
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { REFUSED } = require("dns");


module.exports.getDashboardData = async (req, res) => {
    /* Recibo el id del usuario que mando la peticion */
    try {
        const token = req.query.token;
        const primeraFecha = req.query.primeraFecha;
        const payload = jwt.verify(token, "my-secret-key"); //Obtengo ID del usuario conectado
        const userId = payload.id;
        
        let response = await getInfoByID(userId, primeraFecha)
        res.json(response)
    } catch (error) {
        res.json({err: "Error has been ocurred in getDashboardData"});
    }
}

module.exports.getTransactionsData = async (req, res) => {
    try {
        let today_end = new Date();
        let today_init = new Date();
        let date_UTC = new Date();
        let today_date = date_UTC.toISOString().split("T")[0];
        
        date_UTC.setUTCHours(date_UTC.getUTCHours()-3)
        today_init.setUTCHours(03,00,00);
        today_end.setUTCHours(23,59,59);

        const storeinfoDB = await Store.find();
        let transactions = [];
        let transactions_db = [];
        let transactions_to_add = [];
        console.log("Transacciones de hoy: ",  today_date);

        // Traigo la data de cada una de las tiendas desde Tiendanube
        for (const stores of storeinfoDB) {
            try {
                const orders_today = await Order.find({
                    store_id: stores.user_id,
                    payment_status: "paid",
                    paid_at: { $gte: today_init}
                })

                const { data } = await axios.get(
                    `https://api.tiendanube.com/v1/${stores.user_id}/orders?created_at_min=${today_date}`,
                    {
                        headers: {
                          Authentication: "bearer " + stores.access_token,
                          "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
                        },
                    }
                )
                transactions_db.push({
                    store:  stores.nombre,
                    transactions: orders_today.length,
                })

                if(data) {
                    transactions.push({
                        store:  stores.nombre,
                        transactions: data.filter(e => e.payment_status === "paid").length,
                    })
                    // Busco las transacciones que no estan en la DB

                    orders_today.map(async (internal)=>{
                        if( await data.some((external)=>{
                            return external.id === internal.id;
                        })) {
                        } else {
                            transactions_to_add.push(internal);
                        }
                        return;
                    })
                }
            } catch (error) {
                if(error.response.data.code === 404) {
                    console.log("No hay transacciones");
                    transactions.push([]);
                }
                else {
                    console.log(error.response.data.description);
                }
            }
        }
        res.json({
            internalData: transactions_db,
            externalData: transactions,
            transactions_to_add: transactions_to_add,
            date: today_date   
        });
    } catch (error) {
        console.log(error);
        res.json({err: "Error has been ocurred"});
    }
}



module.exports.getTransactionsDataByDate = async (req, res) => {
    try {
        let transactions = [];

        const created_at_min = new Date(req.query.created_at_min);
        const created_at_max = new Date(req.query.created_at_max);

        if(created_at_min > created_at_max) {
            return res.status(404).send('Revise sus parametros. La fecha minima es mayor que la maxima.');
        }

        created_at_min.setHours(0, 0, 0);
        created_at_max.setHours(23, 59, 59);
        
        //Cambiar esto para que luego permita hacer la busqueda por mas tiendas al mismo tiempo
        const storeName = req.query.storeName;

        let page = 1;
        let hasMore = true;

        const storeinfoDB = await Store.findOne({
            nombre: storeName
        });
        
        if(storeinfoDB.nombre == storeName) {
            while (hasMore) {
                try {
                    const { data } = await axios.get(
                        `https://api.tiendanube.com/v1/${storeinfoDB.user_id}/orders?fields=id,store_id,storefront,contact_email,contact_name,contact_identification,billing_name,billing_phone,billing_zipcode,billing_city,billing_province,shipping_cost_owner,shipping_cost_customer,coupon,promotional_discount,subtotal,discount,discount_gateway,total,gateway,gateway_id,gateway_name,shipping_option,shipping_option_code,shipping_option_reference,shipping_pickup_type,created_at,payment_details,payment_count,payment_status,products,number,cancelled_at,closed_at,read_at,status,gateway_link,shipping_carrier_name,shipping_status,paid_at`,
                        {
                            params: {
                                page,
                                per_page: 30,
                                created_at_min: created_at_min ?? null,
                                created_at_max: created_at_max ?? null,
                            },
                            headers: {
                                Authentication: "bearer " + storeinfoDB.access_token,
                                "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
                            },
                        }
                    );
    
                    if(data) {
                        transactions.push(...data);
                    }

                    console.log(`Page ${page}: ${data.length} orders retrieved.`);
                    hasMore = data.length === 30;
                    page++;
                } catch (error) {
                    console.error(`Error fetching orders for store ${storeinfoDB.nombre} on page ${page}:`, error.message);
                    hasMore = false;
                }
            }

            if(transactions.length === 0) {
                return res.status(404).send('Revise sus parametros. No se encontraron datos de busqueda.');
            }
           
            const filePath = await generateExcelFile(transactions);

            res.setHeader('Content-Disposition', `attachment; filename=resumen-de-ordenes.xlsx`);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error al descargar el archivo:', err);
                    return res.status(500).send('Error al descargar el archivo');
                } else {
                    fs.unlinkSync(filePath);
                }
            });

        } else {
            return res.status(404).send('Revise sus parametros. No se encontró tienda seleccionada.');
        }
    } catch (error) {
        console.error(error);
        res.json({err: "Error has been ocurred"});
    }
}

async function generateExcelFile(transactions) {      
    let transacciones = [];

    for (let index = 0; index < transactions.length; index++) {
        const order = transactions[index]
        let store = await Store.findOne(
            { user_id: order.store_id },
            { nombre: 1, _id: 0 }
        )
        transacciones.push({
            ...order,
            store_name: store.nombre
        })
    }
    
    const rows = transacciones.map((order) =>({
        order_id: order.id,
        created_at: order.created_at,
        customer_name: order.customer?.name || 'N/A',
        total: order.total 
        ? `$${(order.total * 1).toLocaleString('es-ES')}`
        : '$0', 
        currency: order.currency || 'N/A',
        status: order.status || 'N/A',
        store_id: order.store_id || 'N/A',
        store_name: order.store_name || 'N/A',
        gateway_id: order.gateway_id || 'N/A',
        contact_email: order.contact_email || 'N/A',
        contact_name: order.contact_name || 'N/A',
        contact_identification: order.contact_identification || 'N/A',
        billing_name: order.billing_name || 'N/A',
        billing_phone: order.billing_phone || 'N/A',
        billing_zipcode: order.billing_zipcode || 'N/A',
        billing_city: order.billing_city || 'N/A',
        billing_province: order.billing_province || 'N/A',
        shipping_cost_owner: order.shipping_cost_owner || 0,
        shipping_cost_customer: order.shipping_cost_customer || 0,
        coupon: JSON.stringify(order.coupon) || [],
        promotional_discount: JSON.stringify(order.promotional_discount) || {},
        subtotal: order.subtotal 
        ? `$${(order.subtotal * 1).toLocaleString('es-ES')}`
        : '$0',
        discount: order.discount 
        ? `$${(order.discount * 1).toLocaleString('es-ES')}`
        : '$0',
        discount_gateway: order.discount_gateway || 0,
        gateway: order.gateway || 'N/A',
        gateway_name: order.gateway_name || 'N/A',
        shipping_option: order.shipping_option || 'N/A',
        shipping_option_code: order.shipping_option_code || 'N/A',
        shipping_option_reference: order.shipping_option_reference || 'N/A',
        shipping_pickup_type: order.shipping_pickup_type || 'N/A',
        method: order.payment_details?.method,
        credit_card_company: order.payment_details?.credit_card_company,
        installments: order.payment_details?.installments,
        payment_count: order.payment_count || 0,
        payment_status: order.payment_status || 'N/A',
        products: JSON.stringify(order.products) || [],
        number: order.number || 'N/A',
        cancelled_at: order.cancelled_at || null,
        closed_at: order.closed_at || null,
        read_at: order.read_at || null,
        gateway_link: order.gateway_link || 'N/A',
        shipping_carrier_name: order.shipping_carrier_name || 'N/A',
        shipping_status: order.shipping_status || 'N/A',
        paid_at: order.paid_at || null,
    })); 

    const effectiveSales = transactions.filter(
        (order) => order.payment_status === 'paid'
    );

    const totalSales = effectiveSales.reduce((sum, order) => sum + (Number(order.subtotal) || 0), 0);

    const salesByDate = effectiveSales.reduce((acc, order) => {
        const date = order.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});

    const paymentPlatforms = effectiveSales.reduce((acc, order) => {
        const platform = order.gateway || 'Unknown';
        acc[platform] = (acc[platform] || 0) + 1;
        return acc;
    }, {});
    
    const paymentMethods = effectiveSales.reduce((acc, order) => {
        const payment_method = order.payment_details?.method;
        acc[payment_method] = (acc[payment_method] || 0) + 1;
        return acc;
    }, {});
    
    const cardMethods = effectiveSales.reduce((acc, order) => {
        if(order.payment_details.method == 'credit_card'){
            const card_installments = order.payment_details.installments;
            acc[card_installments] = (acc[card_installments] || 0) + 1;
            return acc;
        } else {
            return acc
        }
    }, {});

    const shippingMethods = effectiveSales.reduce((acc, order) => {
        const method = order.shipping_option || 'Unknown';
        acc[method] = acc[method] || { count: 0, cost: 0 };
        acc[method].count += 1;
        acc[method].cost += Number(order.shipping_cost_owner) || 0;
        return acc;
    }, {});

    
    const products = effectiveSales.map((order) => { 
        return order.products || []
    }).flat();
    
    const productSummary = products.reduce((acc, product) => {
        
        const sku = product.sku || 'Unknown';
        acc[sku] = acc[sku] || { name: product.name, sold: 0, revenue: 0 };
        acc[sku].sold += Number(product.quantity) || 0;
        acc[sku].revenue += (Number(product.price) || 0) * (Number(product.quantity) || 0);
        
        return acc;
    }, {});

    const workbook = xlsx.utils.book_new();

    const ordersSheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, ordersSheet, 'Ordenes');

    const salesByDateRows = Object.entries(salesByDate).map(([date, count]) => ({
        Fecha: date,
        Cantidad: count,
        'Porcentaje de ventas': ((count / effectiveSales.length) * 100).toFixed(2) + '%',
    }));
    const salesByDateSheet = xlsx.utils.json_to_sheet(salesByDateRows);
    xlsx.utils.book_append_sheet(workbook, salesByDateSheet, 'Ventas por fechas');

    const summarySheet = xlsx.utils.json_to_sheet([
        {
            'Total de ventas': effectiveSales.length,
            'Recaudación total': `$${(totalSales).toLocaleString('es-ES')}`,
            'Venta promedio':
                effectiveSales.length > 0
                    ? `$${(totalSales / effectiveSales.length).toLocaleString('es-ES')}`
                    : '$0'
        },
    ]);
    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Resumen de ventas');

    const paymentMethodsRows = Object.entries(paymentMethods).map(
        ([method, count]) => ({
            Tipo: 'Método',
            Metodo: method,
            Ventas: count,
            Porcentaje: ((count / effectiveSales.length) * 100).toFixed(2) + '%',
        })
    );

    const paymentPlatformsRows = Object.entries(paymentPlatforms).map(
        ([platform, count]) => ({
            Tipo: 'Plataforma',
            Metodo: platform,
            Ventas: count,
            Porcentaje: ((count / effectiveSales.length) * 100).toFixed(2) + '%',
        })
    );
    
    const cardMethodsRows = Object.entries(cardMethods).map(
        ([cards, count]) => ({
            Tipo: 'Cuotas',
            Metodo: cards,
            Ventas: count,
            Porcentaje: ((count / effectiveSales.length) * 100).toFixed(2) + '%',
        })
    );

    const paymentDataRows = [...paymentPlatformsRows, {}, ...paymentMethodsRows, {}, {}, ...cardMethodsRows];

    const paymentMethodsSheet = xlsx.utils.json_to_sheet(paymentDataRows);
    xlsx.utils.book_append_sheet(workbook, paymentMethodsSheet, 'Metodos de pago');

    const productRows = Object.entries(productSummary).map(([sku, data]) => ({
        SKU: sku,
        Nombre: data.name,
        'Cantidad de ventas': data.sold.toLocaleString('es-ES'),
        'Ganancia por producto': `$${data.revenue.toLocaleString('es-ES')}`,
    }));
    const productsSheet = xlsx.utils.json_to_sheet(productRows);
    xlsx.utils.book_append_sheet(workbook, productsSheet, 'Productos');

    const shippingRows = Object.entries(shippingMethods).map(
        ([method, { count, cost }]) => ({
            'Metodo de envio': method,
            'Costo por envio': count.toLocaleString('es-ES'),
            'Porcentaje de envios': ((count / effectiveSales.length) * 100).toFixed(2) + '%',
            'Costo': `$${(cost * 1).toLocaleString('es-ES')}`,
        })
    );
    const shippingSheet = xlsx.utils.json_to_sheet(shippingRows);
    xlsx.utils.book_append_sheet(workbook, shippingSheet, 'Metodos de envios');

    const filePath = path.join(__dirname, `resumen-de-ordenes.xlsx`);
    xlsx.writeFile(workbook, filePath);

    return filePath;
}
