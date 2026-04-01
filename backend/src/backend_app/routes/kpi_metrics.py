"""Aggregate KPI metrics for the admin report from Mongo participant documents."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

HOUSED_MILESTONE_VALUES = frozenset({"transitional", "permanent"})

HOUSED_STATUS_VALUES = frozenset(
    {
        "privateMarket",
        "subsidizedHousing",
        "singleRoomOccupancy",
        "supportiveHousing",
        "transitionalHousing",
    }
)

EMPLOYMENT_PLACEMENT_VALUES = frozenset({"hired", "stable"})

AGE_BUCKETS = (
    ("0–17", 0, 17),
    ("18–24", 18, 24),
    ("25–34", 25, 34),
    ("35–44", 35, 44),
    ("45+", 45, 200),
)

_HS_NEGATIVE = frozenset({"no", "n/a", "na", "none", "not yet", "not completed", "no.", "n"})


def _parse_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str) and len(value) >= 10:
        try:
            return datetime.strptime(value[:10], "%Y-%m-%d").date()
        except ValueError:
            return None
    return None


def _age_years(dob: date, ref: date | None = None) -> int | None:
    ref = ref or date.today()
    years = ref.year - dob.year - ((ref.month, ref.day) < (dob.month, dob.day))
    return years if years >= 0 else None


def _indicates_hs_completed(text: str | None) -> bool:
    if not text or not isinstance(text, str):
        return False
    t = text.strip().lower()
    if len(t) < 2:
        return False
    if t in _HS_NEGATIVE:
        return False
    return True


def _has_education_plan(doc: dict[str, Any]) -> bool:
    intake = doc.get("intake") or {}
    ds = intake.get("departmentSpecific") or {}
    if ds.get("eduEnrolledInSchool") == "yes":
        return True
    dr = intake.get("departmentReferral") or {}
    edu = dr.get("education") or []
    if isinstance(edu, list) and len(edu) > 0:
        return True
    programs = doc.get("programs") or []
    return "Education" in programs


def _housing_timeline_days(doc: dict[str, Any]) -> tuple[date | None, date | None, str | None]:
    """Start date, last update date, and milestone value for Housing / general."""
    hm = (doc.get("programMilestones") or {}).get("Housing", {}).get("general")
    if not isinstance(hm, dict):
        return None, None, None
    start = _parse_date(hm.get("startDate"))
    last = _parse_date(hm.get("lastUpdateDate"))
    val = hm.get("value")
    return start, last, val if isinstance(val, str) else None


def _has_program_progress(doc: dict[str, Any], program_docs: dict[str, Any]) -> bool:
    """True if any milestone differs from the first value in any milestone tree."""
    pm_all = doc.get("programMilestones") or {}
    for pname in doc.get("programs") or []:
        pdef = program_docs.get(pname)
        if not pdef:
            continue
        trees = pdef.get("milestoneTree") or {}
        pm_prog = pm_all.get(pname) or {}
        for tree_name, milestone_list in trees.items():
            if not isinstance(milestone_list, list) or not milestone_list:
                continue
            first = milestone_list[0]
            node = pm_prog.get(tree_name)
            if not isinstance(node, dict):
                continue
            val = node.get("value")
            if val is not None and val != first:
                return True
    return False


def compute_kpis(db: Any) -> dict[str, Any]:
    """Build KPI payload for GET /stats (admin)."""
    program_docs_list = list(db.programs.find({}))
    program_docs = {p["name"]: p for p in program_docs_list}

    total_participants = db.people.count_documents({})

    housed_count = db.people.count_documents(
        {
            "$or": [
                {"programMilestones.Housing.general.value": {"$in": list(HOUSED_MILESTONE_VALUES)}},
                {"housing.status": {"$in": list(HOUSED_STATUS_VALUES)}},
            ]
        }
    )

    employment_placements = db.people.count_documents(
        {"programMilestones.Employment.general.value": {"$in": list(EMPLOYMENT_PLACEMENT_VALUES)}}
    )

    cursor = db.people.find(
        {},
        {
            "dob": 1,
            "programs": 1,
            "programMilestones": 1,
            "housing": 1,
            "intake": 1,
        },
    )

    age_bucket_counts = {label: 0 for label, _, _ in AGE_BUCKETS}
    ages: list[int] = []

    hs_reporting = 0
    hs_graduate = 0

    edu_plan_eligible = 0
    edu_plan_yes = 0

    housing_timeline_eligible = 0
    housed_within_90 = 0
    housed_within_365 = 0

    youth_progress_eligible = 0
    youth_with_progress = 0

    for doc in cursor:
        dob_s = doc.get("dob")
        d = _parse_date(dob_s)
        if d is not None:
            age = _age_years(d)
            if age is not None:
                ages.append(age)
                for label, lo, hi in AGE_BUCKETS:
                    if lo <= age <= hi:
                        age_bucket_counts[label] += 1
                        break

        ds = (doc.get("intake") or {}).get("departmentSpecific") or {}
        hs_field = ds.get("eduHighSchoolCompletedWhere")
        if hs_field is not None and str(hs_field).strip() != "":
            hs_reporting += 1
            if _indicates_hs_completed(str(hs_field)):
                hs_graduate += 1

        if doc.get("intake") is not None or (doc.get("programs") or []):
            edu_plan_eligible += 1
            if _has_education_plan(doc):
                edu_plan_yes += 1

        if "Housing" in (doc.get("programs") or []):
            start, last, val = _housing_timeline_days(doc)
            if start is not None and last is not None:
                housing_timeline_eligible += 1
                if val in HOUSED_MILESTONE_VALUES:
                    days = (last - start).days
                    if days <= 90:
                        housed_within_90 += 1
                    if days <= 365:
                        housed_within_365 += 1

        d2 = _parse_date(dob_s)
        if d2 is not None:
            age = _age_years(d2)
            if age is not None and age < 25 and (doc.get("programs") or []):
                youth_progress_eligible += 1
                if _has_program_progress(doc, program_docs):
                    youth_with_progress += 1

    def pct(num: int, den: int) -> float | None:
        if den <= 0:
            return None
        return round(100.0 * num / den, 1)

    avg_age = round(sum(ages) / len(ages), 1) if ages else None

    age_distribution = [
        {"label": label, "count": age_bucket_counts[label]} for label, _, _ in AGE_BUCKETS
    ]

    return {
        "totalParticipants": total_participants,
        "participantsHoused": housed_count,
        "housedWithin3MonthsPercent": pct(housed_within_90, housing_timeline_eligible),
        "housedWithin3MonthsDenominator": housing_timeline_eligible,
        "housedWithin3MonthsNumerator": housed_within_90,
        "housedWithin12MonthsPercent": pct(housed_within_365, housing_timeline_eligible),
        "housedWithin12MonthsDenominator": housing_timeline_eligible,
        "housedWithin12MonthsNumerator": housed_within_365,
        "mealsOrGroceriesProvided": None,
        "mealsOrGroceriesAvailable": False,
        "highSchoolGraduatePercent": pct(hs_graduate, hs_reporting),
        "highSchoolGraduateReportingCount": hs_reporting,
        "educationPlanPercent": pct(edu_plan_yes, edu_plan_eligible),
        "educationPlanEligibleCount": edu_plan_eligible,
        "employmentPlacements": employment_placements,
        "averageAgeYears": avg_age,
        "ageDistribution": age_distribution,
        "participantsWithAgeCount": len(ages),
        "youthProgressPercent": pct(youth_with_progress, youth_progress_eligible),
        "youthProgressEligibleCount": youth_progress_eligible,
        "youthProgressNumerator": youth_with_progress,
        "giveBackPercent": None,
        "belongPercent": None,
        "recommendPercent": None,
        "outcomesSurveyAvailable": False,
    }
