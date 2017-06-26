function openerp_ab_pos_db(instance, module){

    /* The PosDB holds reference to data that is either
     * - static: does not change between pos reloads
     * - persistent : must stay between reloads ( orders )
     */

    module.PosDB = module.PosDB.extend({

        add_order: function(order){
            var order_id = order.uid;
            //var orders  = this.load('orders',[]);

            console.log('Paso por add_order');
            // if the order was already stored, we overwrite its data
            //for(var i = 0, len = orders.length; i < len; i++){
            //   if(orders[i].id === order_id){
            //        orders[i].data = order;
            //        this.save('orders',orders);
            //        return order_id;
            //    }
            //}

            //orders.push({id: order_id, data: order});
            //this.save('orders',orders);
            return order_id;
	    },


	});

}
