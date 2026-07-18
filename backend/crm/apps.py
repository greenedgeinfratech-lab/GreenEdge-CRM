from django.apps import AppConfig


class CRMConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'crm'
    verbose_name = 'CRM'

    def ready(self):
        import crm.signals  # noqa: F401 — register signal handlers
