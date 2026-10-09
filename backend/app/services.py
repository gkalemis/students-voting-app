from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session
from .models import AnonymousVoteScore, Criterion, ParticipationToken, Presentation, PresentationStatus, Vote, VoteScore


def aware(value):
    if value is None or value.tzinfo:
        return value
    return value.replace(tzinfo=timezone.utc)


def vote_count(db: Session, presentation_id: int, anonymous=False) -> int:
    model = AnonymousVoteScore if anonymous else Vote
    if anonymous:
        return db.scalar(select(func.count(func.distinct(model.anonymous_vote_id))).where(model.presentation_id == presentation_id)) or 0
    return db.scalar(select(func.count(model.id)).where(model.presentation_id == presentation_id)) or 0


def finalize_votes(db: Session, session_id: int) -> None:
    presentations = db.scalars(select(Presentation).where(Presentation.session_id == session_id)).all()
    for presentation in presentations:
        votes = db.scalars(select(Vote).where(Vote.presentation_id == presentation.id)).all()
        for vote in votes:
            anonymous_id = __import__("secrets").token_hex(16)
            for score in db.scalars(select(VoteScore).where(VoteScore.vote_id == vote.id)).all():
                db.add(AnonymousVoteScore(presentation_id=presentation.id, anonymous_vote_id=anonymous_id, criterion_id=score.criterion_id, score=score.score, synthetic=vote.synthetic))
    db.execute(delete(Vote).where(Vote.presentation_id.in_([p.id for p in presentations])))
    db.execute(delete(ParticipationToken).where(ParticipationToken.session_id == session_id))


def results(db: Session, session_id: int):
    criteria = db.scalars(select(Criterion).where(Criterion.session_id == session_id).order_by(Criterion.position)).all()
    presentations = db.scalars(select(Presentation).where(Presentation.session_id == session_id).order_by(Presentation.position)).all()
    output = []
    for p in presentations:
        source = AnonymousVoteScore if p.status in (PresentationStatus.EVALUATED, PresentationStatus.NO_VOTES) and db.scalar(select(func.count(AnonymousVoteScore.id)).where(AnonymousVoteScore.presentation_id == p.id)) else None
        count = vote_count(db, p.id, anonymous=bool(source))
        means = []
        for criterion in criteria:
            if source:
                mean = db.scalar(select(func.avg(AnonymousVoteScore.score)).where(AnonymousVoteScore.presentation_id == p.id, AnonymousVoteScore.criterion_id == criterion.id))
            else:
                mean = db.scalar(select(func.avg(VoteScore.score)).join(Vote).where(Vote.presentation_id == p.id, VoteScore.criterion_id == criterion.id))
            means.append({"criterion_id": criterion.id, "name": criterion.name, "weight": criterion.weight, "mean": float(mean) if mean is not None else None})
        weighted = sum(Decimal(str(x["mean"])) * Decimal(x["weight"]) / 100 for x in means if x["mean"] is not None) if count else None
        output.append({"presentation_id": p.id, "presenter_name": p.presenter_name, "title": p.title, "status": p.status.value, "vote_count": count, "criteria": means, "weighted_score": float(weighted) if weighted is not None else None, "rank": None})
    ranked = sorted([x for x in output if x["status"] == "EVALUATED" and x["weighted_score"] is not None], key=lambda x: x["weighted_score"], reverse=True)
    previous, rank = None, 0
    for index, item in enumerate(ranked, 1):
        if previous is None or item["weighted_score"] != previous:
            rank = index
        item["rank"] = rank
        previous = item["weighted_score"]
    return output


def cleanup_expired(db: Session):
    db.execute(delete(ParticipationToken).where(ParticipationToken.expires_at < datetime.now(timezone.utc)))
    db.commit()
