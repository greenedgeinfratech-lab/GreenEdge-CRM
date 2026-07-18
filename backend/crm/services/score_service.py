"""
Lead Score Service
==================
Computes a 0–100 score for each lead based on multiple signals.

Score components:
  Source quality     — 15 pts max
  Stage progression  — 20 pts max
  Estimated value    — 20 pts max
  Followup frequency — 20 pts max
  Engagement (visits/meetings) — 15 pts max
  Response quality   — 10 pts max

The score is stored on the Lead.lead_score field and recalculated
whenever a significant event occurs (stage change, followup, etc.).
"""


class ScoreService:

    # Source quality weights (match by name, case-insensitive)
    SOURCE_WEIGHTS = {
        'referral': 15,
        'walk-in': 14,
        'indiamart': 12,
        'tradeindia': 11,
        'website': 10,
        'google ads': 10,
        'meta ads': 9,
        'exhibition': 8,
        'cold call': 6,
        'email campaign': 5,
        'whatsapp': 7,
    }

    # Stage progression weights (won stage = max)
    STAGE_WEIGHTS = {
        'raw': 2,
        'new': 4,
        'discussion': 8,
        'visit': 12,
        'proposal': 15,
        'negotiation': 18,
        'won': 20,
        'lost': 0,
    }

    @classmethod
    def calculate(cls, lead) -> int:
        """
        Compute 0–100 score for a lead.
        """
        details = cls.get_detailed_score(lead)
        return details['score']

    @classmethod
    def get_detailed_score(cls, lead) -> dict:
        score = 0
        positive_signals = []
        negative_signals = []
        suggestions = []

        # 1. Source quality (0–15)
        if lead.source_id:
            source_name = (getattr(lead.source, 'name', '') or '').lower()
            pts = cls.SOURCE_WEIGHTS.get(source_name, 5)
            score += pts
            if pts >= 10:
                positive_signals.append(f"Strong lead source: {source_name.title()}")
        else:
            score += 3
            negative_signals.append("No lead source specified")

        # 2. Stage progression (0–20)
        if lead.stage_id:
            stage_name = (getattr(lead.stage, 'name', '') or '').lower()
            pts = cls.STAGE_WEIGHTS.get(stage_name, 5)
            score += pts
            if pts >= 12:
                positive_signals.append(f"Advanced pipeline stage: {stage_name.title()}")
            elif pts <= 4 and stage_name != 'lost':
                negative_signals.append("Stuck in early stages")

        # 3. Estimated value (0–20)
        value = float(lead.estimated_value or 0)
        if value >= 1_000_000:
            score += 20
            positive_signals.append("High estimated value (≥ ₹10L)")
        elif value >= 500_000:
            score += 15
            positive_signals.append("Good estimated value (≥ ₹5L)")
        elif value >= 100_000:
            score += 10
        elif value >= 10_000:
            score += 5
        elif value > 0:
            score += 2
        else:
            negative_signals.append("No estimated value entered")

        # 4. Followup frequency (0–20)
        try:
            followup_count = lead.followups.filter(is_active=True).count()
            if followup_count >= 6:     
                score += 20
                positive_signals.append("Highly engaged (6+ interactions)")
            elif followup_count >= 4:   
                score += 16
                positive_signals.append("Good engagement")
            elif followup_count >= 2:   
                score += 10
            elif followup_count >= 1:   
                score += 5
            else:
                negative_signals.append("No follow-ups logged yet")
        except Exception:
            followup_count = 0

        # 5. Engagement — visits/meetings (0–15)
        try:
            visits = lead.followups.filter(
                is_active=True,
                followup_type__in=['site_visit', 'office_meeting', 'online_meeting']
            ).count()
            if visits >= 3:     
                score += 15
                positive_signals.append("Multiple meetings conducted")
            elif visits >= 2:   
                score += 10
            elif visits >= 1:   
                score += 6
                positive_signals.append("Meeting conducted")
            else:
                suggestions.append("Schedule a meeting or site visit")
        except Exception:
            visits = 0

        # 6. Appointments held (0–10)
        try:
            appts = lead.appointments.filter(status='completed').count()
            if appts >= 2:      
                score += 10
            elif appts >= 1:    
                score += 6
            elif lead.appointments.filter(status='scheduled').exists():
                positive_signals.append("Upcoming appointment scheduled")
        except Exception:
            appts = 0

        score = min(score, 100)

        # Category
        if score >= 75: category = "Hot"
        elif score >= 40: category = "Warm"
        else: category = "Weak"

        # AI Suggestions (rule-based for now)
        if followup_count == 0:
            suggestions.append("Log your first follow-up call")
        if not lead.estimated_value:
            suggestions.append("Update estimated value")
        if score >= 70 and not lead.products.exists():
            suggestions.append("Create a quotation for interested products")
        if category == "Hot":
            suggestions.append("Push for closure this month")

        return {
            'score': score,
            'category': category,
            'reasons': {
                'positive': positive_signals,
                'negative': negative_signals,
            },
            'suggestions': suggestions
        }
