# -*- coding: utf-8 -*-

from openerp import tools, models, fields, api, _
from openerp.osv import osv
from openerp.exceptions import except_orm, ValidationError
from StringIO import StringIO
import urllib2, httplib, urlparse, gzip, requests, json
import openerp.addons.decimal_precision as dp
import logging
import datetime
import time
from openerp.fields import Date as newdate
from datetime import datetime,date,timedelta

class account_invoice(models.Model):
	_inherit = 'account.invoice'

	@api.one
	def _compute_session_id(self):
		return_value = None	
		if self.date_invoice and self.state in ['open','paid'] and self.type == 'out_refund':
			date_invoice = datetime.strptime(self.date_invoice, '%Y-%m-%d').date()
			date_before = datetime.strptime(self.date_invoice, '%Y-%m-%d').date() - timedelta(days=1)
			str_date_invoice = str(date_invoice) + ' 23:59:00'
			str_date_before = str(date_before) + ' 23:59:00'
			session_id = self.env['pos.session'].search([('start_at','>',str_date_before),('start_at','<',str_date_invoice)])
			if session_id:
				return_value = session_id[0].id
		self.session_id = return_value


	session_id = fields.Many2one('pos.session',string='Sesión',compute=_compute_session_id)

class pos_session_refund(models.Model):
	_name = 'pos.session.refund'
	_description = 'pos.session.refund'

	session_id = fields.Many2one('pos.session',string='Sesión')
	refund_id = fields.Many2one('account.invoice',string='Nota de Credito')
	amount_total = fields.Float('Monto Total',related='refund_id.amount_total')

class pos_order(models.Model):
	_inherit = 'pos.order'

	refund_id = fields.Many2one('pos.order','Devolución')
	origin_id = fields.Many2one('pos.order','Pedido Origen')

class pos_session(models.Model):
	_inherit = 'pos.session'

	@api.one
	def _compute_session_sales(self):
		return_value = 0
		for order in self.order_ids:
			if order.state == 'paid':
				return_value = return_value + order.amount_total
		self.session_sales = return_value

	@api.one
	def update_session_refunds(self):
		# Delete refunds
		session_refunds = self.env['pos.session.refund'].search([])
		for session_refund in session_refunds:
			if session_refund.session_id.id == self.id:
				session_refund.unlink()
		refund_ids = self.env['account.invoice'].search([('state','in',['open','paid']),('type','=','out_refund')])
		for refund_id in refund_ids:
			if refund_id.session_id.id == self.id:
				vals = {
					'session_id': refund_id.session_id.id,
					'refund_id': refund_id.id,
					'amount_total': refund_id.amount_total
					}
				return_id = self.env['pos.session.refund'].create(vals)
		return None

	@api.one
	def _compute_next_document_number(self):
		return_value = ''
		if self.config_id and self.config_id.journal_id:
			return_value = ' Fact A: ' + str(self.config_id.journal_id.last_a_sale_document_completed + 1).zfill(8) + ' - Fact B: ' \
					+ str(self.config_id.journal_id.last_b_sale_document_completed + 1).zfill(8)
		self.next_document_numbers = return_value

	refund_ids = fields.One2many(comodel_name='pos.session.refund',inverse_name='session_id',string='Notas de Crédito',readonly=True)
	session_sales = fields.Float('Ventas Diarias',compute=_compute_session_sales)
	next_document_numbers = fields.Char('Proximas Facturas',compute=_compute_next_document_number)

class product_product(models.Model):
	_inherit = 'product.product'

	@api.one
	def _compute_lst_price_with_vat(self):
		if self.taxes_id.ids:
			for tax_id in self.taxes_id.ids:
				tax = self.env['account.tax'].browse(tax_id)
				self.lst_price_with_vat = (1+tax.amount) * self.lst_price

	@api.one
	def _compute_tax_rate(self):
		if self.taxes_id.ids:
			for tax_id in self.taxes_id.ids:
				tax = self.env['account.tax'].browse(tax_id)
				self.tax_rate = tax.amount

	tax_rate = fields.Float('Tasa IVA',compute=_compute_tax_rate)
	lst_price_with_vat = fields.Float('Precio c/IVA',compute=_compute_lst_price_with_vat)

class account_journal(models.Model):
	_inherit = 'account.journal'

	@api.model
	def connect_fiscal_printer(self):
		# import pdb;pdb.set_trace()
		journals = self.env['account.journal'].search([])
		for journal in journals:
			if journal.use_fiscal_printer and journal.nro_serie != '':
				fps = self.env['fpoc.fiscal_printer'].search([])
				#import pdb;pdb.set_trace()
				for fp in fps:
					if fp.serialNumber == journal.nro_serie:
						vals = {
							'fiscal_printer_id': fp.id
							}
						journal.write(vals)

	@api.one
	def _compute_fiscal_printer(self):
		import pdb;pdb.set_trace()
		journal = self
		if journal.use_fiscal_printer and journal.nro_serie != '':
			fps = self.env['fpoc.fiscal_printer'].search([])
			for fp in fps:
				if fp.serialNumber == journal.nro_serie:
					self.fiscal_printer_id = fp.id

	is_credit_card = fields.Boolean('Tarjeta de crédito',default=False)
	coeficiente = fields.Float('Coeficiente',default=0)
	producto_recargo = fields.Many2one('product.product','Producto Recargo',domain=[('type','=','service')])
	nro_serie = fields.Char('Nro de Serie Impresora Fiscal')
	# fiscal_printer_id = fields.Many2one('fpoc.fiscal_printer','Fiscal Printer',compute=_compute_fiscal_printer)

class account_bank_statement_line(models.Model):
	_inherit = 'account.bank.statement.line'

	@api.one
	def _compute_is_credit_card(self):
		if self.journal_id:
			self.is_credit_card = self.journal_id.is_credit_card

	is_credit_card = fields.Boolean('Es tarjeta de crédito',computed=_compute_is_credit_card)
	nro_cupon = fields.Char('Nro cupon')
	nro_tarjeta = fields.Char('Nro tarjeta')

class res_partner(models.Model):
	_inherit = 'res.partner'

	@api.constrains('is_consumidor_final')
	def check_consumidor_final(self):
		cfs = self.search([('is_consumidor_final','=',True)])
		if len(cfs) > 1:
			raise ValidationError('Ya existe un consumidor final')
		return True

	is_consumidor_final = fields.Boolean('Consumidor Final',default=False)
	responsability_id = fields.Many2one(
        	'afip.responsability',
	        'Responsability',
		required=True
	    )
	document_type_id = fields.Many2one(
        	'afip.document_type',
	        'Document type',
		required=True
	    )
	document_number = fields.Char(
        	'Document number',
	        size=64,
		required=True
	    )


