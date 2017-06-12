openerp.ab_pos = function (instance) {
    console.log('Paso por el main');
    var module = instance.point_of_sale;
    ab_pos_models(instance, module);
    ab_pos_screens(instance, module);
};
