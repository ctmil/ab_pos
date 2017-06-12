function ab_pos_models(instance, module) {
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;
    var round_pr = instance.web.round_precision;
    var round_di = instance.web.round_decimals;

    var PaymentlineParent = module.Paymentline;
    var PosModelParent = module.PosModel;

    module.Paymentline = module.Paymentline.extend({
        initialize: function (attr, options) {
        	PaymentlineParent.prototype.initialize.apply(this, arguments);
		this.nro_cupon = '';
		this.nro_tarjeta = '';
		},
        // returns the payment type: 'cash' | 'bank'
        get_is_credit_card: function(){
            return this.cashregister.journal.is_credit_card
        },
	
    });

    module.PosModel = module.PosModel.extend({

        initialize: function(session, attributes) {
            Backbone.Model.prototype.initialize.call(this, attributes);
            var  self = this;
	    console.log('initialize ab_pos PosModel');
            this.session = session;                 
            this.flush_mutex = new $.Mutex();                   // used to make sure the orders are sent to the server once at time
            this.pos_widget = attributes.pos_widget;

            this.proxy = new module.ProxyDevice(this);              // used to communicate to the hardware devices via a local proxy
            this.barcode_reader = new module.BarcodeReader({'pos': this, proxy:this.proxy, patterns: {}});  // used to read barcodes
            this.proxy_queue = new module.JobQueue();           // used to prevent parallels communications to the proxy
            this.db = new module.PosDB();                       // a local database used to search trough products and categories & store pending orders
            this.debug = jQuery.deparam(jQuery.param.querystring()).debug !== undefined;    //debug mode 
            
            // Business data; loaded from the server at launch
            this.accounting_precision = 2; //TODO
            this.company_logo = null;
            this.company_logo_base64 = '';
            this.currency = null;
            this.shop = null;
            this.company = null;
            this.user = null;
            this.users = [];
            this.partners = [];
            this.cashier = null;
            this.cashregisters = [];
            this.bankstatements = [];
            this.taxes = [];
            this.pos_session = null;
            this.config = null;
            this.units = [];
            this.units_by_id = {};
            this.pricelist = null;
            this.order_sequence = 1;
            window.posmodel = this;

            // these dynamic attributes can be watched for change by other models or widgets
            this.set({
                'synch':            { state:'connected', pending:0 }, 
                'orders':           new module.OrderCollection(),
                'selectedOrder':    null,
            });

            this.bind('change:synch',function(pos,synch){
                clearTimeout(self.synch_timeout);
                self.synch_timeout = setTimeout(function(){
                    if(synch.state !== 'disconnected' && synch.pending > 0){
                        self.set('synch',{state:'disconnected', pending:synch.pending});
                    }
                },3000);
            });

            this.get('orders').bind('remove', function(order,_unused_,options){ 
                self.on_removed_order(order,options.index,options.reason); 
            });
            
            // We fetch the backend data on the server asynchronously. this is done only when the pos user interface is launched,
            // Any change on this data made on the server is thus not reflected on the point of sale until it is relaunched. 
            // when all the data has loaded, we compute some stuff, and declare the Pos ready to be used. 
            this.ready = this.load_server_data()
                .then(function(){
                    if(self.config.use_proxy){
                        return self.connect_to_proxy();
                    }
                });
            
        },


        //creates a new empty order and sets it as the current order
        add_new_order: function(){
	    console.log('models ',this.models);
            var order = new module.Order({pos:this});
	    for (var x = 0; x < this.partners.length; x++) {
		if (this.partners[x].vat == 'AR11111111113') {
			order.set_client(this.partners[x]);
			}		
		}
            this.get('orders').add(order);
            this.set('selectedOrder', order);
        },

    });

}
