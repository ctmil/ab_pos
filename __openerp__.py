# -*- coding: utf-8 -*-
# © 2014-2015 Taktik (http://www.taktik.be) - Adil Houmadi <ah@taktik.be>
# © 2016 Serv. Tecnol. Avanzados - Pedro M. Baeza
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

{
    'name': 'AB POS',
    'version': '8.0.1',
    'category': 'Point Of Sale',
    'sequence': 1,
    'summary': 'AB Point of sale',
    'depends': [
        "account","point_of_sale",
    ],
    'data': [
        "views/ab_pos_template.xml",
        "views/ab_pos_view.xml",
    ],
    'demo': [
    ],
    'qweb': [
        'static/src/xml/pos.xml'
    ],
    'installable': True,
    'license': 'AGPL-3',
}
