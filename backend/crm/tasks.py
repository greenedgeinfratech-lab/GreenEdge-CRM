from celery import shared_task
import logging
from crm.models import Quotation
from crm.services.delivery_service import DeliveryService

logger = logging.getLogger(__name__)

@shared_task
def send_quotation_email_task(quotation_id: str) -> bool:
    """
    Celery task to asynchronously format and send a quotation email.
    """
    logger.info(f"Starting email delivery task for quotation {quotation_id}")
    try:
        quotation = Quotation.objects.get(pk=quotation_id)
        success = DeliveryService.send_quotation_email(quotation)
        logger.info(f"Email delivery task for quotation {quotation_id} finished with success={success}")
        return success
    except Quotation.DoesNotExist:
        logger.error(f"Quotation {quotation_id} not found for email task")
        return False
    except Exception as e:
        logger.error(f"Error in send_quotation_email_task for quotation {quotation_id}: {e}")
        return False

@shared_task
def send_quotation_whatsapp_task(quotation_id: str) -> bool:
    """
    Celery task to asynchronously format and send a quotation WhatsApp message.
    """
    logger.info(f"Starting WhatsApp delivery task for quotation {quotation_id}")
    try:
        quotation = Quotation.objects.get(pk=quotation_id)
        success = DeliveryService.send_quotation_whatsapp(quotation)
        logger.info(f"WhatsApp delivery task for quotation {quotation_id} finished with success={success}")
        return success
    except Quotation.DoesNotExist:
        logger.error(f"Quotation {quotation_id} not found for WhatsApp task")
        return False
    except Exception as e:
        logger.error(f"Error in send_quotation_whatsapp_task for quotation {quotation_id}: {e}")
        return False
