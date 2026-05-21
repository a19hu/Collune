from datetime import datetime, timezone as dt_timezone, timedelta
import random
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction

from .models import (
    User,
    BrandProfile,
    BrandMember,
    BrandProfile,
    BrandOnboarding,
    SocialMediaPlatform,
    OTPVerification,
)
from .permissions import IsAdminLike, IsBrandUser, IsCreatorUser
from .serializers import (
    UserSerializer,
    BrandSerializer,
    BrandProfileSerializer,
    BrandSignUpSerializer,
    BrandOnboardingSerializer,
    BrandProfileDetailsSerializer,
    BrandProfileSocialSerializer,
    BrandProfileImagesSerializer,
)
# from .tasks import run_campaign_matching


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request,role):
    role = role.upper()
    if role not in ["BRAND", "CREATOR"]:
        return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)
    
    if role == "CREATOR":
        phone_number = request.data.get("phone_number")
        full_name = request.data.get("full_name")
        username = request.data.get("username") or phone_number
        email = request.data.get("email")

        if not phone_number or not full_name:
            return Response(
                {"error": "phone_number and full_name are required for creator signup"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        if User.objects.filter(phone_number=phone_number).exists() or User.objects.filter(username=username).exists():
            return Response({"error": "User with this phone number or username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        if email and User.objects.filter(email=email).exists():
            return Response({"error": "User with this email already exists"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email or None,
                first_name=full_name.split()[0],
                last_name=" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else "",
                phone_number=phone_number,
                role=role,
                is_phone_verified=False,
            )
            user.set_unusable_password()
            user.save(update_fields=["password"])
            # Creator.objects.create(user=user, display_name=full_name)
            otp = f"{random.randint(100000, 999999)}"
            OTPVerification.objects.create(user=user, otp=otp, is_verified=False)

        return Response(
            {
                "message": "Creator signup successful. Verify OTP to login.",
                "phone_number": user.phone_number,
                "otp": otp,
            },
            status=status.HTTP_201_CREATED
        )

    if role == "BRAND":
        serializer = BrandSignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(
            {
                "message": "Brand signup successful",
            },
            status=status.HTTP_201_CREATED
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def creator_request_otp(request):
    phone_number = request.data.get("phone_number")
    if not phone_number:
        return Response({"error": "phone_number is required"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(phone_number=phone_number, role="CREATOR").first()
    if not user:
        return Response({"error": "Creator not found"}, status=status.HTTP_404_NOT_FOUND)

    otp = f"{random.randint(100000, 999999)}"
    OTPVerification.objects.create(user=user, otp=otp, is_verified=False)
    return Response({"message": "OTP sent successfully", "otp": otp}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([AllowAny])
def creator_verify_otp(request):
    phone_number = request.data.get("phone_number")
    otp = request.data.get("otp")
    if not phone_number or not otp:
        return Response({"error": "phone_number and otp are required"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(phone_number=phone_number, role="CREATOR").first()
    if not user:
        return Response({"error": "Creator not found"}, status=status.HTTP_404_NOT_FOUND)

    otp_obj = OTPVerification.objects.filter(
        user=user, otp=str(otp), is_verified=False
    ).order_by("-created_at").first()
    if not otp_obj:
        return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

    if datetime.now(dt_timezone.utc) - otp_obj.created_at > timedelta(minutes=10):
        return Response({"error": "OTP expired"}, status=status.HTTP_400_BAD_REQUEST)

    otp_obj.is_verified = True
    otp_obj.save(update_fields=["is_verified"])
    user.is_phone_verified = True
    user.save(update_fields=["is_phone_verified"])

    refresh = RefreshToken.for_user(user)
    return Response(
        {"refresh": str(refresh), "access": str(refresh.access_token), "message": "Creator login successful"},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def brand_login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password")
    if not email or not password:
        return Response({"error": "email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.filter(username=email, role="BRAND").first()
    if not user or not user.check_password(password):
        return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

    refresh = RefreshToken.for_user(user)
    return Response(
        {"refresh": str(refresh), "access": str(refresh.access_token), "message": "Brand login successful"},
        status=status.HTTP_200_OK,
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def brand_onboarding(request):

    brand = BrandProfile.objects.filter(created_by=request.user).first()

    if not brand:
        return Response(
            {"error": "Brand not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    profile, _ = BrandOnboarding.objects.get_or_create(
        brand=brand
    )

    serializer = BrandOnboardingSerializer(
        profile,
        data=request.data,
        partial=True
    )

    serializer.is_valid(raise_exception=True)
    serializer.save()

    profile.is_onboarding_completed = True
    profile.save()

    return Response(
        serializer.data,
        status=status.HTTP_200_OK
    )

@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
def brand_account(request):
    brand = BrandProfile.objects.filter(created_by=request.user).first()

    if not brand:
        return Response(
            {"error": "Brand not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == "GET":
        serializer = BrandSerializer(brand)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = BrandSerializer(brand, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



def brand_profile(request):
    brand = BrandProfile.objects.filter(created_by=request.user).first()

    if not brand:
        return Response(
            {"error": "Brand not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    profile, _ = BrandProfile.objects.get_or_create(brand=brand)

    if request.method == "GET":
        serializer = BrandProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == "POST":
        serializer = BrandProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


def _get_user_brand(request):
    return BrandProfile.objects.filter(created_by=request.user).first()


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def brand_profile_details(request):
    brand = _get_user_brand(request)
    if not brand:
        return Response({"error": "Brand not found"}, status=status.HTTP_404_NOT_FOUND)

    profile, _ = BrandProfile.objects.get_or_create(brand=brand)

    if request.method == "GET":
        data = {
            "company_discription": profile.company_discription,
            "company_category": list(profile.company_category.values_list("id", flat=True)),
        }
        serializer = BrandProfileDetailsSerializer(profile, data=data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    serializer = BrandProfileDetailsSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    validated_data = serializer.validated_data

    if "company_discription" in validated_data:
        profile.company_discription = validated_data["company_discription"]
    profile.save()

    if "company_category" in validated_data:
        profile.company_category.set(validated_data["company_category"])


    response_data = {
        "company_discription": profile.company_discription,
        "company_category": list(profile.company_category.values_list("id", flat=True)),
    }
    return Response(response_data, status=status.HTTP_200_OK)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def brand_profile_social(request):
    brand = _get_user_brand(request)
    if not brand:
        return Response({"error": "Brand not found"}, status=status.HTTP_404_NOT_FOUND)

    profile, _ = BrandProfile.objects.get_or_create(brand=brand)

    slug_to_field = {
        "youtube": "youtube",
        "instagram": "instagram",
        "facebook": "facebook",
        "twitter": "x",
    }

    if request.method == "GET":
        data = {"website": brand.website, "youtube": "", "instagram": "", "facebook": "", "x": ""}
        for item in profile.social_media_links.all():
            field = slug_to_field.get(item.slug)
            if field:
                data[field] = item.link
        return Response(data)

    serializer = BrandProfileSocialSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    validated_data = serializer.validated_data

    if "website" in validated_data:
        brand.website = validated_data["website"]
        brand.save(update_fields=["website", "updated_at"])

    for slug, field in slug_to_field.items():
        if field not in validated_data:
            continue
        link = validated_data[field]
        platform, _ = SocialMediaPlatform.objects.get_or_create(
            slug=slug,
            defaults={"name": slug.capitalize(), "link": link},
        )
        platform.link = link
        platform.save(update_fields=["link"])
        profile.social_media_links.add(platform)

    return Response(
        {
            "website": brand.website,
            "youtube": next((p.link for p in profile.social_media_links.all() if p.slug == "youtube"), ""),
            "instagram": next((p.link for p in profile.social_media_links.all() if p.slug == "instagram"), ""),
            "facebook": next((p.link for p in profile.social_media_links.all() if p.slug == "facebook"), ""),
            "x": next((p.link for p in profile.social_media_links.all() if p.slug == "twitter"), ""),
        },
        status=status.HTTP_200_OK,
    )


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def brand_profile_images(request):
    brand = _get_user_brand(request)
    if not brand:
        return Response({"error": "Brand not found"}, status=status.HTTP_404_NOT_FOUND)

    profile, _ = BrandProfile.objects.get_or_create(brand=brand)

    if request.method == "GET":
        serializer = BrandProfileImagesSerializer(profile)
        return Response(serializer.data)

    serializer = BrandProfileImagesSerializer(profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_200_OK)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    with transaction.atomic():
        # Remove direct links to the user.
        BrandMember.objects.filter(user=user).delete()

        # Clear many-to-many membership references.
        user.chat_rooms.clear()

        # Finally remove the auth user row.
        user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

