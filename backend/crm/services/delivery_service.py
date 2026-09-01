import urllib.request
import urllib.parse
import base64
import json
import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from crm.models import Quotation, LeadTimeline
from crm.services.timeline_service import TimelineService

logger = logging.getLogger(__name__)

class DeliveryService:

    @staticmethod
    def send_quotation_email(quotation: Quotation) -> bool:
        """
        Formats and sends a Quotation/PI as an HTML email to the linked Lead.
        """
        lead = quotation.lead
        recipient_email = lead.email if lead else None
        
        # Fallback if no linked lead or lead email
        if not recipient_email:
            logger.warning(f"No email recipient found for quotation {quotation.id}")
            return False

        subject = f"{quotation.type} #{quotation.quote_number or 'Draft'} - {quotation.customer_name}"
        
        # Build plain text body
        text_body = (
            f"Dear {quotation.customer_name},\n\n"
            f"Please find below the details of your {quotation.type.lower()}:\n\n"
            f"Document Number: {quotation.quote_number or 'Draft'}\n"
            f"Date: {quotation.quote_date or '-'}\n"
            f"Valid Until: {quotation.valid_till or '-'}\n"
            f"Grand Total: INR {quotation.grand_total}\n\n"
            f"Thank you for your business.\n\n"
            f"Regards,\n"
            f"GreenEdge ERP & CRM Team"
        )

        # Build items HTML table
        items_html = ""
        for item in quotation.items.all():
            igst_pct = getattr(item, 'igst_percent', 0)
            if igst_pct > 0:
                tax_desc = f"{igst_pct:.2f}% IGST"
            else:
                tax_desc = f"{item.cgst_percent + item.sgst_percent:.2f}% (CGST+SGST)"
            
            items_html += f"""
            <tr>
              <td>{item.item_description}</td>
              <td>{item.qty} {item.unit}</td>
              <td>{item.rate:.2f}</td>
              <td>{item.taxable:.2f}</td>
              <td>{tax_desc}</td>
              <td>{item.amt:.2f}</td>
            </tr>
            """

        notes_section = ""
        if quotation.notes:
            notes_section = f"""
            <div style="margin-top: 20px;">
              <strong>Notes:</strong><br/>
              <p style="white-space: pre-wrap; font-size: 12px; color: #555;">{quotation.notes}</p>
            </div>
            """

        terms_section = ""
        if quotation.terms_conditions:
            terms_html = "".join([f"<li>{t.get('text', t)}</li>" for t in quotation.terms_conditions])
            terms_section = f"""
            <div style="margin-top: 20px;">
              <strong>Terms & Conditions:</strong>
              <ol style="font-size: 12px; color: #555;">{terms_html}</ol>
            </div>
            """

            total_igst_val = getattr(quotation, 'total_igst', 0)
            if total_igst_val > 0:
                tax_rows_html = f"Total IGST: INR {total_igst_val:.2f}<br/>"
            else:
                tax_rows_html = f"Total CGST: INR {quotation.total_cgst:.2f}<br/>Total SGST: INR {quotation.total_sgst:.2f}<br/>"

            html_body = f"""
        <html>
        <head>
          <style>
            body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.5; }}
            .container {{ padding: 20px; border: 1px solid #eee; border-radius: 5px; max-width: 600px; margin: 0 auto; }}
            .header {{ font-size: 20px; font-weight: bold; color: #c85a17; margin-bottom: 20px; border-bottom: 2px solid #c85a17; padding-bottom: 8px; }}
            .details {{ margin-bottom: 20px; font-size: 13px; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f8f9fa; font-weight: bold; }}
            .totals {{ margin-top: 20px; text-align: right; font-size: 13px; line-height: 1.6; }}
            .footer {{ font-size: 11px; color: #777; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">{quotation.type} #{quotation.quote_number or 'Draft'}</div>
            <p>Dear {quotation.customer_name},</p>
            <p>Please find below the details of the {quotation.type.lower()} generated for you.</p>
            
            <div class="details">
              <strong>Date:</strong> {quotation.quote_date or '-'}<br/>
              <strong>Valid Till:</strong> {quotation.valid_till or '-'}<br/>
              <strong>Reference:</strong> {quotation.reference or '-'}<br/>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th>Qty</th>
                  <th>Rate (INR)</th>
                  <th>Taxable (INR)</th>
                  <th>GST %</th>
                  <th>Total (INR)</th>
                </tr>
              </thead>
              <tbody>
                {items_html}
              </tbody>
            </table>

            <div class="totals">
              Total Taxable Value: INR {quotation.total_taxable:.2f}<br/>
              {tax_rows_html}
              <strong>Grand Total: <span style="font-size: 16px; color: #2e7d32;">&#8377;{quotation.grand_total:.2f}</span></strong>
            </div>

            {notes_section}
            {terms_section}

            <div class="footer">
              This is an automated communication sent from GreenEdge CRM.
            </div>
          </div>
        </body>
        </html>
        """

        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@greenedge.local')
        msg = EmailMultiAlternatives(subject, text_body, from_email, [recipient_email])
        msg.attach_alternative(html_body, "text/html")
        
        try:
            msg.send()
            
            # Log to Lead Timeline if lead is linked
            if lead:
                TimelineService._create(
                    lead=lead,
                    user=quotation.updated_by or quotation.created_by,
                    event_type=LeadTimeline.EventType.EMAIL_SENT,
                    title=f"Quotation Email Sent: #{quotation.quote_number or 'Draft'}",
                    body=f"Sent {quotation.type.lower()} to {recipient_email} for amount INR {quotation.grand_total:.2f}."
                )
            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False

    @staticmethod
    def send_quotation_whatsapp(quotation: Quotation) -> bool:
        """
        Formats and sends a WhatsApp summary of the Quotation/PI to the linked Lead.
        """
        lead = quotation.lead
        recipient_mobile = lead.mobile if lead else None
        
        if not recipient_mobile:
            logger.warning(f"No mobile recipient found for quotation {quotation.id}")
            return False

        # Format recipient mobile number to include +country code (e.g. +91)
        to_number = recipient_mobile.strip()
        if not to_number.startswith('+'):
            if len(to_number) == 10:
                to_number = f"+91{to_number}"
            else:
                to_number = f"+{to_number}"

        body_text = (
            f"Dear {quotation.customer_name},\n\n"
            f"Your {quotation.type.lower()} #{quotation.quote_number or 'Draft'} has been generated.\n\n"
            f"Summary details:\n"
            f"• Date: {quotation.quote_date or '-'}\n"
            f"• Valid Till: {quotation.valid_till or '-'}\n"
            f"• Grand Total: INR {quotation.grand_total:.2f}\n\n"
            f"Thank you for choosing GreenEdge.\n"
            f"Please check your email for the detailed copy."
        )

        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
        from_number = getattr(settings, 'TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')

        success = False
        message_sid = ""

        # Simulated log if Twilio credentials are missing or default
        if not account_sid or not auth_token or account_sid == 'your_twilio_sid':
            logger.info(f"[SIMULATED WHATSAPP] To: {to_number} | Body:\n{body_text}")
            success = True
            message_sid = "SIM_SID_12345"
        else:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
            
            data = urllib.parse.urlencode({
                'To': f"whatsapp:{to_number}",
                'From': from_number,
                'Body': body_text
            }).encode('utf-8')
            
            req = urllib.request.Request(url, data=data, method='POST')
            
            # Auth header construction
            auth_str = f"{account_sid}:{auth_token}"
            auth_b64 = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
            req.add_header("Authorization", f"Basic {auth_b64}")
            req.add_header("Content-Type", "application/x-www-form-urlencoded")
            
            try:
                with urllib.request.urlopen(req) as response:
                    res_body = json.loads(response.read().decode('utf-8'))
                    message_sid = res_body.get('sid', '')
                    success = True
            except Exception as e:
                logger.error(f"Failed to send WhatsApp message via Twilio: {e}")
                success = False

        if success:
            # Log to Lead Timeline if lead is linked
            if lead:
                TimelineService._create(
                    lead=lead,
                    user=quotation.updated_by or quotation.created_by,
                    event_type=LeadTimeline.EventType.WHATSAPP_SENT,
                    title=f"Quotation WhatsApp Sent: #{quotation.quote_number or 'Draft'}",
                    body=f"Sent WhatsApp summary to {to_number} (SID: {message_sid})."
                )
            return True
        return False
