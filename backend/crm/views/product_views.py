from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from crm.models.product import ProductCatalog
from crm.serializers.product_serializers import ProductCatalogSerializer
from common.pagination import StandardResultsSetPagination

INITIAL_PRODUCTS = [
    {
        "name": "1 WAAREE 540WP MONO HF-CUT SOLAR MODULE",
        "code": "WAA-540W",
        "item_type": "Stock",
        "hsn_sac": "8541",
        "description": "1 WAAREE 540WP MONO HF-CUT SOLAR MODULE",
        "unit": "Nos",
        "rate": 14500.00,
        "cgst_percent": 6.0,
        "sgst_percent": 6.0,
        "igst_percent": 12.0,
        "stock_qty": 50,
    },
    {
        "name": "12 F HOT DIP STUD",
        "code": "STUD-12F",
        "item_type": "Stock",
        "hsn_sac": "7318",
        "description": "12 F HOT DIP STUD",
        "unit": "Nos",
        "rate": 450.00,
        "cgst_percent": 9.0,
        "sgst_percent": 9.0,
        "igst_percent": 18.0,
        "stock_qty": 200,
    },
    {
        "name": "12 HOT DIP PARLIN",
        "code": "PARLIN-12",
        "item_type": "Stock",
        "hsn_sac": "7308",
        "description": "12 HOT DIP PARLIN",
        "unit": "Nos",
        "rate": 1200.00,
        "cgst_percent": 9.0,
        "sgst_percent": 9.0,
        "igst_percent": 18.0,
        "stock_qty": 100,
    },
    {
        "name": "16MM ALUMINIUM CABLE 100METER EARTH GUARD",
        "code": "CBL-16MM-EG",
        "item_type": "Stock",
        "hsn_sac": "8544",
        "description": "16MM ALUMINIUM CABLE 100METER EARTH GUARD",
        "unit": "Mtr",
        "rate": 3800.00,
        "cgst_percent": 9.0,
        "sgst_percent": 9.0,
        "igst_percent": 18.0,
        "stock_qty": 500,
    },
    {
        "name": "16mm aluminium cable 100meter",
        "code": "CBL-16MM-100M",
        "item_type": "Stock",
        "hsn_sac": "8544",
        "description": "16mm aluminium cable 100meter",
        "unit": "Mtr",
        "rate": 3200.00,
        "cgst_percent": 9.0,
        "sgst_percent": 9.0,
        "igst_percent": 18.0,
        "stock_qty": 350,
    },
    {
        "name": "2 KW Ongrid Solar System",
        "code": "SYS-2KW-ON",
        "item_type": "Stock",
        "hsn_sac": "8541",
        "description": "2 KW Ongrid Solar System",
        "unit": "Set",
        "rate": 95000.00,
        "cgst_percent": 6.0,
        "sgst_percent": 6.0,
        "igst_percent": 12.0,
        "stock_qty": 10,
    },
    {
        "name": "300 4.8MM CABLE TIE NAVKAR",
        "code": "TIE-300-4.8",
        "item_type": "Stock",
        "hsn_sac": "3926",
        "description": "300 4.8MM CABLE TIE NAVKAR",
        "unit": "Pkt",
        "rate": 280.00,
        "cgst_percent": 9.0,
        "sgst_percent": 9.0,
        "igst_percent": 18.0,
        "stock_qty": 150,
    },
    {
        "name": "3KW GRID CONNECTED 560-580 WP X6 NO 1P TATA POWER SOLAR SYSTEM SPGS SOLAR MODULE DCR BIFACIAL PANEL",
        "code": "SYS-3KW-TATA-SPGS",
        "item_type": "Stock",
        "hsn_sac": "8541",
        "description": "3KW GRID CONNECTED 560-580 WP X6 NO 1P TATA POWER SOLAR SYSTEM",
        "unit": "Set",
        "rate": 145000.00,
        "cgst_percent": 6.0,
        "sgst_percent": 6.0,
        "igst_percent": 12.0,
        "stock_qty": 15,
    },
    {
        "name": "3KW GRID CONNECTED 575WP X6 NOS. 1P",
        "code": "SYS-3KW-575W",
        "item_type": "Stock",
        "hsn_sac": "8541",
        "description": "3KW GRID CONNECTED 575WP X6 NOS. 1P",
        "unit": "Set",
        "rate": 152000.00,
        "cgst_percent": 6.0,
        "sgst_percent": 6.0,
        "igst_percent": 12.0,
        "stock_qty": 12,
    },
    {
        "name": "3KWp TATA SOLAR ONGRID SYSTEM KIT",
        "code": "KIT-3KWP-TATA",
        "item_type": "Stock",
        "hsn_sac": "8541",
        "description": "3KWp TATA SOLAR ONGRID SYSTEM KIT",
        "unit": "Set",
        "rate": 148000.00,
        "cgst_percent": 6.0,
        "sgst_percent": 6.0,
        "igst_percent": 12.0,
        "stock_qty": 8,
    },
    {
        "name": "Solar System Installation & Commissioning Charges",
        "code": "SRV-INST-01",
        "item_type": "Service",
        "hsn_sac": "9954",
        "description": "On-site installation and testing charges",
        "unit": "Job",
        "rate": 15000.00,
        "cgst_percent": 9.0,
        "sgst_percent": 9.0,
        "igst_percent": 18.0,
        "stock_qty": 0,
    },
]

class ProductCatalogViewSet(viewsets.ModelViewSet):
    """
    CRUD API for ProductCatalog items.
    Auto-seeds default products if list is requested and company has 0 items.
    """
    serializer_class = ProductCatalogSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = ProductCatalog.objects.filter(company=self.request.user.company)
        
        # Auto seed if company has no products yet
        if not qs.exists():
            for item in INITIAL_PRODUCTS:
                ProductCatalog.objects.create(
                    company=self.request.user.company,
                    created_by=self.request.user,
                    updated_by=self.request.user,
                    **item
                )
            qs = ProductCatalog.objects.filter(company=self.request.user.company)

        query = self.request.query_params.get('search', None)
        item_type = self.request.query_params.get('item_type', None)

        if query:
            qs = qs.filter(name__icontains=query) | qs.filter(code__icontains=query) | qs.filter(hsn_sac__icontains=query)
        if item_type:
            qs = qs.filter(item_type=item_type)

        return qs.order_by('name')

    def perform_create(self, serializer):
        serializer.save(
            company=self.request.user.company,
            created_by=self.request.user,
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
