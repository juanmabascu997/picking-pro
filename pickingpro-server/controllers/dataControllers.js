const Store = require("../models/store");
const Order = require("../models/orden");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { getInfoByID } = require("../middlewares/infoMiddleware");
const xlsx = require('xlsx');
const _ = require('lodash');
const { DateTime } = require("luxon");
const crypto = require("crypto");

// In-memory job store (jobId -> { status, buffer, error, createdAt })
const exportJobs = new Map();

// Clean up jobs older than 10 minutes periodically
setInterval(() => {
    const TEN_MIN = 10 * 60 * 1000;
    const now = Date.now();
    for (const [id, job] of exportJobs) {
        if (now - job.createdAt > TEN_MIN) exportJobs.delete(id);
    }
}, 2 * 60 * 1000);

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
        res.json({ err: "Error has been ocurred in getDashboardData" });
    }
}

module.exports.getTransactionsData = async (req, res) => {
    try {
        let today_end = new Date();
        let today_init = new Date();
        let date_UTC = new Date();
        let today_date = date_UTC.toISOString().split("T")[0];

        date_UTC.setUTCHours(date_UTC.getUTCHours() - 3)
        today_init.setUTCHours(03,00,00);
        today_end.setUTCHours(23, 59, 59);

        const storeinfoDB = await Store.find();
        let transactions = [];
        let transactions_db = [];
        let transactions_to_add = [];
        console.log("Transacciones de hoy: ", today_date);

        // Traigo la data de cada una de las tiendas desde Tiendanube
        for (const stores of storeinfoDB) {
            try {
                const orders_today = await Order.find({
                    store_id: stores.user_id,
                    payment_status: "paid",
                    paid_at: { $gte: today_init }
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
                    store: stores.nombre,
                    transactions: orders_today.length,
                })

                if (data) {
                    transactions.push({
                        store: stores.nombre,
                        transactions: data.filter(e => e.payment_status === "paid").length,
                    })
                    // Busco las transacciones que no estan en la DB

                    orders_today.map(async (internal) => {
                        if (await data.some((external) => {
                            return external.id === internal.id;
                        })) {
                        } else {
                            transactions_to_add.push(internal);
                        }
                        return;
                    })
                }
            } catch (error) {
                if (error.response.data.code === 404) {
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
        res.json({ err: "Error has been ocurred" });
    }
}



module.exports.getTransactionsDataByDate = async (req, res) => {
    const created_at_min_raw = DateTime.fromISO(req.query.created_at_min, { zone: "UTC" })
        .startOf("day")
        .plus({ hours: 3 })
        .toUTC()
        .toISO();

    const created_at_max_raw = DateTime.fromISO(req.query.created_at_max, { zone: "UTC" })
        .endOf("day")
        .plus({ hours: 3 })
        .toUTC()
        .toISO();

    if (created_at_min_raw > created_at_max_raw) {
        return res.status(400).send('Revise sus parametros. La fecha minima es mayor que la maxima.');
    }

    const storesNames = req.query.storeName.split("-");
    const storesinfosDB = [];

    for (const storeName of storesNames) {
        const storeinfoDB = await Store.findOne({ nombre: storeName });
        if (!storeinfoDB) {
            return res.status(404).send('Revise sus parametros. Una de las tiendas no fue encontrada.');
        }
        storesinfosDB.push(storeinfoDB);
    }

    // Generate a unique job ID and register the job
    const jobId = crypto.randomBytes(12).toString("hex");
    exportJobs.set(jobId, { status: "processing", buffer: null, error: null, createdAt: Date.now() });

    // Start background processing (does NOT block the response)
    processExportJob(jobId, storesinfosDB, created_at_min_raw, created_at_max_raw);

    // Respond immediately with a polling page so Railway's proxy doesn't time out
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(202).send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Generando reporte…</title>
  <style>
    body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f5f5f5}
    .card{background:#fff;padding:2rem 3rem;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.15);text-align:center}
    .spinner{width:48px;height:48px;border:5px solid #e0e0e0;border-top-color:#1976d2;border-radius:50%;animation:spin .9s linear infinite;margin:0 auto 1.5rem}
    @keyframes spin{to{transform:rotate(360deg)}}
    p{color:#555;margin:.5rem 0}
    .error{color:#c62828}
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner" id="spinner"></div>
    <p id="msg">Generando reporte, por favor espere&hellip;</p>
    <p id="sub" style="font-size:.85rem;color:#888">Esto puede tardar varios minutos según el rango de fechas.</p>
  </div>
  <script>
    (function poll(){
      fetch('/data/job-status/${jobId}')
        .then(function(r){return r.json()})
        .then(function(d){
          if(d.status==='done'){
            document.getElementById('msg').textContent='¡Listo! Descargando archivo…';
            document.getElementById('sub').textContent='';
            document.getElementById('spinner').style.borderTopColor='#2e7d32';
            window.location.href='/data/job-download/${jobId}';
          } else if(d.status==='error'){
            document.getElementById('spinner').style.display='none';
            document.getElementById('msg').className='error';
            document.getElementById('msg').textContent='Error: '+(d.error||'desconocido');
          } else {
            setTimeout(poll,3000);
          }
        })
        .catch(function(){setTimeout(poll,5000)});
    })();
  </script>
</body>
</html>`);
};

async function processExportJob(jobId, storesinfosDB, created_at_min_raw, created_at_max_raw) {
    try {
        let transactions = [];

        for (const storeinfoDB of storesinfosDB) {
            let page = 1;
            let hasMore = true;
            while (hasMore) {
                try {
                    const { data } = await axios.get(
                        `https://api.tiendanube.com/v1/${storeinfoDB.user_id}/orders?fields=id,store_id,storefront,contact_email,contact_name,contact_identification,billing_name,billing_phone,billing_zipcode,billing_city,billing_province,shipping_cost_owner,shipping_cost_customer,coupon,promotional_discount,subtotal,discount,discount_gateway,total,gateway,gateway_id,gateway_name,shipping_option,shipping_option_code,shipping_option_reference,shipping_pickup_type,created_at,payment_details,payment_count,payment_status,products,number,cancelled_at,closed_at,read_at,status,gateway_link,shipping_carrier_name,shipping_status,paid_at`,
                        {
                            params: {
                                page,
                                per_page: 30,
                                created_at_min: created_at_min_raw,
                                created_at_max: created_at_max_raw,
                            },
                            headers: {
                                Authentication: "bearer " + storeinfoDB.access_token,
                                "User-Agent": "picking-pro (nahuelezequiel20@gmail.com)",
                            },
                        }
                    );

                    if (data) transactions.push(...data);
                    console.log(`[job ${jobId}] Page ${page}: ${data.length} orders retrieved.`);
                    hasMore = data.length === 30;
                    page++;
                } catch (error) {
                    console.error(`[job ${jobId}] Error fetching page ${page} for store ${storeinfoDB.nombre}:`, error.message);
                    hasMore = false;
                }
            }
        }

        if (transactions.length === 0) {
            exportJobs.set(jobId, { ...exportJobs.get(jobId), status: "error", error: "No se encontraron datos para el rango de fechas seleccionado." });
            return;
        }

        transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const buffer = await generateExcelFile(transactions, created_at_min_raw, created_at_max_raw);
        exportJobs.set(jobId, { ...exportJobs.get(jobId), status: "done", buffer });
        console.log(`[job ${jobId}] Excel generado. ${transactions.length} transacciones.`);
    } catch (err) {
        console.error(`[job ${jobId}] Error en processExportJob:`, err);
        exportJobs.set(jobId, { ...exportJobs.get(jobId), status: "error", error: err.message });
    }
}

module.exports.getJobStatus = (req, res) => {
    const job = exportJobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ status: "not_found" });
    res.json({ status: job.status, error: job.error || null });
};

module.exports.getJobDownload = (req, res) => {
    const job = exportJobs.get(req.params.jobId);
    if (!job || job.status !== "done" || !job.buffer) {
        return res.status(404).send("Archivo no disponible o aún en proceso.");
    }
    res.setHeader("Content-Disposition", 'attachment; filename="resumen-de-ordenes.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Length", job.buffer.length);
    res.status(200).end(job.buffer);

    // Remove from memory after download
    setTimeout(() => exportJobs.delete(req.params.jobId), 5 * 60 * 1000);
};

async function formmaterDate(date) {
    return DateTime.fromISO(date.replace("+0000", "Z"), { zone: "UTC" })
        .setZone("America/Buenos_Aires")
        .toFormat("dd/MM/yyyy, HH:mm:ss");
}


async function generateExcelFile(transactions, created_at_min_raw, created_at_max_raw) {
    let transacciones = [];

    const created_at_min = DateTime.fromJSDate(new Date(created_at_min_raw))
        .minus({ hours: 3 })
        .toUTC();

    const created_at_max = DateTime.fromJSDate(new Date(created_at_max_raw))
        .minus({ hours: 3 })
        .toUTC();

    for (let index = 0; index < transactions.length; index++) {
        const order = transactions[index];
        let created_at = transactions[index].created_at;
        let closed_at = transactions[index].closed_at;
        let cancelled_at = transactions[index].cancelled_at;
        let paid_at = transactions[index].paid_at;
        let read_at = transactions[index].read_at;

        const fechaArgentina = DateTime.fromISO(created_at.replace("+0000", "Z"), { zone: "UTC" })
            .setZone("America/Buenos_Aires");

        const newDate = fechaArgentina.minus({ hours: 3 }).toUTC();

        if (newDate > created_at_max || newDate < created_at_min) {
            transacciones = transacciones.filter(odr => odr.id !== order.id);
        } else {
            created_at = await formmaterDate(created_at);
            if (closed_at) closed_at = await formmaterDate(closed_at);
            if (cancelled_at) cancelled_at = await formmaterDate(cancelled_at);
            if (paid_at) paid_at = await formmaterDate(paid_at);
            if (read_at) read_at = await formmaterDate(read_at);

            let store = await Store.findOne(
                { user_id: order.store_id },
                { nombre: 1, _id: 0 }
            )
            transacciones.push({
                ...order,
                created_at: created_at,
                closed_at: closed_at,
                cancelled_at: cancelled_at,
                paid_at: paid_at,
                read_at: read_at,
                store_name: store.nombre
            })
        }
    }

    const rows = transacciones.map((order) => ({
        order_id: order.id,
        created_at: order.created_at,
        customer_name: order.customer?.name || 'N/A',
        total: order.total || 0,
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
        subtotal: order.subtotal || 0,
        discount: order.discount || 0,
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

    const effectiveSales = transacciones.filter(
        (order) => order.payment_status === 'paid'
    );

    const totalSales = effectiveSales.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

    const salesByDate = effectiveSales.reduce((acc, order) => {
        const date = order.created_at.split(',')[0] + '_' + order.store_name;
        acc[date] = acc[date] || { date: date, count: 0, recaudacion: 0, tienda: order.store_name };
        acc[date].count += 1;
        acc[date].recaudacion += Number(order.total) || 0;
        return acc;
    }, {});

    const paymentPlatforms = effectiveSales.reduce((acc, order) => {
        const platform = order.gateway || 'Unknown';
        acc[platform] = acc[platform] || { platformMethod: platform, count: 0, recaudacion: 0, tienda: [] };
        acc[platform].count += 1;
        acc[platform].recaudacion += Number(order.total) || 0;
        acc[platform].tienda[order.store_name] = acc[platform].tienda[order.store_name] || { store_name: order.store_name, count: 0, recaudacion: 0 };
        acc[platform].tienda[order.store_name].count += 1;
        acc[platform].tienda[order.store_name].recaudacion += Number(order.total) || 0;
        return acc;
    }, {});

    const paymentMethods = effectiveSales.reduce((acc, order) => {
        const payment_method = order.payment_details?.method;
        acc[payment_method] = acc[payment_method] || { paymentMethod: payment_method, count: 0, recaudacion: 0, tienda: [] };
        acc[payment_method].count += 1;
        acc[payment_method].recaudacion += Number(order.total) || 0;
        acc[payment_method].tienda[order.store_name] = acc[payment_method].tienda[order.store_name] || { store_name: order.store_name, count: 0, recaudacion: 0 };
        acc[payment_method].tienda[order.store_name].count += 1;
        acc[payment_method].tienda[order.store_name].recaudacion += Number(order.total) || 0;
        return acc;
    }, {});

    const cardMethods = effectiveSales.reduce((acc, order) => {
        if (order.payment_details.method == 'credit_card') {
            const card_installments = order.payment_details.installments;
            acc[card_installments] = acc[card_installments] || { cardMethod: card_installments, count: 0, recaudacion: 0, tienda: [] };
            acc[card_installments].count += 1;
            acc[card_installments].recaudacion += Number(order.total) || 0;
            acc[card_installments].tienda[order.store_name] = acc[card_installments].tienda[order.store_name] || { store_name: order.store_name, count: 0, recaudacion: 0 };
            acc[card_installments].tienda[order.store_name].count += 1;
            acc[card_installments].tienda[order.store_name].recaudacion += Number(order.total) || 0;
            return acc;
        } else {
            return acc
        }
    }, {});

    const shippingMethods = effectiveSales.reduce((acc, order) => {
        const method = order.shipping_option || 'Unknown';
        acc[method] = acc[method] || { method: method, count: 0, cost: 0, tienda: [] };
        acc[method].count += 1;
        acc[method].cost += Number(order.shipping_cost_owner) || 0;
        acc[method].tienda[order.store_name] = acc[method].tienda[order.store_name] || { store_name: order.store_name, count: 0, cost: 0 };
        acc[method].tienda[order.store_name].count += 1;
        acc[method].tienda[order.store_name].cost += Number(order.shipping_cost_owner) || 0;
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
        acc[sku].tienda = product.store_name;
        return acc;
    }, {});

    const workbook = xlsx.utils.book_new();

    const ordersSheet = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(workbook, ordersSheet, 'Ordenes');
    // --------------------------------------------------------------------------------------------------------------------

    const totalVentasPorTienda = _.values(salesByDate).reduce((acc, order) => {
        const tienda = order.tienda;
        acc[tienda] = acc[tienda] || { count: 0, recaudacion: 0 };
        acc[tienda].recaudacion += order.recaudacion;
        acc[tienda].count += order.count;
        return acc;
    }, {});

    const salesByDateAndStoresRows = _.groupBy(Object.entries(salesByDate).map(([date, { count, recaudacion, tienda }]) => ({
        Fecha: date.split('_')[0],
        Tienda: tienda,
        Cantidad: count,
        'Porcentaje de ventas': ((count / totalVentasPorTienda[tienda].count) * 100).toFixed(2) + '%',
        Recaudacion: recaudacion
    })), 'Tienda');

    const salesByDateRows = [];

    Object.entries(salesByDateAndStoresRows).map(([store, rows]) => {
        salesByDateRows.push(...rows, {});
    });

    const salesByDateSheet = xlsx.utils.json_to_sheet(salesByDateRows);
    xlsx.utils.book_append_sheet(workbook, salesByDateSheet, 'Ventas por fechas');
    // --------------------------------------------------------------------------------------------------------------------


    totalVentasPorTienda.Total = {
        count: effectiveSales.length,
        recaudacion: totalSales
    };

    const summaryRows = Object.entries(totalVentasPorTienda).map(
        ([tienda, { count, recaudacion }]) => ({
            Tienda: tienda,
            Ventas: count,
            Recaudacion: recaudacion,
            'Venta promedio': (recaudacion / count).toFixed(2)
        })
    );

    const summarySheet = xlsx.utils.json_to_sheet(summaryRows);
    xlsx.utils.book_append_sheet(workbook, summarySheet, 'Resumen de ventas');
    // --------------------------------------------------------------------------------------------------------------------

    const data = [];

    Object.values(paymentMethods).forEach(({ paymentMethod, count, recaudacion, tienda }) => {
        const totalPercentage = ((recaudacion / totalSales) * 100).toFixed(2) + '%';
        data.push({
            Tipo: 'Método de Pago Total',
            Metodo: paymentMethod,
            Ventas: count,
            Tienda: 'Total',
            Porcentaje: totalPercentage,
            Recaudacion: recaudacion
        });

        const totalStoreCount = Object.values(tienda).reduce(
            (sum, t) => sum + t.count,
            0
        );

        Object.values(tienda).forEach(({ store_name, recaudacion, count }) => {
            const storePercentage = ((count / totalStoreCount) * 100).toFixed(2) + '%';

            data.push({
                Tipo: 'Método por Tienda',
                Metodo: paymentMethod,
                Ventas: count,
                Tienda: store_name,
                Porcentaje: storePercentage,
                Recaudacion: parseFloat(recaudacion)
            });
        });
    });

    data.push({});

    Object.values(paymentPlatforms).forEach(({ platformMethod, count, recaudacion, tienda }) => {
        const totalPercentage = ((recaudacion / totalSales) * 100).toFixed(2) + '%';
        data.push({
            Tipo: 'Plataformas de Pago Total',
            Metodo: platformMethod,
            Ventas: count,
            Tienda: 'Total',
            Porcentaje: totalPercentage,
            Recaudacion: recaudacion
        });

        const totalStoreCount = Object.values(tienda).reduce(
            (sum, t) => sum + t.count,
            0
        );

        Object.values(tienda).forEach(({ store_name, recaudacion, count }) => {
            const storePercentage = ((count / totalStoreCount) * 100).toFixed(2) + '%';

            data.push({
                Tipo: 'Plataformas por Tienda',
                Metodo: platformMethod,
                Ventas: count,
                Tienda: store_name,
                Porcentaje: storePercentage,
                Recaudacion: recaudacion
            });
        });
    });

    data.push({});

    Object.values(cardMethods).forEach(({ cardMethod, count, recaudacion, tienda }) => {
        const totalPercentage = ((recaudacion / totalSales) * 100).toFixed(2) + '%';
        data.push({
            Tipo: 'Cuotas Total',
            Metodo: cardMethod,
            Ventas: count,
            Tienda: 'Total',
            Porcentaje: totalPercentage,
            Recaudacion: recaudacion
        });

        const totalStoreCount = Object.values(tienda).reduce(
            (sum, t) => sum + t.count,
            0
        );

        Object.values(tienda).forEach(({ store_name, recaudacion, count }) => {
            const storePercentage = ((count / totalStoreCount) * 100).toFixed(2) + '%';

            data.push({
                Tipo: 'Cuotas por Tienda',
                Metodo: cardMethod,
                Ventas: count,
                Tienda: store_name,
                Porcentaje: storePercentage,
                Recaudacion: recaudacion
            });
        });
    });

    const paymentMethodsSheet = xlsx.utils.json_to_sheet(data);

    xlsx.utils.book_append_sheet(workbook, paymentMethodsSheet, 'Metodos de pago');

    // --------------------------------------------------------------------------------------------------------------------

    const productRows = Object.entries(productSummary).map(([sku, data]) => ({
        SKU: sku,
        Tienda: data.tienda,
        Nombre: data.name,
        'Cantidad de ventas': data.sold,
        'Ganancia por producto': data.revenue,
    }));

    const productsSheet = xlsx.utils.json_to_sheet(productRows);
    xlsx.utils.book_append_sheet(workbook, productsSheet, 'Productos');

    // --------------------------------------------------------------------------------------------------------------------    
    const tiendaRows = []

    Object.values(shippingMethods).forEach(({ method, tienda }) => {
        const totalStoreCount = Object.values(tienda).reduce(
            (sum, t) => sum + t.count,
            0
        );

        Object.values(tienda).forEach(({ store_name, cost, count }) => {
            const storePercentage = ((count / totalStoreCount) * 100).toFixed(2) + '%';
            tiendaRows.push({
                'Metodo de envio': method,
                'Tienda': store_name,
                'Cantidad de envíos': count,
                'Porcentaje de envíos por metodo': storePercentage,
                'Costo total': cost,
            })
        })
    }
    );

    const tiendaSheet = xlsx.utils.json_to_sheet(tiendaRows);
    xlsx.utils.book_append_sheet(workbook, tiendaSheet, 'Metodos de envios');
    // --------------------------------------------------------------------------------------------------------------------

    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}