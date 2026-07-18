"""
CRM Pipeline Configuration Models
==================================
Defines the configurable building blocks of each company's CRM workflow.

Every company defines its own:
  - Stages    (Raw → Won/Lost with drag-to-reorder)
  - Sources   (IndiaMART, Website, WhatsApp, ...)
  - Tags      (Hot, VIP, Govt, ...)
  - LostReasons (Price, Competitor, ...)
"""

import uuid
from django.db import models
from common.models import TenantBaseModel


class LeadStage(TenantBaseModel):
    """
    A single stage in the company's CRM pipeline.

    Stages are ordered by `sequence` and company-scoped so that
    different businesses can have completely different workflows.
    """
    name = models.CharField(max_length=100)
    sequence = models.PositiveSmallIntegerField(default=0)
    color = models.CharField(
        max_length=30, default='#22c55e',
        help_text='Hex colour for UI display'
    )
    is_won = models.BooleanField(default=False)
    is_lost = models.BooleanField(default=False)
    is_default = models.BooleanField(
        default=False,
        help_text='Stage automatically assigned to new leads'
    )

    class Meta:
        ordering = ['company', 'sequence']
        unique_together = ('company', 'name')
        indexes = [
            models.Index(fields=['company', 'sequence']),
        ]

    def __str__(self):
        return f"{self.company_id} — {self.name}"

    def save(self, *args, **kwargs):
        # Enforce only one is_won and one is_lost per company
        if self.is_won:
            LeadStage.objects.filter(company=self.company, is_won=True).exclude(pk=self.pk).update(is_won=False)
        if self.is_lost:
            LeadStage.objects.filter(company=self.company, is_lost=True).exclude(pk=self.pk).update(is_lost=False)
        super().save(*args, **kwargs)


class LeadSource(TenantBaseModel):
    """
    Where a lead came from.
    Configurable per company — common examples: IndiaMART, Meta Ads, Walk-In.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['company', 'name']
        unique_together = ('company', 'name')

    def __str__(self):
        return self.name


class LeadTag(TenantBaseModel):
    """
    Many-to-many tags for flexible lead categorisation.
    Examples: Hot, Warm, Cold, VIP, Government, Dealer.
    """
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=30, default='#3b82f6')

    class Meta:
        ordering = ['company', 'name']
        unique_together = ('company', 'name')

    def __str__(self):
        return self.name


class LostReason(TenantBaseModel):
    """
    Mandatory reason codes when marking a lead as Lost.
    Examples: Price, Competitor, Budget, No Response, Cancelled.
    """
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['company', 'name']
        unique_together = ('company', 'name')

    def __str__(self):
        return self.name
