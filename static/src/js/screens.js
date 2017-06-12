function ab_pos_screens(instance, module) {

    _t = instance.web._t;

    module.PaymentScreenWidget = instance.point_of_sale.PaymentScreenWidget.extend({

       init: function(parent, options) {
            var self = this;
            this._super(parent,options);

            this.pos.bind('change:selectedOrder',function(){
                    this.bind_events();
                    this.renderElement();
                },this);

            this.bind_events();
            this.decimal_point = instance.web._t.database.parameters.decimal_point;

            this.line_delete_handler = function(event){
                var node = this;
                while(node && !node.classList.contains('paymentline')){
                    node = node.parentNode;
                }
                if(node){
                    self.pos.get('selectedOrder').removePaymentline(node.line)
                }
                event.stopPropagation();
            };

            this.line_change_handler = function(event){
                var node = this;
	        if (node.id.indexOf('nro_cupon') == (-1)  && node.id.indexOf('nro_tarjeta') == (-1)) {
                	while(node && !node.classList.contains('paymentline')){
	                    node = node.parentNode;
        	        }   
                	if(node){
	                    var amount;
	                    try{
        	                amount = instance.web.parse_value(this.value, {type: "float"});
                	    }   
	                    catch(e){
        	                amount = 0;
                	    }   
	                    node.line.set_amount(amount);
			}
                } 
            };

            this.line_click_handler = function(event){
                var node = this;
                while(node && !node.classList.contains('paymentline')){
                    node = node.parentNode;
                }   
                if(node){
                    self.pos.get('selectedOrder').selectPaymentline(node.line);
                }   
            };

            this.hotkey_handler = function(event){
                if(event.which === 13){
                    self.validate_order();
                }else if(event.which === 27){
                    self.back();
                }   
            };

        },

        validate_order: function(options) {
            var self = this;
            var currentOrder = this.pos.get('selectedOrder');
	    var partner = currentOrder.get_client();
		console.log('currentOrder.getTotalTaxIncluded',currentOrder.getTotalTaxIncluded());
		console.log('currentOrder.get_client',currentOrder.get_client());
	    if (currentOrder.getTotalTaxIncluded() > 1000 && partner.document_number == '11111111113') {
	                this.pos_widget.screen_selector.show_popup('error',{
        	            'message': _t('Cliente incorrecto'),
                	    'comment': _t('Cliente no puede ser Consumidor Final para tickets que superen los $1,000'),
	                });
        	        return;
		}
            this._super(options);
	
	},

        update_payment_summary: function() {
            var currentOrder = this.pos.get('selectedOrder');
            var paidTotal = currentOrder.getPaidTotal();
            var dueTotal = currentOrder.getTotalTaxIncluded();
            var remaining = dueTotal > paidTotal ? dueTotal - paidTotal : 0;
            var change = paidTotal > dueTotal ? paidTotal - dueTotal : 0;

            this.$('.payment-due-total').html(this.format_currency(dueTotal));
            this.$('.payment-paid-total').html(this.format_currency(paidTotal));
            this.$('.payment-remaining').html(this.format_currency(remaining));
            this.$('.payment-change').html(this.format_currency(change));
            if(currentOrder.selected_orderline === undefined){
                remaining = 1;  // What is this ? 
            }

            if(this.pos_widget.action_bar){
                this.pos_widget.action_bar.set_button_disabled('validation', !this.is_paid());
                this.pos_widget.action_bar.set_button_disabled('invoice', true);
            }
        },


    });

}

