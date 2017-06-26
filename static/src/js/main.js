openerp.ab_pos = function (instance) {
    var module = instance.point_of_sale;
    ab_pos_models(instance, module);
    ab_pos_screens(instance, module);
    ab_pos_widgets(instance, module);
};
