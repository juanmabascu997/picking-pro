const Order = require("../models/orden");

const days = (date_1, date_2) => {
  let difference = date_1.getTime() - date_2.getTime();
  let TotalDays = Math.ceil(difference / (1000 * 3600 * 24));
  return TotalDays;
};

let fechaHoraActual = function () {
  var fecha = new Date();
  var diferenciaHoraria = fecha.getTimezoneOffset();
  fecha.setMinutes(fecha.getMinutes() - diferenciaHoraria);

  return fecha
}

module.exports.getInfoByID = async function (
  userId,
  primeraFecha = null,
  segundaFecha = null
) {
  try {
    let today_init = new Date();
    let today = fechaHoraActual();

    let nuevaFecha = null;
    today_init.setHours(0o0, 0o0, 0o0);

    /* Ordenes pendientes general */
    const orders_to_pick = await Order.countDocuments({
      order_picked: false,
      order_packed: false,
      order_asigned_to: null,
      order_problem: null,
      payment_status: "paid",
      next_action: "waiting_packing",
      shipping_status: "unpacked",
    });

    /* Ordenes pendientes para empaquetar */
    const pending_orders = await Order.countDocuments({
      order_picked: true,
      order_packed: false,
      order_problem: null,
      payment_status: "paid",
      next_action: "waiting_packing",
      shipping_status: "unpacked",
    });

    /* Ordenes empaquetadas por el user hoy */
    const packed_orders_today = await Order.countDocuments({
      order_picked: true,
      order_packed: true,
      order_problem: null,
      order_packed_for: userId,
      payment_status: "paid",
      $and: [
        { packed_at: { $gte: today_init } },
        { packed_at: { $lte: today } },
      ],
    });

    /* Ordenes pickeadas por el user hoy */
    const picked_orders_today = await Order.countDocuments({
      order_picked: true,
      order_problem: null,
      order_picked_for: userId,
      payment_status: "paid",
      $and: [
        { picked_at: { $gte: today_init } },
        { picked_at: { $lte: today } },
      ],
    });

    let current = new Date(); 
    let firstDayfTheWeek = current.getDate() - current.getDay();
    firstDayfTheWeek = new Date(current.setDate(firstDayfTheWeek + 1));

    /* Ordenes empaquetadas por el user en la semana actual*/
    const packed_orders_in_the_week = await Order.countDocuments({
      order_packed: true,
      order_packed_for: userId,
      order_problem: null,
      payment_status: "paid",
      $and: [
        { packed_at: { $gte: firstDayfTheWeek } },
        { packed_at: { $lte: today } },
      ],
    });

    /* Ordenes empaquetadas por el user en la semana actual*/
    const picked_orders_in_the_week = await Order.countDocuments({
      order_picked: true,
      order_picked_for: userId,
      order_problem: null,
      payment_status: "paid",
      $and: [
        { picked_at: { $gte: firstDayfTheWeek } },
        { picked_at: { $lte: today } },
      ],
    });

    if (primeraFecha || segundaFecha) {
      var curr = null;
      var first = null;
      let date_1 = new Date(primeraFecha);
      let date_2 = null;
      let total_dias = 6;
      let inicio_dias = 1;

      if (segundaFecha) {
        date_2 = new Date(segundaFecha);
        curr = date_1; // get current date
        first = date_2.getDate(); // First day is the day of the month - the day of the week;
        total_dias = days(date_1, date_2);
        inicio_dias = 0;
      } else {
        curr = fechaHoraActual(); // get current date
        first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
      }

      let data_week = [
        {
          data: [],
          id: "Empaquetados",
          id: "pvId",
          dias: segundaFecha
            ? []
            : ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
        },
        {
          data: [],
          id: "Pickeados",
          id: "uvId",
          dias: segundaFecha
            ? []
            : ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
        },
      ];

      for (let i = inicio_dias; i <= total_dias; i++) {
        let today_chart = new Date(curr.setDate(first + i));
        let today_init_chart = new Date(curr.setDate(first + i));
        today_init_chart.setHours(0o0, 0o0, 0o0);
        today_chart.setHours(20, 59, 59);

        const picked = await Order.countDocuments({
          order_picked: true,
          order_picked_for: userId,
          order_problem: null,
          payment_status: "paid",
          $and: [
            { picked_at: { $gte: today_init_chart } },
            { picked_at: { $lte: today_chart } },
          ],
        });
        const packed = await Order.countDocuments({
          order_packed: true,
          order_packed_for: userId,
          order_problem: null,
          payment_status: "paid",
          $and: [
            { packed_at: { $gte: today_init_chart } },
            { packed_at: { $lte: today_chart } },
          ],
        });

        data_week[0].data.push({
          x: today_chart.getDate(),
          y: packed,
        });
        data_week[1].data.push({
          x: today_chart.getDate(),
          y: picked,
        });
      }

      if (!segundaFecha) {
        nuevaFecha = new Date(primeraFecha);
        nuevaFecha.setHours(0o0, 0o0, 0o0);
      }
      
      /* Ordenes pickeadas por el user en las fechas seleccionadas*/
      const picked_orders_in_selected_dates = await Order.countDocuments({
        order_picked: true,
        order_picked_for: userId,
        order_problem: null,
        payment_status: "paid",
        $and: [
          { picked_at: { $gte: segundaFecha ? segundaFecha : nuevaFecha } },
          { picked_at: { $lte: primeraFecha } },
        ],
      });
      return {
        picked_orders_in_the_week,
        packed_orders_in_the_week,
        orders_to_pick,
        pending_orders,
        packed_orders_today,
        picked_orders_today,
        picked_orders_in_selected_dates,
        data_week,
      };
    } else {
      return {
        picked_orders_in_the_week,
        packed_orders_in_the_week,
        orders_to_pick,
        pending_orders,
        packed_orders_today,
        picked_orders_today,
      };
    }
  } catch (error) {
    console.log(error);
    return { err: "Error has been ocurred" };
  }
};
