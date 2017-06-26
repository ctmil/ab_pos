function ab_pos_widgets(instance, module){ //module is instance.point_of_sale
    var QWeb = instance.web.qweb;
        var _t = instance.web._t;

    module.PosWidget = module.PosWidget.extend({
        template: 'PosWidget',

        start: function() {
            var self = this;
            var res = this._super();

	    console.log('start');

            self.$('.neworder-button').click(function(){
                    console.log('clickeo en neworder');
            });

	    return res;
	    },
	
	});

}
