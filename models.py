# -*- coding: utf-8 -*-

from openerp import models, fields, api, _
from openerp.osv import osv
from openerp.exceptions import except_orm, ValidationError
from StringIO import StringIO
import urllib2, httplib, urlparse, gzip, requests, json
import openerp.addons.decimal_precision as dp
import logging
import datetime
from openerp.fields import Date as newdate
from datetime import datetime,date

class account_journal(models.Model):
	_inherit = 'account.journal'

	is_credit_card = fields.Boolean('Tarjeta de crédito',default=False)
	coeficiente = fields.Float('Coeficiente',default=0)
	producto_recargo = fields.Many2one('product.product','Producto Recargo',domain=[('type','=','service')])

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
