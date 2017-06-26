# -*- coding: utf-8 -*-
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

{
    'name': 'AB POS',
    'version': '8.0.1',
    'category': 'Point Of Sale',
    'sequence': 1,
    'summary': 'AB Point of sale',
    'depends': [
        "account","point_of_sale","l10n_ar_fpoc_pos"
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
