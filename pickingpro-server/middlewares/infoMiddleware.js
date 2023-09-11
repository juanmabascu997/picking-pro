const Order = require("../models/orden");

function getOneWeekAfter() {
  var curr = new Date(); // get current date
  var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
  var last = first - 6; // last day is the first day + 6

  var lastday = new Date(curr.setDate(last)).toISOString();

  return lastday;
}

module.exports.getInfoByID = async function (
  userId,
  primeraFecha = null,
  segundaFecha = null
) {
  try {
    let oneWeekAfter = getOneWeekAfter();
    let today_init = new Date();
    let today = new Date();
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

    /* Ordenes empaquetadas por el user en la semana actual*/
    const packed_orders_in_the_week = await Order.countDocuments({
      order_packed: true,
      order_packed_for: userId,
      order_problem: null,
      payment_status: "paid",
      $and: [
        { packed_at: { $gte: oneWeekAfter } },
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
        { picked_at: { $gte: oneWeekAfter } },
        { picked_at: { $lte: today } },
      ],
    });

    if (primeraFecha || segundaFecha) {
      var curr = new Date(); // get current date
      var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week
      let data_week = [
        { data: [], label: "Packed", id: "pvId" },
        { data: [], label: "Picked", id: "uvId" },
      ];

      for (let i = 1; i < 6; i++) {
        let today_chart = new Date(curr.setDate(first + i));
        let today_init_chart = new Date(curr.setDate(first + i));
        today_init_chart.setHours(0o0, 0o0, 0o0);

        const picked = await Order.countDocuments({
          order_picked: true,
          order_picked_for: userId,
          order_problem: null,
          payment_status: "paid",
          $and: [
            { packed_at: { $gte: today_init_chart } },
            { packed_at: { $lte: today_chart } },
          ],
        });
        const packed = await Order.countDocuments({
          order_packed: true,
          order_packed_for: userId,
          order_problem: null,
          payment_status: "paid",
          $and: [
            { picked_at: { $gte: today_init_chart } },
            { picked_at: { $lte: today_chart } },
          ],
        });

        data_week[0].data.push(packed);
        data_week[1].data.push(picked);
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
