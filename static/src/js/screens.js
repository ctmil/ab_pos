function ab_pos_screens(instance, module) {

    _t = instance.web._t;
    var round_pr = instance.web.round_precision;
    var round_di = instance.web.round_decimals;

    module.PaymentScreenWidget = instance.point_of_sale.PaymentScreenWidget.extend({

        show: function(){
            this._super();
            var self = this;

            this.add_action_button({
                    label: _t('Nueva Orden'),
                    icon: '/point_of_sale/static/src/img/icons/png48/shut-down.png',
                    click: function(){
                        self.clear_order();
                    },
                });

            this.update_payment_summary();

        },

	clear_order: function() {
	    console.log('clear_order ',this.pos.get('selectedOrder'));
            if( !this.pos.get('selectedOrder').is_empty() ){
                        this.pos_widget.screen_selector.show_popup('confirm',{
                            message: _t('Reiniciar orden ?'),
                            comment: _t('Perderá todos los datos ingresados'),
                            confirm: function(){
                               this.pos.delete_current_order();
                            },
                        });
            }else{
                        this.pos.delete_current_order();
            };
	},

        render_paymentline: function(line){
            var el_html  = openerp.qweb.render('Paymentline',{widget: this, line: line});
                el_html  = _.str.trim(el_html);

            var el_node  = document.createElement('tbody');
                el_node.innerHTML = el_html;
                el_node = el_node.childNodes[0];
                el_node.line = line;
                //el_node.querySelector('.paymentline-delete')
                //    .addEventListener('click', this.line_delete_handler);
                el_node.addEventListener('click', this.line_click_handler);
                if (el_node.querySelector('input.paymentline-input')) {
	                el_node.querySelector('input.paymentline-input')
        	            .addEventListener('keyup', this.line_change_handler);
			};
		// if (el_node.querySelector('paymentline-input')) {
                //	el_node.querySelector('paymentline-input')
                //    	.addEventListener('keyup', this.line_change_handler);
		//	};
		if (el_node.querySelector('input.paymentline-cupon-input')) {
	                el_node.querySelector('input.paymentline-cupon-input')
        	            .addEventListener('keyup', this.line_cupon_change_handler);
			};
		if (el_node.querySelector('input.paymentline-card-input')) {
	                el_node.querySelector('input.paymentline-card-input')
        	            .addEventListener('keyup', this.line_card_change_handler);
			};
		if (el_node.querySelector('button.btn-addpayment')) {
	                el_node.querySelector('button.btn-addpayment')
        	            .addEventListener('click', this.on_click_addpayment);
			};
		if (el_node.querySelector('button.btn-deletepayment')) {
			console.log('Entro por aca');
	                el_node.querySelector('button.btn-deletepayment')
        	            .addEventListener('click', this.line_delete_handler);
			};

            line.node = el_node;

            return el_node;
        },


       init: function(parent, options) {
            var self = this;
            this._super(parent,options);

	    console.log('PaymentScreenWidget init',this);
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
		console.log('line_change_handler',this);
                var node = this;
                while(node && !node.classList.contains('paymentline')){
                    node = node.parentNode;
                }
                if(node){
                    var amount;
		    console.log('Esta pasando por aca',node,this);
		    if (node.line.product_recargo != null) {
		    	console.log('Trata de modificar coeficiente',node,this,event);
			event.srcElement.disabled = true;
	                //this.pos_widget.screen_selector.show_popup('error',{
        		//            'message': _t('Recargo'),
              		//	    'comment': _t('Recargo ya agregado. No puede modificarse'),
		        //        });
		    	console.log('Trata de modificar coeficiente',event);
			return;
			};
                    try{
                        amount = instance.web.parse_value(this.value, {type: "float"});
                    }
                    catch(e){
                        amount = 0;
                    }
                    node.line.set_amount(amount);
                }
            };

            this.line_card_change_handler = function(event){
                var node = this;
                while(node && !node.classList.contains('paymentline')){
                    node = node.parentNode;
                }
                if(node){
                    var card_text = instance.web.parse_value(this.value, {type: "text"});
                    node.line.nro_tarjeta = card_text;
                }
            };

            this.line_cupon_change_handler = function(event){
                var node = this;
                while(node && !node.classList.contains('paymentline')){
                    node = node.parentNode;
                }
                if(node){
                    var card_text = instance.web.parse_value(this.value, {type: "text"});
                    node.line.nro_cupon = card_text;
                }
            };

            this.on_click_addpayment = function(event){
                var node = this;
                while(node && !node.classList.contains('paymentline')){
                    node = node.parentNode;
                }
		node.line.confirmed = true;
		var line = node.line;
		console.log('on_click_addpayment',line);
	    	if (line.cashregister.journal.coeficiente != 0) {
			if (line.product_recargo != null) {
		                //this.pos_widget.screen_selector.show_popup('error',{
        		        //    'message': _t('Recargo'),
              			//    'comment': _t('Recargo ya agregado'),
		                //});
        	        	return;
				};
			console.log('add_paymentline ',line);
			var selectedOrder = line.pos.get('selectedOrder');
        	        var newLine = selectedOrder.getLastOrderline();
			console.log('Tiene coeficiente - selectedOrder', selectedOrder);
	                if (newLine == undefined) {
        	                return;
                	        };
	                var newProduct = newLine.product;
        	        newProduct = line.pos.db.product_by_id[line.cashregister.journal.producto_recargo[0]];
                	console.log('setAmount newProduct', newProduct);
	                // var insert_line = new module.Orderline({}, {pos: this.pos, order: selectedOrder, product: newProduct, quantity: 1, price: recargo_price});
        	        console.log('setAmount value', line.amount, line.cashregister.journal.coeficiente);
			if (newProduct.tax_rate === 0) {
				console.log('Pasaje #1');
	                	var recargo_price = round_di(parseFloat(line.amount) * (line.cashregister.journal.coeficiente));
			} else {
				console.log('Pasaje #2');
	                	var recargo_price = (round_di(parseFloat(line.amount / (1+newProduct.tax_rate)) * (line.cashregister.journal.coeficiente)));
				}
	                console.log('precio_recargo ', line.amount);
        	        // console.log('Producto Recargo ',newProduct);
                	var insert_line = new module.Orderline({}, {pos: line.pos, product: newProduct, quantity: 1});
	                insert_line.price = line.recargo;
        	        line.pos.get('selectedOrder').addOrderline(insert_line);
			line.product_recargo = insert_line.cid;
			// deletes discount line
			if (line.cashregister.journal.coeficiente < 0) {
				console.log('addPaymentLine selectedOrder',selectedOrder,line);
				old_node_line = node.line;
                		event.stopPropagation();
                    		selectedOrder.removePaymentline(node.line)
				// this.remove_paymentline(node.line);
				};
			//line.recargo = recargo_price;
			// line.amount = line.amount + recargo_price * 1.21;
                	// console.log('insert_line ',line,event);
			};
		// if (line) {
		// 	line.update_payment_summary();
		//	};
            };

            //this.line_change_handler = function(event){
            //    var node = this;
		//console.log('esta pasando por aca',node);
	        //if (node.id.indexOf('nro_cupon') == (-1)  && node.id.indexOf('nro_tarjeta') == (-1)) {
                //	while(node && !node.classList.contains('paymentline')){
	        //            node = node.parentNode;
        	//        }   
                //	if(node){
	        //            var amount;
	        //            try{
        	 //               amount = instance.web.parse_value(this.value, {type: "float"});
                //	    }   
	          //          catch(e){
        	//                amount = 0;
                //	    }   
		//	    console.log('llama al set_amount');
	        //            node.line.set_amount(amount);
	//		}
          //      } 
            //};

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
                //if(event.which === 13){
                //    self.validate_order();
                //}else if(event.which === 27){
                if(event.which === 27){
                    self.back();
                } 
                //var node = this;
                //while(node && !node.classList.contains('paymentline')){
                //    node = node.parentNode;
                //}
		//console.log('hotkey_handler',this,node);
		//if (this.is_paid()) {
	        //        this.pos_widget.action_bar.set_button_disabled('validation',true);
  		//	};
            };

        },

        validate_order: function(options) {
            var self = this;
            options = options || {};

            var currentOrder = this.pos.get('selectedOrder');
	    console.log('validate_order',currentOrder);
	    var partner = currentOrder.get_client();
	    console.log('validate_order partner',partner);
	
	    if (partner.street == "false" ) {
	                this.pos_widget.screen_selector.show_popup('error',{
        	            'message': _t('Datos faltantes'),
              	    'comment': _t('Debe cargarse la direccion del cliente'),
	                });
        	        return;
		};
	    if (partner.city == "false") {
	                this.pos_widget.screen_selector.show_popup('error',{
        	            'message': _t('Datos faltantes'),
              	    'comment': _t('Debe cargarse la ciudad del cliente'),
	                });
        	        return;
		};
	    if (partner.zip == "false") {
	                this.pos_widget.screen_selector.show_popup('error',{
        	            'message': _t('Datos faltantes'),
              	    'comment': _t('Debe cargarse el codigo postal del cliente'),
	                });
        	        return;
		};

	    if (currentOrder.getTotalTaxIncluded() > 1000 && partner.document_number == '11111111113') {
	                this.pos_widget.screen_selector.show_popup('error',{
        	            'message': _t('Cliente incorrecto'),
              	    'comment': _t('Cliente no puede ser Consumidor Final para tickets que superen los $1,000'),
	                });
        	        return;
		}

            if(currentOrder.get('orderLines').models.length === 0){
                this.pos_widget.screen_selector.show_popup('error',{
                    'message': _t('Empty Order'),
                    'comment': _t('There must be at least one product in your order before it can be validated'),
                });
                return;
            }

            var plines = currentOrder.get('paymentLines').models;
            for (var i = 0; i < plines.length; i++) {
                if (plines[i].get_type() === 'bank' && plines[i].get_amount() < 0) {
                    this.pos_widget.screen_selector.show_popup('error',{
                        'message': _t('Negative Bank Payment'),
                        'comment': _t('You cannot have a negative amount in a Bank payment. Use a cash payment method to return money to the customer.'),
                    });
                    return;
                }
                // if (plines[i].cashregister.journal.coeficiente != 0 && plines[i].product_recargo === null) {
                if (plines[i].product_recargo === null && plines[i].cashregister.journal.coeficiente > 0) {
		    //console.log('validate_order plines',plines[i]);
		    //console.log('validate_order plines',plines[i].producto_recargo);
		    //console.log('validate_order plines',plines[i].cashregister.journal.coeficiente);
                    this.pos_widget.screen_selector.show_popup('error',{
                        'message': _t('Recargo faltante'),
                        'comment': _t('Para pagos con tarjeta de crédito debe agregar el recargo.'),
                    });
                    return;
                }
            }

            if(!this.is_paid()){
                return;
            }

            // The exact amount must be paid if there is no cash payment method defined.
            if (Math.abs(currentOrder.getTotalTaxIncluded() - currentOrder.getPaidTotal()) > 0.00001) {
                var cash = false;
                for (var i = 0; i < this.pos.cashregisters.length; i++) {
                    cash = cash || (this.pos.cashregisters[i].journal.type === 'cash');
                }
                if (!cash) {
                    this.pos_widget.screen_selector.show_popup('error',{
                        message: _t('Cannot return change without a cash payment method'),
                        comment: _t('There is no cash payment method available in this point of sale to handle the change.\n\n Please pay the exact amount or add a cash payment method in the point of sale configuration'),
                    });
                    return;
                }
            }

            if (this.pos.config.iface_cashdrawer) {
                    this.pos.proxy.open_cashbox();
            }

            if(options.invoice){
                // deactivate the validation button while we try to send the order
                this.pos_widget.action_bar.set_button_disabled('validation',true);
                this.pos_widget.action_bar.set_button_disabled('invoice',true);

                var invoiced = this.pos.push_and_invoice_order(currentOrder);

                invoiced.fail(function(error){
                    if(error === 'error-no-client'){
                        self.pos_widget.screen_selector.show_popup('error',{
                            message: _t('An anonymous order cannot be invoiced'),
                            comment: _t('Please select a client for this order. This can be done by clicking the order tab'),
                        });
                    }else{
                        self.pos_widget.screen_selector.show_popup('error',{
                            message: _t('The order could not be sent'),
                            comment: _t('Check your internet connection and try again.'),
                        });
                    }
                    self.pos_widget.action_bar.set_button_disabled('validation',false);
                    self.pos_widget.action_bar.set_button_disabled('invoice',false);
                });

                invoiced.done(function(){
                    self.pos_widget.action_bar.set_button_disabled('validation',false);
                    self.pos_widget.action_bar.set_button_disabled('invoice',false);
                    self.pos.get('selectedOrder').destroy();
                });

            }else{

                this.pos.push_order(currentOrder) 
                if(this.pos.config.iface_print_via_proxy){
                    var receipt = currentOrder.export_for_printing();
                    //this.pos.proxy.print_receipt(QWeb.render('XmlReceipt',{
                    //    receipt: receipt, widget: self,
                    //}));
                    this.pos.get('selectedOrder').destroy();    //finish order and go back to scan screen
                }else{
                    // this.pos_widget.screen_selector.set_current_screen(this.next_screen);
                    this.pos.get('selectedOrder').destroy();    //finish order and go back to scan screen
		    // this.refresh();
                }
            }

            // hide onscreen (iOS) keyboard 
            setTimeout(function(){
                document.activeElement.blur();
                $("input").blur();
            },250);
        },

        update_payment_summary: function() {
            var currentOrder = this.pos.get('selectedOrder');
	    console.log('update_payment_summary',currentOrder);
            var paidTotal = currentOrder.getPaidTotal();
            var dueTotal = currentOrder.getTotalTaxIncluded();
            var remaining = dueTotal > paidTotal ? dueTotal - paidTotal : 0;
            var change = paidTotal > dueTotal ? paidTotal - dueTotal : 0;

            this.$('.payment-due-total').html(this.format_currency(dueTotal));
            this.$('.payment-paid-total').html(this.format_currency(paidTotal));
            this.$('.payment-remaining').html(this.format_currency(remaining));
            this.$('.payment-change').html(this.format_currency(change));
            this.$('.doc-numbers').html(currentOrder.next_document_numbers);
            if(currentOrder.selected_orderline === undefined){
                remaining = 1;  // What is this ? 
            }

            if(this.pos_widget.action_bar){
                this.pos_widget.action_bar.set_button_disabled('validation', !this.is_paid());
                this.pos_widget.action_bar.set_button_disabled('invoice', true);
            }
        },

        add_paymentline: function(line) {
            var list_container = this.el.querySelector('.payment-lines');
                list_container.appendChild(this.render_paymentline(line));
	    if (line.cashregister.journal.coeficiente != 0) {
		console.log('add_paymentline ',line);
		var selectedOrder = this.pos.get('selectedOrder');
                var newLine = selectedOrder.getLastOrderline();
		console.log('Tiene coeficiente - selectedOrder', selectedOrder);
		if (line.cashregister.journal.coeficiente < 0) {
			console.log('Aplicara el descuento a las lineas',selectedOrder.get('orderLines').models);
	                var orderLines = selectedOrder.get('orderLines').models;
			var discount = line.cashregister.journal.coeficiente;
			if (orderLines) {
				console.log('recorrera las lineas',orderLines,discount);
				for (var x = 0; x <  selectedOrder.get('orderLines').models.length; x++) {
					console.log('selectedLine',selectedOrder.get('orderLines').models[x]);
					// selectedOrder.get('orderLines').models[x].discount = discount * (-1);
					selectedOrder.get('orderLines').models[x].price = selectedOrder.get('orderLines').models[x].price * ( 1 + discount) ;
					};
				};
                		// event.stopPropagation();
                    		// selectedOrder.removePaymentline(line);
			};
                if (newLine == undefined) {
                        return;
                        };
		if (line.cashregister.journal.coeficiente > 0) {
	                var newProduct = newLine.product;
        	        newProduct = this.pos.db.product_by_id[line.cashregister.journal.producto_recargo[0]];
                	console.log('setAmount newProduct', newProduct);
	                // var insert_line = new module.Orderline({}, {pos: this.pos, order: selectedOrder, product: newProduct, quantity: 1, price: recargo_price});
        	        console.log('setAmount value', line.amount, line.cashregister.journal.coeficiente);
			if (newProduct.tax_rate === 0) {
				console.log('Pasaje #1');
	                	var recargo_price = round_di(parseFloat(line.amount) * (line.cashregister.journal.coeficiente));
			} else {
				console.log('Pasaje #2');
                		var recargo_price = (round_di(parseFloat(line.amount / (1+newProduct.tax_rate)) * (line.cashregister.journal.coeficiente)));
				}
        	        // var recargo_price = round_di(parseFloat(line.amount) * (line.cashregister.journal.coeficiente));
                	console.log('precio_recargo ', recargo_price);
        	        console.log('Producto Recargo ',newProduct);
	                var insert_line = new module.Orderline({}, {pos: this.pos, product: newProduct, quantity: 1});
                	insert_line.price = recargo_price;
	                //this.pos.get('selectedOrder').addOrderline(insert_line);
			//line.product_recargo = insert_line.cid;
			line.recargo = recargo_price;
			line.amount = line.amount + recargo_price * 1.21;
                	console.log('insert_line ',line,this.pos.get('selectedOrder'));
			};
		};
            if(this.numpad_state){
                this.numpad_state.reset();
            }
        },

    });

    //module.ReceiptScreenWidget = instance.point_of_sale.ReceiptScreenWidget.extend({
//	show: function(){
//		var finish_button = this.add_action_button({
//                    label: _t('Next Order'),
//                    icon: '/point_of_sale/static/src/img/icons/png48/go-next.png',
//                    click: function() { 
//			console.log(this);
//			},
//                });
//		this.refresh();
//		},
//
//    });

    module.ClientListScreenWidget = instance.point_of_sale.ClientListScreenWidget.extend({

        // what happens when we save the changes on the client edit form -> we fetch the fields, sanitize them,
        // send them to the backend for update, and call saved_client_details() when the server tells us the
        // save was successfull.
        save_client_details: function(partner) {
            var self = this;

            var fields = {}
            this.$('.client-details-contents .detail').each(function(idx,el){
                fields[el.name] = el.value;
            });

            if (!fields.name) {
                this.pos_widget.screen_selector.show_popup('error',{
                    message: _t('A Customer Name Is Required'),
                });
                return;
            }
            if (!fields.name) {
                this.pos_widget.screen_selector.show_popup('error',{
                    message: _t('A Customer Name Is Required'),
                });
                return;
            }
            if (fields.document_number == "") {
                this.pos_widget.screen_selector.show_popup('error',{
                    message: _t('Debe ingresar nro de documento'),
                });
                return;
            }
            if (fields.document_type_id == "") {
                this.pos_widget.screen_selector.show_popup('error',{
                    message: _t('Debe ingresar tipo de documento'),
                });
                return;
            }
            if (fields.responsability_id == "") {
                this.pos_widget.screen_selector.show_popup('error',{
                    message: _t('Debe ingresar la responsabilidad fiscal'),
                });
                return;
            }

            if (this.uploaded_picture) {
                fields.image = this.uploaded_picture;
            }

            fields.id           = partner.id || false;
            fields.country_id   = fields.country_id || false;
            fields.ean13        = fields.ean13 ? this.pos.barcode_reader.sanitize_ean(fields.ean13) : false;

            new instance.web.Model('res.partner').call('create_from_ui',[fields]).then(function(partner_id){
                self.saved_client_details(partner_id);
            },function(err,event){
                event.preventDefault();
                self.pos_widget.screen_selector.show_popup('error',{
                    'message':_t('Error: Could not Save Changes'),
                    'comment':_t('Your Internet connection is probably down.'),
                });
            });
        },


    });
	
}

