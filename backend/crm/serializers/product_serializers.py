from rest_framework import serializers
from crm.models.product import ProductCatalog

class ProductCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCatalog
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'company', 'created_by', 'updated_by']
