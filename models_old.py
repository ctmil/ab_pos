# -*- coding: utf-8 -*-
import logging
import psycopg2
import time
from datetime import datetime

from openerp import tools
from openerp.osv import fields, osv
from openerp.tools import float_is_zero
from openerp.tools.translate import _

import openerp.addons.decimal_precision as dp
import openerp.addons.product.product

_logger = logging.getLogger(__name__)

class pos_order(osv.osv):
	_inherit = 'pos.order'


	def add_payment(self, cr, uid, order_id, data, context=None):
	        """Create a new payment for the order"""
        	context = dict(context or {})
	        statement_line_obj = self.pool.get('account.bank.statement.line')
        	property_obj = self.pool.get('ir.property')
	        order = self.browse(cr, uid, order_id, context=context)
        	date = data.get('payment_date', time.strftime('%Y-%m-%d'))
		nro_cupon = data.get('nro_cupon','')
		nro_tarjeta = data.get('nro_tarjeta','')
	        if len(date) > 10:
        	    timestamp = datetime.strptime(date, tools.DEFAULT_SERVER_DATETIME_FORMAT)
	            ts = fields.datetime.context_timestamp(cr, uid, timestamp, context)
        	    date = ts.strftime(tools.DEFAULT_SERVER_DATE_FORMAT)
	        args = {
        	    'amount': data['amount'],
	            'date': date,
        	    'name': order.name + ': ' + (data.get('payment_name', '') or ''),
		    'nro_cupon': nro_cupon,
		    'nro_tarjeta': nro_tarjeta,	
	            'partner_id': order.partner_id and self.pool.get("res.partner")._find_accounting_partner(order.partner_id).id or False,
        	}

	        journal_id = data.get('journal', False)
        	statement_id = data.get('statement_id', False)
	        assert journal_id or statement_id, "No statement_id or journal_id passed to the method!"

        	journal = self.pool['account.journal'].browse(cr, uid, journal_id, context=context)
	        # use the company of the journal and not of the current user
        	company_cxt = dict(context, force_company=journal.company_id.id)
	        account_def = property_obj.get(cr, uid, 'property_account_receivable', 'res.partner', context=company_cxt)
        	args['account_id'] = (order.partner_id and order.partner_id.property_account_receivable \
                             and order.partner_id.property_account_receivable.id) or (account_def and account_def.id) or False

	        if not args['account_id']:
        	    if not args['partner_id']:
                	msg = _('There is no receivable account defined to make payment.')
	            else:
        	        msg = _('There is no receivable account defined to make payment for the partner: "%s" (id:%d).') % (order.partner_id.name, order.partner_id.id,)
	            raise osv.except_osv(_('Configuration Error!'), msg)

        	context.pop('pos_session_id', False)

	        for statement in order.session_id.statement_ids:
        	    if statement.id == statement_id:
                	journal_id = statement.journal_id.id
	                break
        	    elif statement.journal_id.id == journal_id:
                	statement_id = statement.id
	                break

        	if not statement_id:
	            raise osv.except_osv(_('Error!'), _('You have to open at least one cashbox.'))

        	args.update({
	            'statement_id': statement_id,
        	    'pos_statement_id': order_id,
	            'journal_id': journal_id,
        	    'ref': order.session_id.name,
		    'nro_cupon': nro_cupon,
		    'nro_tarjeta': nro_tarjeta
	        })

        	statement_line_obj.create(cr, uid, args, context=context)

	        return statement_id

	def _payment_fields(self, cr, uid, ui_paymentline, context=None):
        	return {
	            'amount':       ui_paymentline['amount'] or 0.0,
        	    'payment_date': ui_paymentline['name'],
	            'statement_id': ui_paymentline['statement_id'],
        	    'payment_name': ui_paymentline.get('note',False),
	            'journal':      ui_paymentline['journal_id'],
	            'nro_cupon':      ui_paymentline['nro_cupon'],
	            'nro_tarjeta':      ui_paymentline['nro_tarjeta'],
        	}



pos_order()
