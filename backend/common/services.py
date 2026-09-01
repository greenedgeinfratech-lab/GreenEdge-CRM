import os
import uuid
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings

class FileUploadService:
    @staticmethod
    def generate_unique_filename(filename):
        ext = filename.split('.')[-1]
        unique_name = f"{uuid.uuid4().hex}.{ext}"
        return unique_name

    @staticmethod
    def upload_file(file_obj, directory="uploads"):
        """
        Uploads a file to the specified directory and returns the file URL.
        """
        filename = FileUploadService.generate_unique_filename(file_obj.name)
        path = os.path.join(directory, filename)
        saved_path = default_storage.save(path, ContentFile(file_obj.read()))
        return default_storage.url(saved_path)

    @staticmethod
    def delete_file(file_url):
        """
        Deletes a file given its URL (relative or absolute, depending on storage).
        """
        if file_url:
            # Simple assumption: file_url contains the path under MEDIA_ROOT
            # Needs to be adjusted based on actual storage backend (e.g., S3)
            media_prefix = settings.MEDIA_URL
            if file_url.startswith(media_prefix):
                file_path = file_url[len(media_prefix):]
                if default_storage.exists(file_path):
                    default_storage.delete(file_path)
                    return True
        return False


class NumberingService:
    @staticmethod
    def generate_number(company, entity_name, prefix=None):
        """
        Safely generates the next sequence number for a given company and entity.
        Uses a database transaction to prevent race conditions.
        """
        from django.db import transaction
        from .models import DocumentSequence

        with transaction.atomic():
            # Use select_for_update to lock the row until the transaction completes
            sequence, created = DocumentSequence.objects.select_for_update().get_or_create(
                company=company,
                entity_name=entity_name,
                defaults={
                    'prefix': f"{prefix or entity_name[:3].upper()}-",
                    'padding_length': 4,
                    'current_value': 0
                }
            )

            sequence.current_value += 1
            sequence.save()

            # Format the number
            prefix = sequence.prefix or ""
            suffix = sequence.suffix or ""
            number = str(sequence.current_value).zfill(sequence.padding_length)

            return f"{prefix}{number}{suffix}"

    @staticmethod
    def generate_next_number(company, entity_name):
        """Backward-compatible helper for entities using the default prefix."""
        return NumberingService.generate_number(company, entity_name)
