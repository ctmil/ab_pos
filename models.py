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
from datetime import datetime,date

class product_product(models.Model):
	_inherit = 'product.product'

	@api.one
	def _compute_tax_rate(self):
		if self.taxes_id.ids:
			for tax_id in self.taxes_id.ids:
				tax = self.env['account.tax'].browse(tax_id)
				self.tax_rate = tax.amount

	tax_rate = fields.Float('Tasa IVA',compute=_compute_tax_rate)

class account_journal(models.Model):
	_inherit = 'account.journal'

	@api.model
	def connect_fiscal_printer(self):
		journals = self.env['account.journal'].search([])
		for journal in journals:
			if journal.use_fiscal_printer and journal.nro_serie != '':
				fps = self.env['fpoc.fiscal_printer'].search([])
				for fp in fps:
					if fp.serialNumber == journal.nro_serie:
						vals = {
							'fiscal_printer_id': fp.id
							}
						journal.write(vals)

	is_credit_card = fields.Boolean('Tarjeta de crédito',default=False)
	coeficiente = fields.Float('Coeficiente',default=0)
	producto_recargo = fields.Many2one('product.product','Producto Recargo',domain=[('type','=','service')])
	nro_serie = fields.Char('Nro de Serie Impresora Fiscal')

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


