function ab_pos_models(instance, module) {
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;
    var round_pr = instance.web.round_precision;
    var round_di = instance.web.round_decimals;

    var PaymentlineParent = module.Paymentline;
    var PaymentlineParent = module.Paymentline;
    var PosModelParent = module.PosModel;
    var OrderParent = module.Order;

    module.Order = module.Order.extend({

        initialize: function(attr,options){
            var ret_value = OrderParent.prototype.initialize.apply(this, arguments);
	    this.next_document_numbers = this.pos.pos_session.next_document_numbers;
	    console.log('After initialize', this);
	    return ret_value;
        },

        removePaymentline: function(line){
            if(this.selected_paymentline === line){
                this.selectPaymentline(undefined);
            }
	    console.log('removePaymentline',line);
	    if (line.product_recargo && line.cashregister.journal.coeficiente > 0) {
		// console.log('Con producto de recargo ',line.product_recargo,this,this.attributes.orderLines.models);
		var orderLines = this.attributes.orderLines.models;
		for (var x=0; x < orderLines.length; x++) {
			if (orderLines[x].cid == line.product_recargo) {
				console.log('Orderlines encontro producto recargo ',orderLines[x]);
				this.removeOrderline(orderLines[x]);
				}
			}
		}
            this.get('paymentLines').remove(line);
        },

    });
	

    module.Orderline = module.Orderline.extend({
        // return the product of this orderline
        get_price_with_vat: function(){
            return this.product.lst_price_with_vat;
        },
//
   });

    module.Paymentline = module.Paymentline.extend({
        initialize: function (attr, options) {
        	PaymentlineParent.prototype.initialize.apply(this, arguments);
		this.nro_cupon = '';
		this.nro_tarjeta = '';
		this.product_recargo = null;
		this.recargo;
		this.confirmed = false;
		},
        // returns the amount of money on this paymentline
        //get_amount: function(){
//	    if (this.confirmed) {
//		    console.log('get_amount',this.amount);
//	            return this.amount;
//		} else {
//		    console.log('get_amount not confirmed',this);
//		    return 0;
//		};
  //      },
    //    get_amount_str: function(){
//	    if (this.confirmed) {
//	            return openerp.instances[this.pos.session.name].web.format_value(this.amount, {
  //      	        type: 'float', digits: [69, this.pos.currency.decimals]
//	            });
//	    } else {
//	            return openerp.instances[this.pos.session.name].web.format_value(0, {
  //      	        type: 'float', digits: [69, this.pos.currency.decimals]
//	            });
//	    };
  //      },

        // returns the payment type: 'cash' | 'bank'
        get_is_credit_card: function(){
	    if (this.cashregister.journal.is_credit_card && this.cashregister.journal.coeficiente < 0) {
		return false;
		} else {
	            return this.cashregister.journal.is_credit_card;
		};
	},
	// returns payment type coefficient
	get_coefficient: function(){
            return this.cashregister.journal.coeficiente
	},
	// returns payment type coefficient
	get_btn_add_recargo: function(){
            return this.cashregister.journal.coeficiente != 0 && this.product_recargo === null;
	},
	get_disabled_amount: function() {
	    if (this.cashregister.journal.coeficiente != 0 && this.product_recargo != null) {
		return true;	
		}
	    if (this.cashregister.journal.coeficiente != 0 && this.product_recargo == null) {
		return false;	
		}
	    if (this.cashregister.journal.coeficiente == 0) {
		return false;	
		}
	},


        // returns the associated cashregister
        //exports as JSON for server communication
        export_as_JSON: function(){
            return {
                name: instance.web.datetime_to_str(new Date()),
                statement_id: this.cashregister.id,
                account_id: this.cashregister.account_id[0],
                journal_id: this.cashregister.journal_id[0],
		nro_cupon: this.nro_cupon,
		nro_tarjeta: this.nro_tarjeta,
                amount: this.get_amount()
            };
        },


        //sets the amount of money on this payment line
//        set_amount: function(value){
  //          console.log('set_amount ',this);
	    //if (this.cashregister.journal.coeficiente == 0) {
	    //        this.amount = round_di(parseFloat(value) || 0, this.pos.currency.decimals);
//		} else {
	//            this.amount = round_di(parseFloat(value) * ( 1 + this.cashregister.journal.coeficiente) || 0, this.pos.currency.decimals);
	//	    var selectedOrder = this.pos.get('selectedOrder');
	//	    var newLine = selectedOrder.getLastOrderline();
	//	    console.log('setAmount antes del getLastOrderline', newLine);
	//	    if (newLine == undefined) {
	//		return;
	//		};
	//	    var newProduct = newLine.product;
	//	    newProduct = this.pos.db.product_by_id[this.cashregister.journal.producto_recargo[0]];
	//	    console.log('setAmount newProduct', newProduct);
	//	    console.log('setAmount value', value, this.cashregister.journal.coeficiente);
	//	    var recargo_price = round_di(parseFloat(value) * (this.cashregister.journal.coeficiente));
	//	    console.log('precio_recargo ', recargo_price);
	//	    console.log('Producto Recargo ',newProduct);
	//	    var insert_line = new module.Orderline({}, {pos: this.pos, product: newProduct, quantity: 1});
	//	    insert_line.price = recargo_price;
	//	    this.pos.get('selectedOrder').addOrderline(insert_line);
	//	};
    //        this.trigger('change:amount',this);
      //  },

	
    });

    module.PosModel = module.PosModel.extend({

        // send an array of orders to the server
        // available options:
        // - timeout: timeout for the rpc call in ms
        // returns a deferred that resolves with the list of
        // server generated ids for the sent orders
        _save_to_server: function (orders, options) {
            console.log('esta llamando el _save_to_server antes del create_from_ui_v3',orders);
            if (!orders || !orders.length) {
                var result = $.Deferred();
                result.resolve([]);
                return result;
        	}

            options = options || {};

            var self = this;
            // var timeout = typeof options.timeout === 'number' ? options.timeout : 7500 * orders.length;
            var timeout = typeof options.timeout === 'number' ? options.timeout : 30000;

            var posOrderModel = new instance.web.Model('pos.order');
	    if (orders.length > 1) {
		var new_orders = [orders[0]];
		} else {
		var new_orders = orders;
		}
            console.log('esta llamando el _save_to_server. Llama al create_from_ui_v3 ',orders,timeout);
            // self.pos_widget.loading_message('Imprimiendo ticket'), 100);

            return_value = posOrderModel.call('create_from_ui_v3',
               [_.map(new_orders, function (order) {
                 order.to_invoice = options.to_invoice || false;
                    return order;
               })],
                undefined,
                {
                    shadow: !options.to_invoice,
                    timeout: timeout
                }
            ).then(function (server_ids) {
                _.each(new_orders, function (order) {
		    console.log('Inside  then ',server_ids);
                    self.db.remove_order(order.id);
                });
		//self.pos_widget.screen_selector.show_popup('Odoo Info',{
                //        message: 'Pedido guardado en Odoo e impreso'
		//	});
		window.location.reload();
                return server_ids;
            }).fail(function (error, event){
                if(error.code === 200 ){    // Business Logic Error, not a connection problem
                    self.pos_widget.screen_selector.show_popup('error-traceback',{
                        message: error.data.message,
                        comment: error.data.debug
                    });
                }
                // prevent an error popup creation by the rpc failure
                // we want the failure to be silent as we send the orders in the background
                event.preventDefault();
                console.error('Failed to send orders:', new_orders);
            });
	    return;
        },

        // saves the order locally and try to send it to the backend. 
        // it returns a deferred that succeeds after having tried to send the order and all the other pending orders.
        push_order: function(order) {
            var self = this;
            if (order) {
                    console.log('push_order',order.export_as_JSON());
                }

            if(order){
                this.proxy.log('push_order',order.export_as_JSON());
                this.db.add_order(order.export_as_JSON());
            }

            var pushed = new $.Deferred();

            this.flush_mutex.exec(function(){
                var flushed = self._flush_orders(self.db.get_orders());

                flushed.always(function(ids){
                    pushed.resolve();
                });
            });
            return pushed;
        },



        //creates a new empty order and sets it as the current order

        add_new_order: function(){
            var order = new module.Order({pos:this});
	    // console.log(this.partners);
	    for (var x = 0; x < this.partners.length; x++) {
		if (this.partners[x].document_number == '11111111113') {
			order.set_client(this.partners[x]);
			}		
		}
            this.get('orders').add(order);
            this.set('selectedOrder', order);
        },

        models: [
        {
            model:  'res.users',
            fields: ['name','company_id'],
            ids:    function(self){ return [self.session.uid]; },
            loaded: function(self,users){ self.user = users[0]; },
        },{ 
            model:  'res.company',
            fields: [ 'currency_id', 'email', 'website', 'company_registry', 'vat', 'name', 'phone', 'partner_id' , 'country_id', 'tax_calculation_rounding_method'],
            ids:    function(self){ return [self.user.company_id[0]] },
            loaded: function(self,companies){ self.company = companies[0]; },
        },{
            model:  'decimal.precision',
            fields: ['name','digits'],
            loaded: function(self,dps){
                self.dp  = {};
                for (var i = 0; i < dps.length; i++) {
                    self.dp[dps[i].name] = dps[i].digits;
                }
            },
        },{ 
            model:  'product.uom',
            fields: [],
            domain: null,
            context: function(self){ return { active_test: false }; },
            loaded: function(self,units){
                self.units = units;
                var units_by_id = {};
                for(var i = 0, len = units.length; i < len; i++){
                    units_by_id[units[i].id] = units[i];
                    units[i].groupable = ( units[i].category_id[0] === 1 );
                    units[i].is_unit   = ( units[i].id === 1 );
                }
                self.units_by_id = units_by_id;
            }
        },{
            model:  'res.users',
            fields: ['name','ean13'],
            domain: null,
            loaded: function(self,users){ self.users = users; },
        },{
            model:  'res.partner',
            fields: ['name','street','city','state_id','country_id','vat','phone','zip','mobile','email','ean13','write_date','document_number','responsability_id','document_type_id'],
            domain: [['customer','=',true]],
            loaded: function(self,partners){
                self.partners = partners;
                self.db.add_partners(partners);
            },
        },{
            model:  'res.country',
            fields: ['name'],
            loaded: function(self,countries){
                self.countries = countries;
                self.company.country = null;
                for (var i = 0; i < countries.length; i++) {
                    if (countries[i].id === self.company.country_id[0]){
                        self.company.country = countries[i];
                    }
                }
            },
        },{
            model:  'afip.responsability',
            fields: ['name'],
            loaded: function(self,responsabilities){
                self.responsabilities = responsabilities;
            },
        },{
            model:  'afip.document_type',
            fields: ['name','code','afip_code'],
            loaded: function(self,document_types){
                self.document_types = document_types;
            },
        },{
            model:  'account.tax',
            fields: ['name','amount', 'price_include', 'include_base_amount', 'type', 'child_ids', 'child_depend', 'include_base_amount'],
            domain: null,
            loaded: function(self, taxes){
                self.taxes = taxes;
                self.taxes_by_id = {};
                _.each(taxes, function(tax){
                    self.taxes_by_id[tax.id] = tax;
                });
                _.each(self.taxes_by_id, function(tax) {
                    tax.child_taxes = {};
                    _.each(tax.child_ids, function(child_tax_id) {
                        tax.child_taxes[child_tax_id] = self.taxes_by_id[child_tax_id];
                    });
                });
            },
        },{
            model:  'pos.session',
            fields: ['id', 'journal_ids','name','user_id','config_id','start_at','stop_at','sequence_number','login_number','next_document_numbers'],
            domain: function(self){ return [['state','=','opened'],['user_id','=',self.session.uid]]; },
            loaded: function(self,pos_sessions){
                self.pos_session = pos_sessions[0]; 

                // var orders = self.db.get_orders();
                var orders = {};
                for (var i = 0; i < orders.length; i++) {
                    self.pos_session.sequence_number = Math.max(self.pos_session.sequence_number, orders[i].data.sequence_number+1);
                }
            },
        },{
            model: 'pos.config',
            fields: [],
            domain: function(self){ return [['id','=', self.pos_session.config_id[0]]]; },
            loaded: function(self,configs){
                self.config = configs[0];
                self.config.use_proxy = self.config.iface_payment_terminal || 
                                        self.config.iface_electronic_scale ||
                                        self.config.iface_print_via_proxy  ||
                                        self.config.iface_scan_via_proxy   ||
                                        self.config.iface_cashdrawer;
                
                self.barcode_reader.add_barcode_patterns({
                    'product':  self.config.barcode_product,
                    'cashier':  self.config.barcode_cashier,
                    'client':   self.config.barcode_customer,
                    'weight':   self.config.barcode_weight,
                    'discount': self.config.barcode_discount,
                    'price':    self.config.barcode_price,
                });

                if (self.config.company_id[0] !== self.user.company_id[0]) {
                    throw new Error(_t("Error: The Point of Sale User must belong to the same company as the Point of Sale. You are probably trying to load the point of sale as an administrator in a multi-company setup, with the administrator account set to the wrong company."));
                }
            },
        },{
            model: 'stock.location',
            fields: [],
            ids:    function(self){ return [self.config.stock_location_id[0]]; },
            loaded: function(self, locations){ self.shop = locations[0]; },
        },{
            model:  'product.pricelist',
            fields: ['currency_id'],
            ids:    function(self){ return [self.config.pricelist_id[0]]; },
            loaded: function(self, pricelists){ self.pricelist = pricelists[0]; },
        },{
            model: 'res.currency',
            fields: ['name','symbol','position','rounding','accuracy'],
            ids:    function(self){ return [self.pricelist.currency_id[0]]; },
            loaded: function(self, currencies){
                self.currency = currencies[0];
                if (self.currency.rounding > 0) {
                    self.currency.decimals = Math.ceil(Math.log(1.0 / self.currency.rounding) / Math.log(10));
                } else {
                    self.currency.decimals = 0;
                }

            },
        },{
            model: 'product.packaging',
            fields: ['ean','product_tmpl_id'],
            domain: null,
            loaded: function(self, packagings){ 
                self.db.add_packagings(packagings);
            },
        },{
            model:  'pos.category',
            fields: ['id','name','parent_id','child_id','image'],
            domain: null,
            loaded: function(self, categories){
                self.db.add_categories(categories);
            },
        },{
            model:  'product.product',
            fields: ['display_name', 'list_price','price','pos_categ_id', 'taxes_id', 'ean13', 'default_code', 
                     'to_weight', 'uom_id', 'uos_id', 'uos_coeff', 'mes_type', 'description_sale', 'description',
                     'product_tmpl_id','tax_rate','lst_price_with_vat'],
            domain: [['sale_ok','=',true],['available_in_pos','=',true]],
            context: function(self){ return { pricelist: self.pricelist.id, display_default_code: false }; },
            loaded: function(self, products){
		// console.log('product.product loaded', products);
		//for (var x = 0; x < products.length; x++) {
		//	if (products[x].type == 'service) {
		//		this.pos_products.push(products[x]);
		//		}
		//	};
                self.db.add_products(products);
		// console.log('after loaded products ', this.pos_products);
            },
        },{
            model:  'account.bank.statement',
            fields: ['account_id','currency','journal_id','state','name','user_id','pos_session_id'],
            domain: function(self){ return [['state', '=', 'open'],['pos_session_id', '=', self.pos_session.id]]; },
            loaded: function(self, bankstatements, tmp){
                self.bankstatements = bankstatements;

                tmp.journals = [];
                _.each(bankstatements,function(statement){
                    tmp.journals.push(statement.journal_id[0]);
                });
            },
        },{
            model:  'account.journal',
            fields: ['name','coeficiente','producto_recargo','is_credit_card'],
            domain: function(self,tmp){ return [['id','in',tmp.journals]]; },
            loaded: function(self, journals){
                self.journals = journals;

                // associate the bank statements with their journals. 
                var bankstatements = self.bankstatements;
                for(var i = 0, ilen = bankstatements.length; i < ilen; i++){
                    for(var j = 0, jlen = journals.length; j < jlen; j++){
                        if(bankstatements[i].journal_id[0] === journals[j].id){
                            bankstatements[i].journal = journals[j];
                        }
                    }
                }
                self.cashregisters = bankstatements;
            },
        },{
            label: 'fonts',
            loaded: function(self){
                var fonts_loaded = new $.Deferred();

                // Waiting for fonts to be loaded to prevent receipt printing
                // from printing empty receipt while loading Inconsolata
                // ( The font used for the receipt ) 
                waitForWebfonts(['Lato','Inconsolata'], function(){
                    fonts_loaded.resolve();
                });

                // The JS used to detect font loading is not 100% robust, so
                // do not wait more than 5sec
                setTimeout(function(){
                    fonts_loaded.resolve();
                },5000);

                return fonts_loaded;
            },
        },{
            label: 'pictures',
            loaded: function(self){
                self.company_logo = new Image();
                var  logo_loaded = new $.Deferred();
                self.company_logo.onload = function(){
                    var img = self.company_logo;
                    var ratio = 1;
                    var targetwidth = 300;
                    var maxheight = 150;
                    if( img.width !== targetwidth ){
                        ratio = targetwidth / img.width;
                    }
                    if( img.height * ratio > maxheight ){
                        ratio = maxheight / img.height;
                    }
                    var width  = Math.floor(img.width * ratio);
                    var height = Math.floor(img.height * ratio);
                    var c = document.createElement('canvas');
                        c.width  = width;
                        c.height = height
                    var ctx = c.getContext('2d');
                        ctx.drawImage(self.company_logo,0,0, width, height);

                    self.company_logo_base64 = c.toDataURL();
                    logo_loaded.resolve();
                };
                self.company_logo.onerror = function(){
                    logo_loaded.reject();
                };
                    self.company_logo.crossOrigin = "anonymous";
                self.company_logo.src = '/web/binary/company_logo' +'?dbname=' + self.session.db + '&_'+Math.random();

                return logo_loaded;
            },
        },
        ],


    });

}
