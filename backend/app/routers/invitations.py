import uuid
import datetime
from typing import List, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import settings
from app.database import get_db
from app.models.models import (
    User,
    Group,
    GroupMember,
    GroupInvitation,
    Notification
)
from app.schemas.schemas import (
    ContactInviteInput,
    GroupInviteBatchRequest,
    GroupInvitationOut
)
from app.dependencies.auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/invitations", tags=["Invitations & Contacts System"])


def get_frontend_base_url(request: Request) -> str:
    """Dynamically resolves the frontend base URL from the caller's origin, referer, or app configuration."""
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    host = request.headers.get("host")
    
    if origin and not "192.168." in origin:
        return origin.rstrip("/")
    if referer and not "192.168." in referer:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")
    if host and not host.startswith("192.168."):
        proto = request.headers.get("x-forwarded-proto", "https" if "onrender.com" in host else "http")
        return f"{proto}://{host}".rstrip("/")
    if settings.FRONTEND_URL and not "192.168." in settings.FRONTEND_URL:
        return settings.FRONTEND_URL.rstrip("/")
    return "http://localhost:5173"


@router.post("/group/{group_id}/invite", response_model=List[GroupInvitationOut])
def invite_members(
    group_id: int,
    batch_in: GroupInviteBatchRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify current user is a member of the group
    my_membership = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "active"
    ).first()
    if not my_membership:
        raise HTTPException(status_code=403, detail="You must be an active member to invite people to this group")

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    base_url = get_frontend_base_url(request)
    created_invites: List[GroupInvitationOut] = []

    for c in batch_in.contacts:
        email = c.email.strip().lower() if c.email else None
        phone = c.phone.strip() if c.phone else None
        name = c.name.strip() if c.name else None

        if not email and not phone:
            continue

        # Check if already a member of this group
        reg_user = None
        if email:
            reg_user = db.query(User).filter(User.email == email).first()
        if not reg_user and phone:
            reg_user = db.query(User).filter(User.phone == phone).first()

        if reg_user:
            existing_member = db.query(GroupMember).filter(
                GroupMember.group_id == group_id,
                GroupMember.user_id == reg_user.id,
                GroupMember.status == "active"
            ).first()
            if existing_member:
                # Already an active member
                continue

        # Check if pending invitation exists
        existing_inv = None
        if email:
            existing_inv = db.query(GroupInvitation).filter(
                GroupInvitation.group_id == group_id,
                GroupInvitation.invitee_email == email,
                GroupInvitation.status == "pending"
            ).first()
        if not existing_inv and phone:
            existing_inv = db.query(GroupInvitation).filter(
                GroupInvitation.group_id == group_id,
                GroupInvitation.invitee_phone == phone,
                GroupInvitation.status == "pending"
            ).first()

        if existing_inv:
            inv = existing_inv
        else:
            token = str(uuid.uuid4())
            inv = GroupInvitation(
                group_id=group_id,
                invited_by=current_user.id,
                invitee_name=name or (reg_user.full_name if reg_user else None),
                invitee_email=email,
                invitee_phone=phone,
                token=token,
                status="pending",
                expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=30)
            )
            db.add(inv)
            db.commit()
            db.refresh(inv)

        # If registered user, send in-app notification
        if reg_user and reg_user.id != current_user.id:
            # Check if notification already sent
            notif = db.query(Notification).filter(
                Notification.user_id == reg_user.id,
                Notification.type == "group_invite",
                Notification.action_url == f"/invitations/{inv.token}"
            ).first()
            if not notif:
                db.add(Notification(
                    user_id=reg_user.id,
                    title=f"Invitation to join '{group.name}'",
                    message=f"{current_user.full_name} invited you to join the group '{group.name}'.",
                    type="group_invite",
                    action_url=f"/invitations/{inv.token}"
                ))
                db.commit()

        invite_link = f"{base_url}/invite/{inv.token}"
        created_invites.append(
            GroupInvitationOut(
                id=inv.id,
                group_id=group.id,
                group_name=group.name,
                group_type=group.group_type,
                invited_by_name=current_user.full_name,
                invitee_name=inv.invitee_name,
                invitee_email=inv.invitee_email,
                invitee_phone=inv.invitee_phone,
                token=inv.token,
                invite_link=invite_link,
                status=inv.status,
                is_registered=reg_user is not None,
                created_at=inv.created_at.strftime("%b %d, %Y")
            )
        )

    return created_invites


@router.get("/group/{group_id}", response_model=List[GroupInvitationOut])
def get_group_invitations(
    group_id: int,
    request: Request,
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify membership
    mem = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "active"
    ).first()
    if not mem:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    base_url = get_frontend_base_url(request)
    query = db.query(GroupInvitation).filter(GroupInvitation.group_id == group_id)
    if status_filter:
        query = query.filter(GroupInvitation.status == status_filter)
    invitations = query.order_by(GroupInvitation.created_at.desc()).all()

    users = db.query(User).all()
    user_map = {u.id: u for u in users}

    results = []
    for inv in invitations:
        inviter = user_map.get(inv.invited_by)
        is_reg = False
        if inv.invitee_email:
            is_reg = any(u.email == inv.invitee_email for u in users)
        elif inv.invitee_phone:
            is_reg = any(u.phone == inv.invitee_phone for u in users)

        results.append(
            GroupInvitationOut(
                id=inv.id,
                group_id=group.id,
                group_name=group.name,
                group_type=group.group_type,
                invited_by_name=inviter.full_name if inviter else "Admin",
                invitee_name=inv.invitee_name,
                invitee_email=inv.invitee_email,
                invitee_phone=inv.invitee_phone,
                token=inv.token,
                invite_link=f"{base_url}/invite/{inv.token}",
                status=inv.status,
                is_registered=is_reg,
                created_at=inv.created_at.strftime("%b %d, %Y")
            )
        )
    return results


@router.get("/pending", response_model=List[GroupInvitationOut])
def get_my_pending_invitations(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns invitations sent to the current user's email or phone."""
    query = db.query(GroupInvitation).filter(
        GroupInvitation.status == "pending",
        (GroupInvitation.invitee_email == current_user.email) |
        (GroupInvitation.invitee_phone == current_user.phone if current_user.phone else False)
    )
    invitations = query.order_by(GroupInvitation.created_at.desc()).all()

    base_url = get_frontend_base_url(request)
    groups = db.query(Group).all()
    group_map = {g.id: g for g in groups}
    users = db.query(User).all()
    user_map = {u.id: u for u in users}

    results = []
    for inv in invitations:
        grp = group_map.get(inv.group_id)
        inviter = user_map.get(inv.invited_by)
        if grp:
            results.append(
                GroupInvitationOut(
                    id=inv.id,
                    group_id=grp.id,
                    group_name=grp.name,
                    group_type=grp.group_type,
                    invited_by_name=inviter.full_name if inviter else "Member",
                    invitee_name=inv.invitee_name,
                    invitee_email=inv.invitee_email,
                    invitee_phone=inv.invitee_phone,
                    token=inv.token,
                    invite_link=f"{base_url}/invite/{inv.token}",
                    status=inv.status,
                    is_registered=True,
                    created_at=inv.created_at.strftime("%b %d, %Y")
                )
            )
    return results


@router.post("/group/{group_id}/link", response_model=GroupInvitationOut)
def get_or_create_group_share_link(
    group_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates or retrieves a universal reusable invitation link for the group."""
    mem = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "active"
    ).first()
    if not mem:
        raise HTTPException(status_code=403, detail="You must be an active member to create an invite link")

    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    base_url = get_frontend_base_url(request)
    existing_link = db.query(GroupInvitation).filter(
        GroupInvitation.group_id == group_id,
        GroupInvitation.invitee_email == None,
        GroupInvitation.invitee_phone == None,
        GroupInvitation.status == "pending"
    ).order_by(GroupInvitation.created_at.desc()).first()

    if not existing_link:
        token = str(uuid.uuid4())
        existing_link = GroupInvitation(
            group_id=group_id,
            invited_by=current_user.id,
            invitee_name="Friend via Share Link",
            token=token,
            status="pending",
            expires_at=datetime.datetime.utcnow() + datetime.timedelta(days=365)
        )
        db.add(existing_link)
        db.commit()
        db.refresh(existing_link)

    return GroupInvitationOut(
        id=existing_link.id,
        group_id=group.id,
        group_name=group.name,
        group_type=group.group_type,
        invited_by_name=current_user.full_name,
        invitee_name=existing_link.invitee_name,
        invitee_email=None,
        invitee_phone=None,
        token=existing_link.token,
        invite_link=f"{base_url}/invite/{existing_link.token}",
        status=existing_link.status,
        is_registered=False,
        created_at=existing_link.created_at.strftime("%b %d, %Y")
    )


@router.get("/{token}")
def inspect_invitation(
    token: str,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """Preview invitation details dynamically from the database before accepting or logging in."""
    inv = db.query(GroupInvitation).filter(
        GroupInvitation.token == token.strip()
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found or invalid token")

    group = db.query(Group).filter(Group.id == inv.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Associated group no longer exists")

    inviter = db.query(User).filter(User.id == inv.invited_by).first()
    member_count = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.status == "active"
    ).count()

    is_universal_share = (inv.invitee_email is None and inv.invitee_phone is None)

    # Check expiration
    is_expired = False
    if inv.expires_at and inv.expires_at < datetime.datetime.utcnow():
        is_expired = True

    # Check if current user is already an active member
    is_already_member = False
    if current_user:
        existing_member = db.query(GroupMember).filter(
            GroupMember.group_id == group.id,
            GroupMember.user_id == current_user.id,
            GroupMember.status == "active"
        ).first()
        if existing_member:
            is_already_member = True

    base_url = get_frontend_base_url(request)
    invite_url = f"{base_url}/invite/{inv.token}"

    return {
        "token": inv.token,
        "status": "pending" if is_universal_share else inv.status,
        "group_id": group.id,
        "group_name": group.name,
        "group_description": group.description or "",
        "group_type": group.group_type or "Friends",
        "currency": group.currency or "INR",
        "member_count": member_count,
        "invited_by_name": inviter.full_name if inviter else "Group Admin",
        "invitee_name": inv.invitee_name,
        "invitee_email": inv.invitee_email,
        "invitee_phone": inv.invitee_phone,
        "is_universal_share": is_universal_share,
        "is_already_member": is_already_member,
        "is_expired": is_expired,
        "invite_link": invite_url,
        "created_at": inv.created_at.strftime("%b %d, %Y") if inv.created_at else ""
    }


@router.post("/{token}/accept")
def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(GroupInvitation).filter(
        GroupInvitation.token == token.strip()
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")

    group = db.query(Group).filter(Group.id == inv.group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check expiration
    if inv.expires_at and inv.expires_at < datetime.datetime.utcnow():
        raise HTTPException(status_code=400, detail="This invitation link has expired. Please ask the group admin for a new link.")

    # Check cancelled
    if inv.status == "cancelled":
        raise HTTPException(status_code=400, detail="This invitation has been cancelled by the group admin.")

    # Check if already a member
    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group.id,
        GroupMember.user_id == current_user.id
    ).first()

    is_universal_share = (inv.invitee_email is None and inv.invitee_phone is None)

    if existing and existing.status == "active":
        return {
            "success": True,
            "already_member": True,
            "message": f"You are already a member of {group.name}!",
            "group_id": group.id,
            "group_name": group.name
        }

    if inv.status == "accepted" and not is_universal_share:
        if existing and existing.status == "active":
            return {
                "success": True,
                "already_member": True,
                "message": f"You are already a member of {group.name}!",
                "group_id": group.id,
                "group_name": group.name
            }
        raise HTTPException(status_code=400, detail="This invitation has already been accepted.")

    if inv.status in ["declined", "rejected"] and not is_universal_share:
        raise HTTPException(status_code=400, detail="This invitation was previously declined.")

    now = datetime.datetime.utcnow()
    if existing:
        existing.status = "active"
        existing.joined_at = now
    else:
        new_member = GroupMember(
            group_id=group.id,
            user_id=current_user.id,
            role="member",
            status="active",
            joined_at=now
        )
        db.add(new_member)

    # Only mark targeted 1-to-1 invitations as accepted; keep universal share links active for all friends
    if not is_universal_share:
        inv.status = "accepted"
        inv.accepted_at = now

    db.commit()

    # Notify inviter if it's another user
    if inv.invited_by != current_user.id:
        db.add(Notification(
            user_id=inv.invited_by,
            title=f"New Member Joined {group.name}",
            message=f"{current_user.full_name} accepted your invitation and joined '{group.name}'!",
            type="group_invite",
            action_url=f"/groups/{group.id}"
        ))
        db.commit()

    return {
        "success": True,
        "already_member": False,
        "message": f"Successfully joined {group.name}!",
        "group_id": group.id,
        "group_name": group.name
    }


@router.post("/{token}/decline")
@router.post("/{token}/reject")
def decline_invitation(
    token: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(GroupInvitation).filter(
        GroupInvitation.token == token.strip()
    ).first()

    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")

    is_universal_share = (inv.invitee_email is None and inv.invitee_phone is None)
    now = datetime.datetime.utcnow()

    if not is_universal_share:
        inv.status = "declined"
        inv.declined_at = now
        db.commit()

    # If inviter exists and declined by identified user, notify
    if current_user and inv.invited_by != current_user.id:
        group = db.query(Group).filter(Group.id == inv.group_id).first()
        group_name = group.name if group else "Group"
        db.add(Notification(
            user_id=inv.invited_by,
            title="Invitation Declined",
            message=f"{current_user.full_name} declined the invitation to join '{group_name}'.",
            type="group_invite"
        ))
        db.commit()

    return {
        "success": True,
        "message": "Invitation declined. You have not been added to the group."
    }


@router.post("/{token}/cancel")
def cancel_invitation_by_token(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(GroupInvitation).filter(GroupInvitation.token == token.strip()).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")

    mem = db.query(GroupMember).filter(
        GroupMember.group_id == inv.group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "active"
    ).first()
    if not mem or (mem.role != "admin" and inv.invited_by != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this invitation")

    inv.status = "cancelled"
    db.commit()
    return {"success": True, "message": "Invitation cancelled successfully"}


@router.delete("/{invitation_id}")
def cancel_invitation(
    invitation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inv = db.query(GroupInvitation).filter(GroupInvitation.id == invitation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Must be admin or inviter
    mem = db.query(GroupMember).filter(
        GroupMember.group_id == inv.group_id,
        GroupMember.user_id == current_user.id,
        GroupMember.status == "active"
    ).first()
    if not mem or (mem.role != "admin" and inv.invited_by != current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to cancel this invitation")

    inv.status = "cancelled"
    db.commit()
    return {"success": True, "message": "Invitation cancelled successfully"}
